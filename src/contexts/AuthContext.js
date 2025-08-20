import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { clearAuthStorage, isLocalStorageAvailable } from '../hooks/useLocalStorage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState('unknown');

  // User roles - Updated to match database schema
  const USER_ROLES = {
    ADMIN: 'admin',
    TRIAL: 'trial',
    PAID: 'paid',
    CUSTOMER: 'trial' // Alias for trial users
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting initial session...');
        
        // Skip database diagnostics to prevent startup issues
        console.log('🔍 Setting database status to healthy (skip diagnostics)');
        setDbStatus('healthy');
        
        // Clear any potentially corrupted localStorage entries first
        try {
          const projectRef = supabase.supabaseUrl.split('//')[1].split('.')[0];
          const authKey = `sb-${projectRef}-auth-token`;
          
          // Check if auth token exists and is valid
          const existingToken = localStorage.getItem(authKey);
          if (existingToken) {
            try {
              const parsed = JSON.parse(existingToken);
              // If token is expired or malformed, clear it
              if (!parsed || !parsed.access_token || (parsed.expires_at && new Date(parsed.expires_at * 1000) < new Date())) {
                console.log('🧽 Clearing expired/invalid auth token');
                localStorage.removeItem(authKey);
                localStorage.removeItem('supabase.auth.token');
              }
            } catch (parseError) {
              console.log('🧽 Clearing malformed auth token');
              localStorage.removeItem(authKey);
              localStorage.removeItem('supabase.auth.token');
            }
          }
        } catch (storageError) {
          console.warn('⚠️ Error checking localStorage:', storageError);
        }
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          // Clear potentially corrupted auth data
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.warn('Error signing out:', signOutError);
          }
          if (mounted) {
            setCurrentUser(null);
            setUserProfile(null);
            setLoading(false);
          }
          return;
        }
        
        console.log('📋 Initial session result:', session ? 'User found' : 'No user');
        
        if (mounted) {
          if (session?.user) {
            console.log('👤 Setting current user:', session.user.email);
            setCurrentUser(session.user);

            // Set a timeout for profile loading to prevent hanging
            const profileLoadTimeout = setTimeout(() => {
              console.warn('⚠️ Profile loading timeout, using default profile');
              const userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
              const defaultProfile = {
                id: session.user.id,
                email: session.user.email,
                name: userName,
                role: 'trial',
                account_type: 'trial',
                is_active: true,
                is_paid: false,
                trial_start_date: new Date().toISOString(),
                trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              };
              setUserProfile(defaultProfile);
              if (mounted) {
                setLoading(false);
              }
            }, 3000); // 3 second timeout

            try {
              await loadUserProfile(session.user);
              clearTimeout(profileLoadTimeout);
              console.log('✅ Profile loaded successfully');
            } catch (profileError) {
              clearTimeout(profileLoadTimeout);
              console.error('❌ Profile loading failed:', profileError);
              // Set default profile on error
              const userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
              const defaultProfile = {
                id: session.user.id,
                email: session.user.email,
                name: userName,
                role: 'trial',
                account_type: 'trial',
                is_active: true,
                is_paid: false,
                trial_start_date: new Date().toISOString(),
                trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              };
              setUserProfile(defaultProfile);
            }
          } else {
            console.log('❌ No session found, user not logged in');
            setCurrentUser(null);
            setUserProfile(null);
          }
          console.log('✅ Setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error getting initial session:', error);
        
        // Clear all auth data on any error
        try {
          const projectRef = supabase.supabaseUrl.split('//')[1].split('.')[0];
          localStorage.removeItem(`sb-${projectRef}-auth-token`);
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.clear();
        } catch (clearError) {
          console.warn('Error clearing storage:', clearError);
        }
        
        if (mounted) {
          setCurrentUser(null);
          setUserProfile(null);
          console.log('⚠️ Setting loading to false due to error');
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Fallback timeout to ensure loading never gets stuck indefinitely
    const fallbackTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('⚠️ Fallback timeout triggered - forcing loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second absolute maximum

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔄 Auth state change:', event, session ? 'Session exists' : 'No session');
      
      try {
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              console.log('✅ User signed in:', session.user.email);
              setCurrentUser(session.user);
              try {
                await loadUserProfile(session.user);
              } catch (profileError) {
                console.error('❌ Profile loading failed in auth state change:', profileError);
                // Set default profile on error
                const userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
                const defaultProfile = {
                  id: session.user.id,
                  email: session.user.email,
                  name: userName,
                  role: 'trial',
                  account_type: 'trial',
                  is_active: true,
                  is_paid: false,
                  trial_start_date: new Date().toISOString(),
                  trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                };
                setUserProfile(defaultProfile);
              }
            }
            break;
            
          case 'SIGNED_OUT':
            console.log('👋 User signed out');
            setCurrentUser(null);
            setUserProfile(null);
            // Clear any cached auth data
            try {
              const projectRef = supabase.supabaseUrl.split('//')[1].split('.')[0];
              localStorage.removeItem(`sb-${projectRef}-auth-token`);
              localStorage.removeItem('supabase.auth.token');
              sessionStorage.clear();
            } catch (storageError) {
              console.warn('Warning clearing storage on signout:', storageError);
            }
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed');
            if (session?.user && !currentUser) {
              // Only set user if we don't already have one
              setCurrentUser(session.user);
              await loadUserProfile(session.user);
            }
            break;
            
          case 'USER_UPDATED':
            console.log('📝 User updated');
            if (session?.user) {
              setCurrentUser(session.user);
            }
            break;
            
          case 'PASSWORD_RECOVERY':
            console.log('🔑 Password recovery initiated');
            break;
            
          default:
            console.log('ℹ️ Unhandled auth event:', event);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('❌ Error in auth state change:', error);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(fallbackTimeout);
    };
  }, []);

  const loadUserProfile = async (user) => {
    try {
      console.log('👤 Loading profile for user:', user.email);

      // Create a promise with timeout to prevent hanging
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile loading timeout')), 2000);
      });

      // Try profiles table first (the correct table name)
      let { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]);

      // If profiles table doesn't work, try creating a default profile
      if (error && (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist'))) {
        console.log('🔄 profiles table access failed, will create default profile...');
        try {
          // Try to create a default profile for the user
          const defaultProfile = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: 'user',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert(defaultProfile, { onConflict: 'id' })
            .select()
            .single();

          if (!createError && newProfile) {
            profile = newProfile;
            error = null;
            console.log('✅ Created default profile for user');
          } else {
            console.warn('⚠️ Could not create profile, will use minimal default');
          }
        } catch (createErr) {
          console.warn('⚠️ Error creating default profile:', createErr);
        }
      }

      if (error || !profile) {
        console.warn('⚠️ Profile not found or accessible, creating default profile:', error?.message);
        
        // Extract name from user metadata or email
        const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        
        // Set a default profile if none exists
        const defaultProfile = {
          id: user.id,
          email: user.email,
          name: userName,
          role: 'trial', // Use 'role' field to match our schema
          account_type: 'trial',
          is_active: true,
          is_paid: false,
          trial_start_date: new Date().toISOString(),
          trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        console.log('📝 Setting default profile:', defaultProfile);
        setUserProfile(defaultProfile);
        
        // Try to create the profile in the users table for future use
        try {
          const { error: createError } = await supabase
            .from('users')
            .upsert(defaultProfile, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });
            
          if (createError) {
            console.warn('⚠️ Could not create user profile in database:', createError.message);
          } else {
            console.log('✅ Default profile created in database');
          }
        } catch (createErr) {
          console.warn('⚠️ Exception creating user profile:', createErr.message);
        }
        
        return;
      }

      console.log('✅ Profile loaded successfully:', profile);
      setUserProfile(profile);
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      
      // Set a default profile on any error
      const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
      const defaultProfile = {
        id: user.id,
        email: user.email,
        name: userName,
        role: 'trial', // Use 'role' field to match our schema
        account_type: 'trial',
        is_active: true,
        is_paid: false,
        trial_start_date: new Date().toISOString(),
        trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      console.log('📝 Setting default profile due to error:', defaultProfile);
      setUserProfile(defaultProfile);
    }
  };

  // Supabase auth functions
  const signup = async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  };

  const signin = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const logout = async () => {
    console.log('🚪 Starting logout process...');
    
    try {
      // 1. Call Supabase signOut
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Supabase signOut error:', error);
        // Continue with cleanup even if signOut fails
      }
      
      // 2. Clear local state immediately
      setCurrentUser(null);
      setUserProfile(null);
      
      // 3. Clear localStorage tokens manually
      try {
        const projectRef = supabase.supabaseUrl.split('//')[1].split('.')[0];
        localStorage.removeItem(`sb-${projectRef}-auth-token`);
        localStorage.removeItem('supabase.auth.token');
        
        // Clear any other auth-related storage
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });
        
        // Clear session storage as well
        sessionStorage.clear();
      } catch (storageError) {
        console.warn('⚠️ Warning clearing storage:', storageError);
      }
      
      // 4. Reset loading state
      setLoading(false);
      
      console.log('✅ Logout completed successfully');
      
      // 5. Return success
      return { error: null, success: true };
      
    } catch (unexpectedError) {
      console.error('❌ Unexpected logout error:', unexpectedError);
      
      // Force cleanup on any error
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
      
      return { error: unexpectedError, success: false };
    }
  };

  const demoLogin = async (role = USER_ROLES.STAFF) => {
    console.log('Demo login called for role:', role);

    // Create a fake user for demo
    const demoUser = {
      id: 'demo-user-id',
      email: 'demo@example.com'
    };

    const demoProfile = {
      id: 'demo-user-id',
      email: 'demo@example.com',
      name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      role: role,
      is_active: true
    };

    setCurrentUser(demoUser);
    setUserProfile(demoProfile);

    return demoUser;
  };

  // Permission helpers - Updated for admin and trial full access
  const hasPermission = (requiredRole) => {
    if (!userProfile) return false;
    
    // Get user role from either 'role' or 'account_type' field
    const userRole = userProfile.role || userProfile.account_type;
    
    // Admin and trial users get full access
    if (userRole === 'admin') return true;
    if (userRole === 'trial' && isTrialActive()) return true;
    if (userProfile.is_paid) return true; // Paid users get full access
    
    return false;
  };

  const isAdmin = () => {
    const userRole = userProfile?.role || userProfile?.account_type;
    return userRole === 'admin';
  };

  const isManager = () => {
    const userRole = userProfile?.role || userProfile?.account_type;
    return userRole === 'manager';
  };

  const isTrialActive = () => {
    if (!userProfile) return false;
    if (userProfile.is_paid) return true; // Paid users always active
    if (!userProfile.is_active) return false; // Account disabled
    
    // Check trial period - handle both field name variations
    const now = new Date();
    const trialEndField = userProfile.trial_end_date || userProfile.trial_end;
    if (!trialEndField) return true; // If no trial end date, assume active
    
    const trialEnd = new Date(trialEndField);
    return now <= trialEnd;
  };

  const hasFullAccess = () => {
    const userRole = userProfile?.role || userProfile?.account_type;
    return userRole === 'admin' || isTrialActive();
  };

  const value = {
    currentUser,
    userProfile,
    signup,
    signin,
    logout,
    demoLogin,
    hasPermission,
    isAdmin,
    isManager,
    isTrialActive,
    hasFullAccess,
    USER_ROLES,
    loading,
    dbStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
