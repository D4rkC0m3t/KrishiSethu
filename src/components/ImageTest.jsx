import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { imageService } from '../lib/imageService';
import { fertilizerImageFetcher } from '../utils/fertilizerImageFetcher';
import { Package, Search, Download, CheckCircle, AlertCircle } from 'lucide-react';

const ImageTest = () => {
  const [productName, setProductName] = useState('Urea 50kg Bag');
  const [brand, setBrand] = useState('IFFCO');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [testResults, setTestResults] = useState([]);

  const testImageFetch = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log(`Testing image fetch for: ${productName} (${brand})`);
      
      // Test the imageService
      const imageResult = await imageService.getProductImage({
        id: 'test-1',
        name: productName,
        brand: brand,
        category: 'fertilizer'
      });
      
      setResult(imageResult);
      
      // Add to test results
      setTestResults(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        productName,
        brand,
        result: imageResult
      }, ...prev.slice(0, 4)]); // Keep only last 5 results
      
    } catch (error) {
      console.error('Test error:', error);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testSerpApi = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log(`Testing SerpApi for: ${productName} (${brand})`);
      
      // Test SerpApi directly
      const serpResult = await fertilizerImageFetcher.fetchFromSerpApi(productName, brand);
      
      setResult(serpResult);
      
      // Add to test results
      setTestResults(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        productName,
        brand,
        result: serpResult
      }, ...prev.slice(0, 4)]);
      
    } catch (error) {
      console.error('SerpApi test error:', error);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const commonProducts = [
    { name: 'Urea 50kg Bag', brand: 'IFFCO' },
    { name: 'DAP 50kg Bag', brand: 'Coromandel' },
    { name: 'NPK 20-20-20 50kg', brand: 'Tata Chemicals' },
    { name: 'Potash 50kg Bag', brand: 'ICL' },
    { name: 'Organic Compost 25kg', brand: 'Green Gold' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Image Fetch Test</h1>
        <p className="text-gray-600">Test the image fetching functionality</p>
      </div>

      {/* Test Form */}
      <Card>
        <CardHeader>
          <CardTitle>Test Product Image Fetch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Product Name</label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Brand</label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Enter brand name"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={testImageFetch} disabled={loading || !productName}>
              <Search className="h-4 w-4 mr-2" />
              Test Image Service
            </Button>
            <Button onClick={testSerpApi} disabled={loading || !productName} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Test SerpApi Direct
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {commonProducts.map((product, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => {
                  setProductName(product.name);
                  setBrand(product.brand);
                }}
              >
                {product.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Result */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Test Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-4">
                <div className="aspect-square w-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={result.imageUrl}
                    alt="Test result"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p><strong>Source:</strong> {result.source}</p>
                  <p><strong>Image URL:</strong> <a href={result.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{result.imageUrl}</a></p>
                  
                  {result.attribution && (
                    <div>
                      <strong>Attribution:</strong>
                      <pre className="bg-gray-100 p-2 rounded text-sm mt-1">
                        {JSON.stringify(result.attribution, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {result.productInfo && (
                    <div>
                      <strong>Product Info:</strong>
                      <pre className="bg-gray-100 p-2 rounded text-sm mt-1">
                        {JSON.stringify(result.productInfo, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-red-600">
                <p><strong>Error:</strong> {result.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test History */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{test.productName}</span>
                    <span className="text-gray-500 ml-2">({test.brand})</span>
                    <span className="text-xs text-gray-400 ml-2">{test.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {test.result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">{test.result.source || 'Failed'}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Testing image fetch...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageTest;