import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, requireAdmin = false, fallback = null }) => {
  const { currentUser, userProfile, loading } = useAuth();

  console.log('🛡️ ProtectedRoute State:', {
    loading,
    hasCurrentUser: !!currentUser,
    hasUserProfile: !!userProfile,
    requireAdmin,
    userRole: userProfile?.role
  });

  // If still loading auth state, show loading spinner
  if (loading) {
    console.log('⏳ ProtectedRoute is in loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!currentUser) {
    console.log('❌ No currentUser, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check admin access if required
  if (requireAdmin) {
    const isAdmin = userProfile?.role === 'admin' ||
                   currentUser?.email === 'admin@krishisethu.com' ||
                   currentUser?.email === 'superadmin@krishisethu.com' ||
                   currentUser?.email === 'master@krishisethu.com' ||
                   currentUser?.email === 'arjunin2020@gmail.com' ||
                   userProfile?.role === 'super_admin';

    if (!isAdmin) {
      console.log('❌ Admin access required but user is not admin', {
        userEmail: currentUser?.email,
        userRole: userProfile?.role
      });
      return <Navigate to="/" replace />;
    }
  }

  // Check specific role if required
  if (requiredRole && userProfile?.role !== requiredRole) {
    console.log('❌ Required role not met:', { required: requiredRole, actual: userProfile?.role });
    return <Navigate to="/dashboard" replace />;
  }

  console.log('✅ User authenticated and authorized, allowing access');
  return children;
};

export default ProtectedRoute;
