import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { imageService } from '../lib/imageService';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const FreshImageTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Test products matching your POS mock data
  const testProducts = [
    {
      id: '1',
      name: 'Urea 50kg Bag',
      brand: 'IFFCO',
      category: 'Nitrogen',
      hsn: '31021000'
    },
    {
      id: '2',
      name: 'DAP 50kg Bag',
      brand: 'Coromandel',
      category: 'Phosphorus',
      hsn: '31054000'
    },
    {
      id: '3',
      name: 'NPK 20-20-20 50kg',
      brand: 'Tata Chemicals',
      category: 'Compound',
      hsn: '31052000'
    },
    {
      id: '4',
      name: 'Potash 50kg Bag',
      brand: 'ICL',
      category: 'Potassium',
      hsn: '31042000'
    },
    {
      id: '5',
      name: 'Organic Compost 25kg',
      brand: 'Green Gold',
      category: 'Organic',
      hsn: '31010000'
    }
  ];

  const testFreshImages = async () => {
    setLoading(true);
    setTestResults([]);
    
    console.log('🧪 TESTING FRESH IMAGE LOADING');
    
    const results = [];
    
    for (const product of testProducts) {
      try {
        console.log(`🔄 Testing: ${product.name} (${product.brand})`);
        
        const startTime = Date.now();
        const result = await imageService.getProductImage(product);
        const loadTime = Date.now() - startTime;
        
        results.push({
          product,
          result,
          loadTime,
          success: result.success,
          timestamp: new Date().toLocaleTimeString()
        });
        
        console.log(`${result.success ? '✅' : '❌'} ${product.name}: ${result.success ? result.source : result.error}`);
        
      } catch (error) {
        console.error(`❌ Error testing ${product.name}:`, error);
        results.push({
          product,
          result: { success: false, error: error.message },
          loadTime: 0,
          success: false,
          timestamp: new Date().toLocaleTimeString()
        });
      }
      
      // Update results in real-time
      setTestResults([...results]);
    }
    
    setLoading(false);
    console.log('🧪 Fresh image test completed');
  };

  useEffect(() => {
    // Auto-run test on component mount
    testFreshImages();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fresh Image Test</h1>
          <p className="text-gray-600">Testing fresh image loading with new system</p>
        </div>
        <Button onClick={testFreshImages} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Test Fresh Images
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testResults.map((test, index) => (
          <Card key={test.product.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{test.product.name}</CardTitle>
                {test.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="text-sm text-gray-600">
                <div>Brand: {test.product.brand}</div>
                <div>HSN: {test.product.hsn}</div>
                <div>Time: {test.loadTime}ms</div>
                <div>Tested: {test.timestamp}</div>
              </div>
            </CardHeader>
            <CardContent>
              {test.result.success ? (
                <div className="space-y-3">
                  <img
                    src={test.result.imageUrl}
                    alt={test.product.name}
                    className="w-full h-32 object-cover rounded-lg border"
                    onError={(e) => {
                      e.target.src = '/images/fallback/fertilizer.png';
                    }}
                  />
                  <div className="text-xs space-y-1">
                    <div className="font-medium text-green-700">
                      Source: {test.result.source}
                    </div>
                    {test.result.attribution && (
                      <div className="text-gray-600">
                        {test.result.attribution.title}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <div className="text-sm text-red-600">
                    {test.result.error || 'Failed to load image'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {loading && testResults.length < testProducts.length && (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Loading fresh images...</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter(t => t.success).length}
                </div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {testResults.filter(t => !t.success).length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(testResults.reduce((sum, t) => sum + t.loadTime, 0) / testResults.length)}ms
                </div>
                <div className="text-sm text-gray-600">Avg Load Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(testResults.filter(t => t.success).map(t => t.result.source)).size}
                </div>
                <div className="text-sm text-gray-600">Sources Used</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Console Output</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            Check your browser console (F12) to see detailed logs of the image fetching process.
            Look for messages starting with 🔄, ✅, and ❌.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FreshImageTest;