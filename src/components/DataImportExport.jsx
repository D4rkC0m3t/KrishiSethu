import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Download,
  Upload,
  FileText,
  Database,
  CheckCircle,
  AlertTriangle,
  Users,
  Package,
  Truck,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DataImportExport = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const DATA_TYPES = {
    products: {
      name: 'Products',
      icon: Package,
      description: 'Fertilizer products and inventory items'
    },
    customers: {
      name: 'Customers', 
      icon: Users,
      description: 'Customer database and contact information'
    },
    suppliers: {
      name: 'Suppliers',
      icon: Truck,
      description: 'Supplier information and contact details'
    },
    sales: {
      name: 'Sales Data',
      icon: ShoppingCart,
      description: 'Sales transactions and order history'
    }
  };

  const handleExport = async (dataType, format) => {
    setIsProcessing(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Exporting ${dataType} as ${format}`);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (file, dataType) => {
    setIsProcessing(true);
    try {
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Importing ${dataType} from file:`, file.name);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Import & Export</h2>
          <p className="text-gray-600">Manage your data with import and export tools</p>
        </div>
        <Badge variant="outline" className="text-blue-600">
          <Database className="w-4 h-4 mr-1" />
          Data Management
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="w-5 h-5 mr-2 text-green-600" />
              Export Data
            </CardTitle>
            <CardDescription>
              Download your data in various formats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(DATA_TYPES).map(([key, type]) => {
              const IconComponent = type.icon;
              return (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{type.name}</p>
                      <p className="text-sm text-gray-500">{type.description}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport(key, 'csv')}
                      disabled={isProcessing}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport(key, 'excel')}
                      disabled={isProcessing}
                    >
                      <Database className="w-4 h-4 mr-1" />
                      Excel
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2 text-blue-600" />
              Import Data
            </CardTitle>
            <CardDescription>
              Upload data from CSV or Excel files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(DATA_TYPES).map(([key, type]) => {
              const IconComponent = type.icon;
              return (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{type.name}</p>
                      <p className="text-sm text-gray-500">{type.description}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleImport(file, key);
                      }}
                      className="hidden"
                      id={`import-${key}`}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => document.getElementById(`import-${key}`).click()}
                      disabled={isProcessing}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Import
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Status Messages */}
      {isProcessing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center space-x-3 py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-blue-800">Processing your request...</p>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="py-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Important Notes:</p>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Always backup your data before importing</li>
                <li>• Ensure your CSV/Excel files match the expected format</li>
                <li>• Large imports may take several minutes to process</li>
                <li>• Contact support if you encounter any issues</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataImportExport;
