import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Package,
  Truck,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { purchasesService, suppliersService, productsService } from '../lib/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Purchases = ({ onNavigate }) => {
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('purchaseDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [analytics, setAnalytics] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [newPurchase, setNewPurchase] = useState({
    supplierId: '',
    productId: '',
    quantity: '',
    unitPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    notes: ''
  });
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  // Load suppliers and products
  useEffect(() => {
    const loadData = async () => {
      try {
        const [suppliersData, productsData] = await Promise.all([
          suppliersService.getAll(),
          productsService.getAll()
        ]);
        setSuppliers(suppliersData || []);
        setProducts(productsData || []);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Save new purchase
  const handleSavePurchase = async () => {
    try {
      setIsLoading(true);

      // Validate form
      if (!newPurchase.supplierId || !newPurchase.productId || !newPurchase.quantity || !newPurchase.unitPrice) {
        alert('Please fill in all required fields');
        return;
      }

      // Get supplier and product details
      const supplier = suppliers.find(s => s.id === newPurchase.supplierId);
      const product = products.find(p => p.id === newPurchase.productId);

      const purchaseData = {
        supplierId: newPurchase.supplierId,
        supplierName: supplier?.name || 'Unknown Supplier',
        productId: newPurchase.productId,
        productName: product?.name || 'Unknown Product',
        quantity: parseInt(newPurchase.quantity),
        unitPrice: parseFloat(newPurchase.unitPrice),
        totalAmount: parseInt(newPurchase.quantity) * parseFloat(newPurchase.unitPrice),
        purchaseDate: newPurchase.purchaseDate,
        invoiceNumber: newPurchase.invoiceNumber,
        notes: newPurchase.notes,
        status: 'received'
      };

      await purchasesService.add(purchaseData);

      // Reset form
      setNewPurchase({
        supplierId: '',
        productId: '',
        quantity: '',
        unitPrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        notes: ''
      });

      setShowAddDialog(false);
      alert('Purchase order created successfully!');

      // Reload purchases (you might want to add this functionality)

    } catch (error) {
      console.error('Error saving purchase:', error);
      alert('Error saving purchase order');
    } finally {
      setIsLoading(false);
    }
  };

  // Mock purchases data
  useEffect(() => {
    const mockPurchases = [
      {
        id: 'PUR20250106001',
        purchaseNumber: 'PUR20250106001',
        supplierId: 'sup1',
        supplierName: 'Tata Chemicals Ltd',
        items: [
          { productId: '1', productName: 'NPK 20-20-20', quantity: 50, unitPrice: 850, totalPrice: 42500, batchNo: 'TC2025001' },
          { productId: '2', productName: 'Urea', quantity: 30, unitPrice: 280, totalPrice: 8400, batchNo: 'TC2025002' }
        ],
        subtotal: 50900,
        discount: 1000,
        tax: 2495,
        total: 52395,
        paymentStatus: 'paid',
        amountPaid: 52395,
        balanceAmount: 0,
        invoiceNumber: 'TC/2025/001',
        purchaseDate: new Date('2025-01-06'),
        createdBy: 'Demo User',
        notes: 'Regular monthly stock replenishment'
      },
      {
        id: 'PUR20250105001',
        purchaseNumber: 'PUR20250105001',
        supplierId: 'sup2',
        supplierName: 'IFFCO Distributors',
        items: [
          { productId: '3', productName: 'DAP', quantity: 25, unitPrice: 1200, totalPrice: 30000, batchNo: 'IF2025001' }
        ],
        subtotal: 30000,
        discount: 500,
        tax: 1475,
        total: 30975,
        paymentStatus: 'pending',
        amountPaid: 15000,
        balanceAmount: 15975,
        invoiceNumber: 'IF/2025/001',
        purchaseDate: new Date('2025-01-05'),
        createdBy: 'Demo User',
        notes: 'Partial payment made'
      },
      {
        id: 'PUR20250104001',
        purchaseNumber: 'PUR20250104001',
        supplierId: 'sup3',
        supplierName: 'Green Gold Organics',
        items: [
          { productId: '5', productName: 'Organic Compost', quantity: 100, unitPrice: 150, totalPrice: 15000, batchNo: 'GG2025001' }
        ],
        subtotal: 15000,
        discount: 0,
        tax: 750,
        total: 15750,
        paymentStatus: 'paid',
        amountPaid: 15750,
        balanceAmount: 0,
        invoiceNumber: 'GG/2025/001',
        purchaseDate: new Date('2025-01-04'),
        createdBy: 'Demo User',
        notes: 'Organic fertilizer stock'
      },
      {
        id: 'PUR20250103001',
        purchaseNumber: 'PUR20250103001',
        supplierId: 'sup1',
        supplierName: 'Tata Chemicals Ltd',
        items: [
          { productId: '6', productName: 'Zinc Sulphate', quantity: 40, unitPrice: 180, totalPrice: 7200, batchNo: 'TC2025003' },
          { productId: '7', productName: 'Bio NPK', quantity: 20, unitPrice: 320, totalPrice: 6400, batchNo: 'TC2025004' }
        ],
        subtotal: 13600,
        discount: 200,
        tax: 670,
        total: 14070,
        paymentStatus: 'paid',
        amountPaid: 14070,
        balanceAmount: 0,
        invoiceNumber: 'TC/2025/002',
        purchaseDate: new Date('2025-01-03'),
        createdBy: 'Demo User',
        notes: 'Micronutrient and bio-fertilizer stock'
      },
      {
        id: 'PUR20250102001',
        purchaseNumber: 'PUR20250102001',
        supplierId: 'sup4',
        supplierName: 'ICL Fertilizers',
        items: [
          { productId: '8', productName: 'Potash (MOP)', quantity: 30, unitPrice: 950, totalPrice: 28500, batchNo: 'ICL2025001' }
        ],
        subtotal: 28500,
        discount: 500,
        tax: 1400,
        total: 29400,
        paymentStatus: 'pending',
        amountPaid: 10000,
        balanceAmount: 19400,
        invoiceNumber: 'ICL/2025/001',
        purchaseDate: new Date('2025-01-02'),
        createdBy: 'Demo User',
        notes: 'Advance payment made, balance due in 30 days'
      }
    ];
    setPurchases(mockPurchases);
    setFilteredPurchases(mockPurchases);
    calculateAnalytics(mockPurchases);
  }, []);

  // Calculate analytics
  const calculateAnalytics = (purchaseData) => {
    const totalPurchases = purchaseData.reduce((sum, purchase) => sum + purchase.total, 0);
    const totalTransactions = purchaseData.length;
    const paidPurchases = purchaseData.filter(purchase => purchase.paymentStatus === 'paid');
    const pendingPurchases = purchaseData.filter(purchase => purchase.paymentStatus === 'pending');

    const totalPaid = paidPurchases.reduce((sum, purchase) => sum + purchase.amountPaid, 0);
    const totalPending = pendingPurchases.reduce((sum, purchase) => sum + purchase.balanceAmount, 0);
    const avgOrderValue = totalPurchases / totalTransactions;

    // Supplier breakdown
    const supplierBreakdown = purchaseData.reduce((acc, purchase) => {
      acc[purchase.supplierName] = (acc[purchase.supplierName] || 0) + purchase.total;
      return acc;
    }, {});

    // Monthly purchases for chart
    const monthlyPurchases = purchaseData.reduce((acc, purchase) => {
      const month = purchase.purchaseDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + purchase.total;
      return acc;
    }, {});

    setAnalytics({
      totalPurchases,
      totalTransactions,
      avgOrderValue,
      totalPaid,
      totalPending,
      supplierBreakdown,
      monthlyPurchases,
      paidCount: paidPurchases.length,
      pendingCount: pendingPurchases.length
    });
  };

  // Enhanced filtering logic
  useEffect(() => {
    let filtered = purchases.filter(purchase => {
      const matchesSearch =
        purchase.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || purchase.paymentStatus === statusFilter;
      const matchesSupplier = supplierFilter === 'all' || purchase.supplierName === supplierFilter;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const today = new Date();
        const purchaseDate = new Date(purchase.purchaseDate);

        switch (dateFilter) {
          case 'today':
            matchesDate = purchaseDate.toDateString() === today.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = purchaseDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = purchaseDate >= monthAgo;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesSupplier && matchesDate;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'purchaseDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPurchases(filtered);
    calculateAnalytics(filtered);
  }, [searchTerm, purchases, statusFilter, supplierFilter, dateFilter, sortBy, sortOrder]);

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'partial':
        return <Badge className="bg-orange-100 text-orange-800">Partial</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const viewPurchaseDetails = (purchase) => {
    setSelectedPurchase(purchase);
    setShowDetailsDialog(true);
  };

  const getTotalPurchases = () => {
    return filteredPurchases.reduce((sum, purchase) => sum + purchase.total, 0);
  };

  const getPendingAmount = () => {
    return filteredPurchases
      .filter(purchase => purchase.paymentStatus !== 'paid')
      .reduce((sum, purchase) => sum + purchase.balanceAmount, 0);
  };

  const getTodaysPurchases = () => {
    const today = new Date().toDateString();
    return filteredPurchases.filter(purchase => 
      purchase.purchaseDate.toDateString() === today
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Management</h1>
          <p className="text-gray-600">Track all purchase orders and supplier transactions</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowAddDialog(true)} className="bg-green-600 hover:bg-green-700">
            ➕ New Purchase
          </Button>
          <Button variant="outline" onClick={() => onNavigate('dashboard')}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTodaysPurchases().length}</div>
            <p className="text-xs text-muted-foreground">orders today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{getTotalPurchases().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">all time value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{getPendingAmount().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">outstanding amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPurchases.length}</div>
            <p className="text-xs text-muted-foreground">purchase orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <Input
              placeholder="Search by purchase number, supplier, invoice, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline">Filter by Date</Button>
            <Button variant="outline">Export</Button>
          </div>
        </CardContent>
      </Card>

      {/* Purchases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders ({filteredPurchases.length})</CardTitle>
          <CardDescription>
            All purchase transactions with suppliers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Purchase #</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Supplier</th>
                  <th className="text-left py-3 px-4">Items</th>
                  <th className="text-left py-3 px-4">Total</th>
                  <th className="text-left py-3 px-4">Payment</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-medium">{purchase.purchaseNumber}</span>
                        <div className="text-xs text-gray-500">
                          Invoice: {purchase.invoiceNumber}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{purchase.purchaseDate.toLocaleDateString()}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{purchase.supplierName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div>{purchase.items.length} items</div>
                        <div className="text-xs text-gray-500">
                          {purchase.items[0]?.productName}
                          {purchase.items.length > 1 && ` +${purchase.items.length - 1} more`}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">₹{purchase.total.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div>Paid: ₹{purchase.amountPaid.toLocaleString()}</div>
                        {purchase.balanceAmount > 0 && (
                          <div className="text-red-600">Due: ₹{purchase.balanceAmount.toLocaleString()}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getPaymentStatusBadge(purchase.paymentStatus)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewPurchaseDetails(purchase)}
                        >
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          Print
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Purchase Details - {selectedPurchase?.purchaseNumber}</DialogTitle>
            <DialogDescription>
              Complete purchase order information
            </DialogDescription>
          </DialogHeader>
          
          {selectedPurchase && (
            <div className="space-y-6">
              {/* Purchase Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Purchase Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Purchase Number:</span>
                      <span className="font-medium">{selectedPurchase.purchaseNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span>{selectedPurchase.purchaseDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Supplier:</span>
                      <span>{selectedPurchase.supplierName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice Number:</span>
                      <span>{selectedPurchase.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created By:</span>
                      <span>{selectedPurchase.createdBy}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Payment Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span>{getPaymentStatusBadge(selectedPurchase.paymentStatus)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-medium">₹{selectedPurchase.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="text-green-600">₹{selectedPurchase.amountPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Balance Amount:</span>
                      <span className={selectedPurchase.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                        ₹{selectedPurchase.balanceAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-3">Items Purchased</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Product</th>
                        <th className="text-center py-2">Batch No.</th>
                        <th className="text-center py-2">Qty</th>
                        <th className="text-right py-2">Unit Price</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPurchase.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{item.productName}</td>
                          <td className="text-center py-2">{item.batchNo}</td>
                          <td className="text-center py-2">{item.quantity}</td>
                          <td className="text-right py-2">₹{item.unitPrice.toLocaleString()}</td>
                          <td className="text-right py-2">₹{item.totalPrice.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{selectedPurchase.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>₹{selectedPurchase.discount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>₹{selectedPurchase.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>₹{selectedPurchase.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedPurchase.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedPurchase.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Purchase Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Purchase</DialogTitle>
            <DialogDescription>
              Create a new purchase order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Supplier *</label>
                <Select value={newPurchase.supplierId} onValueChange={(value) => setNewPurchase(prev => ({ ...prev, supplierId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Product *</label>
                <Select value={newPurchase.productId} onValueChange={(value) => setNewPurchase(prev => ({ ...prev, productId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity *</label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={newPurchase.quantity}
                  onChange={(e) => setNewPurchase(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Price *</label>
                <Input
                  type="number"
                  placeholder="Enter unit price"
                  value={newPurchase.unitPrice}
                  onChange={(e) => setNewPurchase(prev => ({ ...prev, unitPrice: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Total Amount</label>
                <Input
                  type="number"
                  placeholder="Auto-calculated"
                  value={newPurchase.quantity && newPurchase.unitPrice ? (parseFloat(newPurchase.quantity) * parseFloat(newPurchase.unitPrice)).toFixed(2) : ''}
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Purchase Date</label>
                <Input
                  type="date"
                  value={newPurchase.purchaseDate}
                  onChange={(e) => setNewPurchase(prev => ({ ...prev, purchaseDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Invoice Number</label>
                <Input
                  placeholder="Enter invoice number"
                  value={newPurchase.invoiceNumber}
                  onChange={(e) => setNewPurchase(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input
                placeholder="Additional notes (optional)"
                value={newPurchase.notes}
                onChange={(e) => setNewPurchase(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePurchase} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Purchases;
