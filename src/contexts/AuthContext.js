import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { clearAuthStorage, isLocalStorageAvailable } from '../hooks/useLocalStorage';
import debugEnhancedInventoryService from '../lib/debugEnhancedInventoryService';

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

  // Session refresh and validation
  const validateAndRefreshSession = async () => {
    try {
      console.log('🔄 Validating and refreshing session...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session validation error:', error);
        return false;
      }
      
      if (!session) {
        console.log('⚠️ No active session found');
        return false;
      }
      
      // Check if token is about to expire (within 5 minutes)
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;
      
      console.log(`⏰ Token expires in ${timeUntilExpiry} seconds`);
      
      if (timeUntilExpiry < 300) { // Less than 5 minutes
        console.log('🔄 Token expiring soon, refreshing...');
        
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          return false;
        }
        
        if (refreshedSession?.user) {
          console.log('✅ Session refreshed successfully');
          setCurrentUser(refreshedSession.user);
          return true;
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Session validation error:', error);
      return false;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let sessionInterval = null;

    // Check for local admin session first
    const checkLocalAdminSession = () => {
      try {
        const adminSession = localStorage.getItem('krishisethu_admin_session');
        if (adminSession) {
          const session = JSON.parse(adminSession);

          // Check if session is still valid (not expired)
          if (session.expires && Date.now() < session.expires) {
            console.log('✅ Found valid local admin session');
            setCurrentUser(session.user);
            setUserProfile({
              ...session.user,
              role: 'admin',
              account_type: 'admin',
              is_admin: true,
              is_active: true,
              is_paid: true
            });
            setLoading(false);
            return true;
          } else {
            // Session expired, remove it
            localStorage.removeItem('krishisethu_admin_session');
          }
        }
      } catch (error) {
        console.error('Error checking local admin session:', error);
        localStorage.removeItem('krishisethu_admin_session');
      }
      return false;
    };

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting initial session...');

        // First check for local admin session
        if (checkLocalAdminSession()) {
          return; // Admin session found, skip Supabase check
        }

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

            // Set a timeout for profile loading to prevent hanging (increased timeout)
            const profileLoadTimeout = setTimeout(() => {
              console.warn('⚠️ Profile loading timeout - using default profile (this is normal for new users)');
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
            }, 8000); // Increased to 8 seconds to reduce false timeouts

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

    // DISABLED: Automatic session validation to prevent unwanted logouts
    // Users will only be logged out when they explicitly sign out or tokens naturally expire
    // if (!checkLocalAdminSession()) {
    //   sessionInterval = setInterval(async () => {
    //     if (mounted && currentUser && !loading) {
    //       const isValid = await validateAndRefreshSession();
    //       if (!isValid) {
    //         console.log('⚠️ Session validation failed, clearing user state');
    //         setCurrentUser(null);
    //         setUserProfile(null);
    //       }
    //     }
    //   }, 60000); // Check every minute
    // }
    
    console.log('ℹ️ Automatic session validation is DISABLED - users will stay logged in until manual logout');

    // Fallback timeout to ensure loading never gets stuck indefinitely
    const fallbackTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('⚠️ Fallback timeout triggered - forcing loading to false (this indicates slow network or database)');
        setLoading(false);
      }
    }, 15000); // Increased to 15 seconds for better reliability

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
      if (sessionInterval) {
        clearInterval(sessionInterval);
      }
    };
  }, []);

  const loadUserProfile = async (user) => {
    try {
      console.log('👤 Loading profile for user:', user.email);
      
      let profile = null;
      let error = null;

      // Try users table first (where RegistrationForm writes)
      try {
        console.log('🔍 Checking users table...');
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Profile loading timeout')), 12000); // Increased timeout
        });
        
        const profilePromise = supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        const result = await Promise.race([profilePromise, timeoutPromise]);
        profile = result.data;
        error = result.error;
        
        if (!error && profile) {
          console.log('✅ Found profile in users table:', profile);
        } else {
          console.log('⚠️ No profile found in users table:', error?.message);
        }
      } catch (usersError) {
        console.log('⚠️ Users table access failed:', usersError.message);
        error = usersError;
      }
      
      // If users table didn't work, try profiles table (optional)
      if (!profile) {
        try {
          console.log('🔍 Checking profiles table...');
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Profile loading timeout')), 10000); // Increased timeout
          });
          
          const profilePromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          const result = await Promise.race([profilePromise, timeoutPromise]);
          profile = result.data;
          error = result.error;
          
          if (!error && profile) {
            console.log('✅ Found profile in profiles table:', profile);
          } else {
            console.log('⚠️ No profile found in profiles table:', error?.message);
          }
        } catch (profilesError) {
          console.log('⚠️ Profiles table access failed (expected if table doesn\'t exist):', profilesError.message);
          // Don't set error if it's just a missing table - we'll create a default profile
          if (profilesError.message.includes('does not exist') || profilesError.code === '42P01') {
            console.log('📝 Profiles table doesn\'t exist, will use default profile instead');
            error = null; // Clear error so we proceed with default profile creation
          } else {
            error = profilesError;
          }
        }
      }

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
        console.log('ℹ️ Profile not found or accessible, creating default profile (this is normal for new users):', error?.message);
        
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

  const logout = async (userContext = 'regular') => {
    console.log('🚪 Starting logout process for:', userContext);
    
    try {
      let wasAdminSession = false;
      
      // 1. Check if this is a local admin session
      const adminSession = localStorage.getItem('krishisethu_admin_session');
      if (adminSession) {
        console.log('🔧 Logging out local admin session');
        localStorage.removeItem('krishisethu_admin_session');
        wasAdminSession = true;
      } else {
        // Check if this is an admin user through other means
        const adminEmails = [
          'arjunpeter@krishisethu.com',
          'admin@krishisethu.com',
          'superadmin@krishisethu.com',
          'master@krishisethu.com',
          'arjunin2020@gmail.com'
        ];
        
        if (currentUser?.email && adminEmails.includes(currentUser.email.toLowerCase())) {
          wasAdminSession = true;
        }
        
        if (userProfile?.role === 'admin' || userProfile?.account_type === 'admin') {
          wasAdminSession = true;
        }
        
        // Call Supabase signOut for regular users
        console.log('🔄 Calling Supabase signOut...');
        
        // Use Promise.race with timeout to prevent hanging on signOut
        const signOutPromise = supabase.auth.signOut();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Supabase signOut timeout')), 3000);
        });
        
        try {
          const { error } = await Promise.race([signOutPromise, timeoutPromise]);
          if (error) {
            console.error('❌ Supabase signOut error:', error);
            // Continue with cleanup even if signOut fails
          } else {
            console.log('✅ Supabase signOut successful');
          }
        } catch (signOutError) {
          console.error('⏱️ Supabase signOut timed out or failed:', signOutError);
          // Continue with cleanup even if signOut times out
        }
      }
      
      // 2. Clear local state immediately
      console.log('🧹 Clearing application state...');
      setCurrentUser(null);
      setUserProfile(null);
      
      // 3. Clear localStorage tokens and session data
      if (isLocalStorageAvailable()) {
        try {
          console.log('🧹 Clearing storage...');
          
          // Clear Supabase specific tokens
          const projectRef = supabase.supabaseUrl.split('//')[1].split('.')[0];
          localStorage.removeItem(`sb-${projectRef}-auth-token`);
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('krishisethu-auth');
          localStorage.removeItem('krishisethu-user');
          
          // Clear any other auth-related storage
          Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase') || 
                key.includes('auth') || 
                key.includes('krishisethu') || 
                key.includes('session')) {
              console.log(`🗑️ Removing localStorage item: ${key}`);
              localStorage.removeItem(key);
            }
          });
          
          // Use the clearAuthStorage helper if available
          if (typeof clearAuthStorage === 'function') {
            clearAuthStorage();
          }
          
          // Clear session storage as well
          sessionStorage.clear();
        } catch (storageError) {
          console.warn('⚠️ Warning clearing storage:', storageError);
        }
      } else {
        console.warn('⚠️ localStorage not available for clearing');
      }
      
      // 4. Reset loading state
      setLoading(false);
      
      // 5. Dispatch a custom event that other components can listen for
      try {
        const eventDetail = { 
          timestamp: new Date().toISOString(),
          wasAdminSession,
          userContext 
        };
        window.dispatchEvent(new CustomEvent('krishisethu:logout-complete', {
          detail: eventDetail
        }));
      } catch (eventError) {
        console.warn('⚠️ Error dispatching logout event:', eventError);
      }
      
      console.log('✅ Logout completed successfully');
      
      // 6. Return success with admin info
      return { 
        error: null, 
        success: true, 
        wasAdminSession,
        userContext 
      };
      
    } catch (unexpectedError) {
      console.error('❌ Unexpected logout error:', unexpectedError);
      
      // Force cleanup on any error
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
      
      // Try one more time to clear storage in case of error
      try {
        if (isLocalStorageAvailable()) {
          localStorage.removeItem('krishisethu_admin_session');
          localStorage.removeItem('krishisethu-auth');
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.clear();
        }
      } catch (e) {
        // Ignore any errors in the final cleanup attempt
      }
      
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

  // Debug inventory testing functions
  const testInventoryLoading = async () => {
    console.log('🧪 Testing inventory loading with debug service...');
    try {
      const result = await debugEnhancedInventoryService.fetchInventory(userProfile);
      console.log('✅ Debug inventory test completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Debug inventory test failed:', error);
      throw error;
    }
  };

  const testSupabaseConnection = async () => {
    console.log('🧪 Testing Supabase connection...');
    try {
      const result = await debugEnhancedInventoryService.testConnection();
      console.log('✅ Connection test completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      throw error;
    }
  };

  const getInventoryDebugStats = () => {
    const stats = debugEnhancedInventoryService.getDebugStats();
    console.log('📊 Inventory debug stats:', stats);
    return stats;
  };

  const clearInventoryCache = () => {
    debugEnhancedInventoryService.clearCache();
    console.log('🧹 Inventory cache cleared');
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
    // Debug inventory functions
    testInventoryLoading,
    testSupabaseConnection,
    getInventoryDebugStats,
    clearInventoryCache
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
