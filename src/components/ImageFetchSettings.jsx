import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { 
  Image, 
  Download, 
  RefreshCw, 
  Settings, 
  AlertCircle, 
  CheckCircle,
  Info
} from 'lucide-react';

const ImageFetchSettings = ({ className = '' }) => {
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(true);
  const [isTestingFetch, setIsTestingFetch] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [stats, setStats] = useState({ total: 0, withImages: 0, withoutImages: 0 });

  useEffect(() => {
    // Load settings from localStorage
    const savedSetting = localStorage.getItem('autoImageFetch');
    setAutoFetchEnabled(savedSetting !== 'false');

    // Load image statistics
    loadImageStats();
  }, []);

  const loadImageStats = () => {
    try {
      const uploadedImages = JSON.parse(localStorage.getItem('uploadedImages') || '{}');
      const productsData = JSON.parse(localStorage.getItem('products') || '[]');
      
      const total = productsData.length;
      const withManualImages = Object.keys(uploadedImages).length;
      const withImages = productsData.filter(p => 
        p.image && p.image !== '' && !p.image.includes('placeholder')
      ).length;
      
      setStats({
        total,
        withImages: Math.max(withImages, withManualImages),
        withoutImages: total - Math.max(withImages, withManualImages)
      });
    } catch (error) {
      console.error('Error loading image stats:', error);
    }
  };

  const handleToggleAutoFetch = (enabled) => {
    setAutoFetchEnabled(enabled);
    localStorage.setItem('autoImageFetch', enabled.toString());
    
    // Show notification
    const message = enabled ? 
      'Automatic image fetching enabled' : 
      'Automatic image fetching disabled';
    
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${enabled ? 'bg-green-500' : 'bg-yellow-500'} text-white p-3 rounded-lg shadow-lg z-50`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  const testImageFetch = async () => {
    setIsTestingFetch(true);
    setTestResult(null);

    try {
      // Import image service dynamically
      const { imageService } = await import('../lib/imageService');
      
      // Test with a common fertilizer
      const testProduct = {
        name: 'NPK 20-20-20',
        category: 'fertilizer',
        brand: 'Test Brand'
      };

      console.log('Testing image fetch for:', testProduct.name);
      
      const result = await imageService.fetchImageFromWeb(
        testProduct.name,
        testProduct.category,
        testProduct
      );

      setTestResult({
        success: result.success,
        imageUrl: result.imageUrl,
        source: result.source,
        error: result.error
      });

      if (result.success) {
        console.log('Test fetch successful:', result);
      } else {
        console.log('Test fetch failed:', result.error);
      }
    } catch (error) {
      console.error('Test fetch error:', error);
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsTestingFetch(false);
    }
  };

  const refreshImageStats = () => {
    loadImageStats();
    
    // Show notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white p-3 rounded-lg shadow-lg z-50';
    notification.textContent = 'Image statistics refreshed';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 2000);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Image Fetch Settings
        </CardTitle>
        <CardDescription>
          Configure automatic image fetching for products
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Auto-fetch toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="font-medium">Automatic Image Fetching</div>
            <div className="text-sm text-gray-600">
              Automatically fetch product images from online sources
            </div>
          </div>
          <Switch
            checked={autoFetchEnabled}
            onCheckedChange={handleToggleAutoFetch}
          />
        </div>

        {/* Image statistics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Image Statistics</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshImageStats}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.withImages}</div>
              <div className="text-sm text-gray-600">With Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.withoutImages}</div>
              <div className="text-sm text-gray-600">Without Images</div>
            </div>
          </div>
          
          {stats.total > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stats.withImages / stats.total) * 100}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Test fetch */}
        <div className="space-y-3">
          <h4 className="font-medium">Test Image Fetching</h4>
          <Button
            onClick={testImageFetch}
            disabled={isTestingFetch}
            className="w-full"
          >
            {isTestingFetch ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Test Fetch
              </>
            )}
          </Button>
          
          {testResult && (
            <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.success ? 'Test Successful' : 'Test Failed'}
                </span>
              </div>
              
              {testResult.success ? (
                <div className="space-y-2">
                  <div className="text-sm text-green-700">
                    Source: {testResult.source}
                  </div>
                  {testResult.imageUrl && (
                    <img 
                      src={testResult.imageUrl} 
                      alt="Test result" 
                      className="w-20 h-20 object-cover rounded border"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="text-sm text-red-700">
                  Error: {testResult.error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">How it works:</div>
              <ul className="space-y-1 text-xs">
                <li>• Manual uploads are always prioritized</li>
                <li>• Auto-fetch tries multiple sources (Curated, SerpAPI, Unsplash)</li>
                <li>• Images are cached to avoid repeated API calls</li>
                <li>• Fallback images are used when no images are found</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageFetchSettings;
