import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // Removed connectionError state since we have offline sync feature
  // Users can work offline without showing error pages

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Network: Back online - offline sync will handle data synchronization');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Network: Gone offline - offline sync will handle data storage');
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Test connection periodically for sync purposes, but don't trigger error states
    const testConnection = async () => {
      try {
        const response = await fetch('/api/health-check', {
          method: 'HEAD',
          cache: 'no-cache',
          timeout: 5000
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        if (!isOnline) {
          setIsOnline(true);
          console.log('Connection restored - sync will resume automatically');
        }
      } catch (error) {
        // Don't log as error since offline functionality handles this gracefully
        if (isOnline) {
          setIsOnline(false);
          console.log('Connection lost - switching to offline mode');
        }
      }
    };

    // Test connection every 30 seconds for sync coordination
    const connectionInterval = setInterval(testConnection, 30000);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectionInterval);
    };
  }, [isOnline]);

  const retryConnection = async () => {
    try {
      // Simple connectivity test
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });

      setIsOnline(true);
      console.log('Connection retry successful');
      return true;
    } catch (error) {
      console.log('Connection retry failed - continuing in offline mode');
      setIsOnline(false);
      return false;
    }
  };

  return {
    isOnline,
    retryConnection
  };
};

export default useNetworkStatus;
