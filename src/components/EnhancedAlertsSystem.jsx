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
  Activity,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Play,
  Pause,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const EnhancedAlertsSystem = ({ onNavigate }) => {
  const { currentUser, userProfile, hasPermission } = useAuth();
  const [alerts, setAlerts] = useState([]);
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
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Enhanced alert settings
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
    
    // Notification preferences
    enableEmailAlerts: true,
    enableSMSAlerts: false,
    enablePushNotifications: true,
    enableSoundAlerts: true,
    
    // Email settings
    emailRecipients: [userProfile?.email || ''],
    emailFrequency: 'immediate',
    
    // Business hours
    businessHoursStart: '09:00',
    businessHoursEnd: '18:00',
    alertsDuringOffHours: false,
    
    // Auto-actions
    autoReorderEnabled: false,
    autoDiscountExpiring: false,
    autoNotifySuppliers: false
  });

  // Notification rules
  const [notificationRules, setNotificationRules] = useState([
    {
      id: '1',
      name: 'Critical Stock Alert',
      event: 'stock_critical',
      condition: 'stock <= criticalStockThreshold',
      enabled: true,
      priority: 'high',
      channels: ['email', 'push'],
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
    }
  ]);

  // Alert analytics
  const [alertAnalytics, setAlertAnalytics] = useState({
    totalAlerts: 0,
    resolvedAlerts: 0,
    pendingAlerts: 0,
    averageResolutionTime: 0,
    mostCommonAlertType: '',
    alertTrends: []
  });

  useEffect(() => {
    loadAlerts();
    loadAlertAnalytics();
  }, []);

  useEffect(() => {
    // Filter alerts
    let filtered = alerts;

    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (alert.productName && alert.productName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(alert => alert.category === filterCategory);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(alert => alert.priority === filterPriority);
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'action_required') {
        filtered = filtered.filter(alert => alert.actionRequired);
      } else if (filterStatus === 'resolved') {
        filtered = filtered.filter(alert => alert.resolved);
      } else if (filterStatus === 'snoozed') {
        filtered = filtered.filter(alert => alert.snoozed);
      }
    }

    setFilteredAlerts(filtered);
  }, [alerts, searchTerm, filterCategory, filterPriority, filterStatus]);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      // Mock alerts data - in real app, load from Firebase
      const mockAlerts = [
        {
          id: '1',
          type: 'critical',
          category: 'stock',
          title: 'Critical Stock Level',
          message: 'NPK 20-20-20 has only 2 units left',
          productId: 'prod1',
          productName: 'NPK 20-20-20',
          priority: 'high',
          timestamp: new Date('2025-01-07T10:30:00'),
          actionRequired: true,
          estimatedLoss: 1900,
          reorderSuggestion: 50
        },
        {
          id: '2',
          type: 'warning',
          category: 'expiry',
          title: 'Product Expiring Soon',
          message: 'Organic Compost expires in 5 days',
          productId: 'prod3',
          productName: 'Organic Compost',
          priority: 'medium',
          timestamp: new Date('2025-01-07T09:15:00'),
          actionRequired: true,
          suggestedDiscount: 15
        },
        {
          id: '3',
          type: 'warning',
          category: 'financial',
          title: 'Low Sales Today',
          message: 'Today\'s sales (₹18,500) are below target',
          priority: 'medium',
          timestamp: new Date('2025-01-07T08:45:00'),
          actionRequired: true,
          amount: 18500,
          target: 25000
        },
        {
          id: '4',
          type: 'info',
          category: 'customer',
          title: 'Credit Limit Warning',
          message: 'Rajesh Farmer has used 84% of credit limit',
          customerId: 'cust1',
          customerName: 'Rajesh Farmer',
          priority: 'medium',
          timestamp: new Date('2025-01-07T07:20:00'),
          actionRequired: false,
          creditUsed: 42000,
          creditLimit: 50000
        },
        {
          id: '5',
          type: 'warning',
          category: 'supplier',
          title: 'Late Delivery',
          message: 'IFFCO Limited delivery is 2 days late',
          supplierId: 'sup2',
          supplierName: 'IFFCO Limited',
          priority: 'medium',
          timestamp: new Date('2025-01-06T16:30:00'),
          actionRequired: true,
          daysLate: 2
        },
        {
          id: '6',
          type: 'warning',
          category: 'system',
          title: 'Backup Overdue',
          message: 'Last backup was 8 days ago',
          priority: 'medium',
          timestamp: new Date('2025-01-06T14:15:00'),
          actionRequired: true,
          daysSinceBackup: 8
        }
      ];

      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlertAnalytics = () => {
    // Mock analytics data
    setAlertAnalytics({
      totalAlerts: 24,
      resolvedAlerts: 18,
      pendingAlerts: 6,
      averageResolutionTime: 4.2, // hours
      mostCommonAlertType: 'stock',
      alertTrends: [
        { date: '2025-01-01', count: 3 },
        { date: '2025-01-02', count: 5 },
        { date: '2025-01-03', count: 2 },
        { date: '2025-01-04', count: 7 },
        { date: '2025-01-05', count: 4 },
        { date: '2025-01-06', count: 6 },
        { date: '2025-01-07', count: 8 }
      ]
    });
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAlertSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
    }));
  };

  const saveSettings = () => {
    localStorage.setItem('enhancedAlertSettings', JSON.stringify(alertSettings));
    setShowSettingsDialog(false);
    alert('Alert settings saved successfully!');
  };

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const resolveAlert = (alert) => {
    setAlerts(prev => prev.map(a => 
      a.id === alert.id ? { ...a, resolved: true, resolvedAt: new Date() } : a
    ));
    
    // Navigate to appropriate page
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
    const exportData = filteredAlerts.map(alert => ({
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

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'stock': return <Package className="h-4 w-4" />;
      case 'expiry': return <Clock className="h-4 w-4" />;
      case 'financial': return <DollarSign className="h-4 w-4" />;
      case 'customer': return <Users className="h-4 w-4" />;
      case 'supplier': return <Truck className="h-4 w-4" />;
      case 'system': return <Database className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      'high': 'destructive',
      'medium': 'secondary',
      'low': 'outline'
    };
    const colors = {
      'high': 'text-red-600',
      'medium': 'text-yellow-600',
      'low': 'text-green-600'
    };
    return <Badge variant={variants[priority]} className={colors[priority]}>{priority.toUpperCase()}</Badge>;
  };

  const getTypeBadge = (type) => {
    const variants = {
      'critical': 'destructive',
      'warning': 'secondary',
      'info': 'outline'
    };
    return <Badge variant={variants[type]}>{type.toUpperCase()}</Badge>;
  };

  const criticalAlerts = filteredAlerts.filter(alert => alert.type === 'critical');
  const warningAlerts = filteredAlerts.filter(alert => alert.type === 'warning');
  const actionRequiredAlerts = filteredAlerts.filter(alert => alert.actionRequired);

  return (
    <div className="space-y-6 p-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-8 w-8 text-blue-600" />
            Enhanced Alerts & Notifications
          </h1>
          <p className="text-muted-foreground">
            {alerts.length} total alerts • {actionRequiredAlerts.length} require action • {criticalAlerts.length} critical
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportAlerts}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={requestNotificationPermission}>
            <Bell className="h-4 w-4 mr-2" />
            Enable Push
          </Button>
          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
          </Dialog>
          <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')}>
            ← Dashboard
          </Button>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Warning Alerts</p>
                <p className="text-2xl font-bold text-yellow-600">{warningAlerts.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Action Required</p>
                <p className="text-2xl font-bold text-blue-600">{actionRequiredAlerts.length}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {alertAnalytics.totalAlerts > 0
                    ? Math.round((alertAnalytics.resolvedAlerts / alertAnalytics.totalAlerts) * 100)
                    : 0}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search alerts by title, message, or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="expiry">Expiry</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="action_required">Action Required</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="snoozed">Snoozed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Active Alerts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Active Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts ({filteredAlerts.length})</CardTitle>
              <CardDescription>
                Current system alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Loading alerts...</p>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">No active alerts</p>
                  <p className="text-sm">All systems are running smoothly</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts
                    .sort((a, b) => {
                      const priorityOrder = { high: 3, medium: 2, low: 1 };
                      return priorityOrder[b.priority] - priorityOrder[a.priority];
                    })
                    .map((alert) => (
                      <div key={alert.id} className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors bg-card">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="flex items-center space-x-2">
                              {getCategoryIcon(alert.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-medium text-foreground">{alert.title}</h4>
                                {getTypeBadge(alert.type)}
                                {getPriorityBadge(alert.priority)}
                                {alert.actionRequired && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                    ACTION REQUIRED
                                  </Badge>
                                )}
                                {alert.snoozed && (
                                  <Badge variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                    SNOOZED
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>{alert.timestamp.toLocaleDateString()} {alert.timestamp.toLocaleTimeString()}</span>
                                {alert.productName && <span>Product: {alert.productName}</span>}
                                {alert.customerName && <span>Customer: {alert.customerName}</span>}
                                {alert.supplierName && <span>Supplier: {alert.supplierName}</span>}
                                {alert.amount && <span>Amount: ₹{alert.amount.toLocaleString()}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            {alert.actionRequired && (
                              <Button
                                size="sm"
                                onClick={() => resolveAlert(alert)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Resolve
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => snoozeAlert(alert.id)}
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => dismissAlert(alert.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
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
      </Tabs>
    </div>
  );
};

export default EnhancedAlertsSystem;
