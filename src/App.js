import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import DebugAuth from './components/DebugAuth';
import './App.css';
import './styles/print.css';

// Main App Component with Authentication
function AppContent() {
  const { currentUser, userProfile, loading } = useAuth();

  console.log('🔍 App State:', {
    loading,
    hasCurrentUser: !!currentUser,
    hasUserProfile: !!userProfile,
    userEmail: currentUser?.email,
    userRole: userProfile?.role || userProfile?.account_type
  });

  if (loading) {
    console.log('⏳ App is in loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Simplified authentication check - just check if user exists
  const isAuthenticated = !!currentUser;

  console.log('🔐 Authentication status:', isAuthenticated);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
        />

        {/* Root redirect to login if not authenticated, dashboard if authenticated */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
        />

        {/* Protected Routes - Dashboard handles all internal routing */}
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Catch all other routes and redirect appropriately */}
        <Route path="*" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
