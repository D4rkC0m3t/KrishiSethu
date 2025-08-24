import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { brandsService } from '../lib/supabaseDb';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Award,
  CheckCircle,
  XCircle,
  Building,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

// BrandForm component with validation
const BrandForm = React.memo(({
  formData,
  setFormData,
  handleSubmit,
  isLoading,
  selectedBrand,
  setShowAddDialog,
  setShowEditDialog,
  errors = {}
}) => {
  const [validationErrors, setValidationErrors] = useState({});

  // Validate form fields
  const validateField = (name, value) => {
    const errors = {};
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Brand name is required';
        } else if (value.trim().length < 2) {
          errors.name = 'Brand name must be at least 2 characters';
        } else if (value.trim().length > 100) {
          errors.name = 'Brand name must be less than 100 characters';
        }
        break;
      case 'description':
        if (value && value.length > 500) {
          errors.description = 'Description must be less than 500 characters';
        }
        break;
    }
    
    return errors;
  };

  const handleFieldChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFieldBlur = (name, value) => {
    const fieldErrors = validateField(name, value);
    setValidationErrors(prev => ({ ...prev, ...fieldErrors }));
  };

  console.log('🔍 BrandForm rendering with formData:', formData);
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Display form-level errors */}
      {errors.form && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {errors.form}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Brand Name *</label>
        <Input
          placeholder="Enter brand name (2-100 characters)"
          value={formData.name || ''}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          onBlur={(e) => handleFieldBlur('name', e.target.value)}
          className={validationErrors.name ? 'border-red-500 focus:border-red-500' : ''}
          required
        />
        {validationErrors.name && (
          <p className="text-sm text-red-600">{validationErrors.name}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Input
          placeholder="Enter description (optional, max 500 characters)"
          value={formData.description || ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          onBlur={(e) => handleFieldBlur('description', e.target.value)}
          className={validationErrors.description ? 'border-red-500 focus:border-red-500' : ''}
        />
        <div className="flex justify-between">
          {validationErrors.description && (
            <p className="text-sm text-red-600">{validationErrors.description}</p>
          )}
          <p className="text-xs text-gray-500 ml-auto">
            {(formData.description || '').length}/500
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="brandIsActive"
          checked={formData.isActive}
          onChange={(e) => handleFieldChange('isActive', e.target.checked)}
        />
        <label htmlFor="brandIsActive" className="text-sm font-medium">Active</label>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => {
          setShowAddDialog(false);
          setShowEditDialog(false);
        }}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || Object.keys(validationErrors).some(key => validationErrors[key])}
        >
          {isLoading ? 'Saving...' : selectedBrand ? 'Update Brand' : 'Save Brand'}
        </Button>
      </DialogFooter>
    </form>
  );
});

