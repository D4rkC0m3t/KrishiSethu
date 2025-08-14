import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import InvoiceGenerator from './invoice/InvoiceGenerator';
import { salesService } from '../lib/firestore';
import { invoiceService } from '../lib/invoice';
import {
  FileText,
  Plus,
  Search,
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Loader2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

const InvoiceManagement = ({ onNavigate }) => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'view'
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    // Filter sales based on search term
    const filtered = sales.filter(sale =>
      sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSales(filtered);
  }, [searchTerm, sales]);

  const loadSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const salesData = await salesService.getAll();
      setSales(salesData);
      setFilteredSales(salesData);
    } catch (err) {
      console.error('Error loading sales:', err);
      setError('Failed to load sales data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = (saleId = null) => {
    setSelectedSaleId(saleId);
    setCurrentView('create');
  };



  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return dateObj.toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount) => {
    return invoiceService.formatCurrency(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800',
      'draft': 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={statusColors[status?.toLowerCase()] || statusColors.draft}>
        {status || 'Draft'}
      </Badge>
    );
  };

  if (currentView === 'create') {
    return (
      <InvoiceGenerator 
        onNavigate={(page) => {
          if (page === 'invoices') {
            setCurrentView('list');
          } else {
            onNavigate(page);
          }
        }}
        saleId={selectedSaleId}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Management</h1>
            <p className="text-gray-600">
              Create and manage professional invoices for your sales
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button
              onClick={() => handleCreateInvoice()}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSales}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sales.filter(sale => {
                    const saleDate = sale.createdAt?.seconds ? 
                      new Date(sale.createdAt.seconds * 1000) : 
                      new Date(sale.createdAt);
                    const currentMonth = new Date().getMonth();
                    return saleDate.getMonth() === currentMonth;
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(sales.map(sale => sale.customerName)).size}
                </p>
              </div>
              <User className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by customer name, invoice ID, or payment method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={loadSales}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales List */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Transactions</CardTitle>
          <CardDescription>
            Select a sale to generate an invoice or create a new custom invoice
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sales found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'No sales match your search criteria.' : 'No sales transactions available.'}
              </p>
              <Button onClick={() => handleCreateInvoice()} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Items</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatDate(sale.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {sale.customerName || 'Walk-in Customer'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {sale.items?.length || 0} items
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {sale.paymentMethod || 'Cash'}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(sale.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateInvoice(sale.id)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            Invoice
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceManagement;
