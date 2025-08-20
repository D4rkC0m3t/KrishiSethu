import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, Check, X, Clock, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from './ui/button.js';
import { Badge } from './ui/badge.js';
import { Card, CardContent } from './ui/card.js';
import { cn } from '../lib/utils';

const NotificationDropdown = ({ 
  alerts = [], 
  onNavigate, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  // Convert alerts to notifications format
  useEffect(() => {
    const formattedNotifications = alerts.map(alert => ({
      id: alert.id,
      title: getNotificationTitle(alert),
      message: getNotificationMessage(alert),
      type: getNotificationType(alert),
      timestamp: alert.timestamp || alert.createdAt || new Date(),
      isRead: alert.isRead || false,
      priority: alert.priority || 'medium',
      productId: alert.productId,
      productName: alert.productName
    }));

    // Sort by timestamp (newest first) and limit to 10
    const sortedNotifications = formattedNotifications
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    setNotifications(sortedNotifications);
  }, [alerts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationTitle = (alert) => {
    switch (alert.type) {
      case 'lowStock':
        return '⚠️ Low Stock Alert';
      case 'outOfStock':
        return '🚨 Out of Stock';
      case 'expired':
        return '❌ Product Expired';
      case 'expiringSoon':
        return '⏰ Expiring Soon';
      case 'sale':
        return '💰 Sale Completed';
      case 'purchase':
        return '📦 Purchase Added';
      default:
        return '🔔 Notification';
    }
  };

  const getNotificationMessage = (alert) => {
    switch (alert.type) {
      case 'lowStock':
        return `${alert.productName} is running low (${alert.currentStock || alert.quantity} remaining)`;
      case 'outOfStock':
        return `${alert.productName} is out of stock`;
      case 'expired':
        return `${alert.productName} has expired`;
      case 'expiringSoon':
        return `${alert.productName} expires in ${alert.daysUntilExpiry} days`;
      case 'sale':
        return `Sale of ₹${alert.amount || alert.total} completed`;
      case 'purchase':
        return `Purchase of ${alert.productName} added to inventory`;
      default:
        return alert.message || 'New notification';
    }
  };

  const getNotificationType = (alert) => {
    switch (alert.type) {
      case 'outOfStock':
      case 'expired':
        return 'error';
      case 'lowStock':
      case 'expiringSoon':
        return 'warning';
      case 'sale':
      case 'purchase':
        return 'success';
      default:
        return 'info';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.productId) {
      onNavigate('products'); // Navigate to products page
    } else if (notification.type === 'sale') {
      onNavigate('pos'); // Navigate to POS/sales
    } else {
      onNavigate('alerts-system'); // Navigate to alerts page
    }
    
    setIsOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
      >
        {unreadCount > 0 ? (
          <Bell className="h-5 w-5" />
        ) : (
          <BellOff className="h-5 w-5" />
        )}
        
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden shadow-lg border z-50">
          {/* Header */}
          <div className="p-3 border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs h-6 px-2"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <CardContent className="p-0 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                      !notification.isRead && "bg-blue-50/50 border-l-2 border-l-blue-500"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t bg-muted/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onNavigate('alerts-system');
                  setIsOpen(false);
                }}
                className="w-full text-xs"
              >
                View All Notifications
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default NotificationDropdown;
