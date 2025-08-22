import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import smartCustomerService, { customerServiceV2 } from '../services/customerServiceV2';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { useDebouncedSearch, usePerformanceMonitor } from '../hooks/usePerformance';
import {
  Users,
  UserPlus,
  Edit,
  Eye,
  Trash2,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

const CustomerManagement = ({ onNavigate }) => {
  const [customers, setCustomers] = useState([]);
  const { searchTerm, debouncedSearchTerm, setSearchTerm } = useDebouncedSearch('', 300);
  const { measureAsync } = usePerformanceMonitor('CustomerManagement');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    gstNumber: '',
    creditLimit: '',
    outstandingAmount: '',
    totalPurchases: '',
    isActive: true
  });

  // Load customers from database
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading customers...');

      // Force use of V2 service to ensure JSONB address handling
      const firebaseCustomers = await customerServiceV2.getAllCustomers();
      console.log('✅ Loaded customers:', firebaseCustomers?.length || 0);

      if (firebaseCustomers && firebaseCustomers.length > 0) {
        console.log('📋 Setting customers from database');
        setCustomers(firebaseCustomers);
      } else {
        console.log('📝 No customers found, creating sample data...');
        // If no customers exist, create some sample data
        await createSampleCustomers();
      }
    } catch (error) {
      console.error('❌ Error loading customers:', error);
      setError('Failed to load customers. Please try again.');
      // Fallback to empty array
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array to prevent infinite loops

  // Create sample customers for demo
  const createSampleCustomers = useCallback(async () => {
    const sampleCustomers = [
      {
        name: 'Rajesh Kumar',
        phone: '+91-9876543210',
        email: 'rajesh@email.com',
        address: {
          street: '123 Farm Road, Village Khetpur',
          city: 'Khetpur',
          state: 'Uttar Pradesh',
          pincode: '123456',
          country: 'India'
        },
        creditLimit: 50000,
        outstandingAmount: 15000,
        totalPurchases: 125000,
        isActive: true
      },
      {
        name: 'Priya Sharma',
        phone: '+91-9876543211',
        email: 'priya@email.com',
        address: {
          street: '456 Green Valley, Sector 12',
          city: 'Farmville',
          state: 'Maharashtra',
          pincode: '654321',
          country: 'India'
        },
        creditLimit: 30000,
        outstandingAmount: 5000,
        totalPurchases: 85000,
        isActive: true
      },
      {
        name: 'Amit Patel',
        phone: '+91-9876543212',
        email: 'amit@email.com',
        address: {
          street: '789 Agriculture Lane',
          city: 'Croptown',
          state: 'Gujarat',
          pincode: '789012',
          country: 'India'
        },
        creditLimit: 75000,
        outstandingAmount: 45000,
        totalPurchases: 200000,
        isActive: true
      }
    ];

    try {
      console.log('🔄 Creating sample customers...');
      const createdCustomers = [];

      for (const customer of sampleCustomers) {
        try {
          const created = await smartCustomerService.createCustomer(customer);
          createdCustomers.push(created);
          console.log('✅ Created customer:', created.name);
        } catch (error) {
          console.error('❌ Failed to create customer:', customer.name, error);
        }
      }

      // Set customers directly instead of reloading
      if (createdCustomers.length > 0) {
        console.log('📋 Setting sample customers:', createdCustomers.length);
        setCustomers(createdCustomers);
      }
    } catch (error) {
      console.error('❌ Error creating sample customers:', error);
      setCustomers([]); // Set empty array on error
    }
  }, []); // Empty dependency array

  useEffect(() => {
    // Load customers on component mount
    loadCustomers();
  }, []); // Empty dependency array - only run once on mount

  // Memoized filtered customers for performance
  const filteredCustomers = useMemo(() => {
    if (!debouncedSearchTerm) return customers;

    const searchLower = debouncedSearchTerm.toLowerCase();
    return customers.filter(customer => {
      // Safe string checks with fallbacks
      const name = (customer.name || '').toLowerCase();
      const phone = customer.phone || '';
      const email = (customer.email || '').toLowerCase();

      // Handle address object or string
      let city = '';
      if (customer.address && typeof customer.address === 'object') {
        city = (customer.address.city || '').toLowerCase();
      } else if (customer.city) {
        city = (customer.city || '').toLowerCase();
      }

      return (
        name.includes(searchLower) ||
        phone.includes(debouncedSearchTerm) ||
        email.includes(searchLower) ||
        city.includes(searchLower)
      );
    });
  }, [debouncedSearchTerm, customers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      if (!formData.name.trim() || !formData.phone.trim()) {
        alert('Please fill in required fields (Name and Phone)');
        return;
      }

      // Format data to match database schema
      const newCustomer = {
        name: formData.name?.trim(),
        phone: formData.phone?.trim(),
        email: formData.email?.trim() || null,

        // Create address object for JSONB field
        address: {
          street: formData.address?.trim() || '',
          city: formData.city?.trim() || '',
          state: formData.state?.trim() || '',
          pincode: formData.pincode?.trim() || '',
          country: 'India'
        },

        // Map to database field names
        creditLimit: parseFloat(formData.creditLimit) || 0,
        outstandingAmount: 0,
        totalPurchases: 0,
        isActive: true

        // Note: 'notes' field removed as it doesn't exist in database schema
      };

      // Save to database
      console.log('🔄 Creating customer with data:', newCustomer);
      console.log('🏁 Feature flag USE_NEW_CUSTOMER_ADDRESS:', FEATURE_FLAGS.USE_NEW_CUSTOMER_ADDRESS);

      // Force use of V2 service to ensure JSONB address handling
      const createdCustomer = await customerServiceV2.createCustomer(newCustomer);
      console.log('✅ Customer created successfully:', createdCustomer);

      // Refresh the customer list
      await loadCustomers();

      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        gstNumber: '',
        creditLimit: '',
        outstandingAmount: '',
        totalPurchases: '',
        isActive: true
      });

      setShowAddDialog(false);
      alert('Customer added successfully!');
    } catch (error) {
      console.error('❌ Error adding customer:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      // More specific error messages
      let errorMessage = 'Failed to add customer. ';
      if (error.message?.includes('duplicate key')) {
        errorMessage += 'A customer with this phone number already exists.';
      } else if (error.message?.includes('violates check constraint')) {
        errorMessage += 'Invalid data provided.';
      } else if (error.message?.includes('not-null constraint')) {
        errorMessage += 'Required fields are missing.';
      } else {
        errorMessage += `Error: ${error.message || 'Unknown error'}`;
      }

      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Force use of V2 service to ensure JSONB address handling
      await customerServiceV2.deleteCustomer(customerId);
      console.log('Customer deleted:', customerId);

      // Refresh the customer list
      await loadCustomers();
      alert('Customer deleted successfully!');
    } catch (error) {
      console.error('Error deleting customer:', error);
      setError('Failed to delete customer. Please try again.');
      alert('Error deleting customer');
    } finally {
      setSaving(false);
    }
  };

  const handleCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsDialog(true);
  };

  const handleEditCustomer = (customer) => {
    console.log('📝 Editing customer:', customer);
    console.log('📋 Customer data structure:', {
      keys: Object.keys(customer),
      address: customer.address,
      addressType: typeof customer.address
    });

    setCustomerToEdit(customer);

    // Populate form with ALL customer data fields
    const addressData = customer.address || {};
    const isAddressObject = typeof addressData === 'object' && addressData !== null;

    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: isAddressObject ? (addressData.street || '') : (typeof addressData === 'string' ? addressData : ''),
      city: isAddressObject ? (addressData.city || '') : '',
      state: isAddressObject ? (addressData.state || '') : '',
      pincode: isAddressObject ? (addressData.pincode || '') : '',
      country: isAddressObject ? (addressData.country || 'India') : 'India',
      gstNumber: customer.gstNumber || customer.gst_number || '',
      creditLimit: customer.creditLimit || customer.credit_limit || '',
      outstandingAmount: customer.outstandingAmount || customer.outstanding_amount || '',
      totalPurchases: customer.totalPurchases || customer.total_purchases || '',
      isActive: customer.isActive !== false && customer.is_active !== false
    });

    console.log('📝 Form populated with data:', formData);
    setShowEditDialog(true);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();

    if (!customerToEdit) return;

    try {
      setSaving(true);
      setError(null);

      if (!formData.name.trim() || !formData.phone.trim()) {
        alert('Please fill in required fields (Name and Phone)');
        return;
      }

      console.log('🔄 Updating customer:', customerToEdit.id, 'with data:', formData);
      console.log('🏁 Feature flag USE_NEW_CUSTOMER_ADDRESS:', FEATURE_FLAGS.USE_NEW_CUSTOMER_ADDRESS);

      // Force use of V2 service to ensure JSONB address handling
      await customerServiceV2.updateCustomer(customerToEdit.id, formData);
      console.log('✅ Customer updated successfully');

      // Refresh the customer list
      await loadCustomers();

      // Reset form and close dialog
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        gstNumber: '',
        creditLimit: '',
        outstandingAmount: '',
        totalPurchases: '',
        isActive: true
      });

      setCustomerToEdit(null);
      setShowEditDialog(false);
      alert('Customer updated successfully!');
    } catch (error) {
      console.error('❌ Error updating customer:', error);
      setError('Failed to update customer. Please try again.');
      alert('Error updating customer: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const safeStatus = status || 'Active'; // Default to 'Active' if undefined
    const variants = {
      'Active': 'default',
      'VIP': 'secondary',
      'Inactive': 'outline'
    };
    return <Badge variant={variants[safeStatus] || 'default'}>{safeStatus}</Badge>;
  };

  const getCreditStatus = (customer) => {
    // Use outstandingAmount instead of currentCredit to match database schema
    const currentCredit = customer.outstandingAmount || customer.currentCredit || 0;
    const creditLimit = customer.creditLimit || 0;
    if (creditLimit === 0) return { color: 'text-gray-600', status: 'No Limit' };

    const utilization = (currentCredit / creditLimit) * 100;
    if (utilization > 80) return { color: 'text-red-600', status: 'High' };
    if (utilization > 50) return { color: 'text-yellow-600', status: 'Medium' };
    return { color: 'text-green-600', status: 'Low' };
  };

  // Helper function to safely format numbers
  const formatNumber = (value) => {
    const num = Number(value) || 0;
    return num.toLocaleString();
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => (c.status || 'Active') === 'Active').length;
  const vipCustomers = customers.filter(c => (c.status || '') === 'VIP').length;
  const totalCreditOutstanding = customers.reduce((sum, c) => sum + (Number(c.outstandingAmount) || 0), 0);

  return (
    <div className="space-y-6 p-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground mt-2">Customer Management</h2>
          <p className="text-muted-foreground">Manage customer relationships and credit accounts</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadCustomers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => onNavigate('pos')}>
            <Users className="h-4 w-4 mr-2" />
            POS System
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>Create a new customer account</DialogDescription>
              </DialogHeader>

              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Basic Information Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name *</label>
                    <Input
                      name="name"
                      placeholder="Customer name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone *</label>
                    <Input
                      name="phone"
                      placeholder="+91-9876543210"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Contact Information Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="customer@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">GST Number</label>
                    <Input
                      name="gstNumber"
                      placeholder="29ABCDE1234F1Z5"
                      value={formData.gstNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    name="address"
                    placeholder="Street address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Location Row */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-sm font-medium">City</label>
                    <Input
                      name="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">State</label>
                    <Input
                      name="state"
                      placeholder="State"
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Pincode</label>
                    <Input
                      name="pincode"
                      placeholder="123456"
                      value={formData.pincode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Financial Information Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Credit Limit (₹)</label>
                    <Input
                      name="creditLimit"
                      type="number"
                      placeholder="50000"
                      value={formData.creditLimit}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="isActiveAdd"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="isActiveAdd" className="text-sm font-medium">Active Customer</label>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Add Customer
                      </>
                    )}
                  </Button>
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
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Registered customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
            <span className="text-2xl">⭐</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vipCustomers}</div>
            <p className="text-xs text-muted-foreground">Premium customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Outstanding</CardTitle>
            <span className="text-2xl">💳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{formatNumber(totalCreditOutstanding)}</div>
            <p className="text-xs text-muted-foreground">Total credit used</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>Search and manage customer accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search customers by name, phone, email, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md mb-4">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
              <Button variant="outline" size="sm" onClick={loadCustomers} className="ml-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-muted-foreground">Loading customers...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No customers found</p>
                <p className="text-sm">Try adjusting your search or add a new customer</p>
              </div>
            ) : (
              filteredCustomers.map((customer) => {
                const creditStatus = getCreditStatus(customer);
                return (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{customer.name}</h4>
                        {getStatusBadge(customer.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        📞 {customer.phone} • 📧 {customer.email || 'No email'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        📍 {
                          customer.address && typeof customer.address === 'object'
                            ? (customer.address.city || 'Unknown')
                            : (customer.city || 'Unknown')
                        } • 💰 Total Purchases: ₹{formatNumber(customer.totalPurchases)}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm">
                          Credit: ₹{formatNumber(customer.outstandingAmount || customer.currentCredit)} / ₹{formatNumber(customer.creditLimit)}
                        </span>
                        <span className={`text-sm ${creditStatus.color}`}>
                          {creditStatus.status} Usage
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCustomerDetails(customer)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditCustomer(customer)}
                        title="Edit Customer"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCustomer(customer.id)}
                        disabled={saving}
                        className="text-red-600 hover:text-red-700"
                        title="Delete Customer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>Complete customer information and purchase history</DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {selectedCustomer.name}</p>
                    <p><strong>Phone:</strong> {selectedCustomer.phone || 'Not provided'}</p>
                    <p><strong>Email:</strong> {selectedCustomer.email || 'Not provided'}</p>
                    <p><strong>GST Number:</strong> {selectedCustomer.gstNumber || selectedCustomer.gst_number || 'Not provided'}</p>
                    <p><strong>Address:</strong> {
                      typeof selectedCustomer.address === 'string'
                        ? selectedCustomer.address
                        : selectedCustomer.address
                          ? `${selectedCustomer.address.street || ''}, ${selectedCustomer.address.city || ''}, ${selectedCustomer.address.state || ''} ${selectedCustomer.address.pincode || ''}`.replace(/^,\s*|,\s*$/, '').replace(/,\s*,/g, ',')
                          : 'Not provided'
                    }</p>
                    {selectedCustomer.address && typeof selectedCustomer.address === 'object' && (
                      <>
                        <p><strong>City:</strong> {selectedCustomer.address.city || 'Not provided'}</p>
                        <p><strong>State:</strong> {selectedCustomer.address.state || 'Not provided'}</p>
                        <p><strong>Pincode:</strong> {selectedCustomer.address.pincode || 'Not provided'}</p>
                        <p><strong>Country:</strong> {selectedCustomer.address.country || 'India'}</p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Account Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Status:</strong> {
                      (selectedCustomer.isActive !== false && selectedCustomer.is_active !== false)
                        ? <Badge className="bg-green-100 text-green-800">Active</Badge>
                        : <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                    }</p>
                    <p><strong>Customer ID:</strong> {selectedCustomer.id}</p>
                    <p><strong>Created:</strong> {
                      selectedCustomer.createdAt || selectedCustomer.created_at
                        ? new Date(selectedCustomer.createdAt || selectedCustomer.created_at).toLocaleDateString()
                        : 'Unknown'
                    }</p>
                    <p><strong>Last Updated:</strong> {
                      selectedCustomer.updatedAt || selectedCustomer.updated_at
                        ? new Date(selectedCustomer.updatedAt || selectedCustomer.updated_at).toLocaleDateString()
                        : 'Unknown'
                    }</p>
                    <p><strong>Credit Limit:</strong> ₹{formatNumber(selectedCustomer.creditLimit || selectedCustomer.credit_limit || 0)}</p>
                    <p><strong>Outstanding Amount:</strong> ₹{formatNumber(selectedCustomer.outstandingAmount || selectedCustomer.outstanding_amount || 0)}</p>
                    <p><strong>Total Purchases:</strong> ₹{formatNumber(selectedCustomer.totalPurchases || selectedCustomer.total_purchases || 0)}</p>
                    <p><strong>Available Credit:</strong> ₹{formatNumber(
                      (Number(selectedCustomer.creditLimit || selectedCustomer.credit_limit) || 0) -
                      (Number(selectedCustomer.outstandingAmount || selectedCustomer.outstanding_amount) || 0)
                    )}</p>
                  </div>
                </div>
              </div>

              {/* Purchase History */}
              <div>
                <h4 className="font-medium mb-2">Recent Purchase History</h4>
                <div className="space-y-2">
                  {!selectedCustomer.purchaseHistory || selectedCustomer.purchaseHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No purchase history available</p>
                  ) : (
                    selectedCustomer.purchaseHistory.map((purchase, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">₹{formatNumber(purchase.amount)}</p>
                          <p className="text-xs text-muted-foreground">{purchase.items || 'No items listed'}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {purchase.date ? new Date(purchase.date).toLocaleDateString() : 'Unknown date'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowDetailsDialog(false);
              onNavigate('pos');
            }}>
              Create Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer information</DialogDescription>
          </DialogHeader>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleUpdateCustomer} className="space-y-4">
            {/* Basic Information Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  name="name"
                  placeholder="Customer name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone *</label>
                <Input
                  name="phone"
                  placeholder="+91-9876543210"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Contact Information Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  name="email"
                  type="email"
                  placeholder="customer@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium">GST Number</label>
                <Input
                  name="gstNumber"
                  placeholder="29ABCDE1234F1Z5"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Address Information */}
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input
                name="address"
                placeholder="Street address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>

            {/* Location Row */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-sm font-medium">City</label>
                <Input
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium">State</label>
                <Input
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Pincode</label>
                <Input
                  name="pincode"
                  placeholder="400001"
                  value={formData.pincode}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Financial Information Row */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Credit Limit (₹)</label>
                <Input
                  name="creditLimit"
                  type="number"
                  placeholder="50000"
                  value={formData.creditLimit}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Outstanding (₹)</label>
                <Input
                  name="outstandingAmount"
                  type="number"
                  placeholder="0"
                  value={formData.outstandingAmount}
                  onChange={handleInputChange}
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm font-medium">Total Purchases (₹)</label>
                <Input
                  name="totalPurchases"
                  type="number"
                  placeholder="0"
                  value={formData.totalPurchases}
                  onChange={handleInputChange}
                  readOnly
                />
              </div>
            </div>

            {/* Status Row */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium">Active Customer</label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Update Customer
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerManagement;
