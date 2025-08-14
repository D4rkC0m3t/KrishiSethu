import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Download,
  Smartphone,
  Monitor,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Shield,
  Clock,
  HardDrive,
  Globe,
  X,
  RefreshCw,
  Settings,
  Info
} from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installSupported, setInstallSupported] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop');
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)) {
      if (/ipad/.test(userAgent)) {
        setDeviceType('tablet');
      } else {
        setDeviceType('mobile');
      }
    } else {
      setDeviceType('desktop');
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallSupported(true);

      // Check if we should show the prompt
      const shouldShowPrompt = checkShouldShowPrompt();

      if (shouldShowPrompt) {
        // Show install prompt after a delay if not installed
        setTimeout(() => {
          if (!isInstalled) {
            setShowInstallPrompt(true);
          }
        }, 15000); // Show after 15 seconds
      }
    };

    // Check if we should show the install prompt
    const checkShouldShowPrompt = () => {
      // Don't show if already installed
      if (isInstalled || localStorage.getItem('pwa-installed') === 'true') {
        return false;
      }

      // Check dismiss count and last dismiss time
      const dismissCount = parseInt(localStorage.getItem('pwa-install-dismiss-count') || '0');
      const lastDismiss = localStorage.getItem('pwa-install-last-dismiss');

      // Don't show if dismissed too many times
      if (dismissCount >= 3) {
        return false;
      }

      // Don't show if dismissed recently (within 24 hours)
      if (lastDismiss) {
        const lastDismissTime = new Date(lastDismiss);
        const now = new Date();
        const hoursSinceLastDismiss = (now - lastDismissTime) / (1000 * 60 * 60);

        if (hoursSinceLastDismiss < 24) {
          return false;
        }
      }

      return true;
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      
      // Show success message
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Krishisethu Installed!', {
          body: 'App installed successfully. You can now access it from your home screen.',
          icon: '/logo192.png'
        });
      }
    };

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');

        // Track installation
        localStorage.setItem('pwa-installed', 'true');
        localStorage.setItem('pwa-install-date', new Date().toISOString());

        // Show success notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Krishisethu Installed!', {
            body: 'App installed successfully. You can now access it from your home screen.',
            icon: '/logo192.png',
            tag: 'pwa-installed'
          });
        }
      } else {
        console.log('User dismissed the install prompt');

        // Track dismissal
        const dismissCount = parseInt(localStorage.getItem('pwa-install-dismiss-count') || '0') + 1;
        localStorage.setItem('pwa-install-dismiss-count', dismissCount.toString());
        localStorage.setItem('pwa-install-last-dismiss', new Date().toISOString());
      }

      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const getInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      return {
        title: 'Install on iOS',
        steps: [
          'Tap the Share button in Safari',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to confirm installation'
        ],
        icon: <Smartphone className="h-6 w-6" />
      };
    } else if (isAndroid) {
      return {
        title: 'Install on Android',
        steps: [
          'Tap the menu button (⋮) in Chrome',
          'Select "Add to Home screen"',
          'Tap "Add" to confirm installation'
        ],
        icon: <Smartphone className="h-6 w-6" />
      };
    } else {
      return {
        title: 'Install on Desktop',
        steps: [
          'Click the install icon in the address bar',
          'Or use the install button below',
          'Follow the browser prompts to install'
        ],
        icon: <Monitor className="h-6 w-6" />
      };
    }
  };

  const pwaFeatures = [
    {
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      title: 'Lightning Fast',
      description: 'Instant loading with cached resources'
    },
    {
      icon: <WifiOff className="h-5 w-5 text-blue-500" />,
      title: 'Works Offline',
      description: 'Continue working without internet'
    },
    {
      icon: <Shield className="h-5 w-5 text-green-500" />,
      title: 'Secure & Reliable',
      description: 'HTTPS encryption and data protection'
    },
    {
      icon: <HardDrive className="h-5 w-5 text-purple-500" />,
      title: 'Local Storage',
      description: 'Data cached locally for quick access'
    },
    {
      icon: <RefreshCw className="h-5 w-5 text-indigo-500" />,
      title: 'Auto Updates',
      description: 'Always get the latest features'
    },
    {
      icon: <Smartphone className="h-5 w-5 text-pink-500" />,
      title: 'Native Feel',
      description: 'App-like experience on all devices'
    }
  ];

  if (isInstalled) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-medium text-green-900">App Installed Successfully!</h3>
              <p className="text-sm text-green-700">
                Krishisethu is now available on your home screen
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!showInstallPrompt && !showFeatures) {
    return null;
  }

  const instructions = getInstallInstructions();

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">Install Krishisethu</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowInstallPrompt(false);
                setShowFeatures(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-blue-700">
            Get the full app experience with offline support
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Online/Offline Status */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">Offline</span>
              </>
            )}
            <Badge variant="outline" className="ml-auto">
              {deviceType}
            </Badge>
          </div>

          {/* PWA Features Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFeatures(!showFeatures)}
            className="w-full"
          >
            <Info className="h-4 w-4 mr-2" />
            {showFeatures ? 'Hide' : 'Show'} Features
          </Button>

          {/* Features List */}
          {showFeatures && (
            <div className="space-y-3">
              <h4 className="font-medium text-blue-900">App Features:</h4>
              <div className="grid grid-cols-1 gap-2">
                {pwaFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                    {feature.icon}
                    <div>
                      <div className="font-medium text-sm">{feature.title}</div>
                      <div className="text-xs text-gray-600">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Installation Instructions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {instructions.icon}
              <h4 className="font-medium text-blue-900">{instructions.title}</h4>
            </div>
            <ol className="text-sm text-blue-700 space-y-1">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Install Button */}
          {installSupported && deferredPrompt && (
            <Button
              onClick={handleInstallClick}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Install Now
            </Button>
          )}

          {/* Manual Installation Note */}
          {!installSupported && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Manual Installation</p>
                  <p>Follow the steps above to install manually</p>
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
            <strong>Benefits:</strong> Faster loading, offline access, push notifications, 
            and a native app experience on your device.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;