const BrandsManagement = ({ onNavigate }) => {
  const [brands, setBrands] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logoUrl: '',
    isActive: true
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Load brands
  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrors({}); // Clear any previous errors
      const data = await brandsService.getAll();
      setBrands(data || []);
      setFilteredBrands(data || []);
    } catch (error) {
      console.error('Error loading brands:', error);
      setErrors({ load: 'Failed to load brands. Please refresh the page to try again.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter brands
  useEffect(() => {
    const filtered = brands.filter(brand =>
      brand.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBrands(filtered);
  }, [brands, searchTerm]);

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errors.form) {
      const timer = setTimeout(() => setErrors(prev => ({ ...prev, form: '' })), 5000);
      return () => clearTimeout(timer);
    }
  }, [errors.form]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrors({});
      setSuccessMessage('');
      
      if (!formData.name.trim()) {
        setErrors({ form: 'Brand name is required' });
        return;
      }

      if (selectedBrand) {
        // Update existing brand
        await brandsService.update(selectedBrand.id, formData);
        setSuccessMessage('Brand updated successfully!');
      } else {
        // Add new brand
        await brandsService.add(formData);
        setSuccessMessage('Brand added successfully!');
      }

      // Reset form and reload data
      setFormData({
        name: '',
        description: '',
        logoUrl: '',
        isActive: true
      });
      setShowAddDialog(false);
      setShowEditDialog(false);
      setSelectedBrand(null);
      loadBrands();
    } catch (error) {
      console.error('Error saving brand:', error);
      setErrors({ form: `Failed to ${selectedBrand ? 'update' : 'create'} brand. Please try again.` });
    } finally {
      setIsLoading(false);
    }
  }, [formData, selectedBrand, loadBrands]);

  // Handle edit
  const handleEdit = (brand) => {
    console.log('🔄 Editing brand:', brand);
    setSelectedBrand(brand);
    setFormData({
      name: brand.name || '',
      description: brand.description || '',
      logoUrl: brand.logoUrl || brand.logo_url || '',
      // Standardized: Always use isActive (mapped from database)
      isActive: brand.isActive !== false
    });
    console.log('📋 Brand form populated with data:', { name: brand.name, isActive: brand.isActive });
    setShowEditDialog(true);
  };

  // Handle delete
  const handleDelete = async (brand) => {
    if (window.confirm(`Are you sure you want to delete "${brand.name}"?`)) {
      try {
        setIsLoading(true);
        setErrors({});
        await brandsService.delete(brand.id);
        setSuccessMessage(`Brand "${brand.name}" deleted successfully!`);
        loadBrands();
      } catch (error) {
        console.error('Error deleting brand:', error);
        setErrors({ delete: `Failed to delete "${brand.name}". Please try again.` });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Toggle active status
  const toggleActiveStatus = async (brand) => {
    try {
      setErrors({});
      await brandsService.update(brand.id, { isActive: !brand.isActive });
      setSuccessMessage(`Brand "${brand.name}" ${brand.isActive ? 'deactivated' : 'activated'} successfully!`);
      loadBrands();
    } catch (error) {
      console.error('Error updating brand status:', error);
      setErrors({ toggle: `Failed to ${brand.isActive ? 'deactivate' : 'activate'} "${brand.name}". Please try again.` });
    }
  };

  // Moved BrandForm outside to prevent remounting - see below

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Messages */}
      {Object.entries(errors).map(([key, message]) => (
        message && (
          <Alert key={key} className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {message}
            </AlertDescription>
          </Alert>
        )
      ))}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Brands Management</h1>
          <p className="text-gray-600">Manage product brands and manufacturers</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (open) {
            // Reset form when opening add dialog
            setFormData({
              name: '',
              description: '',
              isActive: true
            });
            setSelectedBrand(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Brand
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Brand</DialogTitle>
              <DialogDescription>Create a new product brand</DialogDescription>
            </DialogHeader>
            <BrandForm
              key={selectedBrand ? `edit-${selectedBrand.id}` : 'add-new'}
              formData={formData}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              selectedBrand={selectedBrand}
              setShowAddDialog={setShowAddDialog}
              setShowEditDialog={setShowEditDialog}
              errors={errors}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Brands List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Brands ({filteredBrands.length})
          </CardTitle>
          <CardDescription>Manage your product brands</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading brands...</div>
          ) : filteredBrands.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No brands found</p>
              <p className="text-sm">Add your first brand to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBrands.map((brand) => (
                <div key={brand.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{brand.name}</h3>
                      <Badge variant={brand.isActive ? 'default' : 'secondary'}>
                        {brand.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {brand.description && (
                      <p className="text-sm text-gray-500 mt-1">{brand.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>📅 Created: {new Date(brand.createdAt || brand.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActiveStatus(brand)}
                    >
                      {brand.isActive ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(brand)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(brand)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) {
          // Reset form when closing edit dialog
          setFormData({
            name: '',
            description: '',
            isActive: true
          });
          setSelectedBrand(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription>Update brand information</DialogDescription>
          </DialogHeader>
          <BrandForm
            key={selectedBrand ? `edit-${selectedBrand.id}` : 'add-new'}
            formData={formData}
            setFormData={setFormData}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            selectedBrand={selectedBrand}
            setShowAddDialog={setShowAddDialog}
            setShowEditDialog={setShowEditDialog}
            errors={errors}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrandsManagement;
