import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { 
  Bell, 
  BellOff, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Smartphone,
  Volume2,
  VolumeX
} from 'lucide-react';
import { notificationService } from '../lib/notificationService';

const NotificationSettings = ({ className = '' }) => {
  const [status, setStatus] = useState(notificationService.getStatus());
  const [settings, setSettings] = useState(status.settings);
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  useEffect(() => {
    // Update status periodically
    const interval = setInterval(() => {
      const newStatus = notificationService.getStatus();
      setStatus(newStatus);
      setSettings(newStatus.settings);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handlePermissionRequest = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      setStatus(notificationService.getStatus());
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    notificationService.saveSettings(newSettings);
    
    // Show feedback
    const message = value ? `${key} notifications enabled` : `${key} notifications disabled`;
    showToast(message, value ? 'success' : 'warning');
  };

  const testNotification = async () => {
    setIsTestingNotification(true);
    
    try {
      // Test different types of notifications
      const testNotifications = [
        {
          type: 'lowStock',
          data: {
            productId: 'test-1',
            productName: 'Test Product',
            quantity: 5
          }
        },
        {
          type: 'expiringSoon',
          data: {
            productId: 'test-2',
            productName: 'Test Fertilizer',
            daysUntilExpiry: 3
          }
        }
      ];

      for (const test of testNotifications) {
        notificationService.showInventoryAlert(test.type, test.data);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Test sales notification
      notificationService.showSalesNotification({
        id: 'test-sale',
        total: 1250,
        customerName: 'Test Customer',
        itemCount: 3
      });

      showToast('Test notifications sent!', 'success');
    } catch (error) {
      console.error('Error testing notifications:', error);
      showToast('Failed to send test notifications', 'error');
    } finally {
      setIsTestingNotification(false);
    }
  };

  const showToast = (message, type) => {
    const colors = {
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500'
    };

    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${colors[type]} text-white p-3 rounded-lg shadow-lg z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const getPermissionBadge = () => {
    switch (status.permission) {
      case 'granted':
        return <Badge className="bg-green-500">Granted</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="outline">Not Requested</Badge>;
    }
  };

  const getPermissionIcon = () => {
    switch (status.permission) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Configure push notifications and alerts for your inventory
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getPermissionIcon()}
              <span className="font-medium">Browser Permission</span>
            </div>
            {getPermissionBadge()}
          </div>
          
          {status.permission !== 'granted' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {status.permission === 'denied' 
                  ? 'Notifications are blocked. Please enable them in your browser settings.'
                  : 'Click below to enable notifications for important inventory alerts.'
                }
              </p>
              {status.permission !== 'denied' && (
                <Button onClick={handlePermissionRequest} className="w-full">
                  <Bell className="h-4 w-4 mr-2" />
                  Enable Notifications
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Support Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Smartphone className="h-4 w-4" />
              <span className="text-sm font-medium">Browser Support</span>
            </div>
            <Badge variant={status.supported ? 'default' : 'destructive'}>
              {status.supported ? 'Supported' : 'Not Supported'}
            </Badge>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Volume2 className="h-4 w-4" />
              <span className="text-sm font-medium">Push Support</span>
            </div>
            <Badge variant={status.pushSupported ? 'default' : 'destructive'}>
              {status.pushSupported ? 'Supported' : 'Not Supported'}
            </Badge>
          </div>
        </div>

        {/* Notification Types */}
        {status.permission === 'granted' && (
          <div className="space-y-4">
            <h4 className="font-medium">Notification Types</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Master Switch</div>
                  <div className="text-sm text-gray-600">Enable/disable all notifications</div>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(value) => handleSettingChange('enabled', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Low Stock Alerts</div>
                  <div className="text-sm text-gray-600">When products are running low</div>
                </div>
                <Switch
                  checked={settings.lowStock}
                  onCheckedChange={(value) => handleSettingChange('lowStock', value)}
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Expiry Alerts</div>
                  <div className="text-sm text-gray-600">When products are expiring soon</div>
                </div>
                <Switch
                  checked={settings.expiry}
                  onCheckedChange={(value) => handleSettingChange('expiry', value)}
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Sales Notifications</div>
                  <div className="text-sm text-gray-600">When sales are completed</div>
                </div>
                <Switch
                  checked={settings.sales}
                  onCheckedChange={(value) => handleSettingChange('sales', value)}
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Sync Notifications</div>
                  <div className="text-sm text-gray-600">When data is synced</div>
                </div>
                <Switch
                  checked={settings.sync}
                  onCheckedChange={(value) => handleSettingChange('sync', value)}
                  disabled={!settings.enabled}
                />
              </div>
            </div>
          </div>
        )}

        {/* Test Notifications */}
        {status.permission === 'granted' && settings.enabled && (
          <div className="space-y-3">
            <h4 className="font-medium">Test Notifications</h4>
            <Button
              onClick={testNotification}
              disabled={isTestingNotification}
              className="w-full"
              variant="outline"
            >
              {isTestingNotification ? (
                <>
                  <Volume2 className="h-4 w-4 mr-2 animate-pulse" />
                  Sending Test Notifications...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Send Test Notifications
                </>
              )}
            </Button>
          </div>
        )}

        {/* Queue Status */}
        {status.queueLength > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                {status.queueLength} notifications queued (will be shown when permission is granted)
              </span>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">About Notifications:</div>
              <ul className="space-y-1 text-xs">
                <li>• Notifications help you stay informed about important inventory events</li>
                <li>• You can customize which types of notifications you receive</li>
                <li>• Notifications work even when the app is not open</li>
                <li>• Your browser may ask for permission to show notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
