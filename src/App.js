import React, { useState, useEffect } from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useDatabase } from './hooks/useDatabase';
import AuthPage from './components/auth/AuthPage';
import Dashboard from './components/Dashboard';
import { DatabaseStatusBadge } from './components/DatabaseStatus';
import NotificationDropdown from './components/NotificationDropdown';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [alerts, setAlerts] = useState([]);
  
  const { isOnline } = useNetworkStatus();
  const { isReady: isDatabaseReady, hasError: hasDatabaseError } = useDatabase();

  const handleAuthSuccess = (user, profile) => {
    setCurrentUser(user);
    setUserProfile(profile);
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserProfile(null);
    setCurrentPage('dashboard');
  };

  // If user is not authenticated, show auth page
  if (!currentUser) {
    return (
      <SettingsProvider>
        <div className="min-h-screen bg-gray-50">
          <AuthPage onAuthSuccess={handleAuthSuccess} />
        </div>
      </SettingsProvider>
    );
  }

  return (
    <SettingsProvider>
      <ErrorBoundary onNavigate={handleNavigate}>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold text-gray-900">
                    KrishiSethu Inventory
                  </h1>
                  <DatabaseStatusBadge className="ml-4" />
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Network Status */}
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="ml-2 text-sm text-gray-600">
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  
                  {/* Notifications */}
                  <NotificationDropdown 
                    alerts={alerts} 
                    onNavigate={handleNavigate}
                  />
                  
                  {/* User Menu */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">
                      {userProfile?.name || currentUser?.email}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {hasDatabaseError ? (
              <div className="text-center py-12">
                <div className="text-red-500 text-lg mb-4">
                  Database Connection Error
                </div>
                <p className="text-gray-600">
                  Please check your database configuration and try again.
                </p>
              </div>
            ) : !isDatabaseReady ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Initializing database...</p>
              </div>
            ) : (
              <Dashboard 
                currentPage={currentPage}
                onNavigate={handleNavigate}
                user={currentUser}
                userProfile={userProfile}
                onAlertsUpdate={setAlerts}
              />
            )}
          </main>
        </div>
      </ErrorBoundary>
    </SettingsProvider>
  );
}

export default App;