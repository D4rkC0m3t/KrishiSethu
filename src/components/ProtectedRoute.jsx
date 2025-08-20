import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, fallback = null }) => {
  const { currentUser, userProfile, loading } = useAuth();

  console.log('🛡️ ProtectedRoute State:', {
    loading,
    hasCurrentUser: !!currentUser,
    hasUserProfile: !!userProfile
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

  // For now, allow access if user exists (we'll add role checking later)
  console.log('✅ User authenticated, allowing access');
  return children;
};

export default ProtectedRoute;
