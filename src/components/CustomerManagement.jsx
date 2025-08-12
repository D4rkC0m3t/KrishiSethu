import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

const CustomerManagement = ({ onNavigate }) => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    pincode: '',
    creditLimit: '',
    notes: ''
  });

  // Load mock customers data
  useEffect(() => {
    const mockCustomers = [
      {
        id: 'cust1',
        name: 'Rajesh Kumar',
        phone: '+91-9876543210',
        email: 'rajesh@email.com',
        address: '123 Farm Road, Village Khetpur',
        city: 'Khetpur',
        pincode: '123456',
        creditLimit: 50000,
        currentCredit: 15000,
        totalPurchases: 125000,
        lastPurchase: '2024-01-20',
        status: 'Active',
        joinDate: '2023-06-15',
        purchaseHistory: [
          { date: '2024-01-20', amount: 5000, items: 'NPK Fertilizer, Urea' },
          { date: '2024-01-10', amount: 3500, items: 'Organic Compost' },
          { date: '2023-12-25', amount: 7500, items: 'Bio Fertilizer Mix' }
        ]
      },
      {
        id: 'cust2',
        name: 'Priya Sharma',
        phone: '+91-9876543211',
        email: 'priya@email.com',
        address: '456 Green Valley, Sector 12',
        city: 'Farmville',
        pincode: '654321',
        creditLimit: 30000,
        currentCredit: 5000,
        totalPurchases: 85000,
        lastPurchase: '2024-01-18',
        status: 'Active',
        joinDate: '2023-08-20',
        purchaseHistory: [
          { date: '2024-01-18', amount: 4200, items: 'Chemical Fertilizer' },
          { date: '2024-01-05', amount: 2800, items: 'Seeds, Pesticides' }
        ]
      },
      {
        id: 'cust3',
        name: 'Amit Patel',
        phone: '+91-9876543212',
        email: 'amit@email.com',
        address: '789 Agriculture Lane',
        city: 'Croptown',
        pincode: '789012',
        creditLimit: 75000,
        currentCredit: 45000,
        totalPurchases: 200000,
        lastPurchase: '2024-01-15',
        status: 'VIP',
        joinDate: '2023-03-10',
        purchaseHistory: [
          { date: '2024-01-15', amount: 12000, items: 'Bulk NPK Order' },
          { date: '2024-01-01', amount: 8500, items: 'Organic Fertilizers' }
        ]
      }
    ];

    setCustomers(mockCustomers);
    setFilteredCustomers(mockCustomers);
  }, []);

  // Filter customers based on search
  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.name.trim() || !formData.phone.trim()) {
        alert('Please fill in required fields (Name and Phone)');
        return;
      }

      const newCustomer = {
        id: Date.now().toString(),
        ...formData,
        creditLimit: parseFloat(formData.creditLimit) || 0,
        currentCredit: 0,
        totalPurchases: 0,
        lastPurchase: null,
        status: 'Active',
        joinDate: new Date().toISOString().split('T')[0],
        purchaseHistory: []
      };

      setCustomers(prev => [newCustomer, ...prev]);
      
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        pincode: '',
        creditLimit: '',
        notes: ''
      });

      setShowAddDialog(false);
      alert('Customer added successfully!');
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Error adding customer');
    }
  };

  const handleCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsDialog(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Active': 'default',
      'VIP': 'secondary',
      'Inactive': 'outline'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getCreditStatus = (customer) => {
    const utilization = (customer.currentCredit / customer.creditLimit) * 100;
    if (utilization > 80) return { color: 'text-red-600', status: 'High' };
    if (utilization > 50) return { color: 'text-yellow-600', status: 'Medium' };
    return { color: 'text-green-600', status: 'Low' };
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'Active').length;
  const vipCustomers = customers.filter(c => c.status === 'VIP').length;
  const totalCreditOutstanding = customers.reduce((sum, c) => sum + c.currentCredit, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Management</h2>
          <p className="text-muted-foreground">Manage customer relationships and credit accounts</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => onNavigate('pos')}>
            🧾 POS System
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>➕ Add Customer</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>Create a new customer account</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    name="address"
                    placeholder="Full address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
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
                    <label className="text-sm font-medium">Pincode</label>
                    <Input
                      name="pincode"
                      placeholder="123456"
                      value={formData.pincode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

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
                  <Button type="submit">Add Customer</Button>
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
            <div className="text-2xl font-bold">₹{totalCreditOutstanding.toLocaleString()}</div>
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

          <div className="space-y-4">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No customers found</p>
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
                        📍 {customer.city} • 💰 Total Purchases: ₹{customer.totalPurchases.toLocaleString()}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm">
                          Credit: ₹{customer.currentCredit.toLocaleString()} / ₹{customer.creditLimit.toLocaleString()}
                        </span>
                        <span className={`text-sm ${creditStatus.color}`}>
                          {creditStatus.status} Usage
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCustomerDetails(customer)}
                      >
                        View Details
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
                    <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
                    <p><strong>Email:</strong> {selectedCustomer.email || 'Not provided'}</p>
                    <p><strong>Address:</strong> {
                      typeof selectedCustomer.address === 'string'
                        ? selectedCustomer.address
                        : selectedCustomer.address
                          ? `${selectedCustomer.address.street || ''}, ${selectedCustomer.address.city || ''}, ${selectedCustomer.address.state || ''} ${selectedCustomer.address.pincode || ''}`.replace(/^,\s*|,\s*$/, '').replace(/,\s*,/g, ',')
                          : 'Not provided'
                    }</p>
                    <p><strong>City:</strong> {selectedCustomer.city}</p>
                    <p><strong>Pincode:</strong> {selectedCustomer.pincode}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Account Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Status:</strong> {getStatusBadge(selectedCustomer.status)}</p>
                    <p><strong>Join Date:</strong> {new Date(selectedCustomer.joinDate).toLocaleDateString()}</p>
                    <p><strong>Credit Limit:</strong> ₹{selectedCustomer.creditLimit.toLocaleString()}</p>
                    <p><strong>Current Credit:</strong> ₹{selectedCustomer.currentCredit.toLocaleString()}</p>
                    <p><strong>Available Credit:</strong> ₹{(selectedCustomer.creditLimit - selectedCustomer.currentCredit).toLocaleString()}</p>
                    <p><strong>Total Purchases:</strong> ₹{selectedCustomer.totalPurchases.toLocaleString()}</p>
                    <p><strong>Last Purchase:</strong> {selectedCustomer.lastPurchase ? new Date(selectedCustomer.lastPurchase).toLocaleDateString() : 'Never'}</p>
                  </div>
                </div>
              </div>

              {/* Purchase History */}
              <div>
                <h4 className="font-medium mb-2">Recent Purchase History</h4>
                <div className="space-y-2">
                  {selectedCustomer.purchaseHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No purchase history available</p>
                  ) : (
                    selectedCustomer.purchaseHistory.map((purchase, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">₹{purchase.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{purchase.items}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(purchase.date).toLocaleDateString()}
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
    </div>
  );
};

export default CustomerManagement;
