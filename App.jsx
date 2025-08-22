import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import EnhancedLogin from './EnhancedLogin';
import EnhancedAdminDashboard from './EnhancedAdminDashboard';

const AppContent = () => {
  const { user, userProfile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <h2>Loading KrishiSethu...</h2>
        <p>Please wait while we initialize your session</p>
        
        <style jsx>{`
          .app-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
          }

          .loading-spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 30px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .app-loading h2 {
            margin-bottom: 10px;
            font-size: 1.8rem;
          }

          .app-loading p {
            opacity: 0.8;
            font-size: 1rem;
          }
        `}</style>
      </div>
    );
  }

  // If no user, show login
  if (!user) {
    return <EnhancedLogin />;
  }

  // If user exists, show appropriate dashboard based on role
  return (
    <EnhancedAdminDashboard 
      currentUser={userProfile || user} 
      onLogout={signOut}
    />
  );
};

const App = () => {
  return (
    <AuthProvider>
      <div className="app">
        <AppContent />
        
        <style jsx global>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          html, body {
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
              Oxygen, Ubuntu, Cantarell, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          #root, .app {
            min-height: 100vh;
          }

          /* Scrollbar styling */
          ::-webkit-scrollbar {
            width: 8px;
          }

          ::-webkit-scrollbar-track {
            background: #f1f5f9;
          }

          ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }

          /* Focus styles for accessibility */
          button:focus-visible,
          input:focus-visible,
          select:focus-visible {
            outline: 2px solid #667eea;
            outline-offset: 2px;
          }

          /* Animation for smooth transitions */
          * {
            transition: color 0.15s ease, background-color 0.15s ease, 
              border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
          }
        `}</style>
      </div>
    </AuthProvider>
  );
};

export default App;
