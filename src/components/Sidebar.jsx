import React, { useState } from 'react';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  FileText,
  Bell,
  Settings,
  LifeBuoy,
  BookText,
  LogOut,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  AlertTriangle,
  Calendar,
  BarChart3,
  Menu,
  ExternalLink,
  Plus,
  BarChart,
  TrendingUp,
  HardDrive,
  Database
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({
  theme = 'light',
  currentPage,
  onNavigate,
  alerts = []
}) {
  const { currentUser, userProfile, logout, isAdmin } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [eInvoiceOpen, setEInvoiceOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const baseStyle = theme === 'dark'
    ? 'bg-[#1a1d29] text-white border-zinc-700'
    : 'bg-white text-gray-900 border-gray-200';

  const unreadAlerts = alerts.filter(a => !a.isRead).length;

  return (
    <aside className={cn(
      `h-screen flex flex-col border-r transition-all duration-300 ease-in-out`,
      isCollapsed ? 'w-16' : 'w-64',
      baseStyle
    )}>
      {/* Top Section */}
      <div className="flex flex-col flex-1">
        {/* Logo & Toggle */}
        <div className={cn(
          "flex items-center border-b border-border transition-all duration-300",
          isCollapsed ? "justify-center px-4 py-4" : "justify-between px-6 py-4"
        )}>
          <div className="flex items-center gap-2 w-full">
            <img
              src="/Logo_Horizontal_sidebar.png"
              alt="Krishisethu Logo"
              className={cn(
                "object-contain transition-all duration-300",
                isCollapsed ? "h-10 w-10" : "h-12 w-full max-w-[180px]"
              )}
            />
          </div>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(true)}
              className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu size={16} />
            </Button>
          )}
        </div>

        {/* Collapsed Toggle Button */}
        {isCollapsed && (
          <div className="px-2 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(false)}
              className="w-full h-10 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}

        {/* Main Navigation */}
        <nav className={cn("flex flex-col gap-1 flex-1", isCollapsed ? "px-2 py-2" : "px-3 py-4")}>
          <SidebarItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active={currentPage === 'dashboard'}
            onClick={() => onNavigate('dashboard')}
            isCollapsed={isCollapsed}
          />

          {/* Inventory */}
          <div className="flex flex-col">
            <SidebarItem
              icon={<Package size={18} />}
              label="Inventory"
              active={currentPage === 'inventory' || currentPage === 'stock-movement' || currentPage === 'stock-movements' || currentPage === 'categories' || currentPage === 'brands' || currentPage === 'add-product'}
              onClick={() => {
                if (isCollapsed) {
                  onNavigate('inventory');
                } else {
                  setInventoryOpen(!inventoryOpen);
                  if (!inventoryOpen) onNavigate('inventory');
                }
              }}
              trailingIcon={!isCollapsed ? <ChevronDown size={14} className={cn("transition-transform", inventoryOpen && "rotate-180")} /> : null}
              isCollapsed={isCollapsed}
            />
            {inventoryOpen && !isCollapsed && (
              <div className="ml-6 mt-1 flex flex-col">
                <SidebarSubItem
                  label="All Fertilizers"
                  active={currentPage === 'inventory'}
                  onClick={() => onNavigate('inventory')}
                  theme={theme}
                  isFirst={true}
                />
                <SidebarSubItem
                  label="Stock Levels"
                  active={currentPage === 'stock-movement'}
                  onClick={() => onNavigate('stock-movement')}
                  theme={theme}
                  isMiddle={true}
                />
                <SidebarSubItem
                  label="Stock History"
                  active={currentPage === 'stock-movements'}
                  onClick={() => onNavigate('stock-movements')}
                  theme={theme}
                />
                <SidebarSubItem
                  label="Categories"
                  active={currentPage === 'categories'}
                  onClick={() => onNavigate('categories')}
                  theme={theme}
                />
                <SidebarSubItem
                  label="Brands"
                  active={currentPage === 'brands'}
                  onClick={() => onNavigate('brands')}
                  theme={theme}
                />
                <SidebarSubItem
                  label="Add Product"
                  active={currentPage === 'add-product'}
                  onClick={() => onNavigate('add-product')}
                  theme={theme}
                  isLast={true}
                />
              </div>
            )}
          </div>

          {/* Orders */}
          <div className="flex flex-col">
            <SidebarItem
              icon={<Truck size={18} />}
              label="Orders"
              active={currentPage === 'purchases' || currentPage === 'purchase-entry' || currentPage === 'suppliers'}
              onClick={() => {
                if (isCollapsed) {
                  onNavigate('purchases');
                } else {
                  setOrdersOpen(!ordersOpen);
                  if (!ordersOpen) onNavigate('purchases');
                }
              }}
              trailingIcon={!isCollapsed ? <ChevronDown size={14} className={cn("transition-transform", ordersOpen && "rotate-180")} /> : null}
              isCollapsed={isCollapsed}
            />
            {ordersOpen && !isCollapsed && (
              <div className="ml-6 mt-1 flex flex-col">
                <SidebarSubItem
                  label="Purchase Orders"
                  active={currentPage === 'purchases'}
                  onClick={() => onNavigate('purchases')}
                  theme={theme}
                  isFirst={true}
                />
                <SidebarSubItem
                  label="Add Purchase"
                  active={currentPage === 'purchase-entry'}
                  onClick={() => onNavigate('purchase-entry')}
                  theme={theme}
                  isMiddle={true}
                />
                <SidebarSubItem
                  label="Suppliers"
                  active={currentPage === 'suppliers'}
                  onClick={() => onNavigate('suppliers')}
                  theme={theme}
                  isLast={true}
                />
              </div>
            )}
          </div>

          {/* Sales */}
          <div className="flex flex-col">
            <SidebarItem
              icon={<ShoppingCart size={18} />}
              label="Sales"
              active={currentPage === 'pos' || currentPage === 'sales' || currentPage === 'customers'}
              onClick={() => {
                if (isCollapsed) {
                  onNavigate('sales'); // Navigate to Sales History when collapsed
                } else {
                  setSalesOpen(!salesOpen);
                  // Don't auto-navigate when expanding, let user choose submenu item
                }
              }}
              trailingIcon={!isCollapsed ? <ChevronDown size={14} className={cn("transition-transform", salesOpen && "rotate-180")} /> : null}
              isCollapsed={isCollapsed}
            />
            {salesOpen && !isCollapsed && (
              <div className="ml-6 mt-1 flex flex-col">
                <SidebarSubItem
                  label="POS System"
                  active={currentPage === 'pos'}
                  onClick={() => onNavigate('pos')}
                  theme={theme}
                  isFirst={true}
                />
                <SidebarSubItem
                  label="Sales History"
                  active={currentPage === 'sales'}
                  onClick={() => onNavigate('sales')}
                  theme={theme}
                  isMiddle={true}
                />
                <SidebarSubItem
                  label="Customers"
                  active={currentPage === 'customers'}
                  onClick={() => onNavigate('customers')}
                  theme={theme}
                  isLast={true}
                />
              </div>
            )}
          </div>

          {/* E-Invoice */}
          <div className="flex flex-col">
            <SidebarItem
              icon={<FileText size={18} />}
              label="E-Invoice"
              active={currentPage === 'e-invoice' || currentPage === 'e-invoice-history'}
              onClick={() => {
                if (isCollapsed) {
                  onNavigate('e-invoice');
                } else {
                  setEInvoiceOpen(!eInvoiceOpen);
                  if (!eInvoiceOpen) onNavigate('e-invoice');
                }
              }}
              trailingIcon={!isCollapsed ? <ChevronDown size={14} className={cn("transition-transform", eInvoiceOpen && "rotate-180")} /> : null}
              isCollapsed={isCollapsed}
            />
            {eInvoiceOpen && !isCollapsed && (
              <div className="ml-6 mt-1 flex flex-col">
                <SidebarSubItem
                  label="Create E-Invoice"
                  active={currentPage === 'e-invoice'}
                  onClick={() => onNavigate('e-invoice')}
                  theme={theme}
                  isFirst={true}
                />
                <SidebarSubItem
                  label="E-Invoice History"
                  active={currentPage === 'e-invoice-history'}
                  onClick={() => onNavigate('e-invoice-history')}
                  theme={theme}
                  isLast={true}
                />
              </div>
            )}
          </div>

          {/* Reports */}
          <div className="flex flex-col">
            <SidebarItem
              icon={<BarChart size={18} />}
              label="Reports"
              active={currentPage === 'reports'}
              onClick={() => {
                if (isCollapsed) {
                  onNavigate('reports');
                } else {
                  setReportsOpen(!reportsOpen);
                  if (!reportsOpen) onNavigate('reports');
                }
              }}
              trailingIcon={!isCollapsed ? <ChevronDown size={14} className={cn("transition-transform", reportsOpen && "rotate-180")} /> : null}
              isCollapsed={isCollapsed}
            />
            {reportsOpen && !isCollapsed && (
              <div className="ml-6 mt-1 flex flex-col">
                <SidebarSubItem
                  label="Inventory Reports"
                  active={currentPage === 'reports'}
                  onClick={() => onNavigate('reports')}
                  theme={theme}
                  isFirst={true}
                />
                <SidebarSubItem
                  label="Sales Reports"
                  active={currentPage === 'reports'}
                  onClick={() => onNavigate('reports')}
                  theme={theme}
                  isLast={true}
                />
              </div>
            )}
          </div>

          <SidebarItem
            icon={<Bell size={18} />}
            label="Notifications"
            active={currentPage === 'alerts-system'}
            onClick={() => onNavigate('alerts-system')}
            badge={unreadAlerts > 0 ? unreadAlerts.toString() : undefined}
            isCollapsed={isCollapsed}
          />
        </nav>

        {/* Secondary Navigation */}
        <div className={cn("border-t border-border pt-3 pb-3", isCollapsed ? "px-2" : "px-3")}>
          <div className="flex flex-col gap-1">
            {/* User Management - Admin Only */}
            {isAdmin() && (
              <SidebarItem
                icon={<Users size={18} />}
                label="User Management"
                active={currentPage === 'user-management'}
                onClick={() => onNavigate('user-management')}
                isCollapsed={isCollapsed}
              />
            )}
            <SidebarItem
              icon={<Database size={18} />}
              label="Import/Export"
              active={currentPage === 'data-import-export'}
              onClick={() => onNavigate('data-import-export')}
              isCollapsed={isCollapsed}
            />
            {/* Backup & Data Management - Admin Only */}
            {isAdmin() && (
              <SidebarItem
                icon={<HardDrive size={18} />}
                label="Backup & Data"
                active={currentPage === 'backup-data-management'}
                onClick={() => onNavigate('backup-data-management')}
                isCollapsed={isCollapsed}
              />
            )}
            <SidebarItem
              icon={<BookText size={18} />}
              label="Documentation"
              active={currentPage === 'documentation'}
              onClick={() => onNavigate('documentation')}
              isCollapsed={isCollapsed}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section - Support & Settings */}
      <div className={cn("border-t border-border", isCollapsed ? "px-2 py-2" : "px-3 py-2")}>
        <div className="space-y-1">
          <SidebarItem
            icon={<LifeBuoy size={18} />}
            label="Support"
            active={currentPage === 'support'}
            onClick={() => onNavigate('support')}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon={<Settings size={18} />}
            label="Settings"
            active={currentPage === 'settings'}
            onClick={() => onNavigate('settings')}
            isCollapsed={isCollapsed}
          />
        </div>
      </div>

      {/* User Footer */}
      <div className={cn(
        "border-t border-border flex items-center transition-all duration-300",
        isCollapsed ? "p-2 justify-center" : "p-4 justify-between"
      )}>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src="/user.jpg" />
            <AvatarFallback className="bg-green-500 text-white text-sm font-medium">
              {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() :
               currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="text-sm min-w-0 flex-1">
              <div className="font-medium truncate">
                {userProfile?.name || currentUser?.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-xs text-muted-foreground">
                {userProfile?.role || 'Staff'}
              </div>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-8 w-8 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 flex-shrink-0"
          >
            <LogOut size={16} />
          </Button>
        )}
      </div>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  badge,
  onClick,
  trailingIcon,
  isCollapsed,
  isSubItem = false,
}) {
  if (isCollapsed) {
    return (
      <div className="relative group">
        <button
          onClick={onClick}
          className={cn(
            'flex items-center justify-center w-full h-10 rounded-lg transition-all duration-200 relative',
            active
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
          )}
        >
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {badge && (
            <Badge className="absolute -top-1 -right-1 text-xs bg-blue-500 text-white px-1 py-0 rounded-full min-w-[16px] h-4 flex items-center justify-center text-[10px]">
              {badge}
            </Badge>
          )}
        </button>

        {/* Tooltip */}
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 top-1/2 transform -translate-y-1/2">
          {label}
          <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 text-left text-sm group',
        isSubItem && 'text-xs py-2',
        active
          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="truncate font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {badge && (
          <Badge className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
            {badge}
          </Badge>
        )}
        {trailingIcon && (
          <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
            {trailingIcon}
          </span>
        )}
      </div>
    </button>
  );
}

function SidebarSubItem({ label, active, onClick, theme, isFirst, isMiddle, isLast }) {
  const borderColor = theme === 'dark' ? "border-gray-500" : "border-gray-400";
  const bgColor = theme === 'dark' ? "bg-gray-500" : "bg-gray-400";

  return (
    <div className="relative pl-4 py-0.5">
      {/* Tree connector lines */}
      <div className="absolute left-0 top-0 bottom-0 w-4">
        {/* Vertical line from above (except first item) */}
        {!isFirst && (
          <div className={cn("absolute left-2 top-0 w-px h-1/2", bgColor)}></div>
        )}

        {/* Vertical line to below (except last item) */}
        {!isLast && (
          <div className={cn("absolute left-2 bottom-0 w-px h-1/2", bgColor)}></div>
        )}

        {/* Curved corner connector */}
        <div className={cn(
          "absolute left-2 top-1/2 w-2 h-2 border-l border-b rounded-bl-sm -translate-y-1/2",
          borderColor
        )}></div>
      </div>

      <button
        onClick={onClick}
        className={cn(
          'w-full text-left text-sm py-1.5 px-2 rounded-md transition-all duration-200',
          active
            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
        )}
      >
        {label}
      </button>
    </div>
  );
}
