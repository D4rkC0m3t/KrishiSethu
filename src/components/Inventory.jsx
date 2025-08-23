import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Package,
  TrendingDown,
  Calendar,
  Download,
  Upload,
  RefreshCw,
  Eye,
  MoreHorizontal,
  CheckSquare,
  Square,
  Clock,
  Layers,
  BarChart3,
  Settings,
  Archive,
  ShoppingCart,
  Truck,
  Bell,
  Target,
  Zap,
  FileText,
  QrCode
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { productsService, productOperations } from '../lib/supabaseDb';
import { EmptyInventory, EmptySearch, LoadingState, ErrorState } from './EmptyState';
import { normalizeProductsArray, validateNormalizedProduct } from '../utils/productNormalizer';
import DatabaseDiagnostic from './DatabaseDiagnostic';

const Inventory = ({ onNavigate }) => {
  console.log('🏗️ [INVENTORY] Component render started');
  console.log('🏗️ [INVENTORY] onNavigate prop:', typeof onNavigate);
  console.log('🏗️ [INVENTORY] Component mounting/re-rendering');
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Advanced inventory features
  const [filterExpiry, setFilterExpiry] = useState('all');
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showReorderDialog, setShowReorderDialog] = useState(false);
  const [showExpiryDialog, setShowExpiryDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reorderSettings, setReorderSettings] = useState({
    autoReorder: false,
    reorderPoint: 10,
    reorderQuantity: 50,
    preferredSupplier: ''
  });
  const [batchData, setBatchData] = useState({
    batchNumber: '',
    expiryDate: '',
    quantity: '',
    costPrice: '',
    supplier: '',
    notes: ''
  });
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Show 50 items per page for better performance
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    // Only filter if we have products
    if (products.length === 0) {
      setFilteredProducts([]);
      return;
    }

    // Enhanced filtering logic
    let filtered = products.filter(product => {
      const matchesSearch =
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.batchNo?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      const matchesType = filterType === 'all' || product.type === filterType;

      // Handle null quantities by treating them as 0
      const quantity = product.quantity ?? 0;
      
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'low-stock' && quantity <= 10 && quantity > 0) ||
        (filterStatus === 'out-of-stock' && quantity === 0) ||
        (filterStatus === 'near-expiry' && product.expiryDate && isNearExpiry(product.expiryDate)) ||
        (filterStatus === 'in-stock' && quantity > 10);

      return matchesSearch && matchesCategory && matchesType && matchesStatus;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'expiryDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [products, searchTerm, filterCategory, filterType, filterStatus, sortBy, sortOrder]);

  // Helper function for expiry status - moved before generateAlerts to avoid initialization error
  const getExpiryStatus = useCallback((product) => {
    if (!product || !product.expiryDate) return 'no-expiry';
    try {
      const today = new Date();
      const expiry = new Date(product.expiryDate);

      // Check if the date is valid
      if (isNaN(expiry.getTime())) return 'no-expiry';

      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'expired';
      if (diffDays <= 7) return 'critical';
      if (diffDays <= 30) return 'warning';
      return 'good';
    } catch (error) {
      console.warn('Error calculating expiry status:', error);
      return 'no-expiry';
    }
  }, []);

  // Generate alerts function - moved before useEffect to avoid initialization error
  const generateAlerts = useCallback((products) => {
    // Skip alert generation if too many products (performance optimization)
    if (products.length > 100) {
      setExpiryAlerts([]);
      setReorderAlerts([]);
      return;
    }

    const expiry = [];
    const reorder = [];

    products.forEach(product => {
      // Expiry alerts - only check if product has expiry date
      if (product.expiryDate) {
        const expiryStatus = getExpiryStatus(product);
        if (expiryStatus === 'expired' || expiryStatus === 'critical' || expiryStatus === 'warning') {
          expiry.push({
            id: product.id,
            product: product.name,
            status: expiryStatus,
            expiryDate: product.expiryDate,
            quantity: product.quantity
          });
        }
      }

      // Reorder alerts - only check if quantity is defined
      if (typeof product.quantity === 'number' && product.quantity <= (product.reorderPoint || 10)) {
        reorder.push({
          id: product.id,
          product: product.name,
          currentStock: product.quantity,
          reorderPoint: product.reorderPoint || 10,
          suggestedOrder: product.reorderQuantity || 50
        });
      }
    });

    setExpiryAlerts(expiry);
    setReorderAlerts(reorder);
  }, [getExpiryStatus]);

  // Generate alerts when products change
  useEffect(() => {
    if (products.length > 0) {
      generateAlerts(products);
    }
  }, [products, generateAlerts]);

  // Pagination logic
  const getPaginatedProducts = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = getPaginatedProducts();

  // Utility functions
  const isNearExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const getStockStatus = (quantity) => {
    const qty = quantity || 0;
    if (qty === 0) return { status: 'Out of Stock', color: 'bg-red-500' };
    if (qty <= 10) return { status: 'Low Stock', color: 'bg-yellow-500' };
    return { status: 'In Stock', color: 'bg-green-500' };
  };





  const handleBatchAdd = () => {
    if (!selectedProduct || !batchData.batchNumber || !batchData.quantity) {
      alert('Please fill in required fields');
      return;
    }

    // In real app, this would update Firebase
    console.log('Adding batch:', {
      productId: selectedProduct.id,
      ...batchData,
      quantity: parseInt(batchData.quantity),
      costPrice: parseFloat(batchData.costPrice)
    });

    // Update local state
    setProducts(prev => prev.map(product =>
      product.id === selectedProduct.id
        ? {
            ...product,
            quantity: product.quantity + parseInt(batchData.quantity),
            batches: [...(product.batches || []), {
              ...batchData,
              id: Date.now().toString(),
              addedDate: new Date().toISOString()
            }]
          }
        : product
    ));

    setBatchData({
      batchNumber: '',
      expiryDate: '',
      quantity: '',
      costPrice: '',
      supplier: '',
      notes: ''
    });
    setShowBatchDialog(false);
    alert('Batch added successfully!');
  };

  const handleReorderSetup = () => {
    if (!selectedProduct) return;

    // Update product with reorder settings
    setProducts(prev => prev.map(product =>
      product.id === selectedProduct.id
        ? {
            ...product,
            reorderPoint: reorderSettings.reorderPoint,
            reorderQuantity: reorderSettings.reorderQuantity,
            autoReorder: reorderSettings.autoReorder,
            preferredSupplier: reorderSettings.preferredSupplier
          }
        : product
    ));

    setShowReorderDialog(false);
    alert('Reorder settings updated successfully!');
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const loadProducts = async () => {
    let isComponentMounted = true;
    
    try {
      if (isComponentMounted) setLoading(true);
      console.log('🔄 [INVENTORY] Loading products from database...');
      
      // Use a single, simple query approach with generous timeout
      console.log('🔄 [INVENTORY] Executing simple products query...');
      
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })
        .limit(500); // Reasonable limit for performance
      
      if (error) {
        console.error('❌ [INVENTORY] Database query failed:', error);
        throw new Error(`Database query failed: ${error.message}`);
      }
      
      console.log(`✅ [INVENTORY] Query successful: ${(products || []).length} products loaded`);
      
      // Normalize products with consistent data structure
      let normalizedProducts = [];
      if (products && products.length > 0) {
        console.log('🔄 [INVENTORY] Sample raw product:', products[0]);
        normalizedProducts = normalizeProductsArray(products);
        console.log(`🔄 [INVENTORY] Normalized ${normalizedProducts?.length || 0} products`);
        console.log('🔄 [INVENTORY] Sample normalized product:', normalizedProducts[0]);
      } else {
        console.log('📦 [INVENTORY] No products found in database');
        normalizedProducts = [];
      }

      // Validate normalized products
      console.log(`🔄 Validating ${normalizedProducts?.length || 0} normalized products...`);
      const validProducts = (normalizedProducts || []).filter(product => {
        const isValid = validateNormalizedProduct(product);
        if (!isValid) {
          console.warn('⚠️ Invalid normalized product:', product);
        }
        return isValid;
      });

      console.log(`🔄 Found ${validProducts.length} valid products after validation`);

      if (isComponentMounted) {
        if (validProducts.length > 0) {
          console.log(`✅ ${validProducts.length} valid products loaded successfully`);
          setProducts(validProducts);
          
          // Show success notification
          showNotification({
            type: 'success',
            title: 'Inventory Loaded',
            message: `Successfully loaded ${validProducts.length} products from database.`,
            duration: 3000
          });
        } else {
          // Handle empty inventory
          console.log('📦 No valid products found in inventory database');
          setProducts([]);
          
          showNotification({
            type: 'info',
            title: 'Empty Inventory',
            message: 'Your inventory is empty. Click "Add Product" to start adding items.',
            duration: 5000
          });
        }
      }
      
    } catch (error) {
      console.error('❌ [INVENTORY] Error loading products:', error);
      console.error('❌ [INVENTORY] Error stack:', error.stack);
      
      if (isComponentMounted) {
        // Set empty array on error to prevent UI crashes
        setProducts([]);
        
        // Show contextual error notification
        let errorMessage = 'Failed to load inventory from database.';
        let solution = 'Please check your internet connection and try again.';
        
        if (error.message.includes('RLS') || error.message.includes('policy')) {
          errorMessage = 'Database access denied.';
          solution = 'Please contact your administrator to fix database permissions.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network connection failed.';
          solution = 'Please check your internet connection.';
        } else if (error.message.includes('auth')) {
          errorMessage = 'Authentication failed.';
          solution = 'Please log out and log back in.';
        } else if (error.message.includes('JWT') || error.message.includes('token')) {
          errorMessage = 'Session expired.';
          solution = 'Please refresh the page or log in again.';
        }
        
        showNotification({
          type: 'error',
          title: errorMessage,
          message: `${solution} Error: ${error.message}`,
          duration: 15000
        });
      }
    } finally {
      // Always ensure loading is set to false if component is still mounted
      if (isComponentMounted) {
        console.log('🔄 [INVENTORY] Setting loading to false');
        setLoading(false);
      }
    }
  };

  // Helper function for consistent notifications
  const showNotification = ({ type, title, message, duration = 5000 }) => {
    try {
      const notification = document.createElement('div');
      const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500', 
        info: 'bg-blue-500',
        warning: 'bg-yellow-500'
      }[type] || 'bg-gray-500';
      
      const icon = {
        success: '✅',
        error: '❌',
        info: '📦',
        warning: '⚠️'
      }[type] || 'ℹ️';
      
      notification.className = `fixed top-4 right-4 ${bgColor} text-white p-4 rounded-lg shadow-lg z-50 max-w-sm`;
      notification.innerHTML = `
        <div class="flex items-start gap-3">
          <span class="text-2xl">${icon}</span>
          <div>
            <div class="font-medium mb-1">${title}</div>
            <div class="text-sm">${message}</div>
          </div>
        </div>
      `;
      
      document.body.appendChild(notification);

      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, duration);
    } catch (notificationError) {
      console.warn('⚠️ Failed to show notification:', notificationError);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-background text-foreground">
        <div className="text-lg">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 min-h-full flex flex-col bg-background text-foreground">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground">
            {filteredProducts.length} of {products.length} products
            {selectedProducts.length > 0 && ` • ${selectedProducts.length} selected`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Alerts Summary */}
          {(expiryAlerts.length > 0 || reorderAlerts.length > 0) && (
            <div className="flex gap-2">
              {expiryAlerts.length > 0 && (
                <Button
                  onClick={() => setShowExpiryDialog(true)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {expiryAlerts.length} Expiring
                </Button>
              )}
              {reorderAlerts.length > 0 && (
                <Button
                  onClick={() => setShowReorderDialog(true)}
                  variant="outline"
                  size="sm"
                  className="text-orange-600 border-orange-200"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {reorderAlerts.length} Low Stock
                </Button>
              )}
            </div>
          )}

          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>

          <Button
            onClick={() => setViewMode(viewMode === 'table' ? 'cards' : viewMode === 'cards' ? 'batches' : 'table')}
            variant="outline"
            size="sm"
          >
            {viewMode === 'table' ? <BarChart3 className="h-4 w-4 mr-2" /> :
             viewMode === 'cards' ? <Layers className="h-4 w-4 mr-2" /> :
             <Package className="h-4 w-4 mr-2" />}
            {viewMode === 'table' ? 'Table' : viewMode === 'cards' ? 'Cards' : 'Batches'}
          </Button>

          <Button
            onClick={() => onNavigate('stock-movement')}
            variant="outline"
            size="sm"
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Stock Movement
          </Button>

          <Button
            onClick={loadProducts}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          
          <Button
            onClick={() => setShowDiagnostic(true)}
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200"
          >
            <Settings className="h-4 w-4 mr-2" />
            Diagnostic
          </Button>

          <div className="flex gap-2">
            <Button onClick={() => onNavigate('add-product')} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
            <Button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNavigate('bulk-add-products'); }}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Bulk Add
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products by name, brand, category, or batch number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Type</label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Micro">Micro</SelectItem>
                      <SelectItem value="Macro">Macro</SelectItem>
                      <SelectItem value="Chemical">Chemical</SelectItem>
                      <SelectItem value="Organic">Organic</SelectItem>
                      <SelectItem value="Bio-fertilizer">Bio-fertilizer</SelectItem>
                      <SelectItem value="Liquid">Liquid</SelectItem>
                      <SelectItem value="Granular">Granular</SelectItem>
                      <SelectItem value="Water Soluble">Water Soluble</SelectItem>
                      <SelectItem value="Seeds">Seeds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Compound">Compound (NPK)</SelectItem>
                      <SelectItem value="Nitrogen">Nitrogen</SelectItem>
                      <SelectItem value="Phosphorus">Phosphorus</SelectItem>
                      <SelectItem value="Potassium">Potassium</SelectItem>
                      <SelectItem value="Micronutrient">Micronutrients</SelectItem>
                      <SelectItem value="Compost">Organic Compost</SelectItem>
                      <SelectItem value="Bio-fertilizer">Bio-fertilizer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Stock Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="in-stock">In Stock</SelectItem>
                      <SelectItem value="low-stock">Low Stock</SelectItem>
                      <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                      <SelectItem value="near-expiry">Near Expiry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Expiry Status</label>
                  <Select value={filterExpiry} onValueChange={setFilterExpiry}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Expiry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="good">Good (30+ days)</SelectItem>
                      <SelectItem value="warning">Warning (7-30 days)</SelectItem>
                      <SelectItem value="critical">Critical (≤7 days)</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="no-expiry">No Expiry Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="quantity">Quantity</SelectItem>
                      <SelectItem value="salePrice">Price</SelectItem>
                      <SelectItem value="expiryDate">Expiry Date</SelectItem>
                      <SelectItem value="brand">Brand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Order</label>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-700">
                  {selectedProducts.length} items selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Bulk Edit
                  </Button>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Products Grid/Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products ({filteredProducts.length})
              </CardTitle>
              <CardDescription>
                Manage your fertilizer inventory with advanced controls
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
              >
                {selectedProducts.length === filteredProducts.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                Select All
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left py-3 px-4">Product Details</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Batch & Expiry</th>
                  <th className="text-left py-3 px-4">Stock Status</th>
                  <th className="text-left py-3 px-4">Pricing</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => {
                  const stockStatus = getStockStatus(product.quantity);
                  const expiryStatus = getExpiryStatus(product);
                  const isSelected = selectedProducts.includes(product.id);

                  return (
                    <tr key={product.id} className={`border-b hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProductSelection(product.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600">
                            {product.imageUrls && product.imageUrls.length > 0 ? (
                              <img
                                src={product.imageUrls[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center ${product.imageUrls && product.imageUrls.length > 0 ? 'hidden' : ''}`}>
                              <Package className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{product.name || 'Unnamed Product'}</div>
                            <div className="text-sm text-gray-500">{product.brand || 'No Brand'}</div>
                            {product.description && (
                              <div className="text-xs text-gray-400 mt-1">{product.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <Badge variant="secondary" className="text-xs">
                            {product.type || 'No Type'}
                          </Badge>
                          <div className="text-sm text-muted-foreground">{product.category || 'No Category'}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="text-sm font-mono">{product.batchNo || 'N/A'}</div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-muted-foreground">
                              {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : 'No expiry date'}
                            </span>
                          </div>
                          <Badge variant="outline" className={`text-xs ${
                            expiryStatus === 'expired' ? 'text-red-600 border-red-200' :
                            expiryStatus === 'critical' ? 'text-orange-600 border-orange-200' :
                            expiryStatus === 'warning' ? 'text-yellow-600 border-yellow-200' :
                            'text-green-600 border-green-200'
                          }`}>
                            {expiryStatus === 'expired' ? 'Expired' :
                             expiryStatus === 'critical' ? 'Critical' :
                             expiryStatus === 'warning' ? 'Warning' :
                             expiryStatus === 'good' ? 'Good' : 'No Expiry'}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">{product.quantity || 0}</span>
                            <span className="text-sm text-gray-500">units</span>
                          </div>
                          <Badge className={`text-xs ${stockStatus.color}`}>
                            {stockStatus.status}
                          </Badge>
                          {product.quantity <= 10 && (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="text-xs">Reorder needed</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-semibold text-green-600">₹{(product.salePrice || 0).toLocaleString()}</span>
                            <span className="text-gray-500 ml-1">sale</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Cost: ₹{(product.purchasePrice || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-blue-600">
                            Margin: ₹{((product.salePrice || 0) - (product.purchasePrice || 0)).toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowBatchDialog(true);
                            }}
                            title="Add Batch"
                          >
                            <Layers className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setReorderSettings({
                                autoReorder: product.autoReorder || false,
                                reorderPoint: product.reorderPoint || 10,
                                reorderQuantity: product.reorderQuantity || 50,
                                preferredSupplier: product.preferredSupplier || ''
                              });
                              setShowReorderDialog(true);
                            }}
                            title="Reorder Settings"
                          >
                            <Target className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View Details"
                            onClick={() => onNavigate('view-product', product)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit Product"
                            onClick={() => onNavigate('edit-product', product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredProducts.length > itemsPerPage && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Empty States */}
          {filteredProducts.length === 0 && products.length === 0 && !loading && (
            <EmptyInventory
              onAddProduct={() => onNavigate('add-product')}
            />
          )}

          {filteredProducts.length === 0 && products.length > 0 && !loading && (
            <EmptySearch
              searchTerm={searchTerm || 'current filters'}
              onClearSearch={() => {
                setSearchTerm('');
                setFilterCategory('all');
                setFilterType('all');
                setFilterStatus('all');
              }}
            />
          )}

          {loading && (
            <LoadingState message="Loading inventory..." />
          )}
        </CardContent>
      </Card>

      {/* Advanced Inventory Dialogs */}

      {/* Batch Management Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Batch</DialogTitle>
            <DialogDescription>
              Add a new batch for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Batch Number *</label>
                <Input
                  placeholder="BATCH001"
                  value={batchData.batchNumber}
                  onChange={(e) => setBatchData(prev => ({ ...prev, batchNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity *</label>
                <Input
                  type="number"
                  placeholder="50"
                  value={batchData.quantity}
                  onChange={(e) => setBatchData(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry Date</label>
                <Input
                  type="date"
                  value={batchData.expiryDate}
                  onChange={(e) => setBatchData(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cost Price (₹)</label>
                <Input
                  type="number"
                  placeholder="450"
                  value={batchData.costPrice}
                  onChange={(e) => setBatchData(prev => ({ ...prev, costPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Supplier</label>
                <Input
                  placeholder="Supplier name"
                  value={batchData.supplier}
                  onChange={(e) => setBatchData(prev => ({ ...prev, supplier: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input
                placeholder="Additional notes about this batch"
                value={batchData.notes}
                onChange={(e) => setBatchData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBatchAdd}>
              <Layers className="h-4 w-4 mr-2" />
              Add Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reorder Settings Dialog */}
      <Dialog open={showReorderDialog} onOpenChange={setShowReorderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reorder Settings</DialogTitle>
            <DialogDescription>
              Configure automatic reorder points for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reorder Point</label>
              <Input
                type="number"
                placeholder="10"
                value={reorderSettings.reorderPoint}
                onChange={(e) => setReorderSettings(prev => ({ ...prev, reorderPoint: parseInt(e.target.value) }))}
              />
              <p className="text-xs text-gray-500">Alert when stock falls below this level</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reorder Quantity</label>
              <Input
                type="number"
                placeholder="50"
                value={reorderSettings.reorderQuantity}
                onChange={(e) => setReorderSettings(prev => ({ ...prev, reorderQuantity: parseInt(e.target.value) }))}
              />
              <p className="text-xs text-gray-500">Suggested quantity to order</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Preferred Supplier</label>
              <Input
                placeholder="Supplier name"
                value={reorderSettings.preferredSupplier}
                onChange={(e) => setReorderSettings(prev => ({ ...prev, preferredSupplier: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoReorder"
                checked={reorderSettings.autoReorder}
                onChange={(e) => setReorderSettings(prev => ({ ...prev, autoReorder: e.target.checked }))}
              />
              <label htmlFor="autoReorder" className="text-sm">Enable automatic reorder alerts</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReorderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReorderSetup}>
              <Target className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expiry Alerts Dialog */}
      <Dialog open={showExpiryDialog} onOpenChange={setShowExpiryDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Expiry Alerts</DialogTitle>
            <DialogDescription>
              Products requiring attention due to expiry dates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {expiryAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    alert.status === 'expired' ? 'bg-red-500' :
                    alert.status === 'critical' ? 'bg-orange-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <h4 className="font-medium">{alert.product}</h4>
                    <p className="text-sm text-muted-foreground">
                      Expires: {new Date(alert.expiryDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">Stock: {alert.quantity} units</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Discount Sale
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowExpiryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Database Diagnostic Modal */}
      {showDiagnostic && (
        <DatabaseDiagnostic onClose={() => setShowDiagnostic(false)} />
      )}
    </div>
  );
};

export default Inventory;
