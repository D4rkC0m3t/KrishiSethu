import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  Truck,
  Settings,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  Target,
  Zap,
  Filter,
  Search,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Smartphone,
  Globe,
  Database,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { productsService, salesService } from '../lib/supabaseDb';
import { realtimeService } from '../lib/realtime';

const AlertsSystem = ({ onNavigate }) => {
  const { currentUser, userProfile, hasPermission } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Enhanced alert settings with customizable thresholds
  const [alertSettings, setAlertSettings] = useState({
    // Stock thresholds
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    outOfStockThreshold: 0,

    // Expiry thresholds
    expiryWarningDays: 30,
    criticalExpiryDays: 7,
    expiredGraceDays: 3,

    // Financial thresholds
    highValueTransactionLimit: 50000,
    dailySalesTarget: 25000,
    lowProfitMarginThreshold: 15,

    // Customer thresholds
    creditLimitWarningPercent: 80,
    inactiveCustomerDays: 90,

    // Supplier thresholds
    lateDeliveryDays: 3,
    qualityScoreThreshold: 85,

    // Notification preferences
    enableEmailAlerts: true,
    enableSMSAlerts: false,
    enablePushNotifications: true,
    enableSoundAlerts: true,

    // Email settings
    emailRecipients: [userProfile?.email || ''],
    emailFrequency: 'immediate', // immediate, hourly, daily

    // SMS settings
    smsRecipients: [],
    smsFrequency: 'critical_only',

    // Business hours
    businessHoursStart: '09:00',
    businessHoursEnd: '18:00',
    alertsDuringOffHours: false,

    // Auto-actions
    autoReorderEnabled: false,
    autoDiscountExpiring: false,
    autoNotifySuppliers: false
  });

  // Notification rules for different business events
  const [notificationRules, setNotificationRules] = useState([
    {
      id: '1',
      name: 'Critical Stock Alert',
      event: 'stock_critical',
      condition: 'stock <= criticalStockThreshold',
      enabled: true,
      priority: 'high',
      channels: ['email', 'sms', 'push'],
      recipients: ['admin', 'manager'],
      template: 'Critical stock alert: {productName} has only {currentStock} units left',
      frequency: 'immediate'
    },
    {
      id: '2',
      name: 'Product Expiry Warning',
      event: 'product_expiring',
      condition: 'daysToExpiry <= expiryWarningDays',
      enabled: true,
      priority: 'medium',
      channels: ['email', 'push'],
      recipients: ['admin', 'manager'],
      template: 'Product expiry warning: {productName} expires in {daysToExpiry} days',
      frequency: 'daily'
    },
    {
      id: '3',
      name: 'High Value Transaction',
      event: 'high_value_sale',
      condition: 'saleAmount >= highValueTransactionLimit',
      enabled: true,
      priority: 'medium',
      channels: ['email'],
      recipients: ['admin'],
      template: 'High value transaction: ₹{amount} sale to {customerName}',
      frequency: 'immediate'
    },
    {
      id: '4',
      name: 'Daily Sales Target',
      event: 'sales_target_achieved',
      condition: 'dailySales >= dailySalesTarget',
      enabled: true,
      priority: 'low',
      channels: ['push'],
      recipients: ['all'],
      template: 'Daily sales target achieved! Total: ₹{dailySales}',
      frequency: 'daily'
    }
  ]);

  // Alert history and analytics
  const [alertHistory, setAlertHistory] = useState([]);
  const [alertAnalytics, setAlertAnalytics] = useState({
    totalAlerts: 0,
    resolvedAlerts: 0,
    pendingAlerts: 0,
    averageResolutionTime: 0,
    mostCommonAlertType: '',
    alertTrends: []
  });

  // Load real products data from Firebase
  const loadProductsAndGenerateAlerts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading products from Firebase for alerts...');

      const firebaseProducts = await productsService.getAll();
      console.log('Loaded products for alerts:', firebaseProducts);

      if (firebaseProducts && firebaseProducts.length > 0) {
        setProducts(firebaseProducts);
        generateAlertsFromProducts(firebaseProducts);
      } else {
        // If no products exist, create some sample data with alert conditions
        await createSampleProductsWithAlerts();
      }
    } catch (error) {
      console.error('Error loading products for alerts:', error);
      setError('Failed to load product data for alerts. Please try again.');
      setProducts([]);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Create sample products with alert conditions for demo
  const createSampleProductsWithAlerts = async () => {
    const sampleProducts = [
      {
        name: 'NPK 10:26:26',
        category: 'Chemical Fertilizer',
        currentStock: 3, // Low stock
        reorderPoint: 10,
        expiryDate: '2024-02-15', // Expiring soon
        batchNumber: 'BATCH001',
        supplier: 'Tata Chemicals',
        purchasePrice: 45,
        sellingPrice: 55
      },
      {
        name: 'Urea 46%',
        category: 'Chemical Fertilizer',
        currentStock: 75,
        reorderPoint: 20,
        expiryDate: '2024-06-30',
        batchNumber: 'BATCH002',
        supplier: 'IFFCO',
        purchasePrice: 25,
        sellingPrice: 30
      },
      {
        name: 'Organic Compost',
        category: 'Organic Fertilizer',
        currentStock: 2, // Critical stock
        reorderPoint: 15,
        expiryDate: '2024-01-25', // Expired
        batchNumber: 'BATCH003',
        supplier: 'Green Gold',
        purchasePrice: 15,
        sellingPrice: 20
      },
      {
        name: 'Bio Fertilizer Mix',
        category: 'Bio Fertilizer',
        currentStock: 8, // Low stock
        reorderPoint: 12,
        expiryDate: '2024-02-10', // Expiring very soon
        batchNumber: 'BATCH004',
        supplier: 'Bio Solutions',
        purchasePrice: 35,
        sellingPrice: 45
      }
    ];

    try {
      for (const product of sampleProducts) {
        await productsService.create(product);
      }
      // Reload products after creating samples
      const newProducts = await productsService.getAll();
      setProducts(newProducts);
      generateAlertsFromProducts(newProducts);
    } catch (error) {
      console.error('Error creating sample products for alerts:', error);
    }
  };

  useEffect(() => {
    // Set up real-time subscription for products to generate alerts
    const unsubscribe = realtimeService.subscribeToProducts((data, error) => {
      if (error) {
        console.error('Real-time products error for alerts:', error);
        setError('Failed to sync product data for alerts. Please refresh.');
        // Fallback to manual loading
        loadProductsAndGenerateAlerts();
      } else if (data) {
        console.log('Real-time products update for alerts:', data);
        setProducts(data);
        generateAlertsFromProducts(data);
        setIsLoading(false);
      }
    });

    // Initial load if real-time fails
    loadProductsAndGenerateAlerts();

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [alertSettings]);

  const generateAlertsFromProducts = (productList) => {
    const newAlerts = [];
    const today = new Date();

    productList.forEach(product => {
      // Use reorderPoint if available, otherwise use alertSettings thresholds
      const criticalThreshold = product.reorderPoint ? Math.floor(product.reorderPoint * 0.5) : alertSettings.criticalStockThreshold;
      const lowThreshold = product.reorderPoint || alertSettings.lowStockThreshold;

      // Critical stock alert
      if (product.currentStock <= criticalThreshold) {
        newAlerts.push({
          id: `critical-${product.id}`,
          type: 'critical',
          category: 'stock',
          title: 'Critical Stock Level',
          message: `${product.name} has only ${product.currentStock} units left`,
          productId: product.id,
          productName: product.name,
          priority: 'high',
          timestamp: new Date(),
          actionRequired: true,
          status: 'active'
        });
      }
      // Low stock alert
      else if (product.currentStock <= lowThreshold) {
        newAlerts.push({
          id: `low-stock-${product.id}`,
          type: 'warning',
          category: 'stock',
          title: 'Low Stock Alert',
          message: `${product.name} is running low (${product.currentStock} units)`,
          productId: product.id,
          productName: product.name,
          priority: 'medium',
          timestamp: new Date(),
          actionRequired: true,
          status: 'active'
        });
      }

      // Expiry alerts (only if product has expiry date)
      if (product.expiryDate) {
        const expiryDate = new Date(product.expiryDate);
        const daysToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        if (daysToExpiry < 0) {
          newAlerts.push({
            id: `expired-${product.id}`,
            type: 'critical',
            category: 'expiry',
            title: 'Product Expired',
            message: `${product.name} expired ${Math.abs(daysToExpiry)} days ago`,
            productId: product.id,
            productName: product.name,
            priority: 'high',
            timestamp: new Date(),
            actionRequired: true,
            status: 'active'
          });
        } else if (daysToExpiry <= alertSettings.expiryWarningDays) {
          newAlerts.push({
            id: `expiring-${product.id}`,
            type: 'warning',
            category: 'expiry',
            title: 'Product Expiring Soon',
            message: `${product.name} expires in ${daysToExpiry} days`,
            productId: product.id,
            productName: product.name,
            priority: daysToExpiry <= alertSettings.criticalExpiryDays ? 'high' : 'medium',
            timestamp: new Date(),
            actionRequired: daysToExpiry <= alertSettings.criticalExpiryDays,
            status: 'active'
          });
        }
      }
    });

    setAlerts(newAlerts);
  };

  // Refresh alerts manually
  const refreshAlerts = async () => {
    setRefreshing(true);
    await loadProductsAndGenerateAlerts();
    setRefreshing(false);
  };

  const getAlertBadge = (alert) => {
    const variants = {
      'critical': 'destructive',
      'warning': 'secondary',
      'info': 'default'
    };
    return <Badge variant={variants[alert.type]}>{alert.type.toUpperCase()}</Badge>;
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'stock': return <Package className="h-4 w-4" />;
      case 'expiry': return <Clock className="h-4 w-4" />;
      case 'quality': return <Target className="h-4 w-4" />;
      case 'financial': return <DollarSign className="h-4 w-4" />;
      case 'customer': return <Users className="h-4 w-4" />;
      case 'supplier': return <Truck className="h-4 w-4" />;
      case 'system': return <Database className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Enhanced notification system
  const sendNotifications = async (newAlerts) => {
    if (!alertSettings.enableEmailAlerts && !alertSettings.enableSMSAlerts && !alertSettings.enablePushNotifications) {
      return;
    }

    // Check business hours
    const now = new Date();
    const currentHour = now.getHours();
    const businessStart = parseInt(alertSettings.businessHoursStart.split(':')[0]);
    const businessEnd = parseInt(alertSettings.businessHoursEnd.split(':')[0]);

    const isDuringBusinessHours = currentHour >= businessStart && currentHour <= businessEnd;

    if (!isDuringBusinessHours && !alertSettings.alertsDuringOffHours) {
      // Queue alerts for next business day
      console.log('Alerts queued for next business day');
      return;
    }

    for (const alert of newAlerts) {
      // Find matching notification rules
      const matchingRules = notificationRules.filter(rule =>
        rule.enabled && shouldTriggerRule(rule, alert)
      );

      for (const rule of matchingRules) {
        // Check frequency limits
        if (shouldSendNotification(rule, alert)) {
          await sendNotificationByChannels(rule, alert);
        }
      }
    }
  };

  const shouldTriggerRule = (rule, alert) => {
    // Simple rule matching - in real app, implement proper rule engine
    switch (rule.event) {
      case 'stock_critical':
        return alert.category === 'stock' && alert.priority === 'high';
      case 'product_expiring':
        return alert.category === 'expiry';
      case 'high_value_sale':
        return alert.category === 'financial' && alert.amount >= alertSettings.highValueTransactionLimit;
      case 'sales_target_achieved':
        return alert.category === 'financial' && alert.type === 'achievement';
      default:
        return false;
    }
  };

  const shouldSendNotification = (rule, alert) => {
    // Check frequency limits and prevent spam
    const lastSent = localStorage.getItem(`last_notification_${rule.id}_${alert.id}`);
    const now = Date.now();

    if (!lastSent) return true;

    const timeSinceLastSent = now - parseInt(lastSent);
    const frequencyLimits = {
      'immediate': 0,
      'hourly': 60 * 60 * 1000,
      'daily': 24 * 60 * 60 * 1000,
      'critical_only': 0
    };

    return timeSinceLastSent >= (frequencyLimits[rule.frequency] || 0);
  };

  const sendNotificationByChannels = async (rule, alert) => {
    const message = formatNotificationMessage(rule.template, alert);

    for (const channel of rule.channels) {
      switch (channel) {
        case 'email':
          if (alertSettings.enableEmailAlerts) {
            await sendEmailNotification(message, alert, rule);
          }
          break;
        case 'sms':
          if (alertSettings.enableSMSAlerts) {
            await sendSMSNotification(message, alert, rule);
          }
          break;
        case 'push':
          if (alertSettings.enablePushNotifications) {
            await sendPushNotification(message, alert, rule);
          }
          break;
      }
    }

    // Record notification sent
    localStorage.setItem(`last_notification_${rule.id}_${alert.id}`, Date.now().toString());
  };

  const formatNotificationMessage = (template, alert) => {
    return template
      .replace('{productName}', alert.productName || '')
      .replace('{currentStock}', alert.currentStock || '')
      .replace('{daysToExpiry}', alert.daysToExpiry || '')
      .replace('{amount}', alert.amount ? `₹${alert.amount.toLocaleString()}` : '')
      .replace('{customerName}', alert.customerName || '')
      .replace('{dailySales}', alert.dailySales ? `₹${alert.dailySales.toLocaleString()}` : '');
  };

  const sendEmailNotification = async (message, alert, rule) => {
    // In real app, integrate with email service (SendGrid, AWS SES, etc.)
    console.log('Email notification:', { message, alert, rule });

    // Simulate email sending
    if (alertSettings.emailRecipients.length > 0) {
      // Mock email API call
      setTimeout(() => {
        console.log(`Email sent to: ${alertSettings.emailRecipients.join(', ')}`);
      }, 1000);
    }
  };

  const sendSMSNotification = async (message, alert, rule) => {
    // In real app, integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log('SMS notification:', { message, alert, rule });

    if (alertSettings.smsRecipients.length > 0) {
      // Mock SMS API call
      setTimeout(() => {
        console.log(`SMS sent to: ${alertSettings.smsRecipients.join(', ')}`);
      }, 1000);
    }
  };

  const sendPushNotification = async (message, alert, rule) => {
    try {
      // Import notification service dynamically
      const { notificationService } = await import('../lib/notificationService');

      // Check if push notifications are enabled for this type
      const alertType = alert.type === 'stock' ? 'lowStock' :
                       alert.type === 'expiry' ? 'expiry' : 'general';

      if (!notificationService.isTypeEnabled(alertType)) {
        console.log(`[Alerts] Push notifications disabled for type: ${alertType}`);
        return;
      }

      // Determine notification type and data
      let notificationType = 'general';
      let notificationData = {
        productId: alert.productId,
        productName: alert.product || 'Unknown Product',
        alertId: alert.id,
        priority: alert.priority
      };

      if (alert.type === 'stock') {
        if (alert.currentStock === 0) {
          notificationType = 'outOfStock';
        } else {
          notificationType = 'lowStock';
          notificationData.quantity = alert.currentStock;
        }
      } else if (alert.type === 'expiry') {
        if (alert.status === 'expired') {
          notificationType = 'expired';
        } else {
          notificationType = 'expiringSoon';
          notificationData.daysUntilExpiry = alert.daysUntilExpiry || 'soon';
        }
      }

      // Show notification using the notification service
      notificationService.showInventoryAlert(notificationType, notificationData);

      console.log(`[Alerts] Push notification sent for ${notificationType}:`, notificationData);
    } catch (error) {
      console.error('[Alerts] Error sending push notification:', error);

      // Fallback to basic browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${alert.title}`, {
          body: message,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: alert.id,
          requireInteraction: alert.priority === 'high'
        });
      }
    }
  };

  // Analytics and reporting
  const updateAlertAnalytics = (newAlerts) => {
    const analytics = {
      totalAlerts: newAlerts.length,
      resolvedAlerts: 0, // Would track from alert history
      pendingAlerts: newAlerts.filter(a => a.actionRequired).length,
      averageResolutionTime: 0, // Calculate from historical data
      mostCommonAlertType: getMostCommonAlertType(newAlerts),
      alertTrends: generateAlertTrends(newAlerts)
    };

    setAlertAnalytics(analytics);
  };

  const getMostCommonAlertType = (alerts) => {
    const typeCounts = alerts.reduce((acc, alert) => {
      acc[alert.category] = (acc[alert.category] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(typeCounts).reduce((a, b) =>
      typeCounts[a] > typeCounts[b] ? a : b, 'stock'
    );
  };

  const generateAlertTrends = (alerts) => {
    // Generate trend data for charts
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10) + 1 // Mock data
      };
    }).reverse();

    return last7Days;
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAlertSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseInt(value) || value
    }));
  };

  // Enhanced filtering and search
  useEffect(() => {
    let filtered = alerts;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (alert.productName && alert.productName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(alert => alert.category === filterCategory);
    }

    // Apply priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(alert => alert.priority === filterPriority);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'action_required') {
        filtered = filtered.filter(alert => alert.actionRequired);
      } else if (filterStatus === 'resolved') {
        filtered = filtered.filter(alert => alert.resolved);
      }
    }

    setFilteredAlerts(filtered);
  }, [alerts, searchTerm, filterCategory, filterPriority, filterStatus]);

  const saveSettings = () => {
    // In a real app, save to backend/localStorage
    localStorage.setItem('alertSettings', JSON.stringify(alertSettings));
    setShowSettingsDialog(false);
    alert('Alert settings saved successfully!');

    // Regenerate alerts with new settings
    const currentProducts = products;
    if (currentProducts.length > 0) {
      generateAlerts(currentProducts);
    }
  };

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));

    // Add to history
    const dismissedAlert = alerts.find(a => a.id === alertId);
    if (dismissedAlert) {
      setAlertHistory(prev => [...prev, { ...dismissedAlert, dismissedAt: new Date(), status: 'dismissed' }]);
    }
  };

  const resolveAlert = (alert) => {
    // Mark as resolved
    setAlerts(prev => prev.map(a =>
      a.id === alert.id ? { ...a, resolved: true, resolvedAt: new Date() } : a
    ));

    // Add to history
    setAlertHistory(prev => [...prev, { ...alert, resolvedAt: new Date(), status: 'resolved' }]);

    // Navigate to appropriate page for resolution
    if (alert.category === 'stock') {
      onNavigate('purchase-entry');
    } else if (alert.category === 'expiry') {
      onNavigate('inventory');
    } else if (alert.category === 'customer') {
      onNavigate('customers');
    } else if (alert.category === 'supplier') {
      onNavigate('suppliers');
    }
  };

  const snoozeAlert = (alertId, hours = 24) => {
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + hours);

    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? { ...alert, snoozedUntil: snoozeUntil, snoozed: true }
        : alert
    ));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setAlertSettings(prev => ({ ...prev, enablePushNotifications: true }));
        alert('Push notifications enabled!');
      }
    }
  };

  const exportAlerts = () => {
    const exportData = alerts.map(alert => ({
      timestamp: alert.timestamp.toISOString(),
      category: alert.category,
      priority: alert.priority,
      title: alert.title,
      message: alert.message,
      productName: alert.productName || '',
      actionRequired: alert.actionRequired
    }));

    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alerts_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };



  const criticalAlerts = filteredAlerts.filter(alert => alert.type === 'critical');
  const warningAlerts = filteredAlerts.filter(alert => alert.type === 'warning');
  const actionRequiredAlerts = filteredAlerts.filter(alert => alert.actionRequired);

  return (
    <div className="space-y-6 bg-background text-foreground min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')}>
              <Activity className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Alert Management</h2>
          <p className="text-muted-foreground">Monitor inventory alerts and system notifications</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={refreshAlerts} disabled={isLoading || refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${(isLoading || refreshing) ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alert Settings</DialogTitle>
                <DialogDescription>Configure alert thresholds and notifications</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Low Stock Threshold</label>
                  <Input
                    name="lowStockThreshold"
                    type="number"
                    value={alertSettings.lowStockThreshold}
                    onChange={handleSettingsChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Critical Stock Threshold</label>
                  <Input
                    name="criticalStockThreshold"
                    type="number"
                    value={alertSettings.criticalStockThreshold}
                    onChange={handleSettingsChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Expiry Warning Days</label>
                  <Input
                    name="expiryWarningDays"
                    type="number"
                    value={alertSettings.expiryWarningDays}
                    onChange={handleSettingsChange}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="enableEmailAlerts"
                    checked={alertSettings.enableEmailAlerts}
                    onChange={handleSettingsChange}
                  />
                  <label className="text-sm">Enable Email Alerts</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="enableSMSAlerts"
                    checked={alertSettings.enableSMSAlerts}
                    onChange={handleSettingsChange}
                  />
                  <label className="text-sm">Enable SMS Alerts</label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={saveSettings}>Save Settings</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => onNavigate('dashboard')}>📊 Dashboard</Button>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <span className="text-2xl">🚨</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">Active alerts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <span className="text-2xl">🔴</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <span className="text-2xl">🟡</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warningAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Monitor closely</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Required</CardTitle>
            <span className="text-2xl">⚡</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actionRequiredAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Need action</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>Current system alerts requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md mb-4">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
              <Button variant="outline" size="sm" onClick={refreshAlerts} className="ml-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-muted-foreground">Loading alerts...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No active alerts</p>
                <p className="text-sm">All systems are running smoothly</p>
              </div>
            ) : (
              alerts
                .sort((a, b) => {
                  const priorityOrder = { high: 3, medium: 2, low: 1 };
                  return priorityOrder[b.priority] - priorityOrder[a.priority];
                })
                .map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCategoryIcon(alert.category)}</span>
                        <span className="text-lg">{getPriorityIcon(alert.priority)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-foreground">{alert.title}</h4>
                          {getAlertBadge(alert)}
                          {alert.actionRequired && (
                            <Badge variant="outline" className="text-xs">ACTION REQUIRED</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Product: {alert.productName} • {alert.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {alert.actionRequired && (
                        <Button
                          size="sm"
                          onClick={() => resolveAlert(alert)}
                          className="text-xs"
                        >
                          Resolve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => dismissAlert(alert.id)}
                        className="text-xs"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Stock Alerts</CardTitle>
            <CardDescription>Low stock and critical inventory levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.filter(alert => alert.category === 'stock').map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span>{getPriorityIcon(alert.priority)}</span>
                    <span className="text-sm">{alert.productName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{alert.type}</span>
                </div>
              ))}
              {alerts.filter(alert => alert.category === 'stock').length === 0 && (
                <p className="text-sm text-muted-foreground">No stock alerts</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expiry Alerts</CardTitle>
            <CardDescription>Products nearing expiry or expired</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.filter(alert => alert.category === 'expiry').map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span>{getPriorityIcon(alert.priority)}</span>
                    <span className="text-sm">{alert.productName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{alert.type}</span>
                </div>
              ))}
              {alerts.filter(alert => alert.category === 'expiry').length === 0 && (
                <p className="text-sm text-muted-foreground">No expiry alerts</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AlertsSystem;
