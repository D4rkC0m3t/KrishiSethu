import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import ConfigurationError from './components/ConfigurationError';
import AdminLogin from './components/admin/AdminLogin';
import AdminMasterDashboard from './components/admin/AdminMasterDashboard';
import UserDashboard from './components/admin/UserDashboard';
import MultiTenantTest from './components/MultiTenantTest';
import DetailedDiagnostic from './components/DetailedDiagnostic';
import RawFetchTest from './components/RawFetchTest';
import SimpleSupabaseTest from './components/SimpleSupabaseTest';
import FreshClientTest from './components/FreshClientTest';
import DeepDiagnostic from './components/DeepDiagnostic';
import MasterTest from './components/MasterTest';
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

  // Listen for logout events to handle redirects
  React.useEffect(() => {
    const handleLogout = (event) => {
      const { wasAdminSession, userContext } = event.detail;
      console.log('🔊 Logout event received:', { wasAdminSession, userContext });
      
      // Redirect admin users to admin login page
      if (wasAdminSession || userContext === 'admin') {
        console.log('🔄 Redirecting admin user to admin login page');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 100);
      } else {
        // Redirect regular users to landing page
        console.log('🔄 Redirecting regular user to landing page');
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
    };

    window.addEventListener('krishisethu:logout-complete', handleLogout);
    return () => {
      window.removeEventListener('krishisethu:logout-complete', handleLogout);
    };
  }, []);

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

        {/* Multi-tenant Test Route */}
        <Route
          path="/test"
          element={<MultiTenantTest />}
        />

        {/* Detailed Diagnostic Route */}
        <Route
          path="/diagnostic"
          element={<DetailedDiagnostic />}
        />

        {/* Raw Fetch Test Route */}
        <Route
          path="/fetch-test"
          element={<RawFetchTest />}
        />

        {/* Simple Supabase Test Route */}
        <Route
          path="/supabase-test"
          element={<SimpleSupabaseTest />}
        />

        {/* Fresh Client Test Route */}
        <Route
          path="/fresh-test"
          element={<FreshClientTest />}
        />

        {/* Deep Diagnostic Route */}
        <Route
          path="/deep-test"
          element={<DeepDiagnostic />}
        />

        {/* Master Test Suite Route */}
        <Route
          path="/master-test"
          element={<MasterTest />}
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={<AdminLogin onNavigate={(path) => window.location.href = path} onAdminLogin={() => window.location.href = '/admin/dashboard'} />}
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminMasterDashboard onNavigate={(path) => window.location.href = path} />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/dashboard/user"
          element={
            <ProtectedRoute>
              <UserDashboard onNavigate={(path) => window.location.href = path} />
            </ProtectedRoute>
          }
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
