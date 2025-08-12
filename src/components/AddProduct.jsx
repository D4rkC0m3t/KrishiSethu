import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { productsService, suppliersService } from '../lib/firestore';
import { storage, db } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const AddProduct = ({ onNavigate, productToEdit = null }) => {
  const { currentUser, userProfile, isManager } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    category: '',
    brand: '',
    batchNo: '',
    expiryDate: '',
    purchasePrice: '',
    salePrice: '',
    quantity: '',
    minStockLevel: '10',
    unit: 'kg',
    supplierId: '',
    hsn: '',
    gstRate: '',
    barcode: '',
    manufacturingDate: '',
    attachments: [],
    description: ''
  });
  const [suppliers, setSuppliers] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuppliers();
    if (productToEdit) {
      setFormData({
        ...productToEdit,
        expiryDate: productToEdit.expiryDate ? 
          new Date(productToEdit.expiryDate).toISOString().split('T')[0] : ''
      });
    }
  }, [productToEdit]);

  const loadSuppliers = async () => {
    try {
      console.log('Loading suppliers...');
      // Try to load from database first, fallback to mock data
      try {
        const data = await suppliersService.getAll();
        console.log('Loaded suppliers from database:', data);
        if (data && data.length > 0) {
          setSuppliers(data);
          return;
        }
      } catch (dbError) {
        console.warn('Failed to load suppliers from database:', dbError);
      }

      // Fallback to mock data
      const mockSuppliers = [
        { id: 'sup1', name: 'Tata Chemicals Ltd', phone: '+91-9876543210' },
        { id: 'sup2', name: 'IFFCO Distributors', phone: '+91-9876543211' },
        { id: 'sup3', name: 'Green Gold Organics', phone: '+91-9876543212' }
      ];
      console.log('Using mock suppliers:', mockSuppliers);
      setSuppliers(mockSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      // Set empty array to prevent form errors
      setSuppliers([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    // Temporarily disable file attachments to prevent storage errors
    if (name === 'attachments' && files) {
      console.log('File attachments temporarily disabled');
      return;
    }
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

    // Debug form data
    console.log('Validating form data:', formData);

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.type) newErrors.type = 'Product type is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.batchNo.trim()) newErrors.batchNo = 'Batch number is required';
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
    if (!formData.purchasePrice || formData.purchasePrice <= 0) {
      newErrors.purchasePrice = 'Valid purchase price is required';
    }
    if (!formData.salePrice || formData.salePrice <= 0) {
      newErrors.salePrice = 'Valid sale price is required';
    }
    if (formData.quantity === '' || formData.quantity < 0) {
      newErrors.quantity = 'Valid quantity is required';
    }
    if (!formData.minStockLevel || formData.minStockLevel < 0) {
      newErrors.minStockLevel = 'Valid minimum stock level is required';
    }
    if (!formData.unit) newErrors.unit = 'Unit is required';
    if (!formData.supplierId) newErrors.supplierId = 'Supplier is required';

    // Optional but recommended fields
    if (formData.hsn && !/^\d{4,8}$/.test(formData.hsn)) {
      newErrors.hsn = 'HSN should be 4-8 digits';
    }
    if (formData.gstRate && (Number(formData.gstRate) < 0 || Number(formData.gstRate) > 28)) {
      newErrors.gstRate = 'GST rate should be between 0 and 28%';
    }

    // Check if sale price is greater than purchase price
    if (formData.salePrice && formData.purchasePrice &&
        parseFloat(formData.salePrice) <= parseFloat(formData.purchasePrice)) {
      newErrors.salePrice = 'Sale price should be greater than purchase price';
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Debug: Check authentication state
      console.log('Current user:', currentUser);
      console.log('User profile:', userProfile);
      console.log('User role:', userProfile?.role);
      console.log('Is manager:', isManager);

      // Check if user is authenticated
      if (!currentUser) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Check if user profile exists
      if (!userProfile) {
        throw new Error('User profile not found. Please refresh the page and try again.');
      }

      // Validate required numeric fields
      const purchasePrice = parseFloat(formData.purchasePrice);
      const salePrice = parseFloat(formData.salePrice);
      const quantity = parseInt(formData.quantity);
      const minStockLevel = parseInt(formData.minStockLevel);
      const gstRate = formData.gstRate ? parseFloat(formData.gstRate) : 0;

      if (isNaN(purchasePrice) || isNaN(salePrice) || isNaN(quantity) || isNaN(minStockLevel)) {
        throw new Error('Invalid numeric values in form data');
      }

      // Validate dates
      const expiryDate = new Date(formData.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        throw new Error('Invalid expiry date');
      }

      const manufacturingDate = formData.manufacturingDate ? new Date(formData.manufacturingDate) : null;
      if (formData.manufacturingDate && isNaN(manufacturingDate.getTime())) {
        throw new Error('Invalid manufacturing date');
      }

      const productData = {
        name: formData.name.trim(),
        type: formData.type,
        category: formData.category,
        brand: formData.brand.trim(),
        batchNo: formData.batchNo.trim(),
        expiryDate: expiryDate,
        purchasePrice: purchasePrice,
        salePrice: salePrice,
        quantity: quantity,
        minStockLevel: minStockLevel,
        unit: formData.unit,
        supplierId: formData.supplierId,
        hsn: formData.hsn.trim(),
        gstRate: gstRate,
        barcode: formData.barcode.trim(),
        manufacturingDate: manufacturingDate,
        description: formData.description.trim(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Product data to save:', productData);

      let productId = productToEdit?.id;
      if (productToEdit) {
        // Update existing product
        console.log('Updating product with ID:', productToEdit.id);
        await productsService.update(productToEdit.id, productData);
        productId = productToEdit.id;
      } else {
        // Add new product
        console.log('Adding new product...');
        console.log('User attempting to add product:', {
          uid: currentUser.uid,
          role: userProfile.role,
          isManager: isManager
        });
        productId = await productsService.add(productData);
        console.log('Product added with ID:', productId);
      }

      // Upload attachments if any (optional - don't fail if storage upload fails)
      if (formData.attachments && formData.attachments.length > 0 && productId) {
        console.log('Uploading attachments...');
        try {
          const urls = [];
          for (const file of formData.attachments) {
            const fileRef = ref(storage, `products/${productId}/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            urls.push(url);
          }
          await productsService.update(productId, { attachments: urls });
          console.log('Attachments uploaded successfully');
        } catch (uploadError) {
          console.error('Failed to upload attachments:', uploadError);
          console.warn('Product saved successfully, but attachments could not be uploaded. You can try uploading them later.');
          // Don't fail the entire operation just because of attachment upload failure
        }
      }

      alert(productToEdit ? 'Product updated successfully!' : 'Product added successfully!');

      onNavigate('inventory');
    } catch (error) {
      console.error('Detailed error saving product:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      console.error('Form data at error:', formData);
      console.error('Current user at error:', currentUser);
      console.error('User profile at error:', userProfile);

      let errorMessage = 'Error saving product. ';
      if (error.code === 'permission-denied') {
        if (!productToEdit && userProfile?.role === 'staff') {
          errorMessage += 'Staff members can only update existing products. Please contact your manager to add new products, or ask them to upgrade your role permissions.';
        } else {
          errorMessage += 'You do not have permission to perform this action.';
        }
      } else if (error.code === 'unavailable') {
        errorMessage += 'Database is currently unavailable. Please check your internet connection.';
      } else if (error.code === 'unauthenticated') {
        errorMessage += 'You are not logged in. Please log in and try again.';
      } else if (error.code === 'storage/retry-limit-exceeded') {
        errorMessage += 'File upload failed due to network issues. The product was saved but attachments could not be uploaded. Please try uploading files later.';
      } else if (error.code && error.code.startsWith('storage/')) {
        errorMessage += 'File upload failed. The product may have been saved but attachments could not be uploaded. Please try again or contact support.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fertilizerTypes = [
    'Micro',
    'Macro',
    'Chemical',
    'Organic',
    'Bio-fertilizer',
    'Liquid',
    'Granular',
    'Water Soluble',
    'Slow Release',
    'Controlled Release',
    'Foliar Spray',
    'Soil Conditioner',
    'Micronutrient Mix',
    'Bio-stimulant',
    'Herbal',
    'Mineral',
    'Soluble Powder',
    'Seeds'
  ];

  const categories = [
    'Nitrogen (N)',
    'Phosphorus (P)',
    'Potassium (K)',
    'Compound (NPK)',
    'Urea',
    'DAP',
    'MOP',
    'SSP',
    '10:26:26',
    '20:20:0:13',
    '19:19:19',
    'Micronutrients',
    'Zinc',
    'Boron',
    'Calcium',
    'Sulphur',
    'Compost',
    'Vermicompost',
    'Bio-stimulants',
    'Soil Conditioner',
    'Organic Manure',
    'Seaweed Extract',
    'Humic/Fulvic',
    'Amino Acid'
  ];

  const units = [
    'kg',
    'bags',
    'liters',
    'tons',
    'packets'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          onClick={() => onNavigate('inventory')}
        >
          ← Back to Inventory
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {productToEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {productToEdit ? 'Update product information' : 'Add a new fertilizer to your inventory'}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>
            Fill in the details for the fertilizer product
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Authentication Status */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <strong>Auth Status:</strong> {currentUser ? `Authenticated as ${currentUser.email || currentUser.uid}` : 'Not authenticated'} |
            <strong> Profile:</strong> {userProfile ? `${userProfile.name} (${userProfile.role})` : 'No profile'} |
            <strong> Suppliers:</strong> {suppliers.length} loaded
          </div>

          {/* Permission Warning */}
          {!productToEdit && userProfile?.role === 'staff' && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <strong>Permission Notice:</strong> As a staff member, you may only be able to update existing products. If you encounter permission errors when adding new products, please contact your manager.
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name *</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., NPK 20-20-20"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Brand *</label>
                <Input
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g., Tata Chemicals"
                  className={errors.brand ? 'border-red-500' : ''}
                />
                {errors.brand && <span className="text-red-500 text-sm">{errors.brand}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type *</label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fertilizerTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <span className="text-red-500 text-sm">{errors.type}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <span className="text-red-500 text-sm">{errors.category}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Batch Number *</label>
                <Input
                  name="batchNo"
                  value={formData.batchNo}
                  onChange={handleChange}
                  placeholder="e.g., TC2024001"
                  className={errors.batchNo ? 'border-red-500' : ''}
                />
                {errors.batchNo && <span className="text-red-500 text-sm">{errors.batchNo}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Barcode / QR</label>
                <Input
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="Scan or enter barcode/QR code"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">HSN Code</label>
                <Input
                  name="hsn"
                  value={formData.hsn}
                  onChange={handleChange}
                  placeholder="e.g., 31051000"
                  className={errors.hsn ? 'border-red-500' : ''}
                />
                {errors.hsn && <span className="text-red-500 text-sm">{errors.hsn}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">GST Rate (%)</label>
                <Input
                  type="number"
                  name="gstRate"
                  value={formData.gstRate}
                  onChange={handleChange}
                  placeholder="0 - 28"
                  className={errors.gstRate ? 'border-red-500' : ''}
                />
                {errors.gstRate && <span className="text-red-500 text-sm">{errors.gstRate}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry Date *</label>
                <Input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className={errors.expiryDate ? 'border-red-500' : ''}
                />
                {errors.expiryDate && <span className="text-red-500 text-sm">{errors.expiryDate}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Manufacturing Date</label>
                <Input
                  type="date"
                  name="manufacturingDate"
                  value={formData.manufacturingDate}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Purchase Price (₹) *</label>
                <Input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className={errors.purchasePrice ? 'border-red-500' : ''}
                />
                {errors.purchasePrice && <span className="text-red-500 text-sm">{errors.purchasePrice}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sale Price (₹) *</label>
                <Input
                  type="number"
                  name="salePrice"
                  value={formData.salePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className={errors.salePrice ? 'border-red-500' : ''}
                />
                {errors.salePrice && <span className="text-red-500 text-sm">{errors.salePrice}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity *</label>
                <Input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  className={errors.quantity ? 'border-red-500' : ''}
                />
                {errors.quantity && <span className="text-red-500 text-sm">{errors.quantity}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Unit *</label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger className={errors.unit ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unit && <span className="text-red-500 text-sm">{errors.unit}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Stock Level *</label>
                <Input
                  type="number"
                  name="minStockLevel"
                  value={formData.minStockLevel}
                  onChange={handleChange}
                  placeholder="10"
                  className={errors.minStockLevel ? 'border-red-500' : ''}
                />
                {errors.minStockLevel && <span className="text-red-500 text-sm">{errors.minStockLevel}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Supplier *</label>
                <Select
                  value={formData.supplierId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}
                >
                  <SelectTrigger className={errors.supplierId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.supplierId && <span className="text-red-500 text-sm">{errors.supplierId}</span>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Additional product details..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md resize-none placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>

            {/* Attachments - Temporarily disabled due to storage configuration issues */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Attachments (Images, Documents)</label>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  📎 File attachments are temporarily disabled while we configure Firebase Storage.
                  You can add product information and upload files later.
                </p>
              </div>
              {/* Temporarily commented out to prevent storage errors
              <Input
                type="file"
                name="attachments"
                accept="image/*,.pdf,.doc,.docx"
                multiple
                onChange={handleChange}
                disabled
              />
              {formData.attachments && formData.attachments.length > 0 && (
                <p className="text-xs text-muted-foreground">{formData.attachments.length} file(s) selected</p>
              )}
              */}
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-6">
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? 'Saving...' : (productToEdit ? 'Update Product' : 'Add Product')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  console.log('=== DEBUG INFO ===');
                  console.log('Current User:', currentUser);
                  console.log('User Profile:', userProfile);
                  console.log('Form Data:', formData);
                  console.log('Suppliers:', suppliers);
                  console.log('Validation Result:', validateForm());
                  console.log('==================');
                }}
              >
                Debug Info
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate('inventory')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProduct;
