import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { brandsService } from '../lib/supabaseDb';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Award,
  CheckCircle,
  XCircle,
  Building
} from 'lucide-react';

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
    website: '',
    contactEmail: '',
    contactPhone: '',
    isActive: true
  });

  // Load brands
  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setIsLoading(true);
      const data = await brandsService.getAll();
      setBrands(data || []);
      setFilteredBrands(data || []);
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter brands
  useEffect(() => {
    const filtered = brands.filter(brand =>
      brand.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.website?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBrands(filtered);
  }, [brands, searchTerm]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      if (!formData.name.trim()) {
        alert('Brand name is required');
        return;
      }

      if (selectedBrand) {
        // Update existing brand
        await brandsService.update(selectedBrand.id, formData);
        alert('Brand updated successfully!');
      } else {
        // Add new brand
        await brandsService.add(formData);
        alert('Brand added successfully!');
      }

      // Reset form and reload data
      setFormData({
        name: '',
        description: '',
        website: '',
        contactEmail: '',
        contactPhone: '',
        isActive: true
      });
      setShowAddDialog(false);
      setShowEditDialog(false);
      setSelectedBrand(null);
      loadBrands();
    } catch (error) {
      console.error('Error saving brand:', error);
      alert('Error saving brand');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (brand) => {
    setSelectedBrand(brand);
    setFormData({
      name: brand.name || '',
      description: brand.description || '',
      website: brand.website || '',
      contactEmail: brand.contactEmail || '',
      contactPhone: brand.contactPhone || '',
      isActive: brand.isActive !== false
    });
    setShowEditDialog(true);
  };

  // Handle delete
  const handleDelete = async (brand) => {
    if (window.confirm(`Are you sure you want to delete "${brand.name}"?`)) {
      try {
        setIsLoading(true);
        await brandsService.delete(brand.id);
        alert('Brand deleted successfully!');
        loadBrands();
      } catch (error) {
        console.error('Error deleting brand:', error);
        alert('Error deleting brand');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Toggle active status
  const toggleActiveStatus = async (brand) => {
    try {
      await brandsService.update(brand.id, { isActive: !brand.isActive });
      loadBrands();
    } catch (error) {
      console.error('Error updating brand status:', error);
      alert('Error updating brand status');
    }
  };

  const BrandForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Brand Name *</label>
        <Input
          placeholder="Enter brand name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Input
          placeholder="Enter description (optional)"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Website</label>
          <Input
            placeholder="https://example.com"
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Contact Email</label>
          <Input
            type="email"
            placeholder="contact@brand.com"
            value={formData.contactEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Contact Phone</label>
        <Input
          placeholder="+91-9876543210"
          value={formData.contactPhone}
          onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="brandIsActive"
          checked={formData.isActive}
          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : selectedBrand ? 'Update Brand' : 'Save Brand'}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Brands Management</h1>
          <p className="text-gray-600">Manage product brands and manufacturers</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
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
            <BrandForm />
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
                      {brand.website && (
                        <span>🌐 {brand.website}</span>
                      )}
                      {brand.contactEmail && (
                        <span>📧 {brand.contactEmail}</span>
                      )}
                      {brand.contactPhone && (
                        <span>📞 {brand.contactPhone}</span>
                      )}
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
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription>Update brand information</DialogDescription>
          </DialogHeader>
          <BrandForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrandsManagement;
