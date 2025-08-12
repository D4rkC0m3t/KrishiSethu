import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Bell,
  Search,
  Plus,
  Menu,
  X,
  Truck,
  FileText,
  Database,
  AlertTriangle,
  Wifi,
  WifiOff,
  Battery,
  Signal
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MobileNavigation = ({ currentPage, onNavigate, alerts = [] }) => {
  const { currentUser, userProfile, isAdmin, hasPermission } = useAuth();
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [connectionType, setConnectionType] = useState('unknown');

  // Navigation items for bottom navigation
  const bottomNavItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: Home,
      permission: 'staff'
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Package,
      permission: 'staff'
    },
    {
      id: 'pos-system',
      label: 'POS',
      icon: ShoppingCart,
      permission: 'staff'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      permission: 'staff'
    },
    {
      id: 'more',
      label: 'More',
      icon: Menu,
      permission: 'staff'
    }
  ];

  // Additional menu items for "More" section
  const moreMenuItems = [
    {
      id: 'e-invoice',
      label: 'E-Invoice',
      icon: FileText,
      permission: 'staff'
    },
    {
      id: 'e-invoice-history',
      label: 'E-Invoice History',
      icon: FileText,
      permission: 'staff'
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      permission: 'staff'
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: Truck,
      permission: 'staff'
    },
    {
      id: 'purchase-entry',
      label: 'Purchases',
      icon: FileText,
      permission: 'staff'
    },
    {
      id: 'alerts-system',
      label: 'Alerts',
      icon: Bell,
      permission: 'staff',
      badge: alerts.filter(a => a.priority === 'high').length
    },
    {
      id: 'data-import-export',
      label: 'Import/Export',
      icon: Database,
      permission: 'staff'
    },
    {
      id: 'user-management',
      label: 'Users',
      icon: Users,
      permission: 'admin'
    },
    {
      id: 'backup-data-management',
      label: 'Backup',
      icon: Database,
      permission: 'admin'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      permission: 'staff'
    }
  ];

  useEffect(() => {
    // Handle scroll to show/hide bottom navigation
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowBottomNav(false); // Hide when scrolling down
      } else {
        setShowBottomNav(true); // Show when scrolling up
      }
      
      setLastScrollY(currentScrollY);
    };

    // Handle online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Get battery information
    const getBatteryInfo = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await navigator.getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
          
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
        } catch (error) {
          console.log('Battery API not supported');
        }
      }
    };

    // Get connection information
    const getConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection;
        setConnectionType(connection.effectiveType || 'unknown');
        
        connection.addEventListener('change', () => {
          setConnectionType(connection.effectiveType || 'unknown');
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    getBatteryInfo();
    getConnectionInfo();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [lastScrollY]);

  const handleNavigation = (pageId) => {
    if (pageId === 'more') {
      setShowMobileMenu(true);
    } else {
      onNavigate(pageId);
      setShowMobileMenu(false);
    }
  };

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4 text-red-500" />;
    
    switch (connectionType) {
      case '4g':
        return <Signal className="h-4 w-4 text-green-500" />;
      case '3g':
        return <Signal className="h-4 w-4 text-yellow-500" />;
      case '2g':
        return <Signal className="h-4 w-4 text-orange-500" />;
      default:
        return <Wifi className="h-4 w-4 text-blue-500" />;
    }
  };

  const getBatteryColor = () => {
    if (batteryLevel === null) return 'text-gray-500';
    if (batteryLevel > 50) return 'text-green-500';
    if (batteryLevel > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Only show on mobile devices
  const isMobile = window.innerWidth <= 768;
  if (!isMobile) return null;

  return (
    <>
      {/* Mobile Status Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between text-xs md:hidden">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">Krishisethu</span>
          {!isOnline && (
            <Badge variant="destructive" className="text-xs">
              Offline
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-1">
            {getConnectionIcon()}
            <span className="text-gray-600">{connectionType}</span>
          </div>
          
          {/* Battery Level */}
          {batteryLevel !== null && (
            <div className="flex items-center gap-1">
              <Battery className={`h-4 w-4 ${getBatteryColor()}`} />
              <span className={getBatteryColor()}>{batteryLevel}%</span>
            </div>
          )}
          
          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="relative">
              <Bell className="h-4 w-4 text-gray-600" />
              {alerts.filter(a => a.priority === 'high').length > 0 && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 transition-transform duration-300 md:hidden ${
          showBottomNav ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map((item) => {
            if (!hasPermission(item.permission)) return null;
            
            const IconComponent = item.icon;
            const isActive = currentPage === item.id;
            const badge = item.badge || 0;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation(item.id)}
                className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                  isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
                }`}
              >
                <div className="relative">
                  <IconComponent className="h-5 w-5" />
                  {badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                    >
                      {badge > 9 ? '9+' : badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden">
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[80vh] overflow-y-auto">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Menu</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* User Info */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {userProfile?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {userProfile?.name || 'User'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {userProfile?.role || 'Staff'}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-2">
              {moreMenuItems.map((item) => {
                if (item.permission === 'admin' && !isAdmin()) return null;
                if (!hasPermission(item.permission)) return null;
                
                const IconComponent = item.icon;
                const badge = item.badge || 0;
                
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => handleNavigation(item.id)}
                    className="w-full justify-start gap-3 h-12"
                  >
                    <IconComponent className="h-5 w-5 text-gray-600" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {badge > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {badge > 9 ? '9+' : badge}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>

            {/* System Status */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="text-green-700">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <span className="text-red-700">Offline</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  {batteryLevel !== null && (
                    <div className="flex items-center gap-1">
                      <Battery className={`h-4 w-4 ${getBatteryColor()}`} />
                      <span className={getBatteryColor()}>{batteryLevel}%</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Signal className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{connectionType}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for bottom navigation */}
      <div className="h-16 md:hidden"></div>
      
      {/* Spacer for top status bar */}
      <div className="h-10 md:hidden"></div>
    </>
  );
};

export default MobileNavigation;
