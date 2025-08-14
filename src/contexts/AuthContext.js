import React, { createContext, useContext, useState } from 'react';

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
  const [loading, setLoading] = useState(false);

  // User roles
  const USER_ROLES = {
    ADMIN: 'admin',
    STAFF: 'staff',
    MANAGER: 'manager'
  };

  // Simple placeholder functions
  const signup = async (email, password, userData) => {
    console.log('Signup called:', email);
    throw new Error('Signup not implemented yet');
  };

  const signin = async (email, password) => {
    console.log('Signin called:', email);
    throw new Error('Signin not implemented yet');
  };

  const logout = async () => {
    console.log('Logout called');
    setCurrentUser(null);
    setUserProfile(null);
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

  // Permission helpers
  const hasPermission = (requiredRole) => {
    if (!userProfile) return false;

    const roleHierarchy = {
      [USER_ROLES.STAFF]: 1,
      [USER_ROLES.MANAGER]: 2,
      [USER_ROLES.ADMIN]: 3
    };

    return roleHierarchy[userProfile.role] >= roleHierarchy[requiredRole];
  };

  const isAdmin = () => userProfile?.role === USER_ROLES.ADMIN;
  const isManager = () => userProfile?.role === USER_ROLES.MANAGER;

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
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
