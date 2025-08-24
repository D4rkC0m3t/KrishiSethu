import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const InventoryDashboard = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalSuppliers: 0,
    totalCustomers: 0,
    lowStockItems: 0,
    recentTransactions: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [quickActions] = useState([
    { id: 1, title: 'Add New Product', icon: '📦', action: 'add-product', color: 'bg-blue-500' },
    { id: 2, title: 'Record Sale', icon: '💰', action: 'record-sale', color: 'bg-green-500' },
    { id: 3, title: 'Purchase Order', icon: '🛒', action: 'purchase-order', color: 'bg-purple-500' },
    { id: 4, title: 'Stock Check', icon: '📊', action: 'stock-check', color: 'bg-orange-500' }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.organization_id) {
      loadDashboardData();
    }
  }, [userProfile]);

  const loadDashboardData = async () => {
    try {
      const orgId = userProfile.organization_id;

      // Load basic statistics
      const [
        productsResult,
        categoriesResult,
        suppliersResult,
        customersResult
      ] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('categories').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
      ]);

      setStats({
        totalProducts: productsResult.count || 0,
        totalCategories: categoriesResult.count || 0,
        totalSuppliers: suppliersResult.count || 0,
        totalCustomers: customersResult.count || 0,
        lowStockItems: 0, // Will implement this later
        recentTransactions: 0 // Will implement this later
      });

      // Load recent activity (placeholder for now)
      setRecentActivity([
        { id: 1, type: 'product_added', message: 'New product "Sample Item" added', time: '2 hours ago', icon: '📦' },
        { id: 2, type: 'sale_recorded', message: 'Sale recorded for ₹2,500', time: '4 hours ago', icon: '💰' },
        { id: 3, type: 'stock_updated', message: 'Stock updated for 5 items', time: '1 day ago', icon: '📊' }
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'add-product':
        alert('Add Product feature coming soon!');
        break;
      case 'record-sale':
        alert('Record Sale feature coming soon!');
        break;
      case 'purchase-order':
        alert('Purchase Order feature coming soon!');
        break;
      case 'stock-check':
        alert('Stock Check feature coming soon!');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const StatCard = ({ title, value, icon, color = 'bg-blue-500' }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <span className="text-white text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your inventory.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
            <span>📊</span>
            Generate Report
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Products" 
          value={stats.totalProducts} 
          icon="📦" 
          color="bg-blue-500"
        />
        <StatCard 
          title="Categories" 
          value={stats.totalCategories} 
          icon="🏷️" 
          color="bg-purple-500"
        />
        <StatCard 
          title="Suppliers" 
          value={stats.totalSuppliers} 
          icon="🏭" 
          color="bg-green-500"
        />
        <StatCard 
          title="Customers" 
          value={stats.totalCustomers} 
          icon="👥" 
          color="bg-orange-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.action)}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-center group"
            >
              <div className={`w-12 h-12 ${action.color} rounded-lg mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <span className="text-white text-xl">{action.icon}</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{action.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">{activity.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Alerts</h2>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">⚠️</span>
                <p className="text-sm font-medium text-yellow-800">Low Stock Alert</p>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                {stats.lowStockItems || 0} items are running low on stock
              </p>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <p className="text-sm font-medium text-green-800">System Status</p>
              </div>
              <p className="text-xs text-green-700 mt-1">
                All systems operational
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started (show only if no data) */}
      {stats.totalProducts === 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-green-600 text-2xl">🚀</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Get Started with Your Inventory</h2>
          <p className="text-gray-600 mb-6">
            Start by adding your first category and products to begin managing your inventory effectively.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => handleQuickAction('add-category')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Add First Category
            </button>
            <button 
              onClick={() => handleQuickAction('add-product')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Add First Product
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryDashboard;
