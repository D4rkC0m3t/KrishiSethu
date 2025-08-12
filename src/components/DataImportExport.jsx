import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import {
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Trash2,
  Settings,
  Calendar,
  Users,
  Package,
  Truck,
  ShoppingCart,
  BarChart3,
  FileDown,
  FileUp,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DataImportExport = ({ onNavigate }) => {
  const { currentUser, userProfile, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('export');
  const [selectedDataType, setSelectedDataType] = useState('products');
  const [exportFormat, setExportFormat] = useState('csv');
  const [importFile, setImportFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const fileInputRef = useRef(null);

  // Data type configurations
  const DATA_TYPES = {
    products: {
      name: 'Products',
      icon: Package,
      description: 'Fertilizer products and inventory items',
      fields: ['name', 'category', 'brand', 'batchNo', 'quantity', 'purchasePrice', 'salePrice', 'unit', 'expiryDate', 'supplier'],
      sampleData: [
        { name: 'NPK 20-20-20', category: 'NPK', brand: 'Tata', batchNo: 'TC2024001', quantity: 100, purchasePrice: 850, salePrice: 950, unit: 'kg', expiryDate: '2025-12-31', supplier: 'Tata Chemicals' },
        { name: 'Urea', category: 'Nitrogen', brand: 'IFFCO', batchNo: 'IF2024002', quantity: 200, purchasePrice: 280, salePrice: 320, unit: 'kg', expiryDate: '2026-06-30', supplier: 'IFFCO Ltd' }
      ]
    },
    customers: {
      name: 'Customers',
      icon: Users,
      description: 'Customer database and contact information',
      fields: ['name', 'phone', 'email', 'address', 'city', 'pincode', 'creditLimit', 'currentCredit', 'status'],
      sampleData: [
        { name: 'Rajesh Farmer', phone: '+91-9876543210', email: 'rajesh@example.com', address: 'Village Kharadi', city: 'Pune', pincode: '411014', creditLimit: 50000, currentCredit: 15000, status: 'Active' },
        { name: 'Sunita Agro Dealer', phone: '+91-9876543211', email: 'sunita@agrostore.com', address: 'Shop 15, Market Yard', city: 'Mumbai', pincode: '400001', creditLimit: 100000, currentCredit: 25000, status: 'VIP' }
      ]
    },
    suppliers: {
      name: 'Suppliers',
      icon: Truck,
      description: 'Supplier information and contact details',
      fields: ['name', 'contactPerson', 'phone', 'email', 'address', 'city', 'state', 'pincode', 'gstNumber', 'status'],
      sampleData: [
        { name: 'Tata Chemicals Ltd', contactPerson: 'Mr. Sharma', phone: '+91-9876543212', email: 'sales@tatachemicals.com', address: 'Industrial Area', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', gstNumber: '27AAAAA0000A1Z5', status: 'Active' },
        { name: 'IFFCO Limited', contactPerson: 'Ms. Patel', phone: '+91-9876543213', email: 'orders@iffco.com', address: 'Sector 15', city: 'Delhi', state: 'Delhi', pincode: '110001', gstNumber: '07BBBBB1111B2Z6', status: 'Active' }
      ]
    },
    sales: {
      name: 'Sales Data',
      icon: ShoppingCart,
      description: 'Sales transactions and order history',
      fields: ['saleNumber', 'customerName', 'productName', 'quantity', 'unitPrice', 'totalPrice', 'paymentMethod', 'saleDate', 'status'],
      sampleData: [
        { saleNumber: 'SALE20250107001', customerName: 'Rajesh Farmer', productName: 'NPK 20-20-20', quantity: 2, unitPrice: 950, totalPrice: 1900, paymentMethod: 'cash', saleDate: '2025-01-07', status: 'completed' },
        { saleNumber: 'SALE20250107002', customerName: 'Sunita Agro Dealer', productName: 'Urea', quantity: 5, unitPrice: 320, totalPrice: 1600, paymentMethod: 'upi', saleDate: '2025-01-07', status: 'completed' }
      ]
    },
    purchases: {
      name: 'Purchase Data',
      icon: FileText,
      description: 'Purchase orders and supplier transactions',
      fields: ['purchaseNumber', 'supplierName', 'productName', 'quantity', 'unitPrice', 'totalPrice', 'orderDate', 'deliveryDate', 'status'],
      sampleData: [
        { purchaseNumber: 'PUR20250107001', supplierName: 'Tata Chemicals Ltd', productName: 'NPK 20-20-20', quantity: 100, unitPrice: 850, totalPrice: 85000, orderDate: '2025-01-05', deliveryDate: '2025-01-07', status: 'delivered' },
        { purchaseNumber: 'PUR20250107002', supplierName: 'IFFCO Limited', productName: 'Urea', quantity: 200, unitPrice: 280, totalPrice: 56000, orderDate: '2025-01-06', deliveryDate: '2025-01-08', status: 'pending' }
      ]
    }
  };

  // Export formats
  const EXPORT_FORMATS = {
    csv: { name: 'CSV', extension: '.csv', icon: FileText },
    excel: { name: 'Excel', extension: '.xlsx', icon: FileSpreadsheet },
    json: { name: 'JSON', extension: '.json', icon: Database }
  };

  // Initialize history data
  React.useEffect(() => {
    // Mock export history
    setExportHistory([
      {
        id: '1',
        dataType: 'products',
        format: 'csv',
        recordCount: 156,
        fileSize: '45 KB',
        exportedAt: new Date('2025-01-07T10:30:00'),
        exportedBy: 'System Administrator',
        status: 'completed'
      },
      {
        id: '2',
        dataType: 'customers',
        format: 'excel',
        recordCount: 89,
        fileSize: '32 KB',
        exportedAt: new Date('2025-01-06T15:45:00'),
        exportedBy: 'Rajesh Kumar',
        status: 'completed'
      }
    ]);

    // Mock import history
    setImportHistory([
      {
        id: '1',
        dataType: 'products',
        fileName: 'new_products_batch.csv',
        recordCount: 25,
        successCount: 23,
        errorCount: 2,
        importedAt: new Date('2025-01-07T09:15:00'),
        importedBy: 'System Administrator',
        status: 'completed'
      },
      {
        id: '2',
        dataType: 'suppliers',
        fileName: 'supplier_update.xlsx',
        recordCount: 12,
        successCount: 12,
        errorCount: 0,
        importedAt: new Date('2025-01-06T14:20:00'),
        importedBy: 'Rajesh Kumar',
        status: 'completed'
      }
    ]);
  }, []);

  const handleExport = async () => {
    if (!hasPermission('manager')) {
      alert('You do not have permission to export data');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const dataConfig = DATA_TYPES[selectedDataType];
      const formatConfig = EXPORT_FORMATS[exportFormat];
      
      // Generate export data
      const exportData = generateExportData(selectedDataType);
      
      // Create and download file
      const fileName = `${selectedDataType}_export_${new Date().toISOString().split('T')[0]}${formatConfig.extension}`;
      
      if (exportFormat === 'csv') {
        downloadCSV(exportData, fileName);
      } else if (exportFormat === 'excel') {
        downloadExcel(exportData, fileName);
      } else if (exportFormat === 'json') {
        downloadJSON(exportData, fileName);
      }
      
      // Add to export history
      const newExport = {
        id: Date.now().toString(),
        dataType: selectedDataType,
        format: exportFormat,
        recordCount: exportData.length,
        fileSize: calculateFileSize(exportData),
        exportedAt: new Date(),
        exportedBy: userProfile?.name || 'User',
        status: 'completed'
      };
      
      setExportHistory(prev => [newExport, ...prev]);
      alert(`${dataConfig.name} exported successfully as ${formatConfig.name}!`);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting data');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportFile(file);
      previewImportFile(file);
    }
  };

  const previewImportFile = async (file) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        alert('File is empty');
        return;
      }
      
      // Parse CSV data
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
      
      setPreviewData(data);
      setShowPreviewDialog(true);
    } catch (error) {
      console.error('Preview error:', error);
      alert('Error reading file');
    }
  };

  const handleImport = async () => {
    if (!hasPermission('manager')) {
      alert('You do not have permission to import data');
      return;
    }

    if (!importFile) {
      alert('Please select a file to import');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock import results
      const totalRecords = Math.floor(Math.random() * 50) + 10;
      const errorCount = Math.floor(Math.random() * 3);
      const successCount = totalRecords - errorCount;
      
      const results = {
        totalRecords,
        successCount,
        errorCount,
        errors: errorCount > 0 ? [
          { row: 3, field: 'email', message: 'Invalid email format' },
          { row: 7, field: 'price', message: 'Price must be a number' }
        ] : []
      };
      
      setImportResults(results);
      
      // Add to import history
      const newImport = {
        id: Date.now().toString(),
        dataType: selectedDataType,
        fileName: importFile.name,
        recordCount: totalRecords,
        successCount,
        errorCount,
        importedAt: new Date(),
        importedBy: userProfile?.name || 'User',
        status: errorCount === 0 ? 'completed' : 'completed_with_errors'
      };
      
      setImportHistory(prev => [newImport, ...prev]);
      
      if (errorCount === 0) {
        alert(`Import completed successfully! ${successCount} records imported.`);
      } else {
        alert(`Import completed with ${errorCount} errors. ${successCount} records imported successfully.`);
      }
      
    } catch (error) {
      console.error('Import error:', error);
      alert('Error importing data');
    } finally {
      setIsProcessing(false);
      setImportFile(null);
      setPreviewData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const generateExportData = (dataType) => {
    const config = DATA_TYPES[dataType];
    // In real app, fetch from Firebase/database
    // For demo, return sample data with more records
    const baseData = config.sampleData;
    const expandedData = [];
    
    for (let i = 0; i < 50; i++) {
      const record = { ...baseData[i % baseData.length] };
      // Modify some fields to create variation
      if (record.name) record.name = `${record.name} ${i + 1}`;
      if (record.batchNo) record.batchNo = `${record.batchNo.slice(0, -3)}${String(i + 1).padStart(3, '0')}`;
      expandedData.push(record);
    }
    
    return expandedData;
  };

  const downloadCSV = (data, fileName) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = (data, fileName) => {
    // In real app, use libraries like xlsx
    // For demo, download as CSV with .xlsx extension
    downloadCSV(data, fileName);
  };

  const downloadJSON = (data, fileName) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const calculateFileSize = (data) => {
    const size = JSON.stringify(data).length;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${Math.round(size / (1024 * 1024))} MB`;
  };

  const downloadTemplate = () => {
    const config = DATA_TYPES[selectedDataType];
    const headers = config.fields;
    const sampleRow = config.sampleData[0];
    
    const templateData = [
      headers.reduce((obj, field) => ({ ...obj, [field]: sampleRow[field] || '' }), {})
    ];
    
    const fileName = `${selectedDataType}_template.csv`;
    downloadCSV(templateData, fileName);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'completed_with_errors':
        return <Badge variant="secondary" className="bg-yellow-500 text-white"><AlertTriangle className="h-3 w-3 mr-1" />With Errors</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Check permissions
  if (!hasPermission('staff')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have permission to access data import/export
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => onNavigate('dashboard')}>
              ← Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Database className="h-8 w-8 text-blue-600" />
              Data Import & Export
            </h1>
            <p className="text-gray-600">
              Import and export business data in various formats
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <FileDown className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')}>
              ← Dashboard
            </Button>
          </div>
        </div>

        {/* Data Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Data Type</CardTitle>
            <CardDescription>
              Choose the type of data you want to import or export
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(DATA_TYPES).map(([key, config]) => {
                const IconComponent = config.icon;
                return (
                  <div
                    key={key}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedDataType === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedDataType(key)}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="font-medium">{config.name}</h3>
                        <p className="text-sm text-gray-500">{config.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Import/Export Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import Data
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export {DATA_TYPES[selectedDataType].name}
                </CardTitle>
                <CardDescription>
                  Export your {DATA_TYPES[selectedDataType].name.toLowerCase()} data in various formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Export Format</label>
                      <Select value={exportFormat} onValueChange={setExportFormat}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(EXPORT_FORMATS).map(([key, format]) => {
                            const IconComponent = format.icon;
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-4 w-4" />
                                  {format.name} ({format.extension})
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fields to Export</label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex flex-wrap gap-2">
                          {DATA_TYPES[selectedDataType].fields.map((field) => (
                            <Badge key={field} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Export Preview</h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <div>Data Type: {DATA_TYPES[selectedDataType].name}</div>
                        <div>Format: {EXPORT_FORMATS[exportFormat].name}</div>
                        <div>Estimated Records: ~50</div>
                        <div>File Size: ~15 KB</div>
                      </div>
                    </div>

                    <Button
                      onClick={handleExport}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export {DATA_TYPES[selectedDataType].name}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import {DATA_TYPES[selectedDataType].name}
                </CardTitle>
                <CardDescription>
                  Upload and import {DATA_TYPES[selectedDataType].name.toLowerCase()} data from CSV or Excel files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select File</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        {importFile ? (
                          <div className="space-y-2">
                            <FileText className="h-8 w-8 text-green-600 mx-auto" />
                            <div className="text-sm font-medium">{importFile.name}</div>
                            <div className="text-xs text-gray-500">
                              {(importFile.size / 1024).toFixed(1)} KB
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Change File
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <FileUp className="h-8 w-8 text-gray-400 mx-auto" />
                            <div className="text-sm text-gray-600">
                              Click to select a CSV or Excel file
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Select File
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Required Fields</label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex flex-wrap gap-2">
                          {DATA_TYPES[selectedDataType].fields.slice(0, 5).map((field) => (
                            <Badge key={field} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                          {DATA_TYPES[selectedDataType].fields.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{DATA_TYPES[selectedDataType].fields.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">Import Guidelines</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Use CSV or Excel format</li>
                        <li>• First row should contain headers</li>
                        <li>• Required fields must not be empty</li>
                        <li>• Download template for correct format</li>
                        <li>• Maximum 1000 records per import</li>
                      </ul>
                    </div>

                    <Button
                      onClick={handleImport}
                      disabled={!importFile || isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Import Data
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Import Results */}
                {importResults && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Import Results</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-green-700">Total Records</div>
                        <div className="font-medium">{importResults.totalRecords}</div>
                      </div>
                      <div>
                        <div className="text-green-700">Successful</div>
                        <div className="font-medium text-green-600">{importResults.successCount}</div>
                      </div>
                      <div>
                        <div className="text-green-700">Errors</div>
                        <div className="font-medium text-red-600">{importResults.errorCount}</div>
                      </div>
                    </div>
                    {importResults.errors.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-red-700 mb-1">Errors:</div>
                        {importResults.errors.map((error, index) => (
                          <div key={index} className="text-xs text-red-600">
                            Row {error.row}: {error.field} - {error.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Export History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export History
                  </CardTitle>
                  <CardDescription>
                    Recent data export activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {exportHistory.map((export_) => (
                      <div key={export_.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{DATA_TYPES[export_.dataType].name}</div>
                          {getStatusBadge(export_.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>Format: {export_.format.toUpperCase()}</div>
                          <div>Records: {export_.recordCount}</div>
                          <div>Size: {export_.fileSize}</div>
                          <div>By: {export_.exportedBy}</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {export_.exportedAt.toLocaleDateString()} {export_.exportedAt.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Import History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Import History
                  </CardTitle>
                  <CardDescription>
                    Recent data import activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {importHistory.map((import_) => (
                      <div key={import_.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{import_.fileName}</div>
                          {getStatusBadge(import_.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>Type: {DATA_TYPES[import_.dataType].name}</div>
                          <div>Records: {import_.recordCount}</div>
                          <div>Success: {import_.successCount}</div>
                          <div>Errors: {import_.errorCount}</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {import_.importedAt.toLocaleDateString()} {import_.importedAt.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Import Preview</DialogTitle>
              <DialogDescription>
                Preview of the first 5 rows from your import file
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-auto">
              {previewData.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(previewData[0]).map((header) => (
                        <th key={header} className="text-left py-2 px-3 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className="border-b">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="py-2 px-3">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                Close Preview
              </Button>
              <Button onClick={() => {
                setShowPreviewDialog(false);
                handleImport();
              }}>
                Proceed with Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DataImportExport;
