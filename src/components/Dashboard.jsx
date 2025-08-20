import React, { useState, useEffect } from 'react';
import { useInventory } from '../hooks/useInventory';
import { useSettingsContext } from '../contexts/SettingsContext';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  BarChart3,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

// Dashboard Components
import DashboardStats from './dashboard/DashboardStats';
import QuickActions from './dashboard/QuickActions';
import RecentActivity from './dashboard/RecentActivity';
import StockAlerts from './dashboard/StockAlerts';
import SalesChart from './dashboard/SalesChart';

const Dashboard = ({ 
  currentPage, 
  onNavigate, 
  user, 
  userProfile, 
  onAlertsUpdate 
}) => {
  const { 
    products, 
    stats, 
    loading, 
    error, 
    getLowStockProducts, 
    getOutOfStockProducts, 
    getNearExpiryProducts,
    refreshData 
  } = useInventory();
  
  const { companyInfo } = useSettingsContext();
  const [refreshing, setRefreshing] = useState(false);

  // Generate alerts for notification system
  useEffect(() => {
    if (products.length > 0) {
      const alerts = [];
      
      // Low stock alerts
      getLowStockProducts().forEach(product => {
        alerts.push({
          id: `low-stock-${product.id}`,
          type: 'lowStock',
          productId: product.id,
          productName: product.name,
          currentStock: product.quantity,
          timestamp: new Date(),
          priority: 'medium'
        });
      });

      // Out of stock alerts
      getOutOfStockProducts().forEach(product => {
        alerts.push({
          id: `out-of-stock-${product.id}`,
          type: 'outOfStock',
          productId: product.id,
          productName: product.name,
          timestamp: new Date(),
          priority: 'high'
        });
      });

      // Near expiry alerts
      getNearExpiryProducts().forEach(product => {
        const expiryDate = new Date(product.expiryDate || product.expiry_date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        alerts.push({
          id: `expiry-${product.id}`,
          type: 'expiringSoon',
          productId: product.id,
          productName: product.name,
          daysUntilExpiry,
          timestamp: new Date(),
          priority: daysUntilExpiry <= 7 ? 'high' : 'medium'
        });
      });

      onAlertsUpdate(alerts);
    }
  }, [products, onAlertsUpdate, getLowStockProducts, getOutOfStockProducts, getNearExpiryProducts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'products':
        return <ProductsPage onNavigate={onNavigate} />;
      case 'sales':
        return <SalesPage onNavigate={onNavigate} />;
      case 'purchases':
        return <PurchasesPage onNavigate={onNavigate} />;
      case 'reports':
        return <ReportsPage onNavigate={onNavigate} />;
      case 'settings':
        return <SettingsPage onNavigate={onNavigate} />;
      case 'alerts-system':
        return <AlertsPage onNavigate={onNavigate} />;
      default:
        return renderDashboardHome();
    }
  };

  const renderDashboardHome = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">
            Welcome back, {userProfile?.name || user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your inventory today
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={() => onNavigate('products')}
            className="flex items-center gap-2 btn-primary"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardStats 
        stats={stats} 
        loading={loading} 
        onNavigate={onNavigate} 
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts and Analytics */}
        <div className="lg:col-span-2 space-y-6">
          <SalesChart />
          <RecentActivity onNavigate={onNavigate} />
        </div>

        {/* Right Column - Alerts and Quick Actions */}
        <div className="space-y-6">
          <QuickActions onNavigate={onNavigate} />
          <StockAlerts 
            lowStockProducts={getLowStockProducts()}
            outOfStockProducts={getOutOfStockProducts()}
            nearExpiryProducts={getNearExpiryProducts()}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} className="btn-primary">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {renderPageContent()}
    </div>
  );
};

// Placeholder components for different pages
const ProductsPage = ({ onNavigate }) => (
  <div className="animate-fade-in">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900 font-display">Products</h1>
      <Button className="btn-primary">
        <Plus className="h-4 w-4 mr-2" />
        Add Product
      </Button>
    </div>
    <Card>
      <CardContent className="p-6">
        <p className="text-gray-600">Products management interface will be implemented here.</p>
      </CardContent>
    </Card>
  </div>
);

const SalesPage = ({ onNavigate }) => (
  <div className="animate-fade-in">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900 font-display">Sales</h1>
      <Button className="btn-primary">
        <Plus className="h-4 w-4 mr-2" />
        New Sale
      </Button>
    </div>
    <Card>
      <CardContent className="p-6">
        <p className="text-gray-600">Sales management interface will be implemented here.</p>
      </CardContent>
    </Card>
  </div>
);

const PurchasesPage = ({ onNavigate }) => (
  <div className="animate-fade-in">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900 font-display">Purchases</h1>
      <Button className="btn-primary">
        <Plus className="h-4 w-4 mr-2" />
        New Purchase
      </Button>
    </div>
    <Card>
      <CardContent className="p-6">
        <p className="text-gray-600">Purchases management interface will be implemented here.</p>
      </CardContent>
    </Card>
  </div>
);

const ReportsPage = ({ onNavigate }) => (
  <div className="animate-fade-in">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900 font-display">Reports</h1>
      <Button variant="outline">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
    </div>
    <Card>
      <CardContent className="p-6">
        <p className="text-gray-600">Reports and analytics interface will be implemented here.</p>
      </CardContent>
    </Card>
  </div>
);

const SettingsPage = ({ onNavigate }) => (
  <div className="animate-fade-in">
    <h1 className="text-2xl font-bold text-gray-900 font-display mb-6">Settings</h1>
    <Card>
      <CardContent className="p-6">
        <p className="text-gray-600">Settings management interface will be implemented here.</p>
      </CardContent>
    </Card>
  </div>
);

const AlertsPage = ({ onNavigate }) => (
  <div className="animate-fade-in">
    <h1 className="text-2xl font-bold text-gray-900 font-display mb-6">Alerts & Notifications</h1>
    <Card>
      <CardContent className="p-6">
        <p className="text-gray-600">Alerts management interface will be implemented here.</p>
      </CardContent>
    </Card>
  </div>
);

export default Dashboard;