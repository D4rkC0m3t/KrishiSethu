import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        }
      } catch (err) {
        console.error('Error in getInitialSession:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
          setError('');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
          setError('');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
          // Don't reload profile on token refresh, just update user
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        // Don't treat missing profile as a critical error
        if (error.code !== 'PGRST116') { // PGRST116 = not found
          setError(`Failed to load profile: ${error.message}`);
        }
        return;
      }

      setUserProfile(profile);
    } catch (err) {
      console.error('Error in loadUserProfile:', err);
      setError(`Failed to load profile: ${err.message}`);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Update last login
      if (data.user) {
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      return { data, error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw error;

      return { data, error: null };
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError('');

      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      setUser(null);
      setUserProfile(null);
      
      return { error: null };
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');

      setError('');
      
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data);
      return { data, error: null };
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.message);
      return { data: null, error: err };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  // Helper functions
  const isAdmin = () => {
    return userProfile?.account_type === 'admin' && userProfile?.is_active;
  };

  const isActive = () => {
    return userProfile?.is_active === true;
  };

  const getDisplayName = () => {
    return userProfile?.full_name || user?.email || 'Unknown User';
  };

  const value = {
    // State
    user,
    userProfile,
    loading,
    error,
    
    // Auth methods
    signIn,
    signUp,
    signOut,
    
    // Profile methods
    updateProfile,
    refreshProfile,
    
    // Helper methods
    isAdmin,
    isActive,
    getDisplayName,
    
    // Clear error
    clearError: () => setError('')
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// HOC for protecting routes that require authentication
export const withAuth = (WrappedComponent, options = {}) => {
  const { requireAdmin = false, redirectTo = '/login' } = options;
  
  return function AuthenticatedComponent(props) {
    const { user, userProfile, loading, isAdmin } = useAuth();
    
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid rgba(255,255,255,0.3)',
              borderTop: '4px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>Loading...</p>
          </div>
        </div>
      );
    }
    
    if (!user) {
      // In a real app, you'd redirect to login
      console.log('User not authenticated, should redirect to:', redirectTo);
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          color: '#ef4444',
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h3>Authentication Required</h3>
          <p>Please log in to access this page.</p>
        </div>
      );
    }
    
    if (requireAdmin && !isAdmin()) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          color: '#dc2626',
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h3>Admin Access Required</h3>
          <p>You don't have permission to access this page.</p>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

export default AuthContext;
