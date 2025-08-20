import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

const AlertsPanel = ({ onNavigate }) => {
  const [alerts, setAlerts] = useState([]);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  // Mock alerts data
  useEffect(() => {
    const mockAlerts = [
      {
        id: '1',
        type: 'low_stock',
        severity: 'high',
        title: 'Critical Low Stock',
        message: 'Urea is critically low (8 bags remaining)',
        productId: '2',
        productName: 'Urea',
        currentStock: 8,
        minStock: 15,
        createdAt: new Date('2025-01-06T10:30:00'),
        isRead: false
      },
      {
        id: '2',
        type: 'expiry',
        severity: 'medium',
        title: 'Near Expiry Alert',
        message: 'DAP expires in 15 days (March 15, 2025)',
        productId: '3',
        productName: 'DAP',
        expiryDate: new Date('2025-03-15'),
        daysUntilExpiry: 15,
        createdAt: new Date('2025-01-06T09:15:00'),
        isRead: false
      },
      {
        id: '3',
        type: 'low_stock',
        severity: 'medium',
        title: 'Low Stock Warning',
        message: 'Potash is running low (12 bags remaining)',
        productId: '4',
        productName: 'Potash',
        currentStock: 12,
        minStock: 20,
        createdAt: new Date('2025-01-05T16:45:00'),
        isRead: true
      },
      {
        id: '4',
        type: 'system',
        severity: 'low',
        title: 'Daily Backup Complete',
        message: 'System backup completed successfully',
        createdAt: new Date('2025-01-06T02:00:00'),
        isRead: true
      },
      {
        id: '5',
        type: 'sales',
        severity: 'low',
        title: 'High Sales Day',
        message: 'Today\'s sales exceeded ₹5,000',
        amount: 5250,
        createdAt: new Date('2025-01-06T18:30:00'),
        isRead: false
      }
    ];
    setAlerts(mockAlerts);
  }, []);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'low_stock': return '📦';
      case 'expiry': return '⏰';
      case 'system': return '⚙️';
      case 'sales': return '💰';
      default: return '🔔';
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    return (
      <Badge className={colors[severity]}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const markAsRead = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
  };

  const deleteAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getActionButton = (alert) => {
    switch (alert.type) {
      case 'low_stock':
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onNavigate('inventory')}
          >
            View Inventory
          </Button>
        );
      case 'expiry':
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onNavigate('inventory')}
          >
            Check Products
          </Button>
        );
      case 'sales':
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onNavigate('sales')}
          >
            View Sales
          </Button>
        );
      default:
        return null;
    }
  };

  const unreadAlerts = alerts.filter(alert => !alert.isRead);
  const recentAlerts = alerts.slice(0, 5);

  return (
    <div className="space-y-6 bg-background text-foreground min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alerts & Notifications</h1>
          <p className="text-muted-foreground">
            {unreadAlerts.length} unread alerts • {alerts.length} total alerts
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={markAllAsRead}>
            Mark All Read
          </Button>
          <Button variant="outline" onClick={() => onNavigate('dashboard')}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter(a => a.severity === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {alerts.filter(a => a.type === 'low_stock').length}
            </div>
            <p className="text-xs text-muted-foreground">products need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expiry Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {alerts.filter(a => a.type === 'expiry').length}
            </div>
            <p className="text-xs text-muted-foreground">products near expiry</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unread Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {unreadAlerts.length}
            </div>
            <p className="text-xs text-muted-foreground">need your attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Latest notifications and warnings</CardDescription>
            </div>
            <Dialog open={showAllAlerts} onOpenChange={setShowAllAlerts}>
              <DialogTrigger asChild>
                <Button variant="outline">View All</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>All Alerts</DialogTitle>
                  <DialogDescription>
                    Complete list of all alerts and notifications
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {alerts.map((alert) => (
                    <AlertItem 
                      key={alert.id} 
                      alert={alert} 
                      onMarkRead={markAsRead}
                      onDelete={deleteAlert}
                      getActionButton={getActionButton}
                      getAlertIcon={getAlertIcon}
                      getAlertColor={getAlertColor}
                      getSeverityBadge={getSeverityBadge}
                    />
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <AlertItem 
                key={alert.id} 
                alert={alert} 
                onMarkRead={markAsRead}
                onDelete={deleteAlert}
                getActionButton={getActionButton}
                getAlertIcon={getAlertIcon}
                getAlertColor={getAlertColor}
                getSeverityBadge={getSeverityBadge}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Alert Item Component
const AlertItem = ({ 
  alert, 
  onMarkRead, 
  onDelete, 
  getActionButton, 
  getAlertIcon, 
  getAlertColor, 
  getSeverityBadge 
}) => {
  return (
    <div className={`p-4 rounded-lg border ${getAlertColor(alert.severity)} ${!alert.isRead ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">{getAlertIcon(alert.type)}</div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-foreground">{alert.title}</h4>
              {getSeverityBadge(alert.severity)}
              {!alert.isRead && (
                <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">NEW</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>{alert.createdAt.toLocaleDateString()} {alert.createdAt.toLocaleTimeString()}</span>
              {alert.productName && <span>Product: {alert.productName}</span>}
              {alert.amount && <span>Amount: ₹{alert.amount.toLocaleString()}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getActionButton(alert)}
          {!alert.isRead && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => onMarkRead(alert.id)}
            >
              Mark Read
            </Button>
          )}
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => onDelete(alert.id)}
            className="text-red-600"
          >
            ✕
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;
