import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Bell,
  BellOff,
  Settings,
  TestTube,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Clock,
  Eye,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { notificationService } from '../lib/notificationService';
import { alertsService } from '../lib/alertsService';

const NotificationManagement = ({ onNavigate }) => {
  const [notificationStatus, setNotificationStatus] = useState(notificationService.getStatus());
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(notificationStatus.settings);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    
    // Update status periodically
    const interval = setInterval(() => {
      const newStatus = notificationService.getStatus();
      setNotificationStatus(newStatus);
      setSettings(newStatus.settings);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Load recent notifications/alerts
      const alerts = await alertsService.getAlerts();
      
      // Convert alerts to notification format
      const notificationList = alerts.map(alert => ({
        id: alert.id,
        title: alert.title || `${alert.type} Alert`,
        message: alert.message || alert.description,
        type: alert.type,
        priority: alert.priority || 'medium',
        timestamp: alert.timestamp || alert.createdAt || new Date(),
        isRead: alert.isRead || false,
        category: alert.category || 'general'
      }));

      setNotifications(notificationList);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionRequest = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      setNotificationStatus(notificationService.getStatus());
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    notificationService.saveSettings(newSettings);
  };

  const testNotification = async () => {
    setIsTestingNotification(true);
    
    try {
      // Test different types of notifications
      await notificationService.showNotification('Test Notification', {
        body: 'This is a test notification from KrishiSethu',
        icon: '/logo192.png',
        tag: 'test-notification'
      });

      // Test inventory alert
      await notificationService.showInventoryAlert('lowStock', {
        productId: 'test-1',
        productName: 'Test Product',
        quantity: 5
      });

    } catch (error) {
      console.error('Error testing notification:', error);
    } finally {
      setTimeout(() => setIsTestingNotification(false), 2000);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const clearAllNotifications = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      setNotifications([]);
    }
  };

  const getPermissionIcon = () => {
    switch (notificationStatus.permission) {
      case 'granted': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getPermissionBadge = () => {
    const variants = {
      granted: 'default',
      denied: 'destructive',
      default: 'secondary'
    };
    return (
      <Badge variant={variants[notificationStatus.permission] || 'secondary'}>
        {notificationStatus.permission}
      </Badge>
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'lowStock':
      case 'outOfStock': return '📦';
      case 'expiring':
      case 'expired': return '⏰';
      case 'sale': return '💰';
      case 'purchase': return '🛒';
      case 'customer': return '👤';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 p-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onNavigate('dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Bell className="h-8 w-8 text-blue-600" />
              Notification Center
            </h1>
          </div>
          <p className="text-muted-foreground">
            {notifications.length} total notifications • {unreadCount} unread
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={loadNotifications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={testNotification} disabled={isTestingNotification}>
            <TestTube className="h-4 w-4 mr-2" />
            {isTestingNotification ? 'Testing...' : 'Test'}
          </Button>
          <Button variant="outline" size="sm" onClick={clearAllNotifications}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Permission Status</p>
                <p className="text-lg font-bold">{notificationStatus.permission}</p>
              </div>
              {getPermissionIcon()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold text-blue-600">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
              </div>
              <BellOff className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Queued</p>
                <p className="text-2xl font-bold text-purple-600">{notificationStatus.queueLength}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Permission Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getPermissionIcon()}
                  Browser Permission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    {getPermissionBadge()}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Browser Support</span>
                    <Badge variant={notificationStatus.supported ? 'default' : 'destructive'}>
                      {notificationStatus.supported ? 'Supported' : 'Not Supported'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Push Support</span>
                    <Badge variant={notificationStatus.pushSupported ? 'default' : 'destructive'}>
                      {notificationStatus.pushSupported ? 'Supported' : 'Not Supported'}
                    </Badge>
                  </div>
                  {notificationStatus.permission !== 'granted' && (
                    <Button onClick={handlePermissionRequest} className="w-full">
                      Request Permission
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                      <div className="text-sm text-gray-600">When products are expiring</div>
                    </div>
                    <Switch
                      checked={settings.expiry}
                      onCheckedChange={(value) => handleSettingChange('expiry', value)}
                      disabled={!settings.enabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Sales Alerts</div>
                      <div className="text-sm text-gray-600">For sales transactions</div>
                    </div>
                    <Switch
                      checked={settings.sales}
                      onCheckedChange={(value) => handleSettingChange('sales', value)}
                      disabled={!settings.enabled}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Recent Notifications</CardTitle>
                  <CardDescription>Latest system notifications and alerts</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={markAllAsRead}>
                    Mark All Read
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllNotifications}>
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BellOff className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No notifications</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        !notification.isRead 
                          ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 bg-gray-50 dark:bg-gray-800/50'
                      } ${getPriorityColor(notification.priority)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-foreground">{notification.title}</h4>
                              {!notification.isRead && (
                                <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                  NEW
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {notification.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Permission Section */}
              <div className="space-y-3">
                <h4 className="font-medium">Browser Permission</h4>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getPermissionIcon()}
                    <span>Current Status: {notificationStatus.permission}</span>
                  </div>
                  {notificationStatus.permission !== 'granted' && (
                    <Button onClick={handlePermissionRequest}>
                      Grant Permission
                    </Button>
                  )}
                </div>
              </div>

              {/* Notification Types */}
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
                      <div className="text-sm text-gray-600">When products are expiring</div>
                    </div>
                    <Switch
                      checked={settings.expiry}
                      onCheckedChange={(value) => handleSettingChange('expiry', value)}
                      disabled={!settings.enabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Sales Alerts</div>
                      <div className="text-sm text-gray-600">For sales transactions</div>
                    </div>
                    <Switch
                      checked={settings.sales}
                      onCheckedChange={(value) => handleSettingChange('sales', value)}
                      disabled={!settings.enabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">System Alerts</div>
                      <div className="text-sm text-gray-600">System status and updates</div>
                    </div>
                    <Switch
                      checked={settings.system}
                      onCheckedChange={(value) => handleSettingChange('system', value)}
                      disabled={!settings.enabled}
                    />
                  </div>
                </div>
              </div>

              {/* Test Section */}
              <div className="space-y-3">
                <h4 className="font-medium">Test Notifications</h4>
                <div className="flex gap-2">
                  <Button 
                    onClick={testNotification} 
                    disabled={isTestingNotification || notificationStatus.permission !== 'granted'}
                    className="flex-1"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {isTestingNotification ? 'Testing...' : 'Send Test Notification'}
                  </Button>
                </div>
                {notificationStatus.permission !== 'granted' && (
                  <p className="text-sm text-gray-500">
                    Grant permission to test notifications
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationManagement;
