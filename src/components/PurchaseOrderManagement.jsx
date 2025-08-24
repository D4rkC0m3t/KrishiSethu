import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  Plus, Edit, Trash2, Eye, CheckCircle, Clock, AlertTriangle, XCircle,
  TrendingUp, ShoppingCart, Package, Truck, DollarSign, Calendar,
  Filter, Download, RefreshCw, Settings, Bell, ArrowUp, ArrowDown,
  Search, FileText, Mail, Phone, MapPin, Star, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { purchasesService, suppliersService, productsService } from '../lib/supabaseDb';
import { formatCurrency, formatDate } from '../utils/numberUtils';

const PurchaseOrderManagement = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredPOs, setFilteredPOs] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [showPODetails, setShowPODetails] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showVendorAnalytics, setShowVendorAnalytics] = useState(false);
  const [showReorderSettings, setShowReorderSettings] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  // Form states
  const [newPO, setNewPO] = useState({
    supplierId: '',
    items: [],
    expectedDelivery: '',
    priority: 'medium',
    notes: '',
    requestedBy: 'Current User'
  });
  const [newItem, setNewItem] = useState({
    productId: '',
    quantity: '',
    unitPrice: '',
    notes: ''
  });

  // Analytics states
  const [analytics, setAnalytics] = useState({
    totalPOs: 0,
    pendingApproval: 0,
    activeOrders: 0,
    totalValue: 0,
    avgDeliveryTime: 0,
    onTimeDeliveryRate: 0
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [suppliersData, productsData] = await Promise.all([
        suppliersService.getAll(),
        productsService.getAll()
      ]);

      setSuppliers(suppliersData || []);
      setProducts(productsData || []);

      // Generate mock purchase orders with comprehensive data
      const mockPOs = generateMockPurchaseOrders(suppliersData || [], productsData || []);
      setPurchaseOrders(mockPOs);
      setFilteredPOs(mockPOs);
      calculateAnalytics(mockPOs);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load purchase order data');
    } finally {
      setLoading(false);
    }
  };

  const generateMockPurchaseOrders = (suppliersData, productsData) => {
    if (!suppliersData.length || !productsData.length) return [];

    const statuses = ['draft', 'pending_approval', 'approved', 'sent', 'confirmed', 'delivered', 'cancelled'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    
    return Array.from({ length: 20 }, (_, i) => {
      const supplier = suppliersData[Math.floor(Math.random() * suppliersData.length)];
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items = Array.from({ length: itemCount }, () => {
        const product = productsData[Math.floor(Math.random() * productsData.length)];
        const quantity = Math.floor(Math.random() * 50) + 1;
        const unitPrice = Math.floor(Math.random() * 1000) + 100;
        return {
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice,
          totalPrice: quantity * unitPrice,
          specifications: 'Standard quality requirements',
          notes: ''
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const tax = subtotal * 0.18; // 18% GST
      const total = subtotal + tax;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        id: `PO-${String(i + 1).padStart(4, '0')}`,
        poNumber: `PO-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierContact: supplier.contactPerson,
        supplierPhone: supplier.phone,
        supplierEmail: supplier.email,
        items,
        subtotal,
        discount: Math.floor(Math.random() * subtotal * 0.1), // Up to 10% discount
        tax,
        total,
        status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        requestedBy: 'Admin User',
        approvedBy: status === 'approved' || status === 'sent' || status === 'confirmed' || status === 'delivered' ? 'Manager' : null,
        createdDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        expectedDelivery: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        actualDelivery: status === 'delivered' ? new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000) : null,
        deliveryAddress: 'Main Warehouse, Industrial Area',
        paymentTerms: supplier.paymentTerms || '30 days',
        notes: 'Standard purchase order for regular inventory replenishment',
        trackingNumber: status === 'sent' || status === 'confirmed' || status === 'delivered' ? `TRK${Math.floor(Math.random() * 1000000)}` : null,
        qualityRating: status === 'delivered' ? Math.floor(Math.random() * 5) + 1 : null,
        deliveryRating: status === 'delivered' ? Math.floor(Math.random() * 5) + 1 : null,
        communicationRating: status === 'delivered' ? Math.floor(Math.random() * 5) + 1 : null
      };
    }).sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
  };

  const calculateAnalytics = (pos) => {
    const totalPOs = pos.length;
    const pendingApproval = pos.filter(po => po.status === 'pending_approval').length;
    const activeOrders = pos.filter(po => ['approved', 'sent', 'confirmed'].includes(po.status)).length;
    const totalValue = pos.reduce((sum, po) => sum + po.total, 0);
    
    const deliveredOrders = pos.filter(po => po.status === 'delivered' && po.actualDelivery);
    const avgDeliveryTime = deliveredOrders.length > 0 
      ? deliveredOrders.reduce((sum, po) => {
          const orderDate = new Date(po.createdDate);
          const deliveryDate = new Date(po.actualDelivery);
          return sum + ((deliveryDate - orderDate) / (1000 * 60 * 60 * 24));
        }, 0) / deliveredOrders.length
      : 0;

    const onTimeDeliveries = deliveredOrders.filter(po => {
      const expectedDate = new Date(po.expectedDelivery);
      const actualDate = new Date(po.actualDelivery);
      return actualDate <= expectedDate;
    }).length;
    const onTimeDeliveryRate = deliveredOrders.length > 0 ? (onTimeDeliveries / deliveredOrders.length) * 100 : 0;

    setAnalytics({
      totalPOs,
      pendingApproval,
      activeOrders,
      totalValue,
      avgDeliveryTime: Math.round(avgDeliveryTime),
      onTimeDeliveryRate: Math.round(onTimeDeliveryRate)
    });
  };

  // Filtering logic
  useEffect(() => {
    let filtered = purchaseOrders.filter(po => {
      const matchesSearch = searchTerm === '' || 
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
      const matchesSupplier = supplierFilter === 'all' || po.supplierId === supplierFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const today = new Date();
        const poDate = new Date(po.createdDate);
        switch (dateFilter) {
          case 'today':
            matchesDate = poDate.toDateString() === today.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = poDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = poDate >= monthAgo;
            break;
          default:
            matchesDate = true;
        }
      }

      return matchesSearch && matchesStatus && matchesSupplier && matchesDate;
    });

    setFilteredPOs(filtered);
  }, [searchTerm, statusFilter, supplierFilter, dateFilter, purchaseOrders]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      pending_approval: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Approval' },
      approved: { color: 'bg-blue-100 text-blue-800', label: 'Approved' },
      sent: { color: 'bg-purple-100 text-purple-800', label: 'Sent' },
      confirmed: { color: 'bg-indigo-100 text-indigo-800', label: 'Confirmed' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { color: 'bg-green-100 text-green-800', icon: ArrowDown },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: null },
      high: { color: 'bg-orange-100 text-orange-800', icon: ArrowUp },
      urgent: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        {Icon && <Icon className="h-3 w-3 mr-1" />}
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const addItemToPO = () => {
    if (!newItem.productId || !newItem.quantity || !newItem.unitPrice) {
      alert('Please fill all item details');
      return;
    }

    const product = products.find(p => p.id === newItem.productId);
    if (!product) return;

    const item = {
      ...newItem,
      productName: product.name,
      totalPrice: parseFloat(newItem.quantity) * parseFloat(newItem.unitPrice)
    };

    setNewPO(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setNewItem({ productId: '', quantity: '', unitPrice: '', notes: '' });
  };

  const removeItemFromPO = (index) => {
    setNewPO(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const createPurchaseOrder = async () => {
    if (!newPO.supplierId || newPO.items.length === 0) {
      alert('Please select supplier and add at least one item');
      return;
    }

    try {
      const supplier = suppliers.find(s => s.id === newPO.supplierId);
      const subtotal = newPO.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const tax = subtotal * 0.18;
      const total = subtotal + tax;

      const poData = {
        ...newPO,
        poNumber: `PO-${Date.now()}`,
        supplierName: supplier.name,
        subtotal,
        tax,
        total,
        status: 'draft',
        createdDate: new Date(),
        requestedBy: 'Current User'
      };

      setPurchaseOrders(prev => [poData, ...prev]);
      setNewPO({
        supplierId: '',
        items: [],
        expectedDelivery: '',
        priority: 'medium',
        notes: '',
        requestedBy: 'Current User'
      });
      setShowCreatePO(false);
      alert('Purchase Order created successfully!');
    } catch (error) {
      console.error('Error creating PO:', error);
      alert('Error creating purchase order');
    }
  };

  const approvePurchaseOrder = async (poId, approved, comments = '') => {
    try {
      setPurchaseOrders(prev =>
        prev.map(po =>
          po.id === poId
            ? {
                ...po,
                status: approved ? 'approved' : 'cancelled',
                approvedBy: approved ? 'Manager' : null,
                approvalComments: comments,
                approvedDate: new Date()
              }
            : po
        )
      );
      setShowApprovalDialog(false);
      alert(`Purchase Order ${approved ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      console.error('Error processing approval:', error);
    }
  };

  const VendorPerformanceAnalytics = () => {
    const vendorStats = suppliers.map(supplier => {
      const supplierPOs = purchaseOrders.filter(po => po.supplierId === supplier.id);
      const deliveredPOs = supplierPOs.filter(po => po.status === 'delivered');
      
      const onTimeDeliveries = deliveredPOs.filter(po => {
        if (!po.actualDelivery || !po.expectedDelivery) return false;
        return new Date(po.actualDelivery) <= new Date(po.expectedDelivery);
      }).length;

      const avgQualityRating = deliveredPOs.length > 0
        ? deliveredPOs.reduce((sum, po) => sum + (po.qualityRating || 0), 0) / deliveredPOs.length
        : 0;

      const totalValue = supplierPOs.reduce((sum, po) => sum + po.total, 0);

      return {
        id: supplier.id,
        name: supplier.name,
        totalOrders: supplierPOs.length,
        deliveredOrders: deliveredPOs.length,
        onTimeDeliveryRate: deliveredPOs.length > 0 ? (onTimeDeliveries / deliveredPOs.length) * 100 : 0,
        avgQualityRating: Math.round(avgQualityRating * 10) / 10,
        totalValue,
        avgOrderValue: supplierPOs.length > 0 ? totalValue / supplierPOs.length : 0
      };
    }).filter(stat => stat.totalOrders > 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supplier Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Performance Comparison</CardTitle>
              <CardDescription>On-time delivery rate vs Quality rating</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="onTimeDeliveryRate" fill="#3b82f6" name="On-Time Delivery %" />
                  <Bar dataKey="avgQualityRating" fill="#10b981" name="Quality Rating" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order Value Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Volume by Supplier</CardTitle>
              <CardDescription>Total order value distribution</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vendorStats}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalValue"
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  >
                    {vendorStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Vendor Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Vendor Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Supplier</th>
                    <th className="text-center p-2">Total Orders</th>
                    <th className="text-center p-2">Delivered</th>
                    <th className="text-center p-2">On-Time Rate</th>
                    <th className="text-center p-2">Quality Rating</th>
                    <th className="text-right p-2">Total Value</th>
                    <th className="text-right p-2">Avg Order</th>
                    <th className="text-center p-2">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorStats.map((vendor) => (
                    <tr key={vendor.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{vendor.name}</td>
                      <td className="text-center p-2">{vendor.totalOrders}</td>
                      <td className="text-center p-2">{vendor.deliveredOrders}</td>
                      <td className="text-center p-2">
                        <div className="flex items-center justify-center">
                          <Progress 
                            value={vendor.onTimeDeliveryRate} 
                            className="w-16 h-2 mr-2" 
                          />
                          <span>{Math.round(vendor.onTimeDeliveryRate)}%</span>
                        </div>
                      </td>
                      <td className="text-center p-2">
                        <div className="flex items-center justify-center">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < vendor.avgQualityRating 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-1">{vendor.avgQualityRating}</span>
                        </div>
                      </td>
                      <td className="text-right p-2">{formatCurrency(vendor.totalValue)}</td>
                      <td className="text-right p-2">{formatCurrency(vendor.avgOrderValue)}</td>
                      <td className="text-center p-2">
                        {vendor.onTimeDeliveryRate >= 90 && vendor.avgQualityRating >= 4 ? (
                          <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                        ) : vendor.onTimeDeliveryRate >= 80 && vendor.avgQualityRating >= 3.5 ? (
                          <Badge className="bg-blue-100 text-blue-800">Good</Badge>
                        ) : vendor.onTimeDeliveryRate >= 70 && vendor.avgQualityRating >= 3 ? (
                          <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const AutoReorderSettings = () => {
    const [reorderSettings, setReorderSettings] = useState(
      products.map(product => ({
        productId: product.id,
        productName: product.name,
        currentStock: product.quantity || 0,
        reorderPoint: Math.max(5, Math.floor((product.quantity || 0) * 0.2)),
        reorderQuantity: Math.max(10, Math.floor((product.quantity || 0) * 0.5)),
        preferredSupplierId: suppliers[0]?.id || '',
        autoReorderEnabled: false,
        leadTimeDays: 7
      }))
    );

    const updateReorderSetting = (productId, field, value) => {
      setReorderSettings(prev =>
        prev.map(setting =>
          setting.productId === productId
            ? { ...setting, [field]: value }
            : setting
        )
      );
    };

    const saveReorderSettings = () => {
      // In a real app, this would save to database
      alert('Reorder settings saved successfully!');
      setShowReorderSettings(false);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Automated Reorder Settings</h3>
            <p className="text-sm text-muted-foreground">
              Configure automatic purchase order generation when stock levels are low
            </p>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setShowReorderSettings(false)}>
              Cancel
            </Button>
            <Button onClick={saveReorderSettings}>
              Save Settings
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Product</th>
                <th className="text-center p-2">Current Stock</th>
                <th className="text-center p-2">Reorder Point</th>
                <th className="text-center p-2">Reorder Quantity</th>
                <th className="text-left p-2">Preferred Supplier</th>
                <th className="text-center p-2">Lead Time (Days)</th>
                <th className="text-center p-2">Auto Reorder</th>
                <th className="text-center p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {reorderSettings.map((setting) => (
                <tr key={setting.productId} className="border-b">
                  <td className="p-2 font-medium">{setting.productName}</td>
                  <td className="text-center p-2">
                    <Badge className={setting.currentStock <= setting.reorderPoint ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                      {setting.currentStock}
                    </Badge>
                  </td>
                  <td className="text-center p-2">
                    <Input
                      type="number"
                      value={setting.reorderPoint}
                      onChange={(e) => updateReorderSetting(setting.productId, 'reorderPoint', parseInt(e.target.value) || 0)}
                      className="w-20 text-center"
                    />
                  </td>
                  <td className="text-center p-2">
                    <Input
                      type="number"
                      value={setting.reorderQuantity}
                      onChange={(e) => updateReorderSetting(setting.productId, 'reorderQuantity', parseInt(e.target.value) || 0)}
                      className="w-20 text-center"
                    />
                  </td>
                  <td className="p-2">
                    <Select 
                      value={setting.preferredSupplierId}
                      onValueChange={(value) => updateReorderSetting(setting.productId, 'preferredSupplierId', value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="text-center p-2">
                    <Input
                      type="number"
                      value={setting.leadTimeDays}
                      onChange={(e) => updateReorderSetting(setting.productId, 'leadTimeDays', parseInt(e.target.value) || 0)}
                      className="w-20 text-center"
                    />
                  </td>
                  <td className="text-center p-2">
                    <input
                      type="checkbox"
                      checked={setting.autoReorderEnabled}
                      onChange={(e) => updateReorderSetting(setting.productId, 'autoReorderEnabled', e.target.checked)}
                      className="rounded"
                    />
                  </td>
                  <td className="text-center p-2">
                    {setting.currentStock <= setting.reorderPoint ? (
                      <Badge className="bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Reorder Now
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        OK
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading purchase order data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Purchase Order Management</h1>
          <p className="text-muted-foreground">
            Comprehensive purchase order tracking with automation and analytics
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowReorderSettings(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Reorder Settings
          </Button>
          <Button onClick={() => setShowCreatePO(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Purchase Order
          </Button>
          <Button variant="outline" onClick={() => onNavigate('dashboard')}>
            ← Back
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total POs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPOs}</div>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{analytics.pendingApproval}</div>
            <p className="text-xs text-muted-foreground">need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.activeOrders}</div>
            <p className="text-xs text-muted-foreground">in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalValue)}</div>
            <p className="text-xs text-muted-foreground">order value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgDeliveryTime}</div>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.onTimeDeliveryRate}%</div>
            <p className="text-xs text-muted-foreground">delivery performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="analytics">Vendor Analytics</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="tracking">Order Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search orders, suppliers, or products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={loadData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders ({filteredPOs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">PO Number</th>
                      <th className="text-left p-3">Supplier</th>
                      <th className="text-left p-3">Items</th>
                      <th className="text-right p-3">Total</th>
                      <th className="text-center p-3">Priority</th>
                      <th className="text-center p-3">Status</th>
                      <th className="text-center p-3">Created</th>
                      <th className="text-center p-3">Expected</th>
                      <th className="text-center p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPOs.map((po) => (
                      <tr key={po.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{po.poNumber}</div>
                            <div className="text-xs text-muted-foreground">
                              by {po.requestedBy}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{po.supplierName}</div>
                            <div className="text-xs text-muted-foreground">
                              {po.supplierContact}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div>{po.items.length} items</div>
                            <div className="text-xs text-muted-foreground">
                              {po.items[0]?.productName}
                              {po.items.length > 1 && ` +${po.items.length - 1} more`}
                            </div>
                          </div>
                        </td>
                        <td className="text-right p-3 font-medium">
                          {formatCurrency(po.total)}
                        </td>
                        <td className="text-center p-3">
                          {getPriorityBadge(po.priority)}
                        </td>
                        <td className="text-center p-3">
                          {getStatusBadge(po.status)}
                        </td>
                        <td className="text-center p-3 text-xs">
                          {formatDate(po.createdDate)}
                        </td>
                        <td className="text-center p-3 text-xs">
                          {formatDate(po.expectedDelivery)}
                        </td>
                        <td className="text-center p-3">
                          <div className="flex justify-center space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPO(po);
                                setShowPODetails(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {po.status === 'pending_approval' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPO(po);
                                  setShowApprovalDialog(true);
                                }}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <VendorPerformanceAnalytics />
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Purchase orders waiting for approval</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Approval workflow content would go here */}
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                <p>No pending approvals at this time</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle>Order Tracking</CardTitle>
              <CardDescription>Track delivery status of active orders</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Order tracking content would go here */}
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4" />
                <p>Order tracking features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Purchase Order Dialog */}
      <Dialog open={showCreatePO} onOpenChange={setShowCreatePO}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Purchase Order</DialogTitle>
            <DialogDescription>
              Create a comprehensive purchase order with multiple items
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Supplier Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Supplier *</label>
                <Select 
                  value={newPO.supplierId} 
                  onValueChange={(value) => setNewPO(prev => ({ ...prev, supplierId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {supplier.contactPerson} • {supplier.phone}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Expected Delivery</label>
                <Input
                  type="date"
                  value={newPO.expectedDelivery}
                  onChange={(e) => setNewPO(prev => ({ ...prev, expectedDelivery: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select 
                  value={newPO.priority} 
                  onValueChange={(value) => setNewPO(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Add Items Section */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Add Items</h3>
              
              <div className="grid grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium">Product</label>
                  <Select 
                    value={newItem.productId} 
                    onValueChange={(value) => setNewItem(prev => ({ ...prev, productId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Stock: {product.quantity || 0}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Unit Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Total</label>
                  <Input
                    value={newItem.quantity && newItem.unitPrice 
                      ? (parseFloat(newItem.quantity) * parseFloat(newItem.unitPrice)).toFixed(2) 
                      : '0.00'
                    }
                    disabled
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addItemToPO} className="w-full">
                    Add Item
                  </Button>
                </div>
              </div>

              {/* Items List */}
              {newPO.items.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Order Items ({newPO.items.length})</h4>
                  <div className="space-y-2">
                    {newPO.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex-1">
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × {formatCurrency(parseFloat(item.unitPrice))} = {formatCurrency(item.totalPrice)}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItemFromPO(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="text-right font-medium">
                      Total: {formatCurrency(newPO.items.reduce((sum, item) => sum + item.totalPrice, 0))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={newPO.notes}
                onChange={(e) => setNewPO(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or requirements..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePO(false)}>
              Cancel
            </Button>
            <Button onClick={createPurchaseOrder} disabled={!newPO.supplierId || newPO.items.length === 0}>
              Create Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Order Details Dialog */}
      <Dialog open={showPODetails} onOpenChange={setShowPODetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details - {selectedPO?.poNumber}</DialogTitle>
          </DialogHeader>
          
          {selectedPO && (
            <div className="space-y-6">
              {/* PO Info Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Order Information</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">PO Number:</span>
                        <span className="font-medium">{selectedPO.poNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        {getStatusBadge(selectedPO.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Priority:</span>
                        {getPriorityBadge(selectedPO.priority)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{formatDate(selectedPO.createdDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expected Delivery:</span>
                        <span>{formatDate(selectedPO.expectedDelivery)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Supplier Information</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{selectedPO.supplierName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contact Person:</span>
                        <span>{selectedPO.supplierContact}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{selectedPO.supplierPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{selectedPO.supplierEmail}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-medium mb-2">Order Items</h4>
                <div className="border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3">Product</th>
                        <th className="text-center p-3">Quantity</th>
                        <th className="text-right p-3">Unit Price</th>
                        <th className="text-right p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPO.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-3 font-medium">{item.productName}</td>
                          <td className="text-center p-3">{item.quantity}</td>
                          <td className="text-right p-3">{formatCurrency(item.unitPrice)}</td>
                          <td className="text-right p-3">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedPO.subtotal)}</span>
                  </div>
                  {selectedPO.discount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-{formatCurrency(selectedPO.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax (18%):</span>
                    <span>{formatCurrency(selectedPO.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedPO.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedPO.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedPO.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPODetails(false)}>
              Close
            </Button>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Print PO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reorder Settings Dialog */}
      <Dialog open={showReorderSettings} onOpenChange={setShowReorderSettings}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Automated Reorder Settings</DialogTitle>
            <DialogDescription>
              Configure automatic purchase order generation for low stock items
            </DialogDescription>
          </DialogHeader>
          <AutoReorderSettings />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrderManagement;
