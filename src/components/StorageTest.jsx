import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { storageService } from '../lib/storage';
import { 
  Upload, 
  Image, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Trash2,
  Eye
} from 'lucide-react';

const StorageTest = () => {
  const [uploads, setUploads] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  // Test product image upload
  const testProductImageUpload = async (file) => {
    try {
      setUploading(true);
      const productId = 'test-product-' + Date.now();
      
      const result = await storageService.uploadProductImage(file, productId, (progress) => {
        console.log('Upload progress:', progress);
      });

      const uploadInfo = {
        id: Date.now(),
        type: 'Product Image',
        fileName: file.name,
        size: file.size,
        url: result.url,
        bucket: result.bucket,
        status: 'success',
        timestamp: new Date()
      };

      setUploads(prev => [uploadInfo, ...prev]);
      setTestResults(prev => [...prev, { type: 'Product Image', status: 'success', message: 'Upload successful' }]);
      
    } catch (error) {
      console.error('Product image upload failed:', error);
      setTestResults(prev => [...prev, { type: 'Product Image', status: 'error', message: error.message }]);
    } finally {
      setUploading(false);
    }
  };

  // Test product document upload
  const testProductDocumentUpload = async (file) => {
    try {
      setUploading(true);
      const productId = 'test-product-' + Date.now();
      
      const result = await storageService.uploadProductDocument(file, productId, (progress) => {
        console.log('Upload progress:', progress);
      });

      const uploadInfo = {
        id: Date.now(),
        type: 'Product Document',
        fileName: file.name,
        size: file.size,
        url: result.url,
        bucket: result.bucket,
        status: 'success',
        timestamp: new Date()
      };

      setUploads(prev => [uploadInfo, ...prev]);
      setTestResults(prev => [...prev, { type: 'Product Document', status: 'success', message: 'Upload successful' }]);
      
    } catch (error) {
      console.error('Product document upload failed:', error);
      setTestResults(prev => [...prev, { type: 'Product Document', status: 'error', message: error.message }]);
    } finally {
      setUploading(false);
    }
  };

  // Test POS image upload
  const testPOSImageUpload = async (file) => {
    try {
      setUploading(true);
      const saleId = 'test-sale-' + Date.now();
      
      const result = await storageService.uploadPOSImage(file, saleId, (progress) => {
        console.log('Upload progress:', progress);
      });

      const uploadInfo = {
        id: Date.now(),
        type: 'POS Image',
        fileName: file.name,
        size: file.size,
        url: result.url,
        bucket: result.bucket,
        status: 'success',
        timestamp: new Date()
      };

      setUploads(prev => [uploadInfo, ...prev]);
      setTestResults(prev => [...prev, { type: 'POS Image', status: 'success', message: 'Upload successful' }]);
      
    } catch (error) {
      console.error('POS image upload failed:', error);
      setTestResults(prev => [...prev, { type: 'POS Image', status: 'error', message: error.message }]);
    } finally {
      setUploading(false);
    }
  };

  // Test POS document upload
  const testPOSDocumentUpload = async (file) => {
    try {
      setUploading(true);
      const saleId = 'test-sale-' + Date.now();
      
      const result = await storageService.uploadPOSDocument(file, saleId, (progress) => {
        console.log('Upload progress:', progress);
      });

      const uploadInfo = {
        id: Date.now(),
        type: 'POS Document',
        fileName: file.name,
        size: file.size,
        url: result.url,
        bucket: result.bucket,
        status: 'success',
        timestamp: new Date()
      };

      setUploads(prev => [uploadInfo, ...prev]);
      setTestResults(prev => [...prev, { type: 'POS Document', status: 'success', message: 'Upload successful' }]);
      
    } catch (error) {
      console.error('POS document upload failed:', error);
      setTestResults(prev => [...prev, { type: 'POS Document', status: 'error', message: error.message }]);
    } finally {
      setUploading(false);
    }
  };

  // Handle file selection
  const handleFileUpload = async (event, uploadType) => {
    const file = event.target.files[0];
    if (!file) return;

    switch (uploadType) {
      case 'product-image':
        await testProductImageUpload(file);
        break;
      case 'product-document':
        await testProductDocumentUpload(file);
        break;
      case 'pos-image':
        await testPOSImageUpload(file);
        break;
      case 'pos-document':
        await testPOSDocumentUpload(file);
        break;
      default:
        console.error('Unknown upload type:', uploadType);
    }

    // Reset file input
    event.target.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearResults = () => {
    setUploads([]);
    setTestResults([]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Storage Upload Test</h1>
        <Button onClick={clearResults} variant="outline" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Results
        </Button>
      </div>

      {/* Upload Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Product Image Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Image className="h-4 w-4" />
              Product Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'product-image')}
              disabled={uploading}
              className="text-xs"
            />
            <p className="text-xs text-gray-500 mt-1">Max: 10MB</p>
          </CardContent>
        </Card>

        {/* Product Document Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Product Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
              onChange={(e) => handleFileUpload(e, 'product-document')}
              disabled={uploading}
              className="text-xs"
            />
            <p className="text-xs text-gray-500 mt-1">Max: 20MB</p>
          </CardContent>
        </Card>

        {/* POS Image Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Image className="h-4 w-4" />
              POS Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'pos-image')}
              disabled={uploading}
              className="text-xs"
            />
            <p className="text-xs text-gray-500 mt-1">Max: 5MB</p>
          </CardContent>
        </Card>

        {/* POS Document Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              POS Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => handleFileUpload(e, 'pos-document')}
              disabled={uploading}
              className="text-xs"
            />
            <p className="text-xs text-gray-500 mt-1">Max: 10MB</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Status */}
      {uploading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading file...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded border">
                  {result.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                    {result.type}
                  </Badge>
                  <span className="text-sm">{result.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files */}
      {uploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploads.map((upload) => (
                <div key={upload.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {upload.type.includes('Image') ? (
                      <Image className="h-5 w-5 text-blue-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{upload.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {upload.type} • {formatFileSize(upload.size)} • {upload.bucket}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(upload.url, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StorageTest;
