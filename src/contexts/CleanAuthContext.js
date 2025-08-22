import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

  useEffect(() => {
    // Get initial user session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      setLoading(true);
      
      try {
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              setUser(session.user);
              await loadUserProfile(session.user);
            }
            break;
            
          case 'SIGNED_OUT':
            setUser(null);
            setUserProfile(null);
            // Clear any cached data
            localStorage.removeItem('sb-auth-token');
            break;
            
          case 'TOKEN_REFRESHED':
            if (session?.user && !user) {
              setUser(session.user);
              await loadUserProfile(session.user);
            }
            break;
            
          default:
            console.log('Unhandled auth event:', event);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [user]);

  const loadUserProfile = async (authUser) => {
    try {
      console.log('Loading profile for user:', authUser.email);
      
      // Query the clean users table
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        
        // If profile doesn't exist, create a default one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating default profile...');
          const defaultProfile = createDefaultProfile(authUser);
          setUserProfile(defaultProfile);
          return;
        }
        
        throw error;
      }

      if (profile) {
        console.log('Profile loaded successfully:', profile.email);
        
        // Validate user access
        const accessValidation = validateUserAccess(profile);
        if (!accessValidation.hasAccess) {
          console.log('User access denied:', accessValidation.reason);
          await signOut();
          throw new Error(accessValidation.reason);
        }
        
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      
      // On any error, create a default profile
      const defaultProfile = createDefaultProfile(authUser);
      setUserProfile(defaultProfile);
    }
  };

  const createDefaultProfile = (authUser) => {
    const userName = authUser.user_metadata?.full_name || 
                    authUser.user_metadata?.name || 
                    authUser.email?.split('@')[0] || 
                    'User';
    
    return {
      id: authUser.id,
      email: authUser.email,
      full_name: userName,
      phone: authUser.user_metadata?.phone || null,
      company: authUser.user_metadata?.company || null,
      is_active: true,
      is_paid: false,
      account_type: 'trial',
      trial_start_date: new Date().toISOString(),
      trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  const validateUserAccess = (profile) => {
    // Admin users always have access
    if (profile.account_type === 'admin') {
      return { hasAccess: true, reason: 'Admin user' };
    }
    
    // Check if account is active
    if (!profile.is_active) {
      return { 
        hasAccess: false, 
        reason: 'Your account has been deactivated. Please contact support.' 
      };
    }
    
    // Paid users always have access
    if (profile.is_paid || profile.account_type === 'paid') {
      return { hasAccess: true, reason: 'Paid user' };
    }
    
    // Check trial period
    if (profile.trial_end_date) {
      const trialEnd = new Date(profile.trial_end_date);
      const now = new Date();
      
      if (now > trialEnd) {
        return { 
          hasAccess: false, 
          reason: 'Your free trial has expired. Please upgrade to continue using KrishiSethu.' 
        };
      }
    }
    
    return { hasAccess: true, reason: 'Valid trial user' };
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      
      setUser(null);
      setUserProfile(null);
      
      // Clear any local storage
      localStorage.clear();
      sessionStorage.clear();
      
    } catch (error) {
      console.error('Error in signOut:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user || !userProfile) {
      throw new Error('No user logged in');
    }

    try {
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

      if (data) {
        setUserProfile(data);
        return data;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Helper function to check if user is admin
  const isAdmin = () => {
    return userProfile?.account_type === 'admin';
  };

  // Helper function to check trial status
  const getTrialStatus = () => {
    if (!userProfile) return { isValid: false, daysLeft: 0 };
    
    if (userProfile.is_paid || userProfile.account_type === 'paid' || userProfile.account_type === 'admin') {
      return { isValid: true, daysLeft: -1, isPaid: true };
    }
    
    if (!userProfile.trial_end_date) {
      return { isValid: false, daysLeft: 0 };
    }
    
    const trialEnd = new Date(userProfile.trial_end_date);
    const now = new Date();
    const diffTime = trialEnd - now;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      isValid: daysLeft > 0,
      daysLeft: Math.max(0, daysLeft),
      isPaid: false
    };
  };

  const value = {
    user,
    userProfile,
    loading,
    signOut,
    updateProfile,
    isAdmin,
    getTrialStatus,
    // Legacy compatibility
    signin: () => {}, // This is handled by the login component directly
    currentUser: user,
    profile: userProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
