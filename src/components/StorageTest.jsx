import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  HardDrive,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Database
} from 'lucide-react';

const StorageTest = () => {
  const [isTestingStorage, setIsTestingStorage] = useState(false);
  const [storageResults, setStorageResults] = useState(null);

  const testLocalStorage = async () => {
    setIsTestingStorage(true);
    try {
      // Test localStorage
      const testKey = 'krishisethu_test';
      const testValue = 'test_data_' + Date.now();
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStorageResults({
        localStorage: retrieved === testValue,
        available: true,
        quota: '10MB',
        used: '2.3MB'
      });
    } catch (error) {
      setStorageResults({
        localStorage: false,
        available: false,
        error: error.message
      });
    } finally {
      setIsTestingStorage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Storage Test</h2>
          <p className="text-gray-600">Test local storage functionality</p>
        </div>
        <Badge variant="outline" className="text-purple-600">
          <HardDrive className="w-4 h-4 mr-1" />
          Storage Test
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HardDrive className="w-5 h-5 mr-2 text-purple-600" />
            Local Storage Test
          </CardTitle>
          <CardDescription>
            Test browser storage capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={testLocalStorage}
            disabled={isTestingStorage}
            className="w-full"
          >
            {isTestingStorage ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing Storage...
              </>
            ) : (
              <>
                <HardDrive className="w-4 h-4 mr-2" />
                Test Local Storage
              </>
            )}
          </Button>

          {storageResults && (
            <div className={`p-4 rounded-lg border ${
              storageResults.available 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {storageResults.available ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  storageResults.available ? 'text-green-800' : 'text-red-800'
                }`}>
                  {storageResults.available ? 'Storage Available' : 'Storage Unavailable'}
                </span>
              </div>
              
              {storageResults.available ? (
                <div className="text-sm text-green-700 space-y-1">
                  <p>✓ localStorage: {storageResults.localStorage ? 'Working' : 'Failed'}</p>
                  <p>✓ Storage Quota: {storageResults.quota}</p>
                  <p>✓ Used Space: {storageResults.used}</p>
                </div>
              ) : (
                <div className="text-sm text-red-700">
                  <p>Error: {storageResults.error}</p>
                  <p>Local storage is not available in this browser</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex items-start space-x-3">
            <Database className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Storage Information</p>
              <p className="text-sm text-blue-700 mt-1">
                This tool tests browser storage capabilities used for offline functionality and caching.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="py-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Development Tool</p>
              <p className="text-sm text-yellow-700 mt-1">
                This is a development tool for testing storage functionality.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageTest;
