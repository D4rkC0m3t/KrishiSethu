import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Add refs to prevent memory leaks and manage cleanup
  const mounted = useRef(true);
  const authSubscription = useRef(null);
  const sessionCheckInterval = useRef(null);
  const refreshTimeout = useRef(null);

  // User roles - Updated to match database schema
  const USER_ROLES = {
    ADMIN: 'admin',
    TRIAL: 'trial',
    PAID: 'paid',
    CUSTOMER: 'trial' // Alias for trial users
  };

  // Enhanced cleanup function
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up AuthContext...');
    
    // Clear intervals and timeouts
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
      sessionCheckInterval.current = null;
    }
    
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
      refreshTimeout.current = null;
    }
    
    // Unsubscribe from auth changes
    if (authSubscription.current) {
      authSubscription.current.unsubscribe();
      authSubscription.current = null;
    }
    
    // Mark as unmounted
    mounted.current = false;
  }, []);

  // Enhanced session validation
  const validateSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('⚠️ Session validation error:', error);
        return false;
      }
      
      if (!session) {
        console.log('❌ No active session found');
        return false;
      }
      
      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        console.warn('⚠️ Session expired, refreshing...');
        
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.error('❌ Session refresh failed:', refreshError);
          return false;
        }
        
        console.log('✅ Session refreshed successfully');
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Session validation failed:', error);
      return false;
    }
  }, []);

  // Periodic session health check
  const startSessionHealthCheck = useCallback(() => {
    // Clear existing interval
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
    }
    
    // Check session every 5 minutes
    sessionCheckInterval.current = setInterval(async () => {
      if (!mounted.current) return;
      
      console.log('🔄 Performing periodic session health check...');
      const isValid = await validateSession();
      
      if (!isValid && currentUser) {
        console.warn('⚠️ Session invalid, forcing logout...');
        await forceLogout();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }, [currentUser, validateSession]);

  // Force logout with complete cleanup
  const forceLogout = useCallback(async () => {
    console.log('🚪 Forcing complete logout...');
    
    try {
      // 1. Clear Supabase session
      await supabase.auth.signOut();
      
      // 2. Clear all local state
      if (mounted.current) {
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
      
      // 3. Clear all storage
      try {
        const projectRef = supabase.supabaseUrl.split('//')[1].split('.')[0];
        
        // Clear all possible auth keys
        const possibleKeys = [
          `sb-${projectRef}-auth-token`,
          'supabase.auth.token',
          'supabase.auth.refreshToken',
          'supabase.auth.user'
        ];
        
        possibleKeys.forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
        
        // Clear all supabase-related keys
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });
        
        sessionStorage.clear();
        
      } catch (storageError) {
        console.warn('⚠️ Error clearing storage:', storageError);
      }
      
      // 4. Stop session health check
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
        sessionCheckInterval.current = null;
      }
      
      console.log('✅ Force logout completed');
      
    } catch (error) {
      console.error('❌ Error during force logout:', error);
    }
  }, []);

  // Initialize auth state with better error handling
  useEffect(() => {
    let isMounted = true;
    mounted.current = true;
    
    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting initial session...');
        setDbStatus('healthy');
        
        // Clear potentially corrupted tokens first
        try {
          const projectRef = supabase.supabaseUrl.split('//')[1].split('.')[0];
          const authKey = `sb-${projectRef}-auth-token`;
          
          const existingToken = localStorage.getItem(authKey);
          if (existingToken) {
            try {
              const parsed = JSON.parse(existingToken);
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
          await forceLogout();
          return;
        }
        
        console.log('📋 Initial session result:', session ? 'User found' : 'No user');
        
        if (isMounted && mounted.current) {
          if (session?.user) {
            console.log('👤 Setting current user:', session.user.email);
            setCurrentUser(session.user);
            await loadUserProfile(session.user);
            
            // Start session health check
            startSessionHealthCheck();
          } else {
            console.log('❌ No session found, user not logged in');
            setCurrentUser(null);
            setUserProfile(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error getting initial session:', error);
        await forceLogout();
      }
    };

    getInitialSession();

    // Listen for auth changes with better error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted || !mounted.current) return;
      
      console.log('🔄 Auth state change:', event, session ? 'Session exists' : 'No session');
      
      try {
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              console.log('✅ User signed in:', session.user.email);
              setCurrentUser(session.user);
              await loadUserProfile(session.user);
              startSessionHealthCheck();
            }
            break;
            
          case 'SIGNED_OUT':
            console.log('👋 User signed out');
            setCurrentUser(null);
            setUserProfile(null);
            if (sessionCheckInterval.current) {
              clearInterval(sessionCheckInterval.current);
              sessionCheckInterval.current = null;
            }
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed');
            if (session?.user && !currentUser) {
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
            
          default:
            console.log('ℹ️ Unhandled auth event:', event);
        }
        
        if (mounted.current) {
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error in auth state change:', error);
        if (mounted.current) {
          setLoading(false);
        }
      }
    });

    authSubscription.current = subscription;

    // Enhanced fallback timeout
    const timeout = setTimeout(async () => {
      if (isMounted && mounted.current && loading) {
        console.log('🕐 Auth initialization timeout (10s) - forcing resolution');
        await forceLogout();
        console.log('✅ Auth timeout resolved');
      }
    }, 10000);

    refreshTimeout.current = timeout;

    return () => {
      isMounted = false;
      cleanup();
    };
  }, []); // Empty dependency array to prevent re-initialization

  // Enhanced loadUserProfile function
  const loadUserProfile = useCallback(async (user) => {
    if (!mounted.current) return;
    
    try {
      console.log('👤 Loading profile for user:', user.email);
      
      let profile = null;
      const tableNames = ['users', 'profiles', 'user_profiles'];
      
      for (const tableName of tableNames) {
        try {
          console.log(`🔍 Trying to load profile from ${tableName} table...`);
          
          const { data, error: queryError } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (queryError) {
            console.log(`⚠️ ${tableName} table query failed:`, queryError.message);
            continue;
          }
          
          if (data) {
            profile = data;
            console.log(`✅ Profile loaded from ${tableName} table`);
            break;
          }
        } catch (tableError) {
          console.log(`❌ Error querying ${tableName} table:`, tableError);
          continue;
        }
      }

      if (!profile && mounted.current) {
        console.warn('⚠️ Profile not found in any table, creating default profile');
        
        const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        
        const defaultProfile = {
          id: user.id,
          email: user.email,
          name: userName,
          role: 'trial',
          account_type: 'trial',
          is_active: true,
          is_paid: false,
          trial_start_date: new Date().toISOString(),
          trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        setUserProfile(defaultProfile);
        
        // Try to create the profile in the database
        for (const tableName of tableNames) {
          try {
            const { error: createError } = await supabase
              .from(tableName)
              .upsert(defaultProfile, { onConflict: 'id', ignoreDuplicates: false });
              
            if (!createError) {
              console.log(`✅ Default profile created in ${tableName} table`);
              break;
            }
          } catch (createErr) {
            console.warn(`⚠️ Could not create profile in ${tableName}:`, createErr.message);
          }
        }
        
        return;
      }

      if (mounted.current) {
        console.log('✅ Profile loaded successfully');
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      
      if (mounted.current) {
        const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        const defaultProfile = {
          id: user.id,
          email: user.email,
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
  }, []);

  // Enhanced auth functions
  const signup = async (email, password, userData = {}) => {
    try {
      console.log('📝 Starting signup process for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) {
        console.error('❌ Signup error:', error);
        return { data: null, error };
      }
      
      console.log('✅ Signup successful:', data.user?.email);
      return { data, error: null };
      
    } catch (unexpectedError) {
      console.error('❌ Unexpected signup error:', unexpectedError);
      return { data: null, error: unexpectedError };
    }
  };

  const signin = async (email, password) => {
    try {
      console.log('🔑 Starting signin process for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('❌ Signin error:', error);
        return { data: null, error };
      }
      
      console.log('✅ Signin successful:', data.user?.email);
      return { data, error: null };
      
    } catch (unexpectedError) {
      console.error('❌ Unexpected signin error:', unexpectedError);
      return { data: null, error: unexpectedError };
    }
  };

  const logout = async () => {
    console.log('🚪 Starting logout process...');
    return await forceLogout();
  };

  const demoLogin = async (role = USER_ROLES.TRIAL) => {
    console.log('Demo login called for role:', role);

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

    if (mounted.current) {
      setCurrentUser(demoUser);
      setUserProfile(demoProfile);
    }

    return demoUser;
  };

  // Permission helpers
  const hasPermission = (requiredRole) => {
    if (!userProfile) return false;
    
    const userRole = userProfile.role || userProfile.account_type;
    
    if (userRole === 'admin') return true;
    if (userRole === 'trial' && isTrialActive()) return true;
    if (userProfile.is_paid) return true;
    
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
    if (userProfile.is_paid) return true;
    if (!userProfile.is_active) return false;
    
    const now = new Date();
    const trialEndField = userProfile.trial_end_date || userProfile.trial_end;
    if (!trialEndField) return true;
    
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
    dbStatus,
    // Export utility functions for debugging
    validateSession,
    forceLogout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
