import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { productsService, stockOperations } from '../lib/supabaseDb';
import { useAuth } from '../contexts/AuthContext';

const StockMovement = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentData, setAdjustmentData] = useState({
    type: 'add', // add, remove, adjust
    quantity: '',
    reason: '',
    notes: ''
  });
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);

  // Load real data from database
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Loading stock movement data...');

      // Load products with current stock levels
      const productsData = await productsService.getAll();
      console.log('📦 Products loaded:', productsData?.length || 0);

      // Transform products data for stock movement display
      const transformedProducts = (productsData || []).map(product => ({
        id: product.id,
        name: product.name,
        currentStock: product.quantity || 0,
        minStockLevel: product.min_stock_level || product.minStockLevel || 0,
        unit: product.unit || 'units'
      }));

      // Load recent stock movements
      const movementsData = await stockOperations.getAll();
      console.log('📈 Stock movements loaded:', movementsData?.length || 0);

      // Transform movements data
      const transformedMovements = (movementsData || []).map(movement => ({
        id: movement.id,
        productId: movement.product_id,
        productName: movement.product_name || 'Unknown Product',
        type: movement.movement_type || movement.type,
        quantity: movement.quantity,
        previousStock: movement.previous_stock,
        newStock: movement.new_stock,
        reason: movement.reason || movement.notes || 'No reason provided',
        date: movement.created_at ? new Date(movement.created_at) : new Date(),
        user: movement.created_by || 'System'
      }));

      setProducts(transformedProducts);
      setMovements(transformedMovements);

      console.log('✅ Stock movement data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading stock movement data:', error);
      setError(error.message);

      // Fallback to empty arrays instead of mock data
      setProducts([]);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

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
    alert('Function called! Check console for details.');
    console.log('🚀 Starting stock adjustment process...');
    console.log('📋 Form data:', adjustmentData);
    console.log('📦 Selected product:', selectedProduct);
    console.log('👤 Current user:', currentUser);
    console.log('🔧 Products service:', productsService);
    console.log('📊 Stock operations:', stockOperations);

    // Validation
    if (!selectedProduct) {
      console.error('❌ No product selected');
      alert('No product selected');
      return;
    }

    if (!adjustmentData.quantity || adjustmentData.quantity === '') {
      console.error('❌ No quantity entered');
      alert('Please enter a quantity');
      return;
    }

    if (!adjustmentData.reason || adjustmentData.reason === '') {
      console.error('❌ No reason selected');
      alert('Please select a reason');
      return;
    }

    setAdjustmentLoading(true);

    try {
      const quantity = parseInt(adjustmentData.quantity);
      console.log('🔢 Parsed quantity:', quantity);

      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('Invalid quantity. Please enter a positive number.');
      }

      const adjustedQuantity = adjustmentData.type === 'remove' ? -quantity : quantity;
      const currentStock = selectedProduct.currentStock || selectedProduct.quantity || 0;
      const newStock = currentStock + adjustedQuantity;

      console.log('📊 Stock calculation:', {
        currentStock,
        adjustedQuantity,
        newStock,
        type: adjustmentData.type
      });

      if (newStock < 0) {
        throw new Error('Cannot reduce stock below zero');
      }

      console.log('💾 Updating product stock in database...');

      // Update product stock in database
      const updateResult = await productsService.update(selectedProduct.id, {
        quantity: newStock
      });

      console.log('✅ Product stock updated:', updateResult);

      console.log('📝 Recording stock movement...');

      // Record stock movement (only use columns that exist in database)
      const movementData = {
        product_id: selectedProduct.id,
        movement_type: 'adjustment',
        quantity: adjustedQuantity,
        reference_type: 'adjustment',
        notes: `${adjustmentData.reason}${adjustmentData.notes ? ` - ${adjustmentData.notes}` : ''}`,
        created_by: currentUser?.id || 'system'
      };

      console.log('📝 Movement data to record:', movementData);

      const movementResult = await stockOperations.recordStockMovement(movementData);
      console.log('✅ Stock movement recorded:', movementResult);

      console.log('🔄 Refreshing data...');

      // Refresh data to show updated values
      await loadData();

      // Close dialog and reset form
      setShowAdjustmentDialog(false);
      setAdjustmentData({ type: 'add', quantity: '', reason: '', notes: '' });

      console.log('🎉 Stock adjustment completed successfully!');
      alert('Stock adjustment completed successfully!');

    } catch (error) {
      console.error('❌ Error adjusting stock:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert(`Error adjusting stock: ${error.message}`);
    } finally {
      setAdjustmentLoading(false);
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
          </Button>
          <Button variant="outline" onClick={() => onNavigate('dashboard')}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading stock data...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <span>⚠️</span>
              <span>Error loading stock data: {error}</span>
              <Button variant="outline" size="sm" onClick={loadData} className="ml-auto">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Stock Overview */}
      {!loading && !error && (
      <>
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
      </>
      )}

      {/* DEBUG: Test button outside dialog */}
      <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded">
        <p className="text-red-700 mb-2">DEBUG MODE: Test the function directly</p>
        <Button
          onClick={() => {
            alert('Test button clicked!');
            console.log('Test button - calling submitAdjustment directly');
            submitAdjustment();
          }}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          TEST: Call submitAdjustment
        </Button>
      </div>

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
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔘 Apply Adjustment button clicked!');
                alert('Button clicked! About to call submitAdjustment...');
                try {
                  submitAdjustment();
                } catch (error) {
                  console.error('Error calling submitAdjustment:', error);
                  alert('Error calling function: ' + error.message);
                }
              }}
              disabled={adjustmentLoading}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              type="button"
            >
              {adjustmentLoading ? 'Processing...' : 'Apply Adjustment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockMovement;
