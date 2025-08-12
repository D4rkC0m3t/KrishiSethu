import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
// import { suppliersService } from '../lib/firestore'; // Commented out for demo - using mock data

const Suppliers = ({ onNavigate }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Mock suppliers data
  useEffect(() => {
    const mockSuppliers = [
      {
        id: 'sup1',
        name: 'Tata Chemicals Ltd',
        contactPerson: 'Rajesh Kumar',
        phone: '+91-9876543210',
        email: 'rajesh@tatachemicals.com',
        address: 'Industrial Area, Phase 1',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        gstNumber: '27AAACT2727Q1ZZ',
        isActive: true,
        createdAt: new Date('2024-01-15'),
        totalPurchases: 15,
        totalAmount: 450000
      },
      {
        id: 'sup2',
        name: 'IFFCO Distributors',
        contactPerson: 'Suresh Patel',
        phone: '+91-9876543211',
        email: 'suresh@iffco.com',
        address: 'Fertilizer Complex',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380001',
        gstNumber: '24AAACI1681G1ZZ',
        isActive: true,
        createdAt: new Date('2024-02-10'),
        totalPurchases: 12,
        totalAmount: 320000
      },
      {
        id: 'sup3',
        name: 'Green Gold Organics',
        contactPerson: 'Priya Sharma',
        phone: '+91-9876543212',
        email: 'priya@greengold.com',
        address: 'Organic Farm Complex',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        gstNumber: '27AABCG1234Q1ZZ',
        isActive: true,
        createdAt: new Date('2024-03-05'),
        totalPurchases: 8,
        totalAmount: 180000
      },
      {
        id: 'sup4',
        name: 'Coromandel International',
        contactPerson: 'Amit Singh',
        phone: '+91-9876543213',
        email: 'amit@coromandel.com',
        address: 'Chemical Plant',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
        gstNumber: '36AABCC1234Q1ZZ',
        isActive: false,
        createdAt: new Date('2023-12-20'),
        totalPurchases: 5,
        totalAmount: 125000
      }
    ];
    setSuppliers(mockSuppliers);
    setFilteredSuppliers(mockSuppliers);
  }, []);

  // Filter suppliers based on search
  useEffect(() => {
    const filtered = suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone.includes(searchTerm)
    );
    setFilteredSuppliers(filtered);
  }, [searchTerm, suppliers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Supplier name is required';
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';

    // Phone validation
    if (formData.phone && !/^[+]?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // GST validation
    if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
      newErrors.gstNumber = 'Invalid GST number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gstNumber: ''
    });
    setErrors({});
  };

  const handleAdd = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      pincode: supplier.pincode,
      gstNumber: supplier.gstNumber || ''
    });
    setShowEditDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      if (selectedSupplier) {
        // Update existing supplier
        console.log('Updating supplier:', selectedSupplier.id, formData);
        // await suppliersService.update(selectedSupplier.id, formData);
        
        // Update local state for demo
        setSuppliers(prev => prev.map(supplier => 
          supplier.id === selectedSupplier.id 
            ? { ...supplier, ...formData, updatedAt: new Date() }
            : supplier
        ));
        
        setShowEditDialog(false);
        alert('Supplier updated successfully!');
      } else {
        // Add new supplier
        console.log('Adding new supplier:', formData);
        // const newId = await suppliersService.add(formData);
        
        // Add to local state for demo
        const newSupplier = {
          id: Date.now().toString(),
          ...formData,
          isActive: true,
          createdAt: new Date(),
          totalPurchases: 0,
          totalAmount: 0
        };
        
        setSuppliers(prev => [newSupplier, ...prev]);
        setShowAddDialog(false);
        alert('Supplier added successfully!');
      }
      
      resetForm();
      setSelectedSupplier(null);
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Error saving supplier. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (supplier) => {
    if (window.confirm(`Are you sure you want to delete ${supplier.name}?`)) {
      try {
        console.log('Deleting supplier:', supplier.id);
        // await suppliersService.delete(supplier.id);
        
        // Remove from local state for demo
        setSuppliers(prev => prev.filter(s => s.id !== supplier.id));
        alert('Supplier deleted successfully!');
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('Error deleting supplier. Please try again.');
      }
    }
  };

  const toggleSupplierStatus = async (supplier) => {
    try {
      const updatedSupplier = { ...supplier, isActive: !supplier.isActive };
      console.log('Toggling supplier status:', supplier.id, updatedSupplier.isActive);
      
      // Update local state for demo
      setSuppliers(prev => prev.map(s => 
        s.id === supplier.id ? updatedSupplier : s
      ));
      
      alert(`Supplier ${updatedSupplier.isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error updating supplier status:', error);
      alert('Error updating supplier status. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supplier Management</h1>
          <p className="text-gray-600">Manage your fertilizer suppliers</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700">
            ➕ Add Supplier
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
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-muted-foreground">registered suppliers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.filter(s => s.isActive).length}</div>
            <p className="text-xs text-muted-foreground">currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.reduce((sum, s) => sum + s.totalPurchases, 0)}</div>
            <p className="text-xs text-muted-foreground">purchase orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{suppliers.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">total purchased</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <Input
              placeholder="Search suppliers by name, contact person, city, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline">Filter</Button>
            <Button variant="outline">Export</Button>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Suppliers ({filteredSuppliers.length})</CardTitle>
          <CardDescription>
            All registered suppliers and their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Supplier</th>
                  <th className="text-left py-3 px-4">Contact</th>
                  <th className="text-left py-3 px-4">Location</th>
                  <th className="text-left py-3 px-4">Purchases</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-gray-500">{supplier.contactPerson}</div>
                        {supplier.gstNumber && (
                          <div className="text-xs text-gray-400">GST: {supplier.gstNumber}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div>{supplier.phone}</div>
                        {supplier.email && (
                          <div className="text-gray-500">{supplier.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div>{supplier.city}, {supplier.state}</div>
                        <div className="text-gray-500">{supplier.pincode}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="font-medium">{supplier.totalPurchases} orders</div>
                        <div className="text-gray-500">₹{supplier.totalAmount.toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        className={supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(supplier)}>
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleSupplierStatus(supplier)}
                          className={supplier.isActive ? 'text-red-600' : 'text-green-600'}
                        >
                          {supplier.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(supplier)}
                          className="text-red-600"
                        >
                          Delete
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

      {/* Add Supplier Dialog */}
      <SupplierDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        title="Add New Supplier"
        formData={formData}
        errors={errors}
        loading={loading}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowAddDialog(false);
          resetForm();
        }}
      />

      {/* Edit Supplier Dialog */}
      <SupplierDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title="Edit Supplier"
        formData={formData}
        errors={errors}
        loading={loading}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowEditDialog(false);
          resetForm();
          setSelectedSupplier(null);
        }}
      />
    </div>
  );
};

// Supplier Dialog Component
const SupplierDialog = ({ open, onOpenChange, title, formData, errors, loading, onChange, onSubmit, onCancel }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Fill in the supplier details below
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Supplier Name *</label>
              <Input
                name="name"
                value={formData.name}
                onChange={onChange}
                placeholder="Enter supplier name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Person *</label>
              <Input
                name="contactPerson"
                value={formData.contactPerson}
                onChange={onChange}
                placeholder="Enter contact person name"
                className={errors.contactPerson ? 'border-red-500' : ''}
              />
              {errors.contactPerson && <span className="text-red-500 text-sm">{errors.contactPerson}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number *</label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={onChange}
                placeholder="Enter phone number"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && <span className="text-red-500 text-sm">{errors.phone}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={onChange}
                placeholder="Enter email address"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Address *</label>
              <Input
                name="address"
                value={formData.address}
                onChange={onChange}
                placeholder="Enter full address"
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && <span className="text-red-500 text-sm">{errors.address}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">City *</label>
              <Input
                name="city"
                value={formData.city}
                onChange={onChange}
                placeholder="Enter city"
                className={errors.city ? 'border-red-500' : ''}
              />
              {errors.city && <span className="text-red-500 text-sm">{errors.city}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">State *</label>
              <Input
                name="state"
                value={formData.state}
                onChange={onChange}
                placeholder="Enter state"
                className={errors.state ? 'border-red-500' : ''}
              />
              {errors.state && <span className="text-red-500 text-sm">{errors.state}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Pincode *</label>
              <Input
                name="pincode"
                value={formData.pincode}
                onChange={onChange}
                placeholder="Enter pincode"
                className={errors.pincode ? 'border-red-500' : ''}
              />
              {errors.pincode && <span className="text-red-500 text-sm">{errors.pincode}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">GST Number</label>
              <Input
                name="gstNumber"
                value={formData.gstNumber}
                onChange={onChange}
                placeholder="Enter GST number"
                className={errors.gstNumber ? 'border-red-500' : ''}
              />
              {errors.gstNumber && <span className="text-red-500 text-sm">{errors.gstNumber}</span>}
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? 'Saving...' : 'Save Supplier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Suppliers;
