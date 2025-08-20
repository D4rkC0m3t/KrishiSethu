import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const PurchaseEntry = ({ onNavigate }) => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: '',
    productId: '',
    quantity: '',
    costPerUnit: '',
    totalCost: '',
    invoiceNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Load real data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        // Import the services
        const { suppliersService, productsService } = await import('../lib/supabaseDb');

        // Load real suppliers
        const suppliersData = await suppliersService.getAll();
        setSuppliers(suppliersData || []);

        // Load real products
        const productsData = await productsService.getAll();

        // Map products to match the expected format
        const mappedProducts = (productsData || []).map(product => ({
          id: product.id,
          name: product.name,
          type: product.type || 'Unknown',
          currentStock: product.quantity || 0
        }));

        setProducts(mappedProducts);

      } catch (error) {
        console.error('❌ Error loading data in PurchaseEntry:', error);
        // Fallback to empty arrays
        setSuppliers([]);
        setProducts([]);
      }
    };

    loadData();

        // Initialize with empty purchases array
        setPurchases([]);
  }, []);

  // Calculate total cost when quantity or cost per unit changes
  useEffect(() => {
    if (formData.quantity && formData.costPerUnit) {
      const total = parseFloat(formData.quantity) * parseFloat(formData.costPerUnit);
      setFormData(prev => ({ ...prev, totalCost: total.toFixed(2) }));
    }
  }, [formData.quantity, formData.costPerUnit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate form
      if (!formData.supplierId || !formData.productId || !formData.quantity || !formData.costPerUnit) {
        alert('Please fill in all required fields');
        return;
      }

      // Get supplier and product names
      const supplier = suppliers.find(s => s.id === formData.supplierId);
      const product = products.find(p => p.id === formData.productId);

      const newPurchase = {
        id: Date.now().toString(),
        ...formData,
        supplierName: supplier?.name,
        productName: product?.name,
        quantity: parseInt(formData.quantity),
        costPerUnit: parseFloat(formData.costPerUnit),
        totalCost: parseFloat(formData.totalCost),
        status: 'Received',
        createdAt: new Date()
      };

      // Add to purchases list
      setPurchases(prev => [newPurchase, ...prev]);

      // Update product stock (simulate inventory update)
      setProducts(prev => prev.map(p => 
        p.id === formData.productId 
          ? { ...p, currentStock: p.currentStock + parseInt(formData.quantity) }
          : p
      ));

      // Reset form
      setFormData({
        supplierId: '',
        productId: '',
        quantity: '',
        costPerUnit: '',
        totalCost: '',
        invoiceNumber: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: ''
      });

      setShowAddDialog(false);
      alert('Purchase entry added successfully! Inventory updated.');
    } catch (error) {
      console.error('Error adding purchase:', error);
      alert('Error adding purchase entry');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Received': 'default',
      'Pending': 'secondary',
      'Cancelled': 'destructive'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const totalPurchaseValue = purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Purchase Management</h2>
          <p className="text-muted-foreground">Record purchases and manage inventory restocking</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => onNavigate('inventory')}>
            📦 View Inventory
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>➕ Add Purchase</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Purchase Entry</DialogTitle>
                <DialogDescription>Record a new purchase and update inventory</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Supplier *</label>
                  <Select value={formData.supplierId} onValueChange={(value) => handleSelectChange('supplierId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Product *</label>
                    <span className="text-xs text-muted-foreground">
                      ({products.length} available)
                    </span>
                  </div>
                  <Select value={formData.productId} onValueChange={(value) => handleSelectChange('productId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {products.length > 0 ? (
                        <>
                          <div className="px-2 py-1 text-xs text-blue-600 font-semibold border-b">
                            {products.length} products available
                          </div>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} (Stock: {product.currentStock})
                            </SelectItem>
                          ))}
                        </>
                      ) : (
                        <div className="px-2 py-1 text-sm text-gray-500">
                          No products found. Loading...
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Quantity *</label>
                    <Input
                      name="quantity"
                      type="number"
                      placeholder="0"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cost per Unit *</label>
                    <Input
                      name="costPerUnit"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.costPerUnit}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Total Cost</label>
                  <Input
                    name="totalCost"
                    type="number"
                    step="0.01"
                    value={formData.totalCost}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Invoice Number</label>
                  <Input
                    name="invoiceNumber"
                    placeholder="INV-2024-001"
                    value={formData.invoiceNumber}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Purchase Date</label>
                  <Input
                    name="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Input
                    name="notes"
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onChange={handleInputChange}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Purchase</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchases.length}</div>
            <p className="text-xs text-muted-foreground">Purchase entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPurchaseValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Purchase value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <span className="text-2xl">⏳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchases.filter(p => p.status === 'Pending').length}</div>
            <p className="text-xs text-muted-foreground">Awaiting delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <span className="text-2xl">📅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchases.filter(p => 
              new Date(p.createdAt).getMonth() === new Date().getMonth()
            ).length}</div>
            <p className="text-xs text-muted-foreground">Recent purchases</p>
          </CardContent>
        </Card>
      </div>

      {/* Purchase List */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>Recent purchase entries and inventory updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {purchases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No purchases recorded yet</p>
                <p className="text-sm">Add your first purchase entry to get started</p>
              </div>
            ) : (
              purchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{purchase.productName}</h4>
                      {getStatusBadge(purchase.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Supplier: {purchase.supplierName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {purchase.quantity} • Unit Cost: ₹{purchase.costPerUnit}
                    </p>
                    {purchase.invoiceNumber && (
                      <p className="text-sm text-muted-foreground">
                        Invoice: {purchase.invoiceNumber}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{purchase.totalCost.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseEntry;
