import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  getDatabaseCategories, 
  getDynamicCategoryTypes, 
  validateDataConsistency 
} from '../config/databaseSync';

const DatabaseSyncTest = () => {
  const [testResults, setTestResults] = useState({
    categories: { status: 'pending', data: null, error: null },
    types: { status: 'pending', data: null, error: null },
    consistency: { status: 'pending', data: null, error: null }
  });
  const [isRunning, setIsRunning] = useState(false);

  const runCategoriesTest = async () => {
    try {
      console.log('🧪 Testing categories...');
      const categories = await getDatabaseCategories();
      
      setTestResults(prev => ({
        ...prev,
        categories: {
          status: categories && categories.length > 0 ? 'success' : 'warning',
          data: categories,
          error: null
        }
      }));
      
      return categories;
    } catch (error) {
      console.error('❌ Categories test failed:', error);
      setTestResults(prev => ({
        ...prev,
        categories: {
          status: 'error',
          data: null,
          error: error.message
        }
      }));
      return [];
    }
  };

  const runTypesTest = async (categories) => {
    try {
      console.log('🧪 Testing types generation...');
      const typeResults = [];
      
      for (const category of categories || []) {
        const types = getDynamicCategoryTypes(category.name);
        typeResults.push({
          categoryName: category.name,
          categoryId: category.id,
          typesCount: types.length,
          types: types.slice(0, 5), // Show first 5 types
          allTypes: types
        });
      }
      
      setTestResults(prev => ({
        ...prev,
        types: {
          status: typeResults.length > 0 ? 'success' : 'warning',
          data: typeResults,
          error: null
        }
      }));
      
      return typeResults;
    } catch (error) {
      console.error('❌ Types test failed:', error);
      setTestResults(prev => ({
        ...prev,
        types: {
          status: 'error',
          data: null,
          error: error.message
        }
      }));
      return [];
    }
  };

  const runConsistencyTest = async () => {
    try {
      console.log('🧪 Testing data consistency...');
      const result = await validateDataConsistency();
      
      setTestResults(prev => ({
        ...prev,
        consistency: {
          status: result.valid ? 'success' : 'warning',
          data: result,
          error: null
        }
      }));
      
      return result;
    } catch (error) {
      console.error('❌ Consistency test failed:', error);
      setTestResults(prev => ({
        ...prev,
        consistency: {
          status: 'error',
          data: null,
          error: error.message
        }
      }));
      return null;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    console.log('🚀 Starting database sync tests...');
    
    try {
      // Reset results
      setTestResults({
        categories: { status: 'running', data: null, error: null },
        types: { status: 'pending', data: null, error: null },
        consistency: { status: 'pending', data: null, error: null }
      });

      // Test categories
      const categories = await runCategoriesTest();
      
      // Test types
      setTestResults(prev => ({
        ...prev,
        types: { status: 'running', data: null, error: null }
      }));
      await runTypesTest(categories);
      
      // Test consistency
      setTestResults(prev => ({
        ...prev,
        consistency: { status: 'running', data: null, error: null }
      }));
      await runConsistencyTest();
      
      console.log('✅ All tests completed');
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'running': return '🔄';
      default: return '⏳';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'running': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Database Synchronization Test
          </CardTitle>
          <CardDescription>
            Test the database-frontend consistency and dynamic type generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? '🔄 Running Tests...' : '🚀 Run All Tests'}
            </Button>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Categories Test */}
              <Card className={`border-2 ${getStatusColor(testResults.categories.status)}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStatusIcon(testResults.categories.status)} Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.categories.status === 'success' && (
                    <div>
                      <p className="font-medium">✅ Loaded {testResults.categories.data?.length || 0} categories</p>
                      <div className="mt-2 space-y-1">
                        {testResults.categories.data?.slice(0, 5).map((cat, idx) => (
                          <div key={idx} className="text-sm text-gray-600">
                            • {cat.name}
                          </div>
                        ))}
                        {testResults.categories.data?.length > 5 && (
                          <div className="text-sm text-gray-500">
                            ... and {testResults.categories.data.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {testResults.categories.status === 'error' && (
                    <p className="text-red-600">❌ {testResults.categories.error}</p>
                  )}
                  {testResults.categories.status === 'warning' && (
                    <p className="text-yellow-600">⚠️ No categories found</p>
                  )}
                  {testResults.categories.status === 'running' && (
                    <p className="text-blue-600">🔄 Loading categories...</p>
                  )}
                  {testResults.categories.status === 'pending' && (
                    <p className="text-gray-600">⏳ Waiting to run...</p>
                  )}
                </CardContent>
              </Card>

              {/* Types Test */}
              <Card className={`border-2 ${getStatusColor(testResults.types.status)}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStatusIcon(testResults.types.status)} Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.types.status === 'success' && (
                    <div>
                      <p className="font-medium">✅ Generated types for {testResults.types.data?.length || 0} categories</p>
                      <div className="mt-2 space-y-2">
                        {testResults.types.data?.slice(0, 3).map((result, idx) => (
                          <div key={idx} className="text-sm">
                            <div className="font-medium text-gray-700">{result.categoryName}</div>
                            <div className="text-gray-600">
                              {result.typesCount} types: {result.types.join(', ')}
                              {result.typesCount > 5 && '...'}
                            </div>
                          </div>
                        ))}
                        {testResults.types.data?.length > 3 && (
                          <div className="text-sm text-gray-500">
                            ... and {testResults.types.data.length - 3} more categories
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {testResults.types.status === 'error' && (
                    <p className="text-red-600">❌ {testResults.types.error}</p>
                  )}
                  {testResults.types.status === 'running' && (
                    <p className="text-blue-600">🔄 Generating types...</p>
                  )}
                  {testResults.types.status === 'pending' && (
                    <p className="text-gray-600">⏳ Waiting to run...</p>
                  )}
                </CardContent>
              </Card>

              {/* Consistency Test */}
              <Card className={`border-2 ${getStatusColor(testResults.consistency.status)}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStatusIcon(testResults.consistency.status)} Consistency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.consistency.status === 'success' && (
                    <div>
                      <p className="font-medium text-green-600">✅ Data is consistent</p>
                      <div className="mt-2 text-sm text-gray-600">
                        No orphaned records or integrity issues found
                      </div>
                    </div>
                  )}
                  {testResults.consistency.status === 'warning' && (
                    <div>
                      <p className="font-medium text-yellow-600">⚠️ Issues found</p>
                      {testResults.consistency.data?.issues?.map((issue, idx) => (
                        <div key={idx} className="mt-1 text-sm text-yellow-700">
                          • {issue.type}: {issue.count} items
                        </div>
                      ))}
                    </div>
                  )}
                  {testResults.consistency.status === 'error' && (
                    <p className="text-red-600">❌ {testResults.consistency.error}</p>
                  )}
                  {testResults.consistency.status === 'running' && (
                    <p className="text-blue-600">🔄 Checking consistency...</p>
                  )}
                  {testResults.consistency.status === 'pending' && (
                    <p className="text-gray-600">⏳ Waiting to run...</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Results */}
            {testResults.types.status === 'success' && testResults.types.data && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>📋 Detailed Type Mapping Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testResults.types.data.map((result, idx) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 mb-2">{result.categoryName}</h4>
                        <p className="text-sm text-gray-600 mb-2">Generated {result.typesCount} types:</p>
                        <div className="text-xs text-gray-700 space-y-1">
                          {result.allTypes.map((type, typeIdx) => (
                            <div key={typeIdx}>• {type}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseSyncTest;
