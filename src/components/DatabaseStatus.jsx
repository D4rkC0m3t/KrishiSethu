import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Package,
  Users,
  Building,
  Tag,
  Settings,
  ShoppingCart
} from 'lucide-react';
import {
  productsService,
  suppliersService,
  customersService,
  salesService,
  purchasesService
} from '../lib/supabaseDb';

const DatabaseStatus = () => {
  const [status, setStatus] = useState({
    products: { count: 0, loading: true },
    suppliers: { count: 0, loading: true },
    customers: { count: 0, loading: true },
    sales: { count: 0, loading: true },
    purchases: { count: 0, loading: true },
    categories: { count: 0, loading: true }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadDatabaseStatus = async () => {
    try {
      setIsRefreshing(true);
      
      const [products, suppliers, customers, sales, purchases] = await Promise.all([
        productsService.getAll(),
        suppliersService.getAll(),
        customersService.getAll(),
        salesService.getAll(),
        purchasesService.getAll()
      ]);

      setStatus({
        products: { count: products.length, loading: false },
        suppliers: { count: suppliers.length, loading: false },
        customers: { count: customers.length, loading: false },
        sales: { count: sales.length, loading: false },
        purchases: { count: purchases.length, loading: false },
        categories: { count: 6, loading: false } // Estimated
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading database status:', error);
      setStatus(prev => ({
        ...prev,
        products: { count: 0, loading: false, error: true },
        suppliers: { count: 0, loading: false, error: true },
        customers: { count: 0, loading: false, error: true },
        sales: { count: 0, loading: false, error: true },
        purchases: { count: 0, loading: false, error: true },
        categories: { count: 0, loading: false, error: true }
      }));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDatabaseStatus();
  }, []);

  const getStatusColor = (item) => {
    if (item.loading) return 'bg-gray-100 text-gray-700';
    if (item.error) return 'bg-red-100 text-red-700';
    if (item.count === 0) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getStatusIcon = (item) => {
    if (item.loading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (item.error) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (item.count === 0) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const collections = [
    {
      key: 'products',
      name: 'Products',
      icon: <Package className="w-5 h-5" />,
      description: 'Fertilizer inventory items'
    },
    {
      key: 'suppliers',
      name: 'Suppliers',
      icon: <Building className="w-5 h-5" />,
      description: 'Fertilizer suppliers'
    },
    {
      key: 'customers',
      name: 'Customers',
      icon: <Users className="w-5 h-5" />,
      description: 'Customer database'
    },
    {
      key: 'sales',
      name: 'Sales',
      icon: <ShoppingCart className="w-5 h-5" />,
      description: 'Sales transactions'
    },
    {
      key: 'purchases',
      name: 'Purchases',
      icon: <Package className="w-5 h-5" />,
      description: 'Purchase orders'
    },
    {
      key: 'categories',
      name: 'Categories',
      icon: <Tag className="w-5 h-5" />,
      description: 'Product categories'
    }
  ];

  const totalRecords = Object.values(status).reduce((sum, item) => sum + item.count, 0);
  const hasData = totalRecords > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Status
            </CardTitle>
            <CardDescription>
              Current database collections and record counts
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDatabaseStatus}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalRecords}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(status).filter(item => item.count > 0).length}
            </div>
            <div className="text-sm text-gray-600">Active Collections</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${hasData ? 'text-green-600' : 'text-yellow-600'}`}>
              {hasData ? 'Ready' : 'Empty'}
            </div>
            <div className="text-sm text-gray-600">Database Status</div>
          </div>
        </div>

        {/* Collections */}
        <div className="space-y-3">
          {collections.map((collection) => {
            const item = status[collection.key];
            return (
              <div key={collection.key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-gray-600">
                    {collection.icon}
                  </div>
                  <div>
                    <div className="font-medium">{collection.name}</div>
                    <div className="text-sm text-gray-500">{collection.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(item)}
                  <Badge className={getStatusColor(item)}>
                    {item.loading ? 'Loading...' : 
                     item.error ? 'Error' : 
                     `${item.count} records`}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-500 text-center">
          Last updated: {lastUpdated.toLocaleString()}
        </div>

        {/* Empty State Message */}
        {!hasData && !isRefreshing && (
          <div className="text-center py-4 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="font-medium">Database is empty</p>
            <p className="text-sm">Use the Database Initialization tool to populate with sample data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseStatus;
