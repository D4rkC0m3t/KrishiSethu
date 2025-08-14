import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Download, 
  RefreshCw, 
  X, 
  AlertCircle, 
  CheckCircle,
  Info
} from 'lucide-react';

const AppUpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [updateDetails, setUpdateDetails] = useState(null);

  useEffect(() => {
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        setRegistration(reg);
        
        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              setUpdateAvailable(true);
              setShowNotification(true);
              setUpdateDetails({
                version: getAppVersion(),
                timestamp: new Date(),
                features: getUpdateFeatures()
              });
              
              console.log('[Update] New app version available');
            }
          });
        });
        
        // Check for waiting service worker
        if (reg.waiting) {
          setUpdateAvailable(true);
          setShowNotification(true);
          setUpdateDetails({
            version: getAppVersion(),
            timestamp: new Date(),
            features: getUpdateFeatures()
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          setUpdateAvailable(true);
          setShowNotification(true);
          setUpdateDetails(event.data.details || {});
        }
      });
    }

    // Check for app updates periodically
    const checkForUpdates = () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_FOR_UPDATES' });
      }
    };

    // Check for updates every 30 minutes
    const updateInterval = setInterval(checkForUpdates, 30 * 60 * 1000);

    return () => {
      clearInterval(updateInterval);
    };
  }, []);

  const getAppVersion = () => {
    // Get version from package.json or environment
    return process.env.REACT_APP_VERSION || '1.0.0';
  };

  const getUpdateFeatures = () => {
    // Return list of new features (could be fetched from server)
    return [
      'Improved barcode scanning',
      'Enhanced offline capabilities',
      'Better notification system',
      'Performance improvements'
    ];
  };

  const handleUpdate = async () => {
    if (!registration || !registration.waiting) {
      console.warn('[Update] No waiting service worker found');
      return;
    }

    setIsUpdating(true);

    try {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Wait for the new service worker to take control
      await new Promise((resolve) => {
        const handleControllerChange = () => {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
          resolve();
        };
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      });

      // Show success notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('App Updated!', {
          body: 'Krishisethu has been updated to the latest version.',
          icon: '/logo192.png',
          tag: 'app-updated'
        });
      }

      // Reload the page to use the new version
      window.location.reload();
    } catch (error) {
      console.error('[Update] Error updating app:', error);
      setIsUpdating(false);
      
      // Show error notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Failed to update app. Please refresh manually.';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 5000);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
    
    // Track dismissal
    localStorage.setItem('update-dismissed', new Date().toISOString());
    
    // Show again after 1 hour
    setTimeout(() => {
      if (updateAvailable) {
        setShowNotification(true);
      }
    }, 60 * 60 * 1000);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!showNotification || !updateAvailable) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Update Available</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-blue-800 mb-2">
                A new version of Krishisethu is available with improvements and new features.
              </p>
              
              {updateDetails && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      v{updateDetails.version}
                    </Badge>
                    <span className="text-xs text-blue-600">
                      {updateDetails.timestamp?.toLocaleDateString()}
                    </span>
                  </div>
                  
                  {updateDetails.features && updateDetails.features.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-blue-800 mb-1">What's New:</p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        {updateDetails.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center gap-1">
                            <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Update Now
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Info className="h-3 w-3" />
              <span>Update will reload the app</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppUpdateNotification;
