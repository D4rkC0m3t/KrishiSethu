import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { productsService } from '../lib/supabaseDb';

const StockMovement = ({ onNavigate }) => {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentData, setAdjustmentData] = useState({
    type: 'add', // add, remove, adjust
    quantity: '',
    reason: '',
    notes: ''
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockProducts = [
      {
        id: '1',
        name: 'NPK 20-20-20',
        currentStock: 45,
        minStockLevel: 10,
        unit: 'bags'
      },
      {
        id: '2',
        name: 'Urea',
        currentStock: 8,
        minStockLevel: 15,
        unit: 'bags'
      },
      {
        id: '3',
        name: 'DAP',
        currentStock: 25,
        minStockLevel: 10,
        unit: 'bags'
      }
    ];

    const mockMovements = [
      {
        id: '1',
        productId: '1',
        productName: 'NPK 20-20-20',
        type: 'sale',
        quantity: -5,
        previousStock: 50,
        newStock: 45,
        reason: 'Sale to customer',
        date: new Date('2025-01-06'),
        user: 'Demo User'
      },
      {
        id: '2',
        productId: '2',
        productName: 'Urea',
        type: 'purchase',
        quantity: +20,
        previousStock: 5,
        newStock: 25,
        reason: 'New stock received',
        date: new Date('2025-01-05'),
        user: 'Demo User'
      },
      {
        id: '3',
        productId: '1',
        productName: 'NPK 20-20-20',
        type: 'adjustment',
        quantity: -2,
        previousStock: 52,
        newStock: 50,
        reason: 'Damaged goods',
        date: new Date('2025-01-04'),
        user: 'Demo User'
      }
    ];

    setProducts(mockProducts);
    setMovements(mockMovements);
  }, []);

  const getStockStatus = (currentStock, minStockLevel) => {
    if (currentStock <= 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    if (currentStock <= minStockLevel) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  };

  const getMovementIcon = (type) => {
    switch (type) {
      case 'sale': return '📤';
      case 'purchase': return '📥';
      case 'adjustment': return '⚖️';
      default: return '📦';
    }
  };

  const getMovementColor = (quantity) => {
    return quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const handleStockAdjustment = (product) => {
    setSelectedProduct(product);
    setAdjustmentData({
      type: 'add',
      quantity: '',
      reason: '',
      notes: ''
    });
    setShowAdjustmentDialog(true);
  };

  const submitAdjustment = async () => {
    if (!selectedProduct || !adjustmentData.quantity || !adjustmentData.reason) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const quantity = parseInt(adjustmentData.quantity);
      const adjustedQuantity = adjustmentData.type === 'remove' ? -quantity : quantity;
      
      // Here you would update the product stock in Firebase
      console.log('Stock adjustment:', {
        productId: selectedProduct.id,
        adjustment: adjustedQuantity,
        reason: adjustmentData.reason,
        notes: adjustmentData.notes
      });

      // Update local state for demo
      setProducts(prev => prev.map(product => 
        product.id === selectedProduct.id 
          ? { ...product, currentStock: product.currentStock + adjustedQuantity }
          : product
      ));

      // Add movement record
      const newMovement = {
        id: Date.now().toString(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        type: 'adjustment',
        quantity: adjustedQuantity,
        previousStock: selectedProduct.currentStock,
        newStock: selectedProduct.currentStock + adjustedQuantity,
        reason: adjustmentData.reason,
        date: new Date(),
        user: 'Demo User'
      };

      setMovements(prev => [newMovement, ...prev]);
      setShowAdjustmentDialog(false);
      alert('Stock adjustment completed successfully!');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Error adjusting stock. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Stock Movement</h1>
          <p className="text-gray-600 dark:text-gray-400">Track inventory changes and adjust stock levels</p>
        </div>
        <Button variant="outline" onClick={() => onNavigate('dashboard')}>
          ← Back to Dashboard
        </Button>
      </div>

      {/* Current Stock Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Current Stock Levels</CardTitle>
          <CardDescription>Overview of all products and their stock status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Product</th>
                  <th className="text-left py-3 px-4">Current Stock</th>
                  <th className="text-left py-3 px-4">Min Level</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const stockStatus = getStockStatus(product.currentStock, product.minStockLevel);
                  return (
                    <tr key={product.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{product.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{product.currentStock}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">{product.unit}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900 dark:text-gray-100">{product.minStockLevel} {product.unit}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={stockStatus.color}>
                          {stockStatus.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleStockAdjustment(product)}
                        >
                          Adjust Stock
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Stock Movements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Movements</CardTitle>
          <CardDescription>Latest inventory changes and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {movements.map((movement) => (
              <div key={movement.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getMovementIcon(movement.type)}</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{movement.productName}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{movement.reason}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {movement.date.toLocaleDateString()} by {movement.user}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getMovementColor(movement.quantity)}`}>
                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {movement.previousStock} → {movement.newStock}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock - {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Make manual adjustments to inventory levels
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                <strong>Current Stock:</strong> {selectedProduct?.currentStock} {selectedProduct?.unit}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Adjustment Type</label>
              <Select 
                value={adjustmentData.type} 
                onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Stock</SelectItem>
                  <SelectItem value="remove">Remove Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                placeholder="Enter quantity"
                value={adjustmentData.quantity}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, quantity: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Select 
                value={adjustmentData.reason} 
                onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, reason: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="damaged">Damaged Goods</SelectItem>
                  <SelectItem value="expired">Expired Products</SelectItem>
                  <SelectItem value="theft">Theft/Loss</SelectItem>
                  <SelectItem value="recount">Stock Recount</SelectItem>
                  <SelectItem value="return">Customer Return</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <textarea
                placeholder="Additional notes..."
                value={adjustmentData.notes}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                rows={3}
              />
            </div>

            {adjustmentData.quantity && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm">
                  <strong>New Stock Level:</strong> {
                    selectedProduct?.currentStock + 
                    (adjustmentData.type === 'remove' ? -parseInt(adjustmentData.quantity || 0) : parseInt(adjustmentData.quantity || 0))
                  } {selectedProduct?.unit}
                </p>
              </div>
            )}
          </div>

          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowAdjustmentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitAdjustment} className="bg-green-600 hover:bg-green-700">
              Apply Adjustment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockMovement;
