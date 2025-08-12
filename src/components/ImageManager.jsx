import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { productsService } from '../lib/firestore';
import { fertilizerImageFetcher, populateProductImages } from '../utils/fertilizerImageFetcher';
import { imageService } from '../lib/imageService';
import {
  Image,
  Download,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertCircle,
  Package,
  BarChart3,
  Settings,
  Upload,
  Search,
  Eye,
  Camera
} from 'lucide-react';

const ImageManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showImageDialog, setShowImageDialog] = useState(false);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const firebaseProducts = await productsService.getAll();
      
      // Add image status to products
      const productsWithImageStatus = firebaseProducts.map(product => ({
        ...product,
        hasImage: !!(product.image || product.imageUrl),
        imageSource: product.image ? 'database' : 'none'
      }));
      
      setProducts(productsWithImageStatus);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch images for all products
  const fetchAllImages = async () => {
    try {
      setLoading(true);
      setProgress(0);
      
      const productsWithoutImages = products.filter(p => !p.hasImage);
      console.log(`Fetching images for ${productsWithoutImages.length} products...`);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);
      
      const result = await populateProductImages(productsWithoutImages);
      
      clearInterval(progressInterval);
      setProgress(100);
      setReport(result.report);
      setShowReport(true);
      
      // Reload products to show updated images
      await loadProducts();
      
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // Clear image cache
  const clearCache = async () => {
    try {
      const result = fertilizerImageFetcher.clearImageCache();
      if (result.success) {
        alert('Image cache cleared successfully!');
        await loadProducts();
      } else {
        alert('Error clearing cache: ' + result.error);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Error clearing cache');
    }
  };

  // View product image
  const viewProductImage = async (product) => {
    try {
      setSelectedProduct(product);
      
      if (!product.hasImage) {
        // Try to fetch image for this product
        const imageResult = await imageService.getProductImage(product);
        if (imageResult.success) {
          setSelectedProduct({
            ...product,
            tempImage: imageResult.imageUrl,
            imageSource: imageResult.source
          });
        }
      }
      
      setShowImageDialog(true);
    } catch (error) {
      console.error('Error viewing product image:', error);
    }
  };

  // Statistics
  const stats = {
    total: products.length,
    withImages: products.filter(p => p.hasImage).length,
    withoutImages: products.filter(p => !p.hasImage).length,
    percentage: products.length > 0 ? Math.round((products.filter(p => p.hasImage).length / products.length) * 100) : 0
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Image Manager</h1>
          <p className="text-gray-600">Manage product images for your inventory</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadProducts} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={clearCache} variant="outline">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With Images</p>
                <p className="text-2xl font-bold text-gray-900">{stats.withImages}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Without Images</p>
                <p className="text-2xl font-bold text-gray-900">{stats.withoutImages}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Coverage</p>
                <p className="text-2xl font-bold text-gray-900">{stats.percentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {loading && progress > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fetching images...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
          <CardDescription>
            Manage images for all products at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={fetchAllImages} 
              disabled={loading || stats.withoutImages === 0}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Fetch Missing Images ({stats.withoutImages})
            </Button>
            
            <Button 
              onClick={() => setShowReport(true)} 
              variant="outline"
              disabled={!report}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Last Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            Click on a product to view or manage its image
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => viewProductImage(product)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {product.hasImage ? (
                      <Image className="h-5 w-5 text-green-600" />
                    ) : (
                      <Package className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.brand}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={product.hasImage ? "default" : "secondary"}>
                    {product.hasImage ? "Has Image" : "No Image"}
                  </Badge>
                  <Eye className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Image Fetch Report</DialogTitle>
            <DialogDescription>
              Results from the last image fetching operation
            </DialogDescription>
          </DialogHeader>
          {report && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{report.successful}</p>
                  <p className="text-sm text-gray-600">Successful</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{report.failed}</p>
                  <p className="text-sm text-gray-600">Failed</p>
                </div>
              </div>
              
              {Object.keys(report.sources).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Sources Used:</h4>
                  <div className="space-y-1">
                    {Object.entries(report.sources).map(([source, count]) => (
                      <div key={source} className="flex justify-between text-sm">
                        <span className="capitalize">{source}</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowReport(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              {selectedProduct?.brand} • {selectedProduct?.category}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {selectedProduct.hasImage || selectedProduct.tempImage ? (
                  <img
                    src={selectedProduct.image || selectedProduct.tempImage}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              
              <div className="text-center">
                <Badge variant={selectedProduct.hasImage ? "default" : "secondary"}>
                  {selectedProduct.imageSource || 'No Image'}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowImageDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageManager;