import React from 'react';
import { AlertTriangle, Package, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const StockAlerts = ({ 
  lowStockProducts = [], 
  outOfStockProducts = [], 
  nearExpiryProducts = [],
  onNavigate 
}) => {
  const totalAlerts = lowStockProducts.length + outOfStockProducts.length + nearExpiryProducts.length;

  if (totalAlerts === 0) {
    return (
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Stock Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-green-600 font-medium">All Good!</p>
            <p className="text-sm text-gray-500">No stock alerts at the moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-up">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Stock Alerts
          </CardTitle>
          <Badge variant="warning" className="bg-yellow-100 text-yellow-800">
            {totalAlerts}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {/* Out of Stock Items */}
          {outOfStockProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">
                  Out of Stock ({outOfStockProducts.length})
                </span>
              </div>
              <div className="space-y-2">
                {outOfStockProducts.slice(0, 3).map((product) => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-red-600">
                        Stock: {product.quantity || 0}
                      </p>
                    </div>
                    <Badge variant="danger" className="text-xs">
                      Out
                    </Badge>
                  </div>
                ))}
                {outOfStockProducts.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{outOfStockProducts.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Low Stock Items */}
          {lowStockProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-700">
                  Low Stock ({lowStockProducts.length})
                </span>
              </div>
              <div className="space-y-2">
                {lowStockProducts.slice(0, 3).map((product) => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-yellow-600">
                        Stock: {product.quantity || 0}
                      </p>
                    </div>
                    <Badge variant="warning" className="text-xs">
                      Low
                    </Badge>
                  </div>
                ))}
                {lowStockProducts.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{lowStockProducts.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Near Expiry Items */}
          {nearExpiryProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-700">
                  Expiring Soon ({nearExpiryProducts.length})
                </span>
              </div>
              <div className="space-y-2">
                {nearExpiryProducts.slice(0, 3).map((product) => {
                  const expiryDate = new Date(product.expiryDate || product.expiry_date);
                  const today = new Date();
                  const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div 
                      key={product.id} 
                      className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-200"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-orange-600">
                          Expires in {daysUntilExpiry} days
                        </p>
                      </div>
                      <Badge variant="warning" className="text-xs bg-orange-100 text-orange-800">
                        {daysUntilExpiry}d
                      </Badge>
                    </div>
                  );
                })}
                {nearExpiryProducts.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{nearExpiryProducts.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => onNavigate('products')}
            className="w-full text-sm"
          >
            View All Products
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockAlerts;