import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { einvoicesService, customerPaymentsService, customerBalanceService } from '../lib/firestore';
import InvoicePreview from './InvoicePreview';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Printer,
  Edit,
  Copy,
  Trash2,
  Download,
  Send,
  Calendar,
  User,
  DollarSign,
  Hash,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';

const EInvoiceHistory = ({ onNavigate }) => {
  // State management
  const [einvoices, setEinvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [showOverpaymentDialog, setShowOverpaymentDialog] = useState(false);
  const [overpaymentData, setOverpaymentData] = useState(null);

  // System settings for invoice preview
  const [systemSettings, setSystemSettings] = useState({
    companyInfo: {
      name: 'New Eralingeswara Fertilizer 2025-26',
      address: {
        street: '6/902 Teru Bazar Holagunda [V]',
        city: 'Holagunda [M]',
        district: 'Alur [T], Kurnool [Dist]',
        state: 'Andhra Pradesh',
        pincode: '518004'
      },
      gstNumber: '37ARNPG9380K1Z2',
      stateCode: '37',
      phone: '9989354866',
      email: 'Gopal.nef@gmail.com'
    },
    bankDetails: {
      bankName: 'SBI CA No - 00000030730537246',
      accountNumber: '00000030730537246',
      branch: 'Holagunda',
      ifsc: 'SBIN0011088'
    },
    taxSettings: {
      hsnCode: '38089199',
      igstRate: 18,
      cgstRate: 9,
      sgstRate: 9
    }
  });

  // Load E-Invoices on component mount
  useEffect(() => {
    loadEInvoices();
  }, []);

  // Filter invoices based on search and filters
  useEffect(() => {
    filterInvoices();
  }, [einvoices, searchTerm, statusFilter, dateFilter]);

  // Load all E-Invoices
  const loadEInvoices = async () => {
    try {
      setIsLoading(true);
      const invoiceData = await einvoicesService.getAll();
      setEinvoices(invoiceData);
    } catch (error) {
      console.error('Error loading E-Invoices:', error);
      alert('Error loading E-Invoice history');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter invoices based on search term and filters
  const filterInvoices = () => {
    let filtered = [...einvoices];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerGSTIN?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(invoice => {
            const invoiceDate = invoice.createdAt?.toDate ? invoice.createdAt.toDate() : new Date(invoice.createdAt);
            return invoiceDate >= filterDate;
          });
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(invoice => {
            const invoiceDate = invoice.createdAt?.toDate ? invoice.createdAt.toDate() : new Date(invoice.createdAt);
            return invoiceDate >= filterDate;
          });
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(invoice => {
            const invoiceDate = invoice.createdAt?.toDate ? invoice.createdAt.toDate() : new Date(invoice.createdAt);
            return invoiceDate >= filterDate;
          });
          break;
      }
    }

    setFilteredInvoices(filtered);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Draft' },
      generated: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Generated' },
      sent: { color: 'bg-green-100 text-green-800', icon: Send, label: 'Sent' },
      paid: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle, label: 'Paid' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  // View invoice details
  const viewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPreviewDialog(true);
  };

  // Print invoice in new window
  const printInvoice = (invoice) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) return;

    // Create the invoice preview content
    const invoiceContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>E-Invoice - ${invoice.invoiceNumber}</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { font-family: monospace; margin: 0; padding: 20px; background: white; }
            .invoice-container { max-width: 210mm; margin: 0 auto; }
            table { width: 100%; border-collapse: collapse; }
            td, th { border: 1px solid black; padding: 4px; font-size: 12px; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="text-center">
              <h1>INVOICE</h1>
              <h2>${systemSettings.companyInfo.name}</h2>
              <p>${systemSettings.companyInfo.address.street}, ${systemSettings.companyInfo.address.city}</p>
              <p>GSTIN: ${systemSettings.companyInfo.gstin}</p>
            </div>
            <br>
            <table>
              <tr>
                <td><strong>Invoice No:</strong> ${invoice.invoiceNumber}</td>
                <td><strong>Date:</strong> ${formatDate(invoice.invoiceDate)}</td>
              </tr>
              <tr>
                <td colspan="2"><strong>Customer:</strong> ${invoice.customerName}</td>
              </tr>
              <tr>
                <td colspan="2"><strong>GSTIN:</strong> ${invoice.customerGSTIN || 'N/A'}</td>
              </tr>
              <tr>
                <td colspan="2"><strong>Address:</strong> ${invoice.customerAddress || 'N/A'}</td>
              </tr>
            </table>
            <br>
            <table>
              <tr>
                <th>Sr</th>
                <th>Description</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
              ${(invoice.items || []).map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.productName}</td>
                  <td>${item.hsn}</td>
                  <td>${item.quantity} ${item.unit}</td>
                  <td>₹${item.rate}</td>
                  <td>₹${item.amount}</td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="5" class="text-right font-bold">Total:</td>
                <td class="font-bold">₹${invoice.grandTotal}</td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Edit invoice
  const editInvoice = (invoice) => {
    // Navigate to E-Invoice creation with pre-filled data
    // This would require passing the invoice data to the EInvoice component
    console.log('Edit invoice:', invoice.id);
    alert('Edit functionality will be implemented in the next update');
  };

  // Duplicate invoice
  const duplicateInvoice = (invoice) => {
    // Create a new invoice with same data but new number
    console.log('Duplicate invoice:', invoice.id);
    alert('Duplicate functionality will be implemented in the next update');
  };

  // Update invoice status
  const updateInvoiceStatus = async (invoice, newStatus) => {
    try {
      await einvoicesService.update(invoice.id, { status: newStatus });
      setEinvoices(prev => prev.map(inv =>
        inv.id === invoice.id ? { ...inv, status: newStatus } : inv
      ));
      alert(`E-Invoice status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating E-Invoice status:', error);
      alert('Error updating E-Invoice status');
    }
  };

  // Record payment for invoice
  const recordPayment = async () => {
    try {
      if (!selectedInvoice) {
        alert('No invoice selected');
        return;
      }

      if (!paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0) {
        alert('Please enter a valid payment amount');
        return;
      }

      const paymentAmountNum = parseFloat(paymentAmount);
      const invoiceTotal = selectedInvoice.grandTotal || 0;

      if (paymentAmountNum > invoiceTotal) {
        setOverpaymentData({
          paymentAmount: paymentAmountNum,
          invoiceTotal: invoiceTotal,
          paymentData: paymentData
        });
        setShowOverpaymentDialog(true);
        return;
      }

      const paymentData = {
        customerId: selectedInvoice.customerId,
        customerName: selectedInvoice.customerName,
        invoiceId: selectedInvoice.id,
        invoiceNumber: selectedInvoice.invoiceNumber,
        paymentAmount: parseFloat(paymentAmount),
        paymentMethod: paymentMethod,
        paymentDate: new Date(),
        referenceNumber: paymentReference,
        notes: `Payment for invoice ${selectedInvoice.invoiceNumber}`,
        createdBy: 'current-user-id'
      };

      await customerPaymentsService.add(paymentData);

      // Update invoice status if fully paid
      const totalPaid = parseFloat(paymentAmount);

      if (totalPaid >= invoiceTotal) {
        await updateInvoiceStatus(selectedInvoice, 'paid');
      }

      // Reset payment form
      setPaymentAmount('');
      setPaymentMethod('cash');
      setPaymentReference('');
      setShowPaymentDialog(false);

      alert('Payment recorded successfully');

      // Reload invoices to reflect changes
      loadEInvoices();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment');
    }
  };

  // Handle overpayment confirmation
  const handleOverpaymentConfirm = async () => {
    try {
      if (!overpaymentData) return;

      await customerPaymentsService.add(overpaymentData.paymentData);

      // Update invoice status if fully paid
      const totalPaid = overpaymentData.paymentAmount;
      const invoiceTotal = overpaymentData.invoiceTotal;

      if (totalPaid >= invoiceTotal) {
        await updateInvoiceStatus(selectedInvoice, 'paid');
      }

      // Reset payment form
      setPaymentAmount('');
      setPaymentMethod('cash');
      setPaymentReference('');
      setShowPaymentDialog(false);
      setShowOverpaymentDialog(false);
      setOverpaymentData(null);

      alert('Payment recorded successfully');

      // Reload invoices to reflect changes
      loadEInvoices();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment');
    }
  };

  // Delete invoice
  const deleteInvoice = async (invoice) => {
    try {
      await einvoicesService.delete(invoice.id);
      setEinvoices(prev => prev.filter(inv => inv.id !== invoice.id));
      setShowDeleteDialog(false);
      setInvoiceToDelete(null);
      alert('E-Invoice deleted successfully');
    } catch (error) {
      console.error('Error deleting E-Invoice:', error);
      alert('Error deleting E-Invoice');
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const total = filteredInvoices.length;
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const statusCounts = filteredInvoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      totalAmount,
      draft: statusCounts.draft || 0,
      generated: statusCounts.generated || 0,
      sent: statusCounts.sent || 0,
      paid: statusCounts.paid || 0,
      cancelled: statusCounts.cancelled || 0
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            E-Invoice History
          </h1>
          <p className="text-gray-600">
            {stats.total} invoices • {formatCurrency(stats.totalAmount)} total value
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={loadEInvoices} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => onNavigate('e-invoice')} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            New E-Invoice
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Invoices</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <div className="text-sm text-gray-600">Draft</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.generated}</div>
            <div className="text-sm text-gray-600">Generated</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            <div className="text-sm text-gray-600">Sent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.paid}</div>
            <div className="text-sm text-gray-600">Paid</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by invoice number, customer name, or GSTIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle>E-Invoice List</CardTitle>
          <CardDescription>
            {filteredInvoices.length} of {einvoices.length} invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Loading E-Invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">No E-Invoices found</p>
              <p className="text-sm text-gray-400">
                {einvoices.length === 0 ? 'Create your first E-Invoice to get started' : 'Try adjusting your search criteria'}
              </p>
              {einvoices.length === 0 && (
                <Button className="mt-4" onClick={() => onNavigate('e-invoice')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First E-Invoice
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="font-medium text-lg">{invoice.invoiceNumber}</div>
                        {getStatusBadge(invoice.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <User className="h-4 w-4" />
                            <span className="font-medium">Customer:</span>
                          </div>
                          <div>{invoice.customerName}</div>
                          {invoice.customerGSTIN && (
                            <div className="text-xs">GSTIN: {invoice.customerGSTIN}</div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">Date:</span>
                          </div>
                          <div>{formatDate(invoice.invoiceDate)}</div>
                          <div className="text-xs">Created: {formatDate(invoice.createdAt)}</div>
                        </div>

                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium">Amount:</span>
                          </div>
                          <div className="font-medium text-green-600">
                            {formatCurrency(invoice.grandTotal)}
                          </div>
                          <div className="text-xs">
                            {invoice.items?.length || 0} items
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Select
                        value={invoice.status}
                        onValueChange={(newStatus) => updateInvoiceStatus(invoice, newStatus)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="generated">Generated</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => printInvoice(invoice)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      {invoice.status !== 'paid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setPaymentAmount(invoice.grandTotal?.toString() || '');
                            setShowPaymentDialog(true);
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editInvoice(invoice)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateInvoice(invoice)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInvoiceToDelete(invoice);
                          setShowDeleteDialog(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>E-Invoice Preview</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoiceNumber} - {selectedInvoice?.customerName}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div id="printable-einvoice-preview">
                <InvoicePreview
                  sale={{
                    saleNumber: selectedInvoice.invoiceNumber,
                    saleDate: selectedInvoice.invoiceDate,
                    customerName: selectedInvoice.customerName,
                    customerGSTIN: selectedInvoice.customerGSTIN,
                    customerAddress: selectedInvoice.customerAddress,
                    customerPhone: selectedInvoice.customerPhone,
                    customerState: selectedInvoice.customerState,
                    customerStateCode: selectedInvoice.customerStateCode,
                    customerContactPerson: selectedInvoice.customerContactPerson,
                    placeOfSupply: selectedInvoice.placeOfSupply,
                    despatchThrough: selectedInvoice.despatchThrough,
                    destination: selectedInvoice.destination,
                    ewaybillNo: selectedInvoice.ewaybillNo,
                    ewaybillDate: selectedInvoice.ewaybillDate,
                    vehicleNo: selectedInvoice.vehicleNo,
                    otherRef: selectedInvoice.otherRef,
                    paymentMethod: selectedInvoice.paymentMethod,
                    supplyDateTime: selectedInvoice.supplyDateTime,
                    ackNo: selectedInvoice.ackNo,
                    ackDate: selectedInvoice.ackDate,
                    irn: selectedInvoice.irn,
                    items: selectedInvoice.items || [],
                    subtotal: selectedInvoice.subtotal,
                    tax: selectedInvoice.totalTax,
                    total: selectedInvoice.grandTotal,
                    roundOff: selectedInvoice.roundOff,
                    previousOutstanding: selectedInvoice.previousOutstanding || 0,
                    notes: selectedInvoice.notes
                  }}
                  settings={systemSettings}
                />
              </div>

              <div className="flex gap-2 justify-center border-t pt-4">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" onClick={() => editInvoice(selectedInvoice)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => duplicateInvoice(selectedInvoice)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete E-Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice {invoiceToDelete?.invoiceNumber}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteInvoice(invoiceToDelete)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Recording Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record payment for invoice {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Payment Amount</label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Reference Number (Optional)</label>
              <Input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Transaction ID, Cheque number, etc."
              />
            </div>

            {selectedInvoice && (
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm">
                  <div><strong>Invoice:</strong> {selectedInvoice.invoiceNumber}</div>
                  <div><strong>Customer:</strong> {selectedInvoice.customerName}</div>
                  <div><strong>Invoice Amount:</strong> ₹{selectedInvoice.grandTotal?.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={recordPayment} className="bg-green-600 hover:bg-green-700">
              <DollarSign className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overpayment Confirmation Dialog */}
      <Dialog open={showOverpaymentDialog} onOpenChange={setShowOverpaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Overpayment Warning</DialogTitle>
            <DialogDescription>
              The payment amount is greater than the invoice total.
            </DialogDescription>
          </DialogHeader>

          {overpaymentData && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm">
                  <div><strong>Payment Amount:</strong> ₹{overpaymentData.paymentAmount.toFixed(2)}</div>
                  <div><strong>Invoice Total:</strong> ₹{overpaymentData.invoiceTotal.toFixed(2)}</div>
                  <div><strong>Overpayment:</strong> ₹{(overpaymentData.paymentAmount - overpaymentData.invoiceTotal).toFixed(2)}</div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Do you want to continue with this payment? The overpayment will be recorded as a credit for the customer.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowOverpaymentDialog(false);
              setOverpaymentData(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleOverpaymentConfirm} className="bg-yellow-600 hover:bg-yellow-700">
              Continue Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EInvoiceHistory;
