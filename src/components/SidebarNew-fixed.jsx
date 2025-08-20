import React from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingCart,
  FileText,
  BarChart,
  Bell,
  Users,
  Database,
  HardDrive,
  BookText,
  LifeBuoy,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

export default function SidebarNew({ theme, currentPage, onNavigate, alerts }) {
  const { currentUser, userProfile, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const isAdmin = () => {
    return currentUser?.email === 'admin@krishisethu.com' ||
           userProfile?.role === 'admin' ||
           userProfile?.account_type === 'admin';
  };

  const unreadAlerts = alerts?.filter(alert => !alert.read).length || 0;

  const menuItems = [
    { 
      label: "Dashboard", 
      icon: LayoutDashboard, 
      key: "dashboard",
      active: currentPage === 'dashboard'
    },
    {
      label: "Inventory",
      icon: Package,
      key: "inventory",
      active: currentPage === 'inventory' || currentPage === 'categories' || currentPage === 'brands' || currentPage === 'stock-movement' || currentPage === 'add-product',
      hasSubmenu: true,
      submenu: [
        { label: "View Products", key: "inventory" },
        { label: "Categories", key: "categories" },
        { label: "Brands", key: "brands" },
        { label: "Stock Movement", key: "stock-movement" }
      ]
    },
    {
      label: "Orders",
      icon: Truck,
      key: "purchases",
      active: currentPage === 'purchases' || currentPage === 'purchase-entry' || currentPage === 'suppliers',
      hasSubmenu: true,
      submenu: [
        { label: "Purchases", key: "purchases" },
        { label: "Purchase Entry", key: "purchase-entry" },
        { label: "Suppliers", key: "suppliers" }
      ]
    },
    {
      label: "Sales & Customers",
      icon: ShoppingCart,
      key: "sales",
      active: currentPage === 'sales' || currentPage === 'pos' || currentPage === 'customers' || currentPage === 'customer-management',
      hasSubmenu: true,
      submenu: [
        { label: "POS", key: "pos" },
        { label: "Sales History", key: "sales" },
        { label: "Customer Management", key: "customer-management" },
        { label: "Credit Accounts", key: "credit-accounts" }
      ]
    },
    {
      label: "E-Invoice",
      icon: FileText,
      key: "e-invoice",
      active: currentPage === 'e-invoice' || currentPage === 'e-invoice-history',
      hasSubmenu: true,
      submenu: [
        { label: "Create E-Invoice", key: "e-invoice" },
        { label: "E-Invoice History", key: "e-invoice-history" }
      ]
    },
    {
      label: "Reports",
      icon: BarChart,
      key: "reports",
      active: currentPage === 'reports' || currentPage === 'reports-advanced' || currentPage === 'reports-sales' || currentPage === 'reports-inventory' || currentPage === 'reports-financial',
      hasSubmenu: true,
      submenu: [
        { label: "Advanced Reports", key: "reports" },
        { label: "Sales Analytics", key: "reports-sales" },
        { label: "Inventory Reports", key: "reports-inventory" },
        { label: "Financial Reports", key: "reports-financial" }
      ]
    },
    {
      label: "Notifications",
      icon: Bell,
      key: "alerts-system",
      active: currentPage === 'alerts-system',
      badge: unreadAlerts > 0 ? unreadAlerts.toString() : undefined
    }
  ];

  const secondaryItems = [
    ...(isAdmin() ? [{ 
      label: "User Management", 
      icon: Users, 
      key: "user-management",
      active: currentPage === 'user-management'
    }] : []),
    { 
      label: "Import/Export", 
      icon: Database, 
      key: "data-import-export",
      active: currentPage === 'data-import-export'
    },
    ...(isAdmin() ? [{ 
      label: "Backup & Data", 
      icon: HardDrive, 
      key: "backup-data-management",
      active: currentPage === 'backup-data-management'
    }] : []),
    { 
      label: "Documentation", 
      icon: BookText, 
      key: "documentation",
      active: currentPage === 'documentation'
    },
    {
      label: "Support",
      icon: LifeBuoy,
      key: "support",
      active: currentPage === 'support'
    },
    {
      label: "Settings",
      icon: Settings,
      key: "settings",
      active: currentPage === 'settings'
    }
  ];

  const MenuItem = ({ item, isSubmenu = false }) => (
    <button
      onClick={() => {
        console.log('🖱️ SidebarNew MenuItem clicked:', item.key, 'isSubmenu:', isSubmenu);
        console.log('🎯 About to call onNavigate with:', item.key);
        onNavigate(item.key);
      }}
      className={cn(
        "flex items-center w-full rounded-md text-sm font-medium transition-colors text-left relative group",
        isSubmenu && "text-xs py-1.5 ml-4",
        isCollapsed && !isSubmenu ? "justify-center p-2" : "justify-between px-3 py-2",
        item.active
          ? "bg-primary text-primary-foreground"
          : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
      )}
      title={isCollapsed ? item.label : undefined}
    >
      <div className={cn(
        "flex items-center",
        isCollapsed && !isSubmenu ? "justify-center" : "gap-2"
      )}>
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {(!isCollapsed || isSubmenu) && <span>{item.label}</span>}
      </div>

      {!isCollapsed && (
        <>
          {item.badge && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
              {item.badge}
            </span>
          )}
          {item.hasSubmenu && (
            <ChevronDown className="h-3 w-3" />
          )}
        </>
      )}

      {/* Tooltip for collapsed state */}
      {isCollapsed && !isSubmenu && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {item.label}
          {item.badge && (
            <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
              {item.badge}
            </span>
          )}
        </div>
      )}
    </button>
  );

  return (
    <aside className={cn(
      "flex flex-col h-screen bg-card border-r relative z-20 flex-shrink-0 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className={cn(
        "flex-shrink-0 border-b border-border transition-all duration-300",
        isCollapsed ? "p-2" : "p-4"
      )}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <img
              src="/Logo_Horizontal_sidebar.png"
              alt="Krishisethu Logo"
              className="h-12 w-full max-w-[180px] object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(true)}
              className="h-8 w-8 hover:bg-accent ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <img
              src="/Logo_Horizontal_sidebar.png"
              alt="Krishisethu Logo"
              className="h-8 w-8 object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(false)}
              className="h-8 w-8 hover:bg-accent"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Scrollable menu list */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        isCollapsed ? "overflow-hidden" : "overflow-y-auto sidebar-scroll"
      )}>
        <nav className={cn("p-2 space-y-1", isCollapsed && "px-1")}>
          {/* Main Menu Items */}
          {menuItems.map((item) => {
            console.log(`📋 Rendering menu item: ${item.label} (${item.key}), active: ${item.active}, hasSubmenu: ${item.hasSubmenu}, currentPage: ${currentPage}`);
            if (item.hasSubmenu) {
              console.log(`📂 Submenu for ${item.label}:`, item.submenu.map(sub => `${sub.label}(${sub.key})`));
              console.log(`🔍 Submenu will show: ${item.hasSubmenu && item.active && !isCollapsed}`);
            }
            return (
              <div key={item.key}>
                <MenuItem item={item} />
                {item.hasSubmenu && item.active && !isCollapsed && (
                  <div className="mt-1 space-y-1">
                    {item.submenu.map((subItem) => {
                      console.log(`📄 Rendering submenu item: ${subItem.label} (${subItem.key}), active: ${currentPage === subItem.key}`);
                      return (
                        <MenuItem
                          key={subItem.key}
                          item={{
                            ...subItem,
                            icon: () => <div className="w-4 h-4" />,
                            active: currentPage === subItem.key
                          }}
                          isSubmenu
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Separator */}
          {!isCollapsed && <div className="border-t border-border my-3" />}

          {/* Secondary Menu Items */}
          {secondaryItems.map((item) => (
            <MenuItem key={item.key} item={item} />
          ))}
        </nav>
      </div>

      {/* Pinned footer with admin profile */}
      <div className={cn(
        "flex-shrink-0 border-t border-border bg-card flex items-center transition-all duration-300",
        isCollapsed ? "p-2 justify-center" : "p-3 gap-3"
      )}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src="/user.jpg" />
          <AvatarFallback className="bg-green-500 text-white text-sm font-medium">
            {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() :
             currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
          </AvatarFallback>
        </Avatar>

        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userProfile?.name || currentUser?.email || 'User'}
              </p>
              <p className="text-xs text-muted-foreground">
                {userProfile?.role || 'admin'}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={logout}
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}

        {isCollapsed && (
          <div className="relative group">
            <Button
              size="icon"
              variant="ghost"
              onClick={logout}
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            {/* Tooltip for logout */}
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Logout
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
