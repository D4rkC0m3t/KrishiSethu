import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { imageCacheService } from '../lib/imageCacheService';
import { productsService } from '../lib/supabaseDb';
import {
  Database,
  Trash2,
  RefreshCw,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  HardDrive,
  Zap
} from 'lucide-react';

const ImageCacheManager = () => {
  const [cacheStats, setCacheStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    try {
      setLoading(true);
      const stats = await imageCacheService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Error loading cache stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearAllCache = async () => {
    try {
      setLoading(true);
      const result = await imageCacheService.clearAllCache();
      if (result.success) {
        alert(`Successfully cleared ${result.deleted} cached images`);
        await loadCacheStats();
      } else {
        alert('Error clearing cache: ' + result.error);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Error clearing cache');
    } finally {
      setLoading(false);
      setShowClearDialog(false);
    }
  };

  const clearExpiredCache = async () => {
    try {
      setLoading(true);
      const result = await imageCacheService.clearExpiredCache();
      if (result.success) {
        alert(`Successfully cleared ${result.deleted} expired cached images`);
        await loadCacheStats();
      } else {
        alert('Error clearing expired cache: ' + result.error);
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
      alert('Error clearing expired cache');
    } finally {
      setLoading(false);
    }
  };

  const batchUpdateProducts = async () => {
    try {
      setLoading(true);
      const products = await productsService.getAll();
      const result = await imageCacheService.batchUpdateProductImages(products);
      
      if (result.success) {
        alert(`Successfully updated ${result.updated} products with cached images`);
      } else {
        alert('Error updating products: ' + result.error);
      }
    } catch (error) {
      console.error('Error batch updating products:', error);
      alert('Error updating products');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString();
  };

  const formatCacheAge = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const days = Math.round((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
    return `${days} days ago`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Image Cache Manager</h1>
          <p className="text-gray-600">Manage cached product images to save API credits and improve performance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadCacheStats} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Stats
          </Button>
        </div>
      </div>

      {/* Cache Statistics */}
      {cacheStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Cached</p>
                  <p className="text-2xl font-bold text-gray-900">{cacheStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">API Credits Saved</p>
                  <p className="text-2xl font-bold text-gray-900">{cacheStats.total * 0.01}</p>
                  <p className="text-xs text-gray-500">~$0.01 per search</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Oldest Cache</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCacheAge(cacheStats.oldestCache)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <HardDrive className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Storage Used</p>
                  <p className="text-lg font-bold text-gray-900">
                    ~{Math.round(cacheStats.total * 0.5)} KB
                  </p>
                  <p className="text-xs text-gray-500">Metadata only</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Source Breakdown */}
      {cacheStats && Object.keys(cacheStats.sources).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cache Sources</CardTitle>
            <CardDescription>
              Breakdown of cached images by source
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(cacheStats.sources).map(([source, count]) => (
                <div key={source} className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600 capitalize">{source.replace('_', ' ')}</p>
                  <Badge variant="outline" className="mt-1">
                    {Math.round((count / cacheStats.total) * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Cache Maintenance</CardTitle>
            <CardDescription>
              Clean up and optimize your image cache
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={clearExpiredCache} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              <Clock className="h-4 w-4 mr-2" />
              Clear Expired Cache (30+ days)
            </Button>
            
            <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Cache
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear All Cache</DialogTitle>
                  <DialogDescription>
                    This will delete all cached images. You'll need to re-fetch images from APIs, 
                    which will use your SerpApi credits. Are you sure?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowClearDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={clearAllCache}>
                    Clear All Cache
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Updates</CardTitle>
            <CardDescription>
              Apply cached images to your product database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={batchUpdateProducts} 
              disabled={loading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Update Products with Cached Images
            </Button>
            
            <p className="text-sm text-gray-500">
              This will update your product records with cached image URLs, 
              making them load faster in the POS system.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Benefits Info */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium">Faster Loading</h4>
                <p className="text-sm text-gray-600">
                  Cached images load instantly without API calls
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium">Cost Savings</h4>
                <p className="text-sm text-gray-600">
                  Reduces SerpApi usage and saves money
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium">Reliability</h4>
                <p className="text-sm text-gray-600">
                  Works even when external APIs are down
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Processing cache operations...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCacheManager;