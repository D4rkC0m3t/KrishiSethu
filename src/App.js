import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import ConfigurationError from './components/ConfigurationError';
import KSLogo from './components/KSLogo';
import './App.css';
import './styles/print.css';

// Configuration Error Boundary
class ConfigurationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Check if this is a configuration error
    if (error.message && error.message.includes('Supabase configuration')) {
      return { hasError: true, error };
    }
    return null;
  }

  componentDidCatch(error, errorInfo) {
    console.error('Configuration Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ConfigurationError error={this.state.error} />;
    }

    return this.props.children;
  }
}

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <div className="animate-pulse mb-4">
          <KSLogo size={128} />
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
        <p className="text-green-700 font-medium">Loading KrishiSethu...</p>
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
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
        />

        {/* Protected Routes - Dashboard handles all internal routing */}
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Catch all other routes and redirect appropriately */}
        <Route path="*" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/" />
        } />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ConfigurationErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ConfigurationErrorBoundary>
  );
}

export default App;
