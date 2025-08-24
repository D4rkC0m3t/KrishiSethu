import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Plus,
  Minus,
  ArrowUpDown,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  RefreshCw,
  Download,
  Upload,
  FileText,
  Calendar,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { productsService, stockAdjustmentService } from '../lib/supabaseDb';

const StockAdjustment = ({ onNavigate }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [adjustments, setAdjustments] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add', 'subtract', 'set'
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  
  // UI States
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [showBulkAdjustDialog, setShowBulkAdjustDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Advanced Features
  const [autoReorderEnabled, setAutoReorderEnabled] = useState(false);
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [stockMovementHistory, setStockMovementHistory] = useState([]);

  useEffect(() => {
    loadProducts();
    loadStockMovements();
    checkReorderAlerts();
    checkExpiryAlerts();
  }, []);

  // Product filtering
  useEffect(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' ||
                           (filterStatus === 'low-stock' && (product.quantity || 0) <= (product.reorderPoint || 10)) ||
                           (filterStatus === 'out-of-stock' && (product.quantity || 0) === 0) ||
                           (filterStatus === 'near-expiry' && isNearExpiry(product.expiryDate));

      return matchesSearch && matchesStatus;
    });
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, filterStatus]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getAll();
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStockMovements = async () => {
    try {
      // Load recent stock movements from database
      const movements = []; // await stockAdjustmentService.getRecentMovements();
      setStockMovementHistory(movements);
    } catch (error) {
      console.error('Error loading stock movements:', error);
    }
  };

  const checkReorderAlerts = useCallback(() => {
    const alerts = products.filter(product => {
      const currentStock = product.quantity || 0;
      const reorderPoint = product.reorderPoint || 10;
      return currentStock <= reorderPoint;
    }).map(product => ({
      id: product.id,
      productName: product.name,
      currentStock: product.quantity || 0,
      reorderPoint: product.reorderPoint || 10,
      suggestedQuantity: product.reorderQuantity || 50,
      priority: (product.quantity || 0) === 0 ? 'critical' : 'warning'
    }));
    
    setReorderAlerts(alerts);
  }, [products]);

  const checkExpiryAlerts = useCallback(() => {
    const alerts = products.filter(product => {
      if (!product.expiryDate) return false;
      return isNearExpiry(product.expiryDate);
    }).map(product => ({
      id: product.id,
      productName: product.name,
      expiryDate: product.expiryDate,
      quantity: product.quantity || 0,
      daysUntilExpiry: Math.ceil((new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)),
      priority: getDaysUntilExpiry(product.expiryDate) <= 7 ? 'critical' : 'warning'
    }));
    
    setExpiryAlerts(alerts);
  }, [products]);

  useEffect(() => {
    checkReorderAlerts();
    checkExpiryAlerts();
  }, [products, checkReorderAlerts, checkExpiryAlerts]);

  const isNearExpiry = (expiryDate) => {
    if (!expiryDate) return false;
    const days = getDaysUntilExpiry(expiryDate);
    return days <= 30 && days > 0;
  };

  const getDaysUntilExpiry = (expiryDate) => {
    return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const handleStockAdjustment = async () => {
    if (!selectedProduct || !adjustmentQuantity) {
      alert('Please select a product and enter adjustment quantity');
      return;
    }

    try {
      setLoading(true);
      
      const adjustment = {
        productId: selectedProduct.id,
        type: adjustmentType,
        quantity: parseFloat(adjustmentQuantity),
        reason: adjustmentReason || 'Manual adjustment',
        batchNumber,
        expiryDate: expiryDate || null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        supplier,
        notes,
        adjustedBy: 'current-user', // Replace with actual user
        adjustedAt: new Date().toISOString()
      };

      // Calculate new quantity
      let newQuantity = selectedProduct.quantity || 0;
      switch (adjustmentType) {
        case 'add':
          newQuantity += adjustment.quantity;
          break;
        case 'subtract':
          newQuantity = Math.max(0, newQuantity - adjustment.quantity);
          break;
        case 'set':
          newQuantity = adjustment.quantity;
          break;
      }

      // Update product in database
      await productsService.update(selectedProduct.id, { 
        quantity: newQuantity,
        ...(costPrice && { purchasePrice: parseFloat(costPrice) }),
        ...(expiryDate && { expiryDate }),
        lastUpdated: new Date().toISOString()
      });

      // Log the adjustment (implement stockAdjustmentService.add)
      // await stockAdjustmentService.add(adjustment);

      // Update local state
      setProducts(prev => prev.map(product =>
        product.id === selectedProduct.id
          ? { ...product, quantity: newQuantity }
          : product
      ));

      // Reset form
      setAdjustmentQuantity('');
      setAdjustmentReason('');
      setBatchNumber('');
      setExpiryDate('');
      setCostPrice('');
      setSupplier('');
      setNotes('');
      setShowAdjustmentDialog(false);
      
      alert(`Stock ${adjustmentType} successful! New quantity: ${newQuantity}`);
      
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Error adjusting stock');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReorder = async () => {
    if (reorderAlerts.length === 0) {
      alert('No products need reordering');
      return;
    }

    try {
      setLoading(true);
      
      // Create purchase orders or adjustment requests for low stock items
      for (const alert of reorderAlerts) {
        if (autoReorderEnabled) {
          // Auto-create purchase order
          const purchaseOrder = {
            productId: alert.id,
            quantity: alert.suggestedQuantity,
            reason: 'Auto-reorder based on reorder point',
            priority: alert.priority,
            createdAt: new Date().toISOString()
          };
          
          // Implement purchase order creation
          console.log('Creating purchase order:', purchaseOrder);
        }
      }
      
      alert('Reorder process initiated for low stock items');
      
    } catch (error) {
      console.error('Error processing bulk reorder:', error);
      alert('Error processing bulk reorder');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (quantity, reorderPoint = 10) => {
    if (quantity === 0) return { status: 'Out of Stock', color: 'bg-red-500', textColor: 'text-red-700' };
    if (quantity <= reorderPoint) return { status: 'Low Stock', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { status: 'In Stock', color: 'bg-green-500', textColor: 'text-green-700' };
  };

  const getPaginatedProducts = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header with Alerts */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Stock Adjustment</h1>
            <p className="text-muted-foreground">Manage inventory levels, batches, and reorder automation</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowBulkAdjustDialog(true)} variant="outline">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Bulk Actions
            </Button>
            <Button onClick={() => onNavigate('inventory')}>
              <Package className="h-4 w-4 mr-2" />
              View Inventory
            </Button>
          </div>
        </div>

        {/* Alert Cards */}
        {(reorderAlerts.length > 0 || expiryAlerts.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reorderAlerts.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <Target className="h-5 w-5" />
                    Low Stock Alert ({reorderAlerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reorderAlerts.slice(0, 3).map(alert => (
                      <div key={alert.id} className="flex justify-between text-sm">
                        <span className="font-medium">{alert.productName}</span>
                        <span className="text-orange-600">
                          {alert.currentStock} / {alert.reorderPoint} units
                        </span>
                      </div>
                    ))}
                    {reorderAlerts.length > 3 && (
                      <p className="text-sm text-orange-600">+{reorderAlerts.length - 3} more items</p>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    className="mt-3 w-full" 
                    onClick={handleBulkReorder}
                    disabled={loading}
                  >
                    {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Target className="h-4 w-4 mr-2" />}
                    Process Reorders
                  </Button>
                </CardContent>
              </Card>
            )}

            {expiryAlerts.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <Clock className="h-5 w-5" />
                    Expiry Alert ({expiryAlerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {expiryAlerts.slice(0, 3).map(alert => (
                      <div key={alert.id} className="flex justify-between text-sm">
                        <span className="font-medium">{alert.productName}</span>
                        <span className="text-red-600">
                          {alert.daysUntilExpiry} days left
                        </span>
                      </div>
                    ))}
                    {expiryAlerts.length > 3 && (
                      <p className="text-sm text-red-600">+{expiryAlerts.length - 3} more items</p>
                    )}
                  </div>
                  <Button size="sm" className="mt-3 w-full" variant="outline">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Review Expiring Items
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Single Adjustment</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          <TabsTrigger value="history">Movement History</TabsTrigger>
        </TabsList>

        {/* Single Adjustment Tab */}
        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Product Selection</CardTitle>
                  <CardDescription>Select a product to adjust stock levels</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={loadProducts} variant="outline" size="sm" disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="space-y-4 mb-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="low-stock">Low Stock</SelectItem>
                      <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                      <SelectItem value="near-expiry">Near Expiry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Products Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-medium">Product</th>
                      <th className="text-left p-4 font-medium">Current Stock</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Last Updated</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {getPaginatedProducts().map(product => {
                      const stockStatus = getStockStatus(product.quantity, product.reorderPoint);
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <Package className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.brand}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold">{product.quantity || 0}</span>
                              <span className="text-sm text-gray-500">units</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={`${stockStatus.color} text-white`}>
                              {stockStatus.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-gray-500">
                              {product.lastUpdated ? new Date(product.lastUpdated).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>
                          <td className="p-4">
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowAdjustmentDialog(true);
                              }}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Operations Tab */}
        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Stock Operations</CardTitle>
              <CardDescription>Perform stock adjustments on multiple products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button className="w-full justify-start" onClick={handleBulkReorder}>
                      <Target className="h-4 w-4 mr-2" />
                      Auto-Reorder Low Stock Items ({reorderAlerts.length})
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Export Stock Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Stock Updates
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium">Automation Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Auto-Reorder</label>
                      <input
                        type="checkbox"
                        checked={autoReorderEnabled}
                        onChange={(e) => setAutoReorderEnabled(e.target.checked)}
                        className="rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Expiry Alerts</label>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Stock Notifications</label>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movement History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Movement History</CardTitle>
              <CardDescription>Track all stock adjustments and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Stock movement history will be displayed here</p>
                <p className="text-sm">Recent adjustments, transfers, and automated changes</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adjust Stock - {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Current stock: {selectedProduct?.quantity || 0} units
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Adjustment Type</label>
                <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Stock (+)</SelectItem>
                    <SelectItem value="subtract">Remove Stock (-)</SelectItem>
                    <SelectItem value="set">Set Exact Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason</label>
                <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock-in">Stock Receipt</SelectItem>
                    <SelectItem value="stock-out">Stock Issue</SelectItem>
                    <SelectItem value="damage">Damaged Goods</SelectItem>
                    <SelectItem value="expiry">Expired Products</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="count-adjustment">Physical Count Adjustment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Batch Number (Optional)</label>
                <Input
                  placeholder="BATCH001"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry Date (Optional)</label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cost Price (Optional)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Supplier (Optional)</label>
                <Input
                  placeholder="Supplier name"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Input
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Preview of new stock level */}
          {adjustmentQuantity && selectedProduct && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">New stock level will be:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {adjustmentType === 'add' ? (selectedProduct.quantity || 0) + parseFloat(adjustmentQuantity) :
                   adjustmentType === 'subtract' ? Math.max(0, (selectedProduct.quantity || 0) - parseFloat(adjustmentQuantity)) :
                   parseFloat(adjustmentQuantity)} units
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustmentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStockAdjustment} disabled={loading || !adjustmentQuantity}>
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockAdjustment;
