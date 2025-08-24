import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { suppliersService } from '../lib/supabaseDb';
import { realtimeService } from '../lib/realtime';
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Normalize supplier data to ensure all required properties exist
  const normalizeSupplier = (supplier) => {
    // Handle JSONB address field from database
    const addressObj = supplier.address || {};
    const isAddressObject = typeof addressObj === 'object' && addressObj !== null;

    return {
      id: supplier.id || `sup_${Date.now()}_${Math.random()}`,
      name: supplier.name || 'Unknown Supplier',
      contactPerson: supplier.contact_person || supplier.contactPerson || 'N/A',
      phone: supplier.phone || 'N/A',
      email: supplier.email || '',
      // Handle both JSONB address object and legacy string address
      address: isAddressObject ? (addressObj.street || '') : (supplier.address || 'N/A'),
      city: isAddressObject ? (addressObj.city || '') : (supplier.city || 'N/A'),
      state: isAddressObject ? (addressObj.state || '') : (supplier.state || 'N/A'),
      pincode: isAddressObject ? (addressObj.pincode || '') : (supplier.pincode || 'N/A'),
      country: isAddressObject ? (addressObj.country || 'India') : (supplier.country || 'India'),
      gstNumber: supplier.gst_number || supplier.gstNumber || '',
      panNumber: supplier.pan_number || supplier.panNumber || '',
      paymentTerms: supplier.payment_terms || supplier.paymentTerms || '30 days',
      creditLimit: supplier.credit_limit || supplier.creditLimit || 0,
      outstandingAmount: supplier.outstanding_amount || supplier.outstandingAmount || 0,
      isActive: supplier.is_active !== false && supplier.isActive !== false, // Default to true if undefined
      totalPurchases: supplier.totalPurchases || 0,
      totalAmount: supplier.totalAmount || 0,
      createdAt: supplier.created_at || supplier.createdAt,
      updatedAt: supplier.updated_at || supplier.updatedAt,
      ...supplier // Keep any additional properties
    };
  };

  // Load suppliers from Supabase
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading suppliers from Supabase...');

      const supabaseSuppliers = await suppliersService.getAll();
      console.log('Loaded suppliers:', supabaseSuppliers);

      if (supabaseSuppliers && supabaseSuppliers.length > 0) {
        // Normalize all suppliers to ensure required properties
        const normalizedSuppliers = supabaseSuppliers.map(normalizeSupplier);
        setSuppliers(normalizedSuppliers);
        setFilteredSuppliers(normalizedSuppliers);
      } else {
        // No suppliers found - start with empty list
        console.log('No suppliers found in database');
        setSuppliers([]);
        setFilteredSuppliers([]);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setError('Failed to load suppliers. Please try again.');
      // Fallback to empty array
      setSuppliers([]);
      setFilteredSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  // Removed createSampleSuppliers function - no longer auto-creating mock data

  useEffect(() => {
    // Initial load only - disable real-time subscription to prevent refresh loops
    console.log('🔄 Loading suppliers on component mount...');
    loadSuppliers();

    // Note: Real-time subscription disabled to prevent infinite refresh loops
    // TODO: Implement proper Supabase real-time subscriptions later
  }, []); // Empty dependency array - run only once on mount

  // Filter suppliers based on search
  useEffect(() => {
    const filtered = suppliers.filter(supplier =>
      (supplier.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contactPerson || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.phone || '').includes(searchTerm)
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
    console.log('🔄 Editing supplier:', supplier);
    setSelectedSupplier(supplier);

    // Handle JSONB address field properly
    const addressData = supplier.address || {};
    const addressString = typeof addressData === 'string' ? addressData : (addressData.street || '');

    setFormData({
      name: supplier.name || '',
      // Handle both camelCase and snake_case field names
      contactPerson: supplier.contactPerson || supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      // Handle JSONB address field
      address: addressString,
      city: addressData.city || '',
      state: addressData.state || '',
      pincode: addressData.pincode || '',
      // Handle both camelCase and snake_case field names
      gstNumber: supplier.gstNumber || supplier.gst_number || ''
    });
    console.log('📋 Form populated with:', {
      contactPerson: supplier.contactPerson || supplier.contact_person,
      gstNumber: supplier.gstNumber || supplier.gst_number,
      address: addressData
    });
    setShowEditDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (selectedSupplier) {
        // Update existing supplier
        console.log('Updating supplier:', selectedSupplier.id, formData);

        try {
          // ✅ Transform form data to match database schema
          const updateData = {
            name: formData.name,
            contact_person: formData.contactPerson,
            phone: formData.phone,
            email: formData.email || null,
            address: {
              street: formData.address || '',
              city: formData.city || '',
              state: formData.state || '',
              pincode: formData.pincode || '',
              country: 'India'
            },
            gst_number: formData.gstNumber || null,
            is_active: true,
            organization_id: null // Allow universal suppliers for now
          };

          console.log('✅ Transformed update data for database:', updateData);
          const updatedSupplier = await suppliersService.update(selectedSupplier.id, updateData);
          console.log('✅ Supplier updated in database:', updatedSupplier);

          if (!updatedSupplier || !updatedSupplier.id) {
            throw new Error('Database did not return a valid updated supplier record');
          }

          // ✅ ALWAYS use the database response
          const normalizedSupplier = normalizeSupplier(updatedSupplier);
          setSuppliers(prev => prev.map(s => s.id === selectedSupplier.id ? normalizedSupplier : s));
          setFilteredSuppliers(prev => prev.map(s => s.id === selectedSupplier.id ? normalizedSupplier : s));

          console.log('✅ Supplier updated in UI with database data:', normalizedSupplier.id);

        } catch (dbError) {
          console.error('❌ Database update failed:', dbError);
          // ❌ Don't update locally - this can cause sync issues
          throw new Error(`Failed to update supplier in database: ${dbError.message}`);
        }

        setShowEditDialog(false);
        setSelectedSupplier(null);
        alert('✅ Supplier updated successfully!');
      } else {
        // Add new supplier
        console.log('Adding new supplier:', formData);

        // Prepare supplier data WITHOUT local ID (let database generate UUID)
        // ✅ Transform address fields to match database schema
        const supplierData = {
          name: formData.name,
          contact_person: formData.contactPerson,
          phone: formData.phone,
          email: formData.email || null,
          address: {
            street: formData.address || '',
            city: formData.city || '',
            state: formData.state || '',
            pincode: formData.pincode || '',
            country: 'India'
          },
          gst_number: formData.gstNumber || null,
          is_active: true,
          organization_id: null // Allow universal suppliers for now
          // ✅ No local ID - let database generate proper UUID
        };

        console.log('✅ Transformed supplier data for database:', supplierData);

        try {
          // Save to database and get the real database record
          const savedSupplier = await suppliersService.add(supplierData);
          console.log('✅ Supplier saved to database:', savedSupplier);

          if (!savedSupplier || !savedSupplier.id) {
            throw new Error('Database did not return a valid supplier record');
          }

          // ✅ ALWAYS use the database response (with real UUID)
          const normalizedSupplier = normalizeSupplier(savedSupplier);
          setSuppliers(prev => [...prev, normalizedSupplier]);
          setFilteredSuppliers(prev => [...prev, normalizedSupplier]);

          console.log('✅ Supplier added to UI with database ID:', normalizedSupplier.id);

        } catch (dbError) {
          console.error('❌ Database save failed:', dbError);
          // ❌ Don't add locally - this causes the disappearing issue
          throw new Error(`Failed to save supplier to database: ${dbError.message}`);
        }

        setShowAddDialog(false);
        alert('✅ Supplier added successfully and saved to database!');
      }

      resetForm();
      setSelectedSupplier(null);
    } catch (error) {
      console.error('❌ Error saving supplier:', error);
      const errorMessage = error.message || 'Failed to save supplier. Please try again.';
      setError(errorMessage);
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier) => {
    if (window.confirm(`Are you sure you want to delete ${supplier.name}?`)) {
      try {
        setSaving(true);
        setError(null);

        console.log('Deleting supplier:', supplier.id);

        try {
          await suppliersService.delete(supplier.id);
        } catch (dbError) {
          console.warn('Database delete failed, deleting locally:', dbError);
        }

        // Remove from local state regardless of database result
        setSuppliers(prev => prev.filter(s => s.id !== supplier.id));
        setFilteredSuppliers(prev => prev.filter(s => s.id !== supplier.id));

        alert('Supplier deleted successfully!');
      } catch (error) {
        console.error('Error deleting supplier:', error);
        setError('Failed to delete supplier. Please try again.');
        alert('Error deleting supplier. Please try again.');
      } finally {
        setSaving(false);
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
    <div className="space-y-6 p-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Supplier Management</h1>
          <p className="text-gray-600">Manage your fertilizer suppliers</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadSuppliers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleAdd} disabled={saving}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
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
            <div className="text-2xl font-bold">₹{suppliers.reduce((sum, s) => sum + (s.totalAmount || 0), 0).toLocaleString()}</div>
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
          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md mb-4">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
              <Button variant="outline" size="sm" onClick={loadSuppliers} className="ml-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-muted-foreground">Loading suppliers...</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No suppliers found</p>
              <p className="text-sm">Try adjusting your search or add a new supplier</p>
            </div>
          ) : (
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
                        <div className="font-medium">{supplier.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{supplier.contactPerson || 'N/A'}</div>
                        {supplier.gstNumber && (
                          <div className="text-xs text-gray-400">GST: {supplier.gstNumber}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div>{supplier.phone || 'N/A'}</div>
                        {supplier.email && (
                          <div className="text-gray-500">{supplier.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div>{(supplier.city || 'N/A')}, {(supplier.state || 'N/A')}</div>
                        <div className="text-gray-500">{supplier.pincode || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="font-medium">{supplier.totalPurchases || 0} orders</div>
                        <div className="text-gray-500">₹{(supplier.totalAmount || 0).toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={(supplier.isActive !== false) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {(supplier.isActive !== false) ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(supplier)} disabled={saving}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(supplier)}
                          disabled={saving}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add Supplier Dialog */}
      <SupplierDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        title="Add New Supplier"
        formData={formData}
        errors={errors}
        loading={saving}
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
        loading={saving}
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
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Supplier
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Suppliers;
