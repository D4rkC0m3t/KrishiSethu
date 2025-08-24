import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  BarChart3,
  PieChart,
  FileText,
  Printer,
  RefreshCw,
  ArrowUpDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { salesService } from '../lib/supabaseDb';

const SalesHistory = ({ onNavigate }) => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [analytics, setAnalytics] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Load sales data
  useEffect(() => {
    const loadSales = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Loading sales data from Supabase...');

        // Use real Supabase database data
        const databaseSales = await salesService.getAll();
        console.log('📊 Raw sales data from Supabase:', databaseSales);
        console.log('📊 First sale structure:', databaseSales[0]);
        console.log('📊 Total sales count:', databaseSales.length);

        // Convert Supabase data to expected format
        const processedSales = databaseSales.map(sale => {
          console.log('🔍 Processing sale:', sale);
          return {
            ...sale,
            // Handle different date field names and formats from Supabase
            date: sale.saleDate ? new Date(sale.saleDate) :
                  sale.sale_date ? new Date(sale.sale_date) :
                  sale.createdAt ? new Date(sale.createdAt) :
                  sale.created_at ? new Date(sale.created_at) :
                  new Date(),

            // Map Supabase fields to expected format (using mapped field names)
            customer: sale.customerName || sale.customer_name || sale.customer || 'Unknown Customer',
            customerName: sale.customerName || sale.customer_name || sale.customer || 'Unknown Customer',
            paymentMethod: sale.paymentMethod || sale.payment_method || 'cash',
            status: sale.status || 'completed',
            total: sale.totalAmount || sale.total_amount || sale.total || 0,
            totalAmount: sale.totalAmount || sale.total_amount || sale.total || 0,
            saleNumber: sale.saleNumber || sale.sale_number || sale.id,

            // Add time for display
            time: sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString() :
                  sale.created_at ? new Date(sale.created_at).toLocaleTimeString() :
                  new Date().toLocaleTimeString(),

            // Ensure items array exists
            items: sale.items || []
          };
        });

        console.log('✅ Processed Supabase sales data:', processedSales);
        console.log('💰 Amount check - first sale total:', processedSales[0]?.total);

        setSales(processedSales);
        
        // Real-time data only - no mock data fallback
        console.log(`✅ Loaded ${processedSales.length} real sales transactions from database`);
        
        if (processedSales.length === 0) {
          console.log('📊 No sales data found in database - showing empty state');
        }
      } catch (error) {
        console.error('Error loading sales:', error);
        // Show error state - no mock data fallback
        setSales([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSales();
  }, []);

  // Calculate analytics
  const calculateAnalytics = (salesData) => {
    // Ensure salesData is an array
    if (!Array.isArray(salesData) || salesData.length === 0) {
      setAnalytics({
        totalSales: 0,
        totalTransactions: 0,
        avgOrderValue: 0,
        totalRevenue: 0,
        pendingAmount: 0,
        paymentMethods: {},
        dailySales: {},
        completedCount: 0,
        pendingCount: 0
      });
      return;
    }

    const totalSales = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalTransactions = salesData.length;
    const completedSales = salesData.filter(sale => sale.status === 'completed');
    const pendingSales = salesData.filter(sale => sale.status === 'pending');

    const avgOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const totalRevenue = completedSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const pendingAmount = pendingSales.reduce((sum, sale) => sum + (sale.total || 0), 0);

    // Payment method breakdown
    const paymentMethods = salesData.reduce((acc, sale) => {
      const method = sale.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    // Daily sales for chart
    const dailySales = salesData.reduce((acc, sale) => {
      // Safely handle date conversion
      let dateString;
      try {
        if (sale.date && typeof sale.date.toDateString === 'function') {
          dateString = sale.date.toDateString();
        } else if (sale.date) {
          dateString = new Date(sale.date).toDateString();
        } else {
          dateString = new Date().toDateString(); // fallback to today
        }
      } catch (error) {
        console.warn('Error processing date for sale:', sale.id, error);
        dateString = new Date().toDateString(); // fallback to today
      }
      
      acc[dateString] = (acc[dateString] || 0) + (sale.total || 0);
      return acc;
    }, {});

    setAnalytics({
      totalSales,
      totalTransactions,
      avgOrderValue,
      totalRevenue,
      pendingAmount,
      paymentMethods,
      dailySales,
      completedCount: completedSales.length,
      pendingCount: pendingSales.length
    });
  };

  // Enhanced filtering logic
  useEffect(() => {
    let filtered = sales.filter(sale => {
      // Safe search matching with null checks
      const matchesSearch =
        (sale.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.items || []).some(item => (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || (sale.status || 'completed') === statusFilter;
      const matchesPayment = paymentFilter === 'all' || (sale.paymentMethod || 'cash') === paymentFilter;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const today = new Date();
        let saleDate;
        try {
          saleDate = sale.date ? new Date(sale.date) : new Date();
        } catch (error) {
          console.warn('Error parsing sale date:', sale.id, error);
          saleDate = new Date(); // fallback to today
        }

        switch (dateFilter) {
          case 'today':
            matchesDate = saleDate.toDateString() === today.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = saleDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = saleDate >= monthAgo;
            break;
          default:
            // No date filtering for 'all' or unknown values
            matchesDate = true;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredSales(filtered);
    calculateAnalytics(filtered);
  }, [searchTerm, sales, dateFilter, statusFilter, paymentFilter, sortBy, sortOrder]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'upi': return '📱';
      case 'credit': return '📝';
      default: return '💰';
    }
  };

  const viewSaleDetails = (sale) => {
    setSelectedSale(sale);
    setShowSaleDetails(true);
  };

  const getTodaysSales = () => {
    const today = new Date().toDateString();
    return filteredSales.filter(sale => sale.date.toDateString() === today);
  };

  const getTotalRevenue = () => {
    return filteredSales
      .filter(sale => sale.status === 'completed')
      .reduce((sum, sale) => sum + sale.total, 0);
  };

  const getPendingAmount = () => {
    return filteredSales
      .filter(sale => sale.status === 'pending')
      .reduce((sum, sale) => sum + sale.total, 0);
  };

  return (
    <div className="space-y-6 p-6 bg-background text-foreground min-h-screen">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Sales Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredSales.length} transactions • ₹{analytics.totalRevenue?.toLocaleString()} revenue
            <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
              📊 Real-time data from database
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate('pos')}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            New Sale
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')}>
            ← Dashboard
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{analytics.totalRevenue?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.completedCount} completed sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  Total Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.totalTransactions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg: ₹{analytics.avgOrderValue?.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  Pending Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  ₹{analytics.pendingAmount?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.pendingCount} pending sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Today's Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {getTodaysSales().length}
                </div>
                <p className="text-xs text-muted-foreground">
                  transactions today
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Sales Trend</CardTitle>
                <CardDescription>Revenue over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={Object.entries(analytics.dailySales || {}).map(([date, amount]) => ({
                    date: new Date(date).toLocaleDateString(),
                    amount
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Distribution of payment types</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={Object.entries(analytics.paymentMethods || {}).map(([method, count]) => ({
                        name: method.toUpperCase(),
                        value: count,
                        color: method === 'cash' ? '#22c55e' : method === 'card' ? '#3b82f6' : method === 'upi' ? '#f59e0b' : '#ef4444'
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {Object.entries(analytics.paymentMethods || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry[0] === 'cash' ? '#22c55e' : entry[0] === 'card' ? '#3b82f6' : entry[0] === 'upi' ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {/* Enhanced Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by sale ID, customer, or product..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filters
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                    const [field, order] = value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Date (Newest)</SelectItem>
                      <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                      <SelectItem value="total-desc">Amount (High to Low)</SelectItem>
                      <SelectItem value="total-asc">Amount (Low to High)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Complete list of all sales transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSales.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No sales transactions found</p>
                    <p className="text-sm">Try adjusting your search criteria</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSales.map((sale) => (
                      <div key={sale.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">Sale #{sale.saleNumber}</div>
                            <div className="text-sm text-gray-500">
                              {sale.customerName} • {new Date(sale.saleDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">₹{sale.total.toLocaleString()}</div>
                            <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                              {sale.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Transactions ({filteredSales.length})</CardTitle>
          <CardDescription>
            All sales transactions with details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Sale ID</th>
                  <th className="text-left py-3 px-4">Date & Time</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Items</th>
                  <th className="text-left py-3 px-4">Payment</th>
                  <th className="text-left py-3 px-4">Total</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium">{sale.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-sm">{sale.date.toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{sale.time}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{
                        typeof sale.customer === 'object'
                          ? sale.customer?.name || sale.customerName || 'Unknown Customer'
                          : sale.customer || sale.customerName || 'Unknown Customer'
                      }</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div>{sale.items.length} items</div>
                        <div className="text-xs text-gray-500">
                          {sale.items[0]?.name}
                          {sale.items.length > 1 && ` +${sale.items.length - 1} more`}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <span>{getPaymentMethodIcon(sale.paymentMethod)}</span>
                        <span className="text-sm capitalize">{sale.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">₹{sale.total.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(sale.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewSaleDetails(sale)}
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

      {/* Sale Details Dialog */}
      <Dialog open={showSaleDetails} onOpenChange={setShowSaleDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sale Details - {selectedSale?.id}</DialogTitle>
            <DialogDescription>
              Complete transaction information
            </DialogDescription>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-6">
              {/* Sale Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Transaction Info</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Sale ID:</strong> {selectedSale.id}</p>
                    <p><strong>Date:</strong> {selectedSale.date.toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {selectedSale.time}</p>
                    <p><strong>Customer:</strong> {
                      typeof selectedSale.customer === 'object'
                        ? selectedSale.customer?.name || selectedSale.customerName || 'Unknown Customer'
                        : selectedSale.customer || selectedSale.customerName || 'Unknown Customer'
                    }</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Payment Info</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Method:</strong> {getPaymentMethodIcon(selectedSale.paymentMethod)} {selectedSale.paymentMethod}</p>
                    <p><strong>Amount Paid:</strong> ₹{selectedSale.amountPaid || selectedSale.amount_paid || selectedSale.total || 0}</p>
                    <p><strong>Change:</strong> ₹{selectedSale.change || 0}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedSale.status)}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-2">Items Purchased</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Item</th>
                      <th className="text-center py-2">Qty</th>
                      <th className="text-right py-2">Price</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{item.name}</td>
                        <td className="text-center py-2">{item.quantity}</td>
                        <td className="text-right py-2">₹{item.price}</td>
                        <td className="text-right py-2">₹{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{selectedSale.subtotal || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>₹{selectedSale.discount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>₹{selectedSale.tax || selectedSale.taxAmount || selectedSale.tax_amount || 0}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>₹{selectedSale.total || selectedSale.totalAmount || selectedSale.total_amount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesHistory;
