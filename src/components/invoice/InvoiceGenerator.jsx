import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import InvoiceTemplate from './InvoiceTemplate';
import { invoiceService } from '../../lib/invoice';
import { customersService, salesService } from '../../lib/firestore';
import { 
  FileText, 
  Download, 
  Printer, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Calculator,
  User,
  Package,
  Loader2,
  AlertTriangle
} from 'lucide-react';

const InvoiceGenerator = ({ onNavigate, saleId = null }) => {
  const [invoiceData, setInvoiceData] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customer: {
      name: '',
      address: '',
      phone: '',
      email: '',
      gst: ''
    },
    items: [
      {
        description: '',
        hsn: '',
        quantity: 1,
        unit: 'Nos',
        rate: 0
      }
    ],
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'Cash',
    notes: invoiceService.getInvoiceSettings().notes,
    terms: invoiceService.getInvoiceSettings().paymentTerms
  });

  useEffect(() => {
    loadCustomers();
    if (saleId) {
      loadSaleData(saleId);
    }
  }, [saleId]);

  const loadCustomers = async () => {
    try {
      const customersList = await customersService.getAll();
      setCustomers(customersList);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadSaleData = async (saleId) => {
    try {
      setLoading(true);
      const saleData = await salesService.getById(saleId);
      if (saleData) {
        // Find customer data
        const customer = customers.find(c => c.name === saleData.customerName) || {
          name: saleData.customerName || 'Walk-in Customer',
          address: 'Customer Address',
          phone: saleData.customerPhone || '',
          email: saleData.customerEmail || '',
          gst: ''
        };

        const invoice = invoiceService.createInvoiceFromSale(saleData, customer);
        setInvoiceData(invoice);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error loading sale data:', error);
      setError('Failed to load sale data');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer: {
          name: customer.name,
          address: customer.address || '',
          phone: customer.phone || '',
          email: customer.email || '',
          gst: customer.gst || ''
        }
      }));
    }
  };

  const handleCustomerChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: value
      }
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: '',
          hsn: '',
          quantity: 1,
          unit: 'Nos',
          rate: 0
        }
      ]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  const generateInvoice = () => {
    try {
      const invoice = invoiceService.createCustomInvoice({
        customer: formData.customer,
        items: formData.items,
        invoiceDate: new Date(formData.invoiceDate),
        dueDate: new Date(formData.dueDate),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        terms: formData.terms
      });
      
      setInvoiceData(invoice);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating invoice:', error);
      setError('Failed to generate invoice');
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceData) return;
    
    try {
      setLoading(true);
      const element = document.getElementById('invoice-content');
      await invoiceService.generateInvoicePDF(element, invoiceData.invoiceNumber);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!invoiceData) return;
    
    try {
      invoiceService.printInvoice('invoice-content');
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert('Failed to print invoice. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading invoice data...</p>
        </div>
      </div>
    );
  }

  if (showPreview && invoiceData) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Action Bar */}
        <div className="no-print bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Editor
            </Button>
            
            <div className="flex gap-3">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                onClick={handleDownloadPDF}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Invoice Preview */}
        <InvoiceTemplate invoiceData={invoiceData} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Generator</h1>
            <p className="text-gray-600">Create professional invoices for your sales</p>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
            <CardDescription>Enter customer details for the invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customer-select">Select Existing Customer</Label>
              <Select onValueChange={handleCustomerSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-name">Customer Name *</Label>
                <Input
                  id="customer-name"
                  value={formData.customer.name}
                  onChange={(e) => handleCustomerChange('name', e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  value={formData.customer.phone}
                  onChange={(e) => handleCustomerChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customer-address">Address</Label>
              <Textarea
                id="customer-address"
                value={formData.customer.address}
                onChange={(e) => handleCustomerChange('address', e.target.value)}
                placeholder="Enter customer address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={formData.customer.email}
                  onChange={(e) => handleCustomerChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="customer-gst">GST Number</Label>
                <Input
                  id="customer-gst"
                  value={formData.customer.gst}
                  onChange={(e) => handleCustomerChange('gst', e.target.value)}
                  placeholder="Enter GST number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Details
            </CardTitle>
            <CardDescription>Set invoice dates and payment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoice-date">Invoice Date</Label>
                <Input
                  id="invoice-date"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="due-date">Due Date</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select 
                value={formData.paymentMethod} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes for the invoice"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                placeholder="Payment terms and conditions"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Section */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Invoice Items
              </CardTitle>
              <CardDescription>Add products or services to the invoice</CardDescription>
            </div>
            <Button onClick={addItem} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="md:col-span-2">
                  <Label>Description *</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Product/Service description"
                  />
                </div>
                <div>
                  <Label>HSN Code</Label>
                  <Input
                    value={item.hsn}
                    onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                    placeholder="HSN"
                  />
                </div>
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select 
                    value={item.unit} 
                    onValueChange={(value) => handleItemChange(index, 'unit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nos">Nos</SelectItem>
                      <SelectItem value="Kg">Kg</SelectItem>
                      <SelectItem value="Ltr">Ltr</SelectItem>
                      <SelectItem value="Mtr">Mtr</SelectItem>
                      <SelectItem value="Box">Box</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rate *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-end">
                  {formData.items.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={generateInvoice} className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Generate Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceGenerator;
