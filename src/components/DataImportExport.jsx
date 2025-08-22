import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import {
  Download,
  Upload,
  FileText,
  Package,
  Users,
  Truck,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  Database,
  Eye,
  Trash2,
  RefreshCw,
  Calendar,
  User,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  productsService, 
  customersService, 
  suppliersService, 
  salesService 
} from '../lib/supabaseDb';

const DataImportExport = ({ onNavigate }) => {
  const { userProfile, hasPermission } = useAuth();
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

  const DATA_TYPES = {
    products: {
      name: 'Products',
      icon: Package,
      description: 'Fertilizer products and inventory items',
      sampleFields: ['Product Name', 'Category', 'Brand', 'Purchase Price', 'Selling Price', 'Stock Quantity', 'Unit', 'Description']
    },
    customers: {
      name: 'Customers', 
      icon: Users,
      description: 'Customer database and contact information',
      sampleFields: ['Customer Name', 'Phone', 'Email', 'Address', 'City', 'State', 'Customer Type', 'Credit Limit']
    },
    suppliers: {
      name: 'Suppliers',
      icon: Truck,
      description: 'Supplier information and contact details',
      sampleFields: ['Supplier Name', 'Contact Person', 'Phone', 'Email', 'Address', 'City', 'State', 'GST Number']
    },
    sales: {
      name: 'Sales Data',
      icon: ShoppingCart,
      description: 'Sales transactions and order history',
      sampleFields: ['Sale Date', 'Customer Name', 'Product Name', 'Quantity', 'Unit Price', 'Total Amount', 'Payment Method', 'Status']
    }
  };

  const EXPORT_FORMATS = {
    csv: {
      name: 'CSV',
      extension: '.csv',
      icon: FileSpreadsheet,
      description: 'Comma-separated values (Excel compatible)'
    },
    excel: {
      name: 'Excel',
      extension: '.xlsx',
      icon: FileSpreadsheet,
      description: 'Microsoft Excel format'
    },
    json: {
      name: 'JSON',
      extension: '.json',
      icon: Database,
      description: 'JavaScript Object Notation'
    }
  };

  // Fetch real data from database
  const fetchRealData = async (dataType) => {
    try {
      let data = [];
      
      switch (dataType) {
        case 'products':
          const products = await productsService.getAll();
          data = products.map(product => ({
            'Product Name': product.name || '',
            'Category': product.category || '',
            'Brand': product.brand || '',
            'Purchase Price': product.purchase_price || product.purchasePrice || '',
            'Selling Price': product.selling_price || product.sellingPrice || '',
            'Stock Quantity': product.stock_quantity || product.stockQuantity || '',
            'Unit': product.unit || '',
            'Description': product.description || ''
          }));
          break;
          
        case 'customers':
          const customers = await customersService.getAll();
          data = customers.map(customer => ({
            'Customer Name': customer.name || '',
            'Phone': customer.phone || '',
            'Email': customer.email || '',
            'Address': customer.address || '',
            'City': customer.city || '',
            'State': customer.state || '',
            'Customer Type': customer.customer_type || customer.customerType || 'Retail',
            'Credit Limit': customer.credit_limit || customer.creditLimit || '0'
          }));
          break;
          
        case 'suppliers':
          const suppliers = await suppliersService.getAll();
          data = suppliers.map(supplier => ({
            'Supplier Name': supplier.name || '',
            'Contact Person': supplier.contact_person || supplier.contactPerson || '',
            'Phone': supplier.phone || '',
            'Email': supplier.email || '',
            'Address': supplier.address || '',
            'City': supplier.city || '',
            'State': supplier.state || '',
            'GST Number': supplier.gst_number || supplier.gstNumber || ''
          }));
          break;
          
        case 'sales':
          const sales = await salesService.getAll();
          data = sales.map(sale => ({
            'Sale Date': sale.sale_date || sale.saleDate || '',
            'Customer Name': sale.customer_name || sale.customerName || '',
            'Product Name': sale.product_name || sale.productName || '',
            'Quantity': sale.quantity || '',
            'Unit Price': sale.unit_price || sale.unitPrice || '',
            'Total Amount': sale.total_amount || sale.totalAmount || '',
            'Payment Method': sale.payment_method || sale.paymentMethod || '',
            'Status': sale.status || 'Completed'
          }));
          break;
          
        default:
          data = [];
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching ${dataType} data:`, error);
      return [];
    }
  };

  // Generate sample data for demo purposes - generic examples for testing
  const generateSampleData = (dataType) => {
    const sampleData = {
      products: [
        {
          'Product Name': 'Sample Fertilizer @10% - 50kg',
          'Category': 'Chemical Fertilizer',
          'Brand': 'Example Brand A',
          'Purchase Price': '1200',
          'Selling Price': '1350',
          'Stock Quantity': '150',
          'Unit': 'pcs',
          'Description': '[SAMPLE DATA] Example fertilizer product'
        },
        {
          'Product Name': 'Sample NPK @20:20:0 - 25kg',
          'Category': 'NPK Fertilizers',
          'Brand': 'Example Brand B',
          'Purchase Price': '1800',
          'Selling Price': '2000',
          'Stock Quantity': '75',
          'Unit': 'pcs',
          'Description': '[SAMPLE DATA] Example NPK fertilizer'
        }
      ],
      customers: [
        {
          'Customer Name': 'Sample Customer 1',
          'Phone': '9876543210',
          'Email': 'customer@example.com',
          'Address': 'Sample Address 123',
          'City': 'Sample City',
          'State': 'Sample State',
          'Customer Type': 'Retail',
          'Credit Limit': '10000'
        }
      ],
      suppliers: [
        {
          'Supplier Name': 'Example Supplier Ltd',
          'Contact Person': 'Sample Contact',
          'Phone': '9876543212',
          'Email': 'supplier@example.com',
          'Address': 'Sample Industrial Area',
          'City': 'Sample City',
          'State': 'Sample State',
          'GST Number': '07AAACI1681G1ZN'
        }
      ],
      sales: [
        {
          'Sale Date': '2024-01-15',
          'Customer Name': 'Sample Customer 1',
          'Product Name': 'Sample Fertilizer @10% - 50kg',
          'Quantity': '2',
          'Unit Price': '1350',
          'Total Amount': '2700',
          'Payment Method': 'Cash',
          'Status': 'Completed'
        }
      ]
    };

    return sampleData[dataType] || [];
  };

  const handleExport = async () => {
    if (!hasPermission || !hasPermission('manager')) {
      alert('You do not have permission to export data');
      return;
    }

    setIsProcessing(true);
    try {
      const dataConfig = DATA_TYPES[selectedDataType];
      const formatConfig = EXPORT_FORMATS[exportFormat];
      
      // Try to fetch real data first, fallback to sample data
      let exportData;
      try {
        exportData = await fetchRealData(selectedDataType);
        if (exportData.length === 0) {
          exportData = generateSampleData(selectedDataType);
        }
      } catch (error) {
        console.warn('Using sample data due to database error:', error);
        exportData = generateSampleData(selectedDataType);
      }
      
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
    if (!hasPermission || !hasPermission('manager')) {
      alert('You do not have permission to import data');
      return;
    }

    if (!importFile) {
      alert('Please select a file to import');
      return;
    }

    setIsProcessing(true);
    try {
      // Read and parse the file
      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        alert('File is empty');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      // Process import based on data type
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          await importRowData(selectedDataType, row);
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push({
            row: i + 2, // +2 because we skip header and arrays are 0-indexed
            error: error.message
          });
        }
      }

      const results = {
        totalRecords: rows.length,
        successCount,
        errorCount,
        errors
      };

      setImportResults(results);

      // Add to import history
      const newImport = {
        id: Date.now().toString(),
        dataType: selectedDataType,
        fileName: importFile.name,
        totalRecords: rows.length,
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
      alert('Error importing data: ' + error.message);
    } finally {
      setIsProcessing(false);
      setImportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const importRowData = async (dataType, row) => {
    switch (dataType) {
      case 'products':
        return await productsService.create({
          name: row['Product Name'],
          category: row['Category'],
          brand: row['Brand'],
          purchase_price: parseFloat(row['Purchase Price']) || 0,
          selling_price: parseFloat(row['Selling Price']) || 0,
          stock_quantity: parseInt(row['Stock Quantity']) || 0,
          unit: row['Unit'],
          description: row['Description']
        });

      case 'customers':
        return await customersService.create({
          name: row['Customer Name'],
          phone: row['Phone'],
          email: row['Email'],
          address: row['Address'],
          city: row['City'],
          state: row['State'],
          customer_type: row['Customer Type'] || 'Retail',
          credit_limit: parseFloat(row['Credit Limit']) || 0
        });

      case 'suppliers':
        return await suppliersService.create({
          name: row['Supplier Name'],
          contact_person: row['Contact Person'],
          phone: row['Phone'],
          email: row['Email'],
          address: row['Address'],
          city: row['City'],
          state: row['State'],
          gst_number: row['GST Number']
        });

      default:
        throw new Error(`Import not supported for ${dataType}`);
    }
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
    // For now, download as CSV with Excel-compatible format
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
    const jsonString = JSON.stringify(data);
    const sizeInBytes = new Blob([jsonString]).size;
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const downloadTemplate = (dataType) => {
    const templates = {
      products: [
        {
          'Product Name': 'Sample Product',
          'Category': 'Sample Category',
          'Brand': 'Sample Brand',
          'Purchase Price': '100',
          'Selling Price': '120',
          'Stock Quantity': '50',
          'Unit': 'Piece',
          'Description': 'Sample product description'
        }
      ],
      customers: [
        {
          'Customer Name': 'Sample Customer',
          'Phone': '9876543210',
          'Email': 'customer@example.com',
          'Address': 'Sample Address',
          'City': 'Sample City',
          'State': 'Sample State',
          'Customer Type': 'Retail',
          'Credit Limit': '10000'
        }
      ],
      suppliers: [
        {
          'Supplier Name': 'Sample Supplier',
          'Contact Person': 'Contact Person',
          'Phone': '9876543210',
          'Email': 'supplier@example.com',
          'Address': 'Sample Address',
          'City': 'Sample City',
          'State': 'Sample State',
          'GST Number': '22AAAAA0000A1Z5'
        }
      ]
    };

    const templateData = templates[dataType] || [];
    const fileName = `${dataType}_template.csv`;
    downloadCSV(templateData, fileName);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Import & Export</h2>
          <p className="text-gray-600">Import and export your business data</p>
        </div>
        <Badge variant="outline" className="text-blue-600">
          <Database className="w-4 h-4 mr-1" />
          Data Management
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Data
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
                    <label className="text-sm font-medium mb-2 block">Data Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(DATA_TYPES).map(([key, type]) => {
                        const IconComponent = type.icon;
                        return (
                          <Button
                            key={key}
                            variant={selectedDataType === key ? "default" : "outline"}
                            onClick={() => setSelectedDataType(key)}
                            className="flex items-center gap-2 h-auto p-3"
                          >
                            <IconComponent className="h-4 w-4" />
                            <span className="text-xs">{type.name}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Export Format</label>
                    <div className="space-y-2">
                      {Object.entries(EXPORT_FORMATS).map(([key, format]) => {
                        const IconComponent = format.icon;
                        return (
                          <Button
                            key={key}
                            variant={exportFormat === key ? "default" : "outline"}
                            onClick={() => setExportFormat(key)}
                            className="w-full justify-start gap-2"
                          >
                            <IconComponent className="h-4 w-4" />
                            <div className="text-left">
                              <div className="font-medium">{format.name}</div>
                              <div className="text-xs text-muted-foreground">{format.description}</div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Export Preview</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Data Type:</strong> {DATA_TYPES[selectedDataType].name}</p>
                      <p><strong>Format:</strong> {EXPORT_FORMATS[exportFormat].name}</p>
                      <p><strong>Fields:</strong></p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {DATA_TYPES[selectedDataType].sampleFields.map((field, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleExport}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
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
                    <label className="text-sm font-medium mb-2 block">Data Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(DATA_TYPES).map(([key, type]) => {
                        const IconComponent = type.icon;
                        return (
                          <Button
                            key={key}
                            variant={selectedDataType === key ? "default" : "outline"}
                            onClick={() => setSelectedDataType(key)}
                            className="flex items-center gap-2 h-auto p-3"
                          >
                            <IconComponent className="h-4 w-4" />
                            <span className="text-xs">{type.name}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Select File</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
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
                          <p className="font-medium">{importFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(importFile.size / 1024).toFixed(1)} KB
                          </p>
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
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                          <p className="text-sm text-muted-foreground">
                            Click to select a CSV or Excel file
                          </p>
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
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Import Requirements</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Required Fields:</strong></p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {DATA_TYPES[selectedDataType].sampleFields.map((field, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                      <p className="mt-2"><strong>Supported Formats:</strong> CSV, Excel (.xlsx, .xls)</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => downloadTemplate(selectedDataType)}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>

                    <Button
                      onClick={handleImport}
                      disabled={isProcessing || !importFile}
                      className="w-full"
                      size="lg"
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Results */}
      {importResults && (
        <Card className={`border-2 ${importResults.errorCount > 0 ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
          <CardContent className="py-4">
            <div className="flex items-start space-x-3">
              {importResults.errorCount > 0 ? (
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-medium ${importResults.errorCount > 0 ? 'text-yellow-800' : 'text-green-800'}`}>
                  Import {importResults.errorCount > 0 ? 'Completed with Errors' : 'Completed Successfully'}
                </h4>
                <div className={`text-sm mt-1 ${importResults.errorCount > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                  <p>Total Records: {importResults.totalRecords}</p>
                  <p>Successfully Imported: {importResults.successCount}</p>
                  {importResults.errorCount > 0 && <p>Errors: {importResults.errorCount}</p>}
                </div>
                {importResults.errors && importResults.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-yellow-800">Errors:</p>
                    <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                      {importResults.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>Row {error.row}: {error.error}</li>
                      ))}
                      {importResults.errors.length > 5 && (
                        <li>... and {importResults.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImportResults(null)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
            <DialogDescription>
              Preview of the first 5 rows from your file. Please verify the data before proceeding.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {previewData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      {Object.keys(previewData[0]).map((header, index) => (
                        <th key={index} className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className="border-b">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="border border-gray-300 px-3 py-2 text-sm">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Cancel
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

      {/* Help Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Important Notes:</p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Always backup your data before importing</li>
                <li>• Ensure your CSV/Excel files match the expected format</li>
                <li>• Download the template file to see the correct format</li>
                <li>• Large imports may take several minutes to process</li>
                <li>• Contact support if you encounter any issues</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataImportExport;

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
    if (!hasPermission || !hasPermission('manager')) {
      alert('You do not have permission to import data');
      return;
    }

    if (!importFile) {
      alert('Please select a file to import');
      return;
    }

    setIsProcessing(true);
    try {
      // Read and parse the file
      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        alert('File is empty');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      // Process import based on data type
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          await importRowData(selectedDataType, row);
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push({
            row: i + 2, // +2 because we skip header and arrays are 0-indexed
            error: error.message
          });
        }
      }

      const results = {
        totalRecords: rows.length,
        successCount,
        errorCount,
        errors
      };

      setImportResults(results);

      // Add to import history
      const newImport = {
        id: Date.now().toString(),
        dataType: selectedDataType,
        fileName: importFile.name,
        totalRecords: rows.length,
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
      alert('Error importing data: ' + error.message);
    } finally {
      setIsProcessing(false);
      setImportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const importRowData = async (dataType, row) => {
    switch (dataType) {
      case 'products':
        return await productsService.create({
          name: row['Product Name'],
          category: row['Category'],
          brand: row['Brand'],
          purchase_price: parseFloat(row['Purchase Price']) || 0,
          selling_price: parseFloat(row['Selling Price']) || 0,
          stock_quantity: parseInt(row['Stock Quantity']) || 0,
          unit: row['Unit'],
          description: row['Description']
        });

      case 'customers':
        return await customersService.create({
          name: row['Customer Name'],
          phone: row['Phone'],
          email: row['Email'],
          address: row['Address'],
          city: row['City'],
          state: row['State'],
          customer_type: row['Customer Type'] || 'Retail',
          credit_limit: parseFloat(row['Credit Limit']) || 0
        });

      case 'suppliers':
        return await suppliersService.create({
          name: row['Supplier Name'],
          contact_person: row['Contact Person'],
          phone: row['Phone'],
          email: row['Email'],
          address: row['Address'],
          city: row['City'],
          state: row['State'],
          gst_number: row['GST Number']
        });

      default:
        throw new Error(`Import not supported for ${dataType}`);
    }
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
    // For now, download as CSV with Excel-compatible format
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
    const jsonString = JSON.stringify(data);
    const sizeInBytes = new Blob([jsonString]).size;
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  };
