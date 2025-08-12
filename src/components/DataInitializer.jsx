import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, AlertCircle, Loader2, Database } from 'lucide-react';
import { seedData, productsService, suppliersService } from '../lib/firestore';

const DataInitializer = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState({
    categories: 'pending',
    brands: 'pending',
    suppliers: 'pending',
    products: 'pending',
    customers: 'pending',
    settings: 'pending'
  });
  const [error, setError] = useState(null);

  const seedDatabase = async () => {
    setIsSeeding(true);
    setError(null);

    try {
      // Check if data already exists
      const [existingProducts, existingSuppliers] = await Promise.all([
        productsService.getAll(),
        suppliersService.getAll()
      ]);

      // If data exists, show existing status
      if (existingProducts.length > 0 || existingSuppliers.length > 0) {
        setSeedStatus({
          categories: 'exists',
          brands: 'exists',
          suppliers: 'exists',
          products: 'exists',
          customers: 'exists',
          settings: 'exists'
        });
        return;
      }

      // Seed all data using the master function
      setSeedStatus({
        categories: 'seeding',
        brands: 'seeding',
        suppliers: 'seeding',
        products: 'seeding',
        customers: 'seeding',
        settings: 'seeding'
      });

      const result = await seedData.seedAllData();

      if (result.success) {
        setSeedStatus({
          categories: 'completed',
          brands: 'completed',
          suppliers: 'completed',
          products: 'completed',
          customers: 'completed',
          settings: 'completed'
        });
      }

    } catch (error) {
      console.error('Error seeding database:', error);
      setError(error.message);
      setSeedStatus({
        categories: 'error',
        brands: 'error',
        suppliers: 'error',
        products: 'error',
        customers: 'error',
        settings: 'error'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
      case 'seeding':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'exists':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'seeding':
        return 'Seeding...';
      case 'completed':
        return 'Seeded';
      case 'exists':
        return 'Already exists';
      default:
        return 'Error';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'seeding':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'exists':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-red-100 text-red-700';
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Initialization
        </CardTitle>
        <CardDescription>
          Initialize your Firebase database with sample data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Categories</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(seedStatus.categories)}
              <Badge className={getStatusColor(seedStatus.categories)}>
                {getStatusText(seedStatus.categories)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Brands</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(seedStatus.brands)}
              <Badge className={getStatusColor(seedStatus.brands)}>
                {getStatusText(seedStatus.brands)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Suppliers</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(seedStatus.suppliers)}
              <Badge className={getStatusColor(seedStatus.suppliers)}>
                {getStatusText(seedStatus.suppliers)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Products</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(seedStatus.products)}
              <Badge className={getStatusColor(seedStatus.products)}>
                {getStatusText(seedStatus.products)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Customers</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(seedStatus.customers)}
              <Badge className={getStatusColor(seedStatus.customers)}>
                {getStatusText(seedStatus.customers)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Settings</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(seedStatus.settings)}
              <Badge className={getStatusColor(seedStatus.settings)}>
                {getStatusText(seedStatus.settings)}
              </Badge>
            </div>
          </div>
        </div>

        <Button 
          onClick={seedDatabase} 
          disabled={isSeeding}
          className="w-full"
        >
          {isSeeding ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Initializing Database...
            </>
          ) : (
            'Initialize Database'
          )}
        </Button>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Creates complete database structure with sample data</p>
          <p>• Includes categories, brands, suppliers, products, customers, and settings</p>
          <p>• Existing data will not be overwritten</p>
          <p>• Safe to run multiple times</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataInitializer;
