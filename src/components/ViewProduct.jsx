import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  Edit, 
  Package, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  FileText,
  Image as ImageIcon,
  Download,
  ExternalLink
} from 'lucide-react';

const ViewProduct = ({ product, onNavigate }) => {
  if (!product) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Product not found</h2>
          <p className="text-gray-500 mb-4">The product you're looking for doesn't exist.</p>
          <Button onClick={() => onNavigate('inventory')}>
            ← Back to Inventory
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-IN');
    } catch {
      return 'Invalid date';
    }
  };

  const getStockStatus = (stock, minLevel = 10) => {
    if (stock <= 0) return { label: 'Out of Stock', color: 'bg-red-500' };
    if (stock <= minLevel) return { label: 'Low Stock', color: 'bg-orange-500' };
    return { label: 'In Stock', color: 'bg-green-500' };
  };

  const stockStatus = getStockStatus(product.stock, product.minStockLevel);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => {
            // Trigger inventory refresh when navigating back
            console.log('🔄 ViewProduct: Navigating back to inventory - triggering refresh');
            window.dispatchEvent(new CustomEvent('inventory-navigation-refresh'));
            onNavigate('inventory');
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600">Product Details</p>
          </div>
        </div>
        <Button onClick={() => onNavigate('edit-product', product)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Product
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Images */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ImageIcon className="h-5 w-5 mr-2" />
              Product Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            {product.attachments && product.attachments.length > 0 ? (
              <div className="space-y-4">
                {product.attachments
                  .filter(file => file.type && file.type.startsWith('image/'))
                  .map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-48 object-cover rounded-lg border"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/300/200';
                        }}
                      />
                      <div className="absolute top-2 right-2 space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(image.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : product.imageUrls && product.imageUrls.length > 0 ? (
              <div className="space-y-4">
                {product.imageUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/300/200';
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No images available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Product Information
              </span>
              <Badge className={stockStatus.color}>
                {stockStatus.label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Product Name</label>
                  <p className="text-lg font-semibold">{product.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <p className="text-gray-900">{product.type || 'Not specified'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Category</label>
                  <p className="text-gray-900">{product.category || 'Not specified'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Brand</label>
                  <p className="text-gray-900">{product.brand || 'Not specified'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Batch Number</label>
                  <p className="text-gray-900">{product.batchNo || 'Not specified'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">HSN Code</label>
                  <p className="text-gray-900">{product.hsn || 'Not specified'}</p>
                </div>
              </div>

              {/* Stock and Pricing */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Current Stock</label>
                  <p className="text-2xl font-bold text-green-600">{product.stock} {product.unit}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Minimum Stock Level</label>
                  <p className="text-gray-900">{product.minStockLevel || 10} {product.unit}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Purchase Price</label>
                  <p className="text-gray-900">₹{product.purchasePrice || 'Not set'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Sale Price</label>
                  <p className="text-xl font-semibold text-blue-600">₹{product.salePrice}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">GST Rate</label>
                  <p className="text-gray-900">{product.gstRate || 0}%</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Unit</label>
                  <p className="text-gray-900">{product.unit || 'PCS'}</p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
              <div>
                <label className="text-sm font-medium text-gray-600">Manufacturing Date</label>
                <p className="text-gray-900">{formatDate(product.manufacturingDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Expiry Date</label>
                <p className="text-gray-900">{formatDate(product.expiryDate)}</p>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-6 pt-6 border-t">
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900 mt-2">{product.description}</p>
              </div>
            )}

            {/* Barcode */}
            {product.barcode && (
              <div className="mt-6 pt-6 border-t">
                <label className="text-sm font-medium text-gray-600">Barcode</label>
                <p className="text-gray-900 font-mono">{product.barcode}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attachments */}
      {product.attachments && product.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Attachments ({product.attachments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {product.attachments.map((file, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.type} • {file.size ? `${Math.round(file.size / 1024)}KB` : 'Unknown size'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ViewProduct;
