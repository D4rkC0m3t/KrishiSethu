import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

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

  // User roles
  const USER_ROLES = {
    ADMIN: 'admin',
    STAFF: 'staff',
    MANAGER: 'manager'
  };

  // Sign up new user
  const signup = async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      const userProfileData = {
        uid: user.uid,
        email: user.email,
        name: userData.name || '',
        role: userData.role || USER_ROLES.STAFF,
        createdAt: new Date(),
        isActive: true
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfileData);
      setUserProfile(userProfileData);
      
      return user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Sign in user
  const signin = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Signin error:', error);
      throw error;
    }
  };

  // Sign out user
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Get user profile from Firestore
  const getUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  // Check if user has permission
  const hasPermission = (requiredRole) => {
    if (!userProfile) return false;
    
    const roleHierarchy = {
      [USER_ROLES.ADMIN]: 3,
      [USER_ROLES.MANAGER]: 2,
      [USER_ROLES.STAFF]: 1
    };
    
    const userRoleLevel = roleHierarchy[userProfile.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
    
    return userRoleLevel >= requiredRoleLevel;
  };

  // Check if user is admin
  const isAdmin = () => {
    return userProfile?.role === USER_ROLES.ADMIN;
  };

  // Check if user is manager or above
  const isManager = () => {
    return hasPermission(USER_ROLES.MANAGER);
  };

  // Demo login for testing
  const demoLogin = async (role = USER_ROLES.STAFF) => {
    try {
      // Create a unique demo email for each role to avoid conflicts
      const demoEmail = `demo-${role}@fertilizer.com`;
      const demoPassword = 'demo123456';

      console.log(`Attempting demo login for role: ${role}`);

      try {
        // Try to sign in with existing demo account
        const userCredential = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
        console.log('Signed in with existing demo account:', userCredential.user.uid);

        // Update the user profile with the selected role
        const demoProfile = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          role: role,
          createdAt: new Date(),
          isActive: true
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), demoProfile);
        setUserProfile(demoProfile);

        return userCredential.user;
      } catch (signInError) {
        console.log('Demo account does not exist, creating new one...', signInError.code);

        // Create demo account if it doesn't exist
        const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
        console.log('Created new demo account:', userCredential.user.uid);

        const demoProfile = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          role: role,
          createdAt: new Date(),
          isActive: true
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), demoProfile);
        setUserProfile(demoProfile);

        return userCredential.user;
      }
    } catch (error) {
      console.error('Demo login failed completely:', error);
      alert(`Demo login failed: ${error.message}. Please check your internet connection and try again.`);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
    USER_ROLES,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
