import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { salesService, productsService, purchasesService, settingsOperations } from '../lib/supabaseDb';
import InvoicePreview from './InvoicePreview';
import ReportHeader from './reports/ReportHeader';
import {
  BarChart3,
  TrendingUp,
  Download,
  FileText,
  Calendar,
  Filter,
  RefreshCw,
  Printer,
  Target,
  AlertTriangle,
  CheckCircle,
  Calculator,
  Percent,
  PieChart,
  Activity,
  Database,
  Eye
} from 'lucide-react';

// ReportHeader functionality implemented inline below
import { shopDetailsService } from '../lib/shopDetails';
import GSTReports from './reports/GSTReports';
// Recharts imports removed as they're not used in this component



// Use the working InvoicePreview component instead


const Reports = ({ onNavigate, defaultTab = "overview" }) => {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('this_month');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportOrientation, setReportOrientation] = useState('portrait');
  const [autoDetectOrientation, setAutoDetectOrientation] = useState(true);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterOptions] = useState({
    category: 'all',
    supplier: 'all',
    customer: 'all',
    paymentMethod: 'all',
    status: 'all'
  });
  const [reportSchedule] = useState({
    enabled: false,
    frequency: 'weekly',
    email: '',
    format: 'pdf'
  });
  const [_realTimeData, setRealTimeData] = useState(null);
  const [salesList, setSalesList] = useState([]);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [systemSettings, setSystemSettings] = useState(null);
  const selectedSale = salesList.find(s => s.id === selectedSaleId);
  const [pdfOrientation, setPdfOrientation] = useState('portrait'); // 'portrait' | 'landscape'
  const [compactInvoice, setCompactInvoice] = useState(false); // smaller font size

  // Helper function to get date filter based on selected range
  const getDateFilter = useCallback((range) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
      case 'today':
        return {
          start: today.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          start: yesterday.toISOString(),
          end: today.toISOString()
        };
      case 'this_week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return {
          start: weekStart.toISOString(),
          end: now.toISOString()
        };
      case 'this_month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          start: monthStart.toISOString(),
          end: now.toISOString()
        };
      case 'last_month':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          start: lastMonthStart.toISOString(),
          end: lastMonthEnd.toISOString()
        };
      case 'this_year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return {
          start: yearStart.toISOString(),
          end: now.toISOString()
        };
      default:
        return {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: now.toISOString()
        };
    }
  }, []);

  // Auto-detect orientation based on data complexity
  const detectOptimalOrientation = useCallback((data) => {
    if (!autoDetectOrientation || !data) return reportOrientation;

    // Check for large tables or many columns
    const hasLargeTables = data.salesData?.length > 20 ||
                          data.inventoryData?.length > 30 ||
                          data.mandatoryFields?.length > 8;

    // Check for wide content
    const hasWideContent = data.mandatoryFields?.length > 6 ||
                          (data.summary && Object.keys(data.summary).length > 8);

    return hasLargeTables || hasWideContent ? 'landscape' : 'portrait';
  }, [autoDetectOrientation, reportOrientation]);

  // Generate empty report structure with real data structure but zero values
  const generateEmptyReportStructure = useCallback(async (reportType) => {
    const currentDate = new Date().toLocaleDateString();

    switch (reportType) {
      case 'sales':
        return {
          summary: {
            totalSales: 0,
            totalTransactions: 0,
            averageOrderValue: 0,
            topProduct: 'No sales data available',
            totalQuantity: 0,
            uniqueCustomers: 0,
            avgQuantityPerSale: 0
          },
          salesData: [],
          mandatoryFields: [
            'Date', 'Invoice No.', 'Product Name', 'Batch No.', 'Unit (Kg/L)',
            'Quantity Sold', 'Unit Price', 'Total Sales', 'Customer Name',
            'Payment Mode', 'Remarks'
          ]
        };
      case 'inventory':
        return {
          summary: {
            totalProducts: 0,
            totalValue: 0,
            lowStockItems: 0,
            outOfStockItems: 0,
            expiringItems: 0
          },
          inventoryData: [],
          mandatoryFields: [
            'Product Name', 'Batch No.', 'Unit (Kg/L)', 'Opening Stock', 'Purchases',
            'Sales', 'Closing Stock', 'Reorder Level', 'Expiry Date', 'Supplier Name', 'Remarks'
          ]
        };
      case 'financial':
        return {
          summary: {
            totalSalesRevenue: 0,
            totalCOGS: 0,
            grossProfit: 0,
            grossProfitMargin: 0,
            operatingExpenses: 0,
            netProfit: 0,
            netProfitMargin: 0
          },
          monthlyFinancialData: [],
          mandatoryFields: [
            'Period', 'Total Sales', 'COGS', 'Gross Profit', 'Expenses', 'Net Profit', 'Profit Margin (%)'
          ]
        };
      default:
        return {
          summary: { message: `No data available for ${reportType} report` },
          data: [],
          mandatoryFields: ['No Data']
        };
    }
  }, []);

  // Real data fetching functions - Fertilizer Industry Specific
  const generateSalesReport = useCallback(async (dateFilter) => {
    try {
      console.log('🔄 Starting sales report generation...');
      console.log('📅 Date filter:', dateFilter);
      console.log('🔧 Sales service:', salesService);

      if (!salesService || typeof salesService.getAll !== 'function') {
        throw new Error('Sales service is not available or not properly imported');
      }

      // Test database connection first
      console.log('🔍 Testing database connection...');
      try {
        await salesService.getAll();
        console.log('✅ Database connection test successful');
      } catch (testError) {
        console.error('❌ Database connection test failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }

      // Fetch sales data with timeout
      console.log('🔄 Fetching sales data from database...');
      const salesData = await Promise.race([
        salesService.getAll(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Sales data fetch timeout')), 8000)
        )
      ]);

      console.log('📊 Raw sales data fetched:', salesData?.length || 0, 'records');
      if (salesData && salesData.length > 0) {
        console.log('📋 Sample sales data:', salesData.slice(0, 2)); // Log first 2 records to see structure
      }

      if (!salesData || salesData.length === 0) {
        console.warn('No sales data found, returning empty structure');
        return await generateEmptyReportStructure('sales');
      }

      // Filter sales data by date range if provided
      let filteredSales = salesData;
      if (dateFilter && dateFilter.start && dateFilter.end) {
        filteredSales = salesData.filter(sale => {
          // Try multiple date field names
          const saleDate = new Date(
            sale.created_at || sale.sale_date || sale.date || sale.createdAt || sale.timestamp
          );
          const startDate = new Date(dateFilter.start);
          const endDate = new Date(dateFilter.end);
          return saleDate >= startDate && saleDate <= endDate;
        });
        console.log('📅 Filtered sales data:', filteredSales.length, 'records');
      }

      // Calculate summary metrics with flexible field mapping
      const totalSales = filteredSales.reduce((sum, sale) => {
        const amount = sale.totalAmount || sale.total_amount || sale.amount || sale.total || 0;
        return sum + parseFloat(amount);
      }, 0);

      const totalTransactions = filteredSales.length;
      const averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      const totalQuantity = filteredSales.reduce((sum, sale) => {
        const qty = sale.quantity || sale.total_quantity || sale.qty || 0;
        return sum + parseFloat(qty);
      }, 0);

      const avgQuantityPerSale = totalTransactions > 0 ? totalQuantity / totalTransactions : 0;

      // Get unique customers with flexible field mapping
      const uniqueCustomers = new Set(
        filteredSales.map(sale =>
          sale.customerName || sale.customer_name || sale.customer || sale.buyer_name || 'Walk-in Customer'
        )
      ).size;

      // Find top product with flexible field mapping
      const productSales = {};
      filteredSales.forEach(sale => {
        const productName = sale.productName || sale.product_name || sale.product || sale.item_name || 'Unknown Product';
        const qty = sale.quantity || sale.total_quantity || sale.qty || 1;
        productSales[productName] = (productSales[productName] || 0) + parseFloat(qty);
      });
      const topProduct = Object.keys(productSales).length > 0
        ? Object.keys(productSales).reduce((a, b) => productSales[a] > productSales[b] ? a : b)
        : 'No sales data';

      // Format sales data for display
      const formattedSalesData = filteredSales.map(sale => ({
        date: new Date(sale.created_at || sale.date).toLocaleDateString(),
        invoiceNo: sale.invoiceNumber || sale.invoice_number || `INV-${sale.id}`,
        productName: sale.productName || sale.product_name || 'Unknown Product',
        batchNo: sale.batchNo || sale.batch_no || 'N/A',
        unit: sale.unit || 'Kg',
        quantitySold: sale.quantity || 0,
        unitPrice: sale.unitPrice || sale.unit_price || 0,
        totalSales: sale.totalAmount || 0,
        customerName: sale.customerName || sale.customer_name || 'Unknown',
        paymentMode: sale.paymentMethod || sale.payment_method || 'Cash',
        remarks: sale.remarks || sale.notes || '—'
      }));

      // Group by payment methods
      const paymentMethods = {};
      filteredSales.forEach(sale => {
        const method = sale.paymentMethod || sale.payment_method || 'Cash';
        paymentMethods[method] = (paymentMethods[method] || 0) + (sale.totalAmount || 0);
      });

      // Top products by quantity
      const topProducts = Object.entries(productSales)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }));

      console.log('✅ Sales report generated successfully');
      console.log('📈 Summary:', { totalSales, totalTransactions, averageOrderValue, uniqueCustomers });

      return {
        summary: {
          totalSales: Math.round(totalSales),
          totalTransactions,
          averageOrderValue: Math.round(averageOrderValue),
          topProduct,
          totalQuantity: Math.round(totalQuantity),
          uniqueCustomers,
          avgQuantityPerSale: Math.round(avgQuantityPerSale * 100) / 100
        },
        salesData: formattedSalesData,
        topProducts,
        paymentMethods: Object.entries(paymentMethods).map(([method, amount]) => ({
          method,
          amount: Math.round(amount)
        })),
        mandatoryFields: [
          'Date', 'Invoice No.', 'Product Name', 'Batch No.', 'Unit (Kg/L)',
          'Quantity Sold', 'Unit Price', 'Total Sales', 'Customer Name',
          'Payment Mode', 'Remarks'
        ]
      };
    } catch (error) {
      console.error('Error generating sales report:', error);
      console.error('Error details:', error.message, error.stack);

      // Return a meaningful error structure instead of throwing
      return {
        summary: {
          totalSales: 0,
          totalTransactions: 0,
          averageOrderValue: 0,
          topProduct: 'Error loading data',
          totalQuantity: 0,
          uniqueCustomers: 0,
          avgQuantityPerSale: 0,
          error: `Failed to load sales data: ${error.message}`
        },
        salesData: [],
        topProducts: [],
        paymentMethods: [],
        mandatoryFields: [
          'Date', 'Invoice No.', 'Product Name', 'Batch No.', 'Unit (Kg/L)',
          'Quantity Sold', 'Unit Price', 'Total Sales', 'Customer Name',
          'Payment Mode', 'Remarks'
        ],
        error: true,
        errorMessage: error.message
      };
    }
  }, [generateEmptyReportStructure]);

  const generateInventoryReport = useCallback(async () => {
    try {
      // Fetch all products
      const products = await productsService.getAll();
      console.log('Fetched products for inventory report:', products.length);

      // Fetch recent purchases for opening stock calculation
      const purchasesData = await purchasesService.getAll();

      // Fetch recent sales for stock movement
      const salesData = await salesService.getAll();

      if (!products || products.length === 0) {
        console.warn('No products found, returning empty inventory structure');
        return await generateEmptyReportStructure('inventory');
      }

      // Calculate inventory metrics for each product
      const inventoryData = products.map(product => {
        // Calculate purchases for this product
        const productPurchases = purchasesData.filter(p =>
          p.productName === product.name || p.product_name === product.name
        );
        const totalPurchases = productPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0);

        // Calculate sales for this product
        const productSales = salesData.filter(s =>
          s.productName === product.name || s.product_name === product.name
        );
        const totalSales = productSales.reduce((sum, s) => sum + (s.quantity || 0), 0);

        // Calculate current stock
        const openingStock = product.openingStock || 0;
        const closingStock = openingStock + totalPurchases - totalSales;

        return {
          productName: product.name,
          batchNo: product.batchNo || product.batch_no || 'N/A',
          unit: product.unit || 'Kg',
          openingStock,
          purchases: totalPurchases,
          sales: totalSales,
          closingStock: Math.max(0, closingStock), // Ensure non-negative
          reorderLevel: product.reorderLevel || product.reorder_level || 10,
          expiryDate: product.expiryDate || product.expiry_date || 'N/A',
          supplierName: product.supplierName || product.supplier_name || 'Unknown',
          remarks: closingStock <= (product.reorderLevel || 10) ? 'Low Stock' : 'In Stock'
        };
      });

      // Calculate summary metrics
      const totalProducts = products.length;
      const lowStockItems = inventoryData.filter(item =>
        item.closingStock <= item.reorderLevel
      ).length;
      const outOfStockItems = inventoryData.filter(item =>
        item.closingStock <= 0
      ).length;
      const totalValue = inventoryData.reduce((sum, item) =>
        sum + (item.closingStock * (products.find(p => p.name === item.productName)?.unitPrice || 0)), 0
      );

      // Category breakdown
      const categoryBreakdown = {};
      products.forEach(product => {
        const category = product.category || 'Uncategorized';
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { count: 0, value: 0 };
        }
        categoryBreakdown[category].count++;
        categoryBreakdown[category].value += (product.unitPrice || 0) *
          (inventoryData.find(i => i.productName === product.name)?.closingStock || 0);
      });

      const formattedInventoryData = inventoryData.map(item => ({
        ...item,
        openingStock: Math.round(item.openingStock * 100) / 100,
        purchases: Math.round(item.purchases * 100) / 100,
        sales: Math.round(item.sales * 100) / 100,
        closingStock: Math.round(item.closingStock * 100) / 100
      }));

      console.log('✅ Inventory report generated successfully');

      return {
        summary: {
          totalProducts,
          totalValue: Math.round(totalValue),
          lowStockItems,
          outOfStockItems,
          expiringItems: 0 // Could be calculated based on expiry dates
        },
        inventoryData: formattedInventoryData,
        categoryBreakdown,
        // Stock movement report data
        stockMovementData: formattedInventoryData.map(item => ({
          productName: item.productName,
          batchNo: item.batchNo,
          qtyIn: item.purchases,
          qtyOut: item.sales,
          balance: item.closingStock,
          reason: 'Sales/Purchase',
          transactionRef: 'Multiple'
        })),
        // Mandatory fields structure for export
        mandatoryFields: [
          'Product Name', 'Batch No.', 'Unit (Kg/L)', 'Opening Stock', 'Purchases',
          'Sales', 'Closing Stock', 'Reorder Level', 'Expiry Date', 'Supplier Name', 'Remarks'
        ],
        stockMovementFields: [
          'Date', 'Product Name', 'Batch No.', 'Qty In', 'Qty Out', 'Balance',
          'Reason / Transaction', 'Ref'
        ]
      };
    } catch (error) {
      console.error('Error generating inventory report:', error);
      return await generateEmptyReportStructure('inventory');
    }
  }, [generateEmptyReportStructure]);

  const generateFinancialReport = useCallback(async (dateFilter) => {
    try {
      // Fetch sales data for financial calculations
      const salesData = await salesService.getAll();

      // Fetch purchases data for COGS calculation
      const purchasesData = await purchasesService.getAll();

      // Calculate financial metrics according to fertilizer industry standard
      const totalSalesRevenue = salesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);

      // Calculate COGS from actual purchase costs
      const totalCOGS = purchasesData.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);

      // Calculate gross profit
      const grossProfit = totalSalesRevenue - totalCOGS;
      const grossProfitMargin = totalSalesRevenue > 0 ? (grossProfit / totalSalesRevenue) * 100 : 0;

      // Estimate operating expenses (10% of gross profit or 5% of revenue)
      const operatingExpenses = Math.max(grossProfit * 0.1, totalSalesRevenue * 0.05);
      const netProfit = grossProfit - operatingExpenses;
      const netProfitMargin = totalSalesRevenue > 0 ? (netProfit / totalSalesRevenue) * 100 : 0;

      // Generate monthly breakdown
      const monthlyData = {};
      const currentYear = new Date().getFullYear();

      // Initialize 12 months
      for (let i = 0; i < 12; i++) {
        const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = {
          month: new Date(currentYear, i).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          totalSalesRevenue: 0,
          cogs: 0,
          grossProfit: 0,
          operatingExpenses: 0,
          netProfit: 0,
          remarks: '—'
        };
      }

      // Populate with actual data
      salesData.forEach(sale => {
        const saleDate = new Date(sale.created_at || sale.date);
        const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].totalSalesRevenue += sale.totalAmount || 0;
        }
      });

      purchasesData.forEach(purchase => {
        const purchaseDate = new Date(purchase.created_at || purchase.date);
        const monthKey = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].cogs += purchase.totalAmount || 0;
        }
      });

      // Calculate derived metrics for each month
      Object.values(monthlyData).forEach(month => {
        month.grossProfit = month.totalSalesRevenue - month.cogs;
        month.operatingExpenses = Math.max(month.grossProfit * 0.1, month.totalSalesRevenue * 0.05);
        month.netProfit = month.grossProfit - month.operatingExpenses;
      });

      console.log('✅ Financial report generated successfully');

      return {
        summary: {
          totalSalesRevenue: Math.round(totalSalesRevenue),
          totalCOGS: Math.round(totalCOGS),
          grossProfit: Math.round(grossProfit),
          grossProfitMargin: Math.round(grossProfitMargin * 100) / 100,
          operatingExpenses: Math.round(operatingExpenses),
          netProfit: Math.round(netProfit),
          netProfitMargin: Math.round(netProfitMargin * 100) / 100
        },
        monthlyFinancialData: Object.values(monthlyData).map(month => ({
          ...month,
          totalSalesRevenue: Math.round(month.totalSalesRevenue),
          cogs: Math.round(totalCOGS),
          grossProfit: Math.round(grossProfit),
          expenses: Math.round(operatingExpenses),
          netProfit: Math.round(netProfit),
          profitMargin: Math.round(netProfitMargin * 100) / 100
        })),
        mandatoryFields: [
          'Period', 'Total Sales', 'COGS', 'Gross Profit', 'Expenses', 'Net Profit', 'Profit Margin (%)'
        ]
      };
    } catch (error) {
      console.error('Error generating financial report:', error);
      return await generateEmptyReportStructure('financial');
    }
  }, [generateEmptyReportStructure]);

  const generateProfitReport = useCallback(async (dateFilter) => {
    // Similar to financial report but focused on profit analysis
    return await generateFinancialReport(dateFilter);
  }, [generateFinancialReport]);

  // Print invoice function - simplified approach
  const handlePrint = () => {
    // Check if a sale is selected
    if (!selectedSale || !selectedSaleId) {
      alert('Please select a sale from the dropdown first.');
      return;
    }

    const invoiceElement = document.getElementById('printable-invoice');
    if (!invoiceElement) {
      alert('No invoice content found to print. Please select a sale first.');
      return;
    }

    // Check if invoice element has content
    if (!invoiceElement.innerHTML.trim()) {
      alert('Invoice content is empty. Please select a sale and wait for it to load.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      alert('Please allow popups to print the invoice');
      return;
    }

    // Wait for QR code and other async content to load
    const waitForContent = () => {
      return new Promise((resolve) => {
        // Check if QR code images are loaded
        const qrImages = invoiceElement.querySelectorAll('img');
        let loadedImages = 0;
        const totalImages = qrImages.length;

        if (totalImages === 0) {
          resolve();
          return;
        }

        qrImages.forEach(img => {
          if (img.complete) {
            loadedImages++;
          } else {
            img.onload = () => {
              loadedImages++;
              if (loadedImages === totalImages) {
                resolve();
              }
            };
            img.onerror = () => {
              loadedImages++;
              if (loadedImages === totalImages) {
                resolve();
              }
            };
          }
        });

        if (loadedImages === totalImages) {
          resolve();
        }

        // Fallback timeout
        setTimeout(resolve, 2000);
      });
    };

    // Wait for content to be ready, then create print window
    waitForContent().then(() => {
      // Get the actual computed styles and content
      const clonedElement = invoiceElement.cloneNode(true);

      // Create a complete HTML document with inline styles
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Tax Invoice - Print</title>
            <meta charset="utf-8">
            <style>
              @page {
                size: A4 portrait;
                margin: 0.5in;
              }
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                background: white;
                color: black;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              /* Table styles */
              table {
                border-collapse: collapse;
                width: 100%;
              }
              td, th {
                border: 1px solid #000;
                padding: 4px;
                vertical-align: top;
              }

              /* Text alignment */
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-left { text-align: left; }

              /* Font weights and sizes */
              .font-bold { font-weight: bold; }
              .text-xs { font-size: 12px; }
              .text-sm { font-size: 14px; }
              .text-lg { font-size: 18px; }

              /* Spacing */
              .mb-0-5 { margin-bottom: 2px; }
              .mt-1 { margin-top: 4px; }
              .p-0-5 { padding: 2px; }
              .p-1 { padding: 4px; }

              /* Colors */
              .bg-white { background-color: white !important; }
              .text-black { color: black !important; }

              /* Borders */
              .border { border: 1px solid #000; }
              .border-black { border-color: #000; }
              .border-0 { border: none; }

              /* QR Code */
              img { max-width: 100%; height: auto; }

              /* Grid and flex */
              .grid { display: table; width: 100%; }
              .grid-cols-2 { }
              .grid-cols-2 > div:first-child { display: table-cell; width: 50%; }
              .grid-cols-2 > div:last-child { display: table-cell; width: 50%; }

              /* Hide elements */
              .no-print { display: none !important; }
            </style>
          </head>
          <body>
            ${clonedElement.innerHTML}
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();

      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    });
  };

  // Enhanced mock report data with comprehensive analytics (prefixed with _ as unused)
  const _mockReportData = {
    sales: {
      summary: {
        totalSales: 125000,
        totalTransactions: 45,
        averageOrderValue: 2778,
        topProduct: 'NPK 20-20-20',
        salesGrowth: 12.5,
        repeatCustomers: 28,
        newCustomers: 17,
        conversionRate: 68.2,
        returnRate: 2.1
      },
      dailySales: [
        { date: '2025-01-01', sales: 4500, transactions: 3 },
        { date: '2025-01-02', sales: 6200, transactions: 4 },
        { date: '2025-01-03', sales: 3800, transactions: 2 },
        { date: '2025-01-04', sales: 7500, transactions: 5 },
        { date: '2025-01-05', sales: 5200, transactions: 3 },
        { date: '2025-01-06', sales: 8900, transactions: 6 }
      ],
      topProducts: [
        { name: 'NPK 20-20-20', quantity: 85, revenue: 80750, profit: 25840, margin: 32.0 },
        { name: 'Urea', quantity: 120, revenue: 38400, profit: 7680, margin: 20.0 },
        { name: 'DAP', quantity: 45, revenue: 67500, profit: 20250, margin: 30.0 },
        { name: 'Potash', quantity: 30, revenue: 24000, profit: 7200, margin: 30.0 }
      ],
      customerAnalytics: [
        { name: 'Rajesh Farmer', purchases: 8, revenue: 45000, avgOrder: 5625, status: 'VIP' },
        { name: 'Sunita Agro', purchases: 12, revenue: 38000, avgOrder: 3167, status: 'VIP' },
        { name: 'Kumar Traders', purchases: 6, revenue: 22000, avgOrder: 3667, status: 'Regular' },
        { name: 'Green Valley Farm', purchases: 4, revenue: 20000, avgOrder: 5000, status: 'New' }
      ],
      paymentMethods: [
        { method: 'Cash', transactions: 28, amount: 75000, percentage: 60.0 },
        { method: 'UPI', transactions: 12, amount: 35000, percentage: 28.0 },
        { method: 'Card', transactions: 3, amount: 10000, percentage: 8.0 },
        { method: 'Credit', transactions: 2, amount: 5000, percentage: 4.0 }
      ],
      hourlyTrends: [
        { hour: '09:00', sales: 8500, transactions: 3 },
        { hour: '10:00', sales: 12000, transactions: 4 },
        { hour: '11:00', sales: 15500, transactions: 6 },
        { hour: '12:00', sales: 18000, transactions: 7 },
        { hour: '13:00', sales: 14000, transactions: 5 },
        { hour: '14:00', sales: 16500, transactions: 6 },
        { hour: '15:00', sales: 22000, transactions: 8 },
        { hour: '16:00', sales: 19000, transactions: 6 }
      ]
    },
    inventory: {
      summary: {
        totalProducts: 156,
        totalValue: 450000,
        lowStockItems: 12,
        nearExpiryItems: 8,
        outOfStockItems: 3,
        fastMovingItems: 25,
        slowMovingItems: 18,
        inventoryTurnover: 8.5,
        averageDaysToSell: 43,
        deadStock: 5
      },
      categoryBreakdown: [
        { category: 'Chemical', products: 89, value: 320000 },
        { category: 'Organic', products: 45, value: 95000 },
        { category: 'Bio-fertilizer', products: 22, value: 35000 }
      ],
      stockMovement: [
        { product: 'NPK 20-20-20', opening: 100, purchased: 50, sold: 85, closing: 65, turnover: 6.2 },
        { product: 'Urea', opening: 80, purchased: 60, sold: 120, closing: 20, turnover: 12.0 },
        { product: 'DAP', opening: 70, purchased: 25, sold: 45, closing: 50, turnover: 4.5 },
        { product: 'Potash', opening: 60, purchased: 30, sold: 30, closing: 60, turnover: 3.0 }
      ],
      expiryAnalysis: [
        { product: 'Bio Fertilizer A', quantity: 25, expiryDate: '2025-01-15', daysLeft: 8, status: 'critical' },
        { product: 'Organic Compost', quantity: 40, expiryDate: '2025-01-25', daysLeft: 18, status: 'warning' },
        { product: 'Liquid NPK', quantity: 15, expiryDate: '2025-02-10', daysLeft: 34, status: 'good' },
        { product: 'Micronutrient Mix', quantity: 8, expiryDate: '2025-01-05', daysLeft: -2, status: 'expired' }
      ],
      supplierPerformance: [
        { supplier: 'Krishak Fertilizers', orders: 12, onTime: 11, quality: 95, totalValue: 180000 },
        { supplier: 'Agro Solutions', orders: 8, onTime: 7, quality: 88, totalValue: 120000 },
        { supplier: 'Green Earth Ltd', orders: 6, onTime: 6, quality: 92, totalValue: 95000 },
        { supplier: 'Farm Tech Corp', orders: 4, onTime: 3, quality: 85, totalValue: 55000 }
      ],
      abcAnalysis: [
        { category: 'A (High Value)', products: 25, value: 315000, percentage: 70.0 },
        { category: 'B (Medium Value)', products: 45, value: 90000, percentage: 20.0 },
        { category: 'C (Low Value)', products: 86, value: 45000, percentage: 10.0 }
      ]
    },
    financial: {
      summary: {
        totalRevenue: 125000,
        totalCosts: 89000,
        grossProfit: 36000,
        profitMargin: 28.8,
        netProfit: 32000,
        operatingExpenses: 4000,
        taxAmount: 6250,
        ebitda: 38000,
        roi: 15.2,
        cashFlow: 28000
      },
      monthlyTrends: [
        { month: 'Oct 2024', revenue: 98000, profit: 28000, expenses: 70000, margin: 28.6 },
        { month: 'Nov 2024', revenue: 112000, profit: 32000, expenses: 80000, margin: 28.6 },
        { month: 'Dec 2024', revenue: 135000, profit: 38000, expenses: 97000, margin: 28.1 },
        { month: 'Jan 2025', revenue: 125000, profit: 36000, expenses: 89000, margin: 28.8 }
      ],
      expenseBreakdown: [
        { category: 'Cost of Goods Sold', amount: 85000, percentage: 68.0 },
        { category: 'Staff Salaries', amount: 15000, percentage: 12.0 },
        { category: 'Rent & Utilities', amount: 8000, percentage: 6.4 },
        { category: 'Transportation', amount: 5000, percentage: 4.0 },
        { category: 'Marketing', amount: 3000, percentage: 2.4 },
        { category: 'Other Expenses', amount: 9000, percentage: 7.2 }
      ],
      profitabilityAnalysis: [
        { product: 'NPK 20-20-20', revenue: 80750, cost: 54000, profit: 26750, margin: 33.1 },
        { product: 'DAP', revenue: 67500, cost: 47250, profit: 20250, margin: 30.0 },
        { product: 'Urea', revenue: 38400, cost: 30720, profit: 7680, margin: 20.0 },
        { product: 'Potash', revenue: 24000, cost: 16800, profit: 7200, margin: 30.0 }
      ],
      cashFlowAnalysis: [
        { week: 'Week 1', inflow: 32000, outflow: 28000, net: 4000 },
        { week: 'Week 2', inflow: 28000, outflow: 25000, net: 3000 },
        { week: 'Week 3', inflow: 35000, outflow: 30000, net: 5000 },
        { week: 'Week 4', inflow: 30000, outflow: 26000, net: 4000 }
      ]
    }
  };





  const generateReport = useCallback(async () => {
    setLoading(true);
    try {
      let data = null;
      const dateFilter = getDateFilter(dateRange);

      console.log(`🔄 Generating ${reportType} report for date range: ${dateRange}`);

      // Add timeout to prevent hanging
      const reportPromise = (async () => {
        switch (reportType) {
          case 'sales':
            return await generateSalesReport(dateFilter);
          case 'inventory':
            return await generateInventoryReport();
          case 'financial':
            return await generateFinancialReport(dateFilter);
          case 'profit':
            return await generateProfitReport(dateFilter);
          default:
            return await generateEmptyReportStructure(reportType);
        }
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Report generation timeout - database may be slow')), 10000)
      );

      data = await Promise.race([reportPromise, timeoutPromise]);

      if (!data || Object.keys(data).length === 0) {
        console.warn('No data returned, generating empty report structure');
        data = await generateEmptyReportStructure(reportType);
      }

      setReportData(data);

      // Auto-detect optimal orientation
      if (autoDetectOrientation) {
        const optimalOrientation = detectOptimalOrientation(data);
        setReportOrientation(optimalOrientation);
      }

      console.log('Report generated successfully:', {
        reportType,
        dataKeys: Object.keys(data),
        summaryKeys: data.summary ? Object.keys(data.summary) : 'No summary',
        dataLength: data.salesData?.length || data.inventoryData?.length || 'No data array'
      });
    } catch (error) {
      console.error('Error generating report:', error);

      // Create error data structure that will be displayed
      const errorData = {
        error: true,
        errorMessage: error.message || 'Unknown error occurred',
        summary: {
          error: `Failed to load ${reportType} report data. Please try again.`
        }
      };

      setReportData(errorData);

      // Show user-friendly error message
      console.warn(`Error generating ${reportType} report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [reportType, dateRange, autoDetectOrientation, detectOptimalOrientation, getDateFilter, generateEmptyReportStructure, generateSalesReport, generateInventoryReport, generateFinancialReport, generateProfitReport]);

  useEffect(() => {
    console.log('🔄 Report useEffect triggered - generating report...');
    generateReport();
  }, [reportType, dateRange, generateReport]);

  // Add real-time data refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing report data...');
      generateReport();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [generateReport]);



  // Load sales list and system settings for invoice preview
  const loadSales = useCallback(async () => {
    const list = await salesService.getAll();
    setSalesList(list);
    if (!selectedSaleId && list.length) setSelectedSaleId(list[0].id);
  }, [selectedSaleId]);

  const loadSettings = useCallback(async () => {
    try {
      const settings = await settingsOperations.getById('system-settings');
      if (settings) setSystemSettings(settings);
    } catch (e) {
      console.warn('No system settings found yet');
    }
  }, []);

  // Utility function to format timestamps (Supabase compatible)
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (typeof timestamp === 'string') {
      // ISO string from Supabase
      return new Date(timestamp).toLocaleDateString();
    }
    if (timestamp instanceof Date) {
      // JavaScript Date object
      return timestamp.toLocaleDateString();
    }
    return 'N/A';
  };

  // Load company details for report headers
  const loadCompanyDetails = useCallback(async () => {
    try {
      const details = await shopDetailsService.getShopDetails();
      setCompanyDetails(details);
    } catch (error) {
      console.error('Failed to load company details:', error);
    }
  }, []);

  // Enhanced report header component with logo
  const renderReportHeader = (title, subtitle) => {
    if (!companyDetails) return null;

    const period = dateRange.replace('_', ' ').toUpperCase();

    return (
      <ReportHeader
        reportTitle={title}
        period={period}
        companyDetails={companyDetails}
        reportId={`RPT-${Date.now()}`}
        systemName="KrishiSethu Inventory Management System"
      />
    );
  };

  // Test function to check sales data
  const testSalesData = async () => {
    try {
      console.log('🧪 Testing sales data fetch...');
      const sales = await salesService.getAll();
      console.log('✅ Test successful - Sales data:', sales);
      alert(`Sales data test successful! Found ${sales.length} sales records.`);
    } catch (error) {
      console.error('❌ Test failed:', error);
      alert(`Sales data test failed: ${error.message}`);
    }
  };

  useEffect(() => {
    loadSales();
    loadSettings();
    loadCompanyDetails();
  }, [loadSales, loadSettings, loadCompanyDetails]);



  const openInvoicePreviewWindow = () => {
    const el = document.getElementById('printable-invoice');
    if (!el) return;
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (!w) return;

    // Copy current CSS (dev mode styles and linked CSS), plus add Tailwind CDN as fallback
    const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((node) => node.outerHTML)
      .join('');

    const pageCss = `
      <style>
        @page { size: A4 portrait; margin: 0; }
        html, body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body * { box-sizing: border-box; }
      </style>
    `;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>${headStyles}${pageCss}</head><body>${el.innerHTML}</body></html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };









  // Advanced reporting functions
  const exportReport = async (format) => {
    setIsGenerating(true);
    try {
      if (!reportData) {
        alert('Please generate a report first');
        return;
      }

      const reportContent = {
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
        dateRange: dateRange,
        generatedAt: new Date().toISOString(),
        data: reportData,
        filters: filterOptions,
        summary: reportData?.summary || {}
      };

      if (format === 'pdf') {
        await exportToPDF(reportContent);
      } else if (format === 'excel') {
        exportToExcel(reportContent);
      } else if (format === 'csv') {
        exportToCSV(reportContent);
      }

      alert(`${reportType} report exported as ${format.toUpperCase()} successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting report: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToPDF = async (reportContent) => {
    // Create a printable HTML version of the report
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }

    const htmlContent = generatePrintableHTML(reportContent);
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Auto-print after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  };

  const generatePrintableHTML = (reportContent) => {
    const { title, dateRange, generatedAt: _generatedAt, data } = reportContent;
    
    let tableContent = '';
    
    if (reportType === 'sales' && data.salesData) {
      tableContent = `
        <h3>Sales Report - Fertilizer Inventory</h3>
        <table>
          <thead>
            <tr>
              ${data.mandatoryFields.map(field => `<th>${field}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.salesData.slice(0, 20).map(sale => `
              <tr>
                <td>${sale.date && sale.date.toDate ? sale.date.toDate().toLocaleDateString() : sale.date || 'N/A'}</td>
                <td>${sale.invoiceNo}</td>
                <td>${sale.productName}</td>
                <td>${sale.batchNo}</td>
                <td>${sale.unit}</td>
                <td>${sale.quantitySold}</td>
                <td>₹${sale.unitPrice.toLocaleString()}</td>
                <td>₹${sale.totalSales.toLocaleString()}</td>
                <td>${sale.customerName}</td>
                <td>${sale.paymentMode}</td>
                <td>${sale.remarks}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <h3>Payment Method Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Payment Method</th>
              <th>Transactions</th>
              <th>Amount</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${data.paymentMethods.map(method => `
              <tr>
                <td>${method.method}</td>
                <td>${method.transactions}</td>
                <td>₹${method.amount.toLocaleString()}</td>
                <td>${method.percentage}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'inventory' && data.inventoryData) {
      tableContent = `
        <h3>Inventory Report - Fertilizer Stock</h3>
        <table>
          <thead>
            <tr>
              ${data.mandatoryFields.map(field => `<th>${field}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.inventoryData.slice(0, 20).map(item => `
              <tr>
                <td>${item.productName}</td>
                <td>${item.batchNo}</td>
                <td>${item.unit}</td>
                <td>${item.openingStock}</td>
                <td>${item.purchases}</td>
                <td>${item.sales}</td>
                <td>${item.closingStock}</td>
                <td>${item.reorderLevel}</td>
                <td>${item.expiryDate}</td>
                <td>${item.supplierName}</td>
                <td>${item.remarks}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <h3>Stock Movement Report</h3>
        <table>
          <thead>
            <tr>
              ${data.stockMovementFields.map(field => `<th>${field}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.stockMovementData.slice(0, 15).map(movement => `
              <tr>
                <td>${new Date().toISOString().split('T')[0]}</td>
                <td>${movement.productName}</td>
                <td>${movement.batchNo}</td>
                <td>${movement.qtyIn}</td>
                <td>${movement.qtyOut}</td>
                <td>${movement.balance}</td>
                <td>${movement.reason}</td>
                <td>${movement.transactionRef}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'financial' && data.monthlyFinancialData) {
      tableContent = `
        <h3>Financial Report - Monthly Breakdown</h3>
        <table>
          <thead>
            <tr>
              ${data.mandatoryFields.map(field => `<th>${field}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.monthlyFinancialData.map(month => `
              <tr>
                <td>${month.month}</td>
                <td>₹${month.totalSalesRevenue.toLocaleString()}</td>
                <td>₹${month.cogs.toLocaleString()}</td>
                <td>₹${month.grossProfit.toLocaleString()}</td>
                <td>₹${month.operatingExpenses.toLocaleString()}</td>
                <td>₹${month.netProfit.toLocaleString()}</td>
                <td>${month.remarks}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <h3>Profit & Loss Summary</h3>
        <table>
          <thead>
            <tr>
              ${data.profitLossFields.map(field => `<th>${field}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${data.quarterlyData.period}</td>
              <td>₹${data.quarterlyData.totalSales.toLocaleString()}</td>
              <td>₹${data.quarterlyData.cogs.toLocaleString()}</td>
              <td>₹${data.quarterlyData.grossProfit.toLocaleString()}</td>
              <td>₹${data.quarterlyData.expenses.toLocaleString()}</td>
              <td>₹${data.quarterlyData.netProfit.toLocaleString()}</td>
              <td>${data.quarterlyData.profitMargin}%</td>
            </tr>
          </tbody>
        </table>
      `;
    } else if (reportType === 'profit' && data.monthlyFinancialData) {
      tableContent = `
        <h3>Profit Analysis Report</h3>
        <table>
          <thead>
            <tr>
              ${data.mandatoryFields.map(field => `<th>${field}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.monthlyFinancialData.map(month => `
              <tr>
                <td>${month.month}</td>
                <td>₹${month.totalSalesRevenue.toLocaleString()}</td>
                <td>₹${month.cogs.toLocaleString()}</td>
                <td>₹${month.grossProfit.toLocaleString()}</td>
                <td>₹${month.operatingExpenses.toLocaleString()}</td>
                <td>₹${month.netProfit.toLocaleString()}</td>
                <td>${month.remarks}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .logo {
              width: 80px;
              height: 80px;
              border: 1px solid #ccc;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              background-color: #f9f9f9;
              flex-shrink: 0;
            }
            .company-info {
              flex: 1;
              margin-left: 15px;
              text-align: left;
            }
            .title {
              text-align: center;
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .report-summary {
              display: flex;
              gap: 15px;
              flex-wrap: wrap;
              margin-bottom: 20px;
            }
            .summary-card {
              flex: 1;
              min-width: 150px;
              border: 1px solid #000;
              padding: 10px;
              text-align: center;
              background: white;
            }
            .summary-card strong {
              font-size: 16px;
              display: block;
              margin-top: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            table, th, td {
              border: 1px solid #000;
            }
            th, td {
              padding: 8px;
              text-align: center;
              font-size: 12px;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            h3 {
              font-size: 16px;
              margin: 20px 0 10px 0;
              color: #333;
            }
            .footer {
              font-size: 12px;
              text-align: center;
              margin-top: 20px;
              border-top: 1px solid #ccc;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              ${companyDetails?.logo ? `
                <img
                  src="${companyDetails.logo}"
                  alt="${companyDetails.name} Logo"
                  style="width: 100%; height: 100%; object-fit: contain;"
                />
              ` : 'LOGO'}
            </div>
            <div class="company-info">
              <strong>${companyDetails?.name || 'Company Name'}</strong><br>
              ${companyDetails?.address?.street || ''}<br>
              ${companyDetails?.address?.city || ''}, ${companyDetails?.address?.state || ''} - ${companyDetails?.address?.pincode || ''}<br>
              📞 ${companyDetails?.phone || ''} | 📧 ${companyDetails?.email || ''}<br>
              ${companyDetails?.gstNumber ? `GST: ${companyDetails.gstNumber}` : ''}
            </div>
          </div>

          <div class="title">${title}</div>
          <p style="text-align:center;">Period: ${dateRange.replace('_', ' ').toUpperCase()} | Generated on: ${new Date().toLocaleString()}</p>
          
          ${data.summary ? `
            <div class="report-summary">
              ${Object.entries(data.summary).map(([key, value]) => `
                <div class="summary-card">
                  ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}<br>
                  <strong>${typeof value === 'number' ? (key.includes('Amount') || key.includes('Revenue') || key.includes('Cost') || key.includes('Profit') ? '₹' + value.toLocaleString() : value.toLocaleString()) : value}</strong>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${tableContent}
          
          <div class="footer">
            <p>Generated by Krishisethu Inventory Management System</p>
            <p>Report ID: ${Date.now()}</p>
          </div>
        </body>
      </html>
    `;
  };

  const exportToExcel = (reportContent) => {
    // For now, export as CSV with Excel-compatible format
    exportToCSV(reportContent, true);
  };

  const exportToCSV = (reportContent, isExcel = false) => {
    const { title, dateRange, generatedAt: _generatedAt, data } = reportContent;
    let csvContent = '';
    
    // Add header information
    csvContent += `${title}\n`;
    csvContent += `Date Range: ${dateRange.replace('_', ' ').toUpperCase()}\n`;
    csvContent += `Generated: ${new Date(_generatedAt).toLocaleString()}\n\n`;
    
    // Add summary if available
    if (data.summary) {
      csvContent += 'SUMMARY\n';
      Object.entries(data.summary).forEach(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const formattedValue = typeof value === 'number' ? 
          (key.includes('Amount') || key.includes('Revenue') || key.includes('Cost') || key.includes('Profit') ? 
            '₹' + value.toLocaleString() : value.toLocaleString()) : value;
        csvContent += `${formattedKey},${formattedValue}\n`;
      });
      csvContent += '\n';
    }

    // Add detailed data based on report type using mandatory fields
    if (reportType === 'sales' && data.salesData) {
      csvContent += 'SALES REPORT - FERTILIZER INVENTORY\n';
      csvContent += data.mandatoryFields.join(',') + '\n';
      data.salesData.forEach(sale => {
        const formattedDate = sale.date && sale.date.toDate ? sale.date.toDate().toLocaleDateString() : sale.date || 'N/A';
        csvContent += `${formattedDate},"${sale.invoiceNo}","${sale.productName}","${sale.batchNo}","${sale.unit}",${sale.quantitySold},"₹${sale.unitPrice.toLocaleString()}","₹${sale.totalSales.toLocaleString()}","${sale.customerName}","${sale.paymentMode}","${sale.remarks}"\n`;
      });
      csvContent += '\n';
      
      if (data.paymentMethods) {
        csvContent += 'PAYMENT METHOD BREAKDOWN\n';
        csvContent += 'Payment Method,Transactions,Amount,Percentage\n';
        data.paymentMethods.forEach(method => {
          csvContent += `"${method.method}",${method.transactions},"₹${method.amount.toLocaleString()}",${method.percentage}%\n`;
        });
      }
    } else if (reportType === 'inventory' && data.inventoryData) {
      csvContent += 'INVENTORY REPORT - FERTILIZER STOCK\n';
      csvContent += data.mandatoryFields.join(',') + '\n';
      data.inventoryData.forEach(item => {
        const formattedExpiryDate = item.expiryDate && item.expiryDate.toDate ? item.expiryDate.toDate().toLocaleDateString() : item.expiryDate || 'N/A';
        csvContent += `"${item.productName}","${item.batchNo}","${item.unit}",${item.openingStock},${item.purchases},${item.sales},${item.closingStock},${item.reorderLevel},"${formattedExpiryDate}","${item.supplierName}","${item.remarks}"\n`;
      });
      csvContent += '\n';
      
      if (data.stockMovementData) {
        csvContent += 'STOCK MOVEMENT REPORT\n';
        csvContent += data.stockMovementFields.join(',') + '\n';
        data.stockMovementData.forEach(movement => {
          csvContent += `${new Date().toISOString().split('T')[0]},"${movement.productName}","${movement.batchNo}",${movement.qtyIn},${movement.qtyOut},${movement.balance},"${movement.reason}","${movement.transactionRef}"\n`;
        });
      }
    } else if (reportType === 'financial' && data.monthlyFinancialData) {
      csvContent += 'FINANCIAL REPORT - MONTHLY BREAKDOWN\n';
      csvContent += data.mandatoryFields.join(',') + '\n';
      data.monthlyFinancialData.forEach(month => {
        csvContent += `"${month.month}","₹${month.totalSalesRevenue.toLocaleString()}","₹${month.cogs.toLocaleString()}","₹${month.grossProfit.toLocaleString()}","₹${month.operatingExpenses.toLocaleString()}","₹${month.netProfit.toLocaleString()}","${month.remarks}"\n`;
      });
      csvContent += '\n';
      
      if (data.quarterlyData) {
        csvContent += 'PROFIT & LOSS SUMMARY\n';
        csvContent += data.profitLossFields.join(',') + '\n';
        const q = data.quarterlyData;
        csvContent += `"${q.period}","₹${q.totalSales.toLocaleString()}","₹${q.cogs.toLocaleString()}","₹${q.grossProfit.toLocaleString()}","₹${q.expenses.toLocaleString()}","₹${q.netProfit.toLocaleString()}",${q.profitMargin}%\n`;
      }
    } else if (reportType === 'profit' && data.monthlyFinancialData) {
      // Same as financial report for profit analysis
      csvContent += 'PROFIT ANALYSIS REPORT\n';
      csvContent += data.mandatoryFields.join(',') + '\n';
      data.monthlyFinancialData.forEach(month => {
        csvContent += `"${month.month}","₹${month.totalSalesRevenue.toLocaleString()}","₹${month.cogs.toLocaleString()}","₹${month.grossProfit.toLocaleString()}","₹${month.operatingExpenses.toLocaleString()}","₹${month.netProfit.toLocaleString()}","${month.remarks}"\n`;
      });
    }

    // Create and download file
    const mimeType = isExcel ? 'application/vnd.ms-excel' : 'text/csv';
    const fileExtension = isExcel ? 'xls' : 'csv';
    const dataBlob = new Blob([csvContent], { type: mimeType });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const scheduleReport = () => {
    if (!reportSchedule.email) {
      alert('Please enter email address for scheduled reports');
      return;
    }

    // In real app, this would set up automated report generation
    console.log('Scheduling report:', reportSchedule);
    alert(`Report scheduled to be sent ${reportSchedule.frequency} to ${reportSchedule.email}`);
  };

  const generateRealTimeData = () => {
    // Simulate real-time data updates
    const realTime = {
      currentSales: Math.floor(Math.random() * 5000) + 15000,
      todayTransactions: Math.floor(Math.random() * 10) + 25,
      activeCustomers: Math.floor(Math.random() * 5) + 12,
      lowStockAlerts: Math.floor(Math.random() * 3) + 8,
      lastUpdated: new Date().toLocaleTimeString()
    };
    setRealTimeData(realTime);
  };

  // Auto-refresh real-time data
  useEffect(() => {
    const interval = setInterval(generateRealTimeData, 30000); // Update every 30 seconds
    generateRealTimeData(); // Initial load
    return () => clearInterval(interval);
  }, []);

  const _calculateKPIProgress = (actual, target) => {
    return Math.min((actual / target) * 100, 100);
  };

  const renderSalesReport = () => {
    if (!reportData) return null;

    // Show error message if there's an error
    if (reportData.error) {
      return (
        <div className="text-center py-8">
          <div className="mb-4" style={{ color: 'var(--destructive)' }}>
            <h3 className="text-lg font-semibold">Error Loading Sales Report</h3>
            <p className="text-sm">{reportData.errorMessage}</p>
          </div>
          <Button onClick={() => generateReport()} variant="outline">
            Try Again
          </Button>
        </div>
      );
    }

    // Ensure all required fields have default values
    const safeReportData = {
      ...reportData,
      summary: {
        totalSales: 0,
        totalTransactions: 0,
        totalQuantity: 0,
        averageOrderValue: 0,
        uniqueCustomers: 0,
        topProduct: 'No data',
        ...reportData.summary
      },
      salesData: reportData.salesData || [],
      paymentMethods: reportData.paymentMethods || [],
      topProducts: reportData.topProducts || []
    };

    return (
      <div id="report-content" className={`space-y-6 ${reportOrientation === 'landscape' ? 'print-landscape' : 'print-portrait'}`}>
        {/* Report Header with Company Logo and Details */}
        {renderReportHeader("Sales Report", "Comprehensive sales analysis and performance metrics")}

        {/* Sales Summary - Fertilizer Industry Specific */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 print-summary-grid print-avoid-break">
          <div className="border p-3 text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
            <div className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Total Sales</div>
            <div className="text-xl font-bold">₹{safeReportData.summary.totalSales.toLocaleString()}</div>
          </div>

          <div className="border p-3 text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
            <div className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Total Transactions</div>
            <div className="text-xl font-bold">{safeReportData.summary.totalTransactions}</div>
          </div>

          <div className="border p-3 text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
            <div className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Total Quantity</div>
            <div className="text-xl font-bold">{safeReportData.summary.totalQuantity.toLocaleString()}</div>
          </div>

          <div className="border p-3 text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
            <div className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Average Order Value</div>
            <div className="text-xl font-bold">₹{safeReportData.summary.averageOrderValue.toLocaleString()}</div>
          </div>

          <div className="border p-3 text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
            <div className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Top Product</div>
            <div className="text-lg font-bold">{reportData.summary.topProduct}</div>
          </div>

          <div className="border p-3 text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
            <div className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Unique Customers</div>
            <div className="text-lg font-bold">{reportData.summary.uniqueCustomers}</div>
          </div>

          <div className="border p-3 text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
            <div className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Avg Quantity Per Sale</div>
            <div className="text-lg font-bold">{reportData.summary.avgQuantityPerSale}</div>
          </div>
        </div>

        {/* Sales Data Table - Fertilizer Format */}
        <Card className="print-card print-avoid-break">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Sales Report - Fertilizer Inventory
            </CardTitle>
            <CardDescription>
              Complete sales transactions with mandatory fields for fertilizer business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className={`w-full border-collapse border ${reportData.salesData?.length > 15 ? 'large-table' : ''}`} style={{ borderColor: 'var(--border)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--muted)' }}>
                    {reportData.mandatoryFields && reportData.mandatoryFields.map((field, index) => (
                      <th key={index} className="border px-2 py-2 text-center text-sm font-medium" style={{ borderColor: 'var(--border)' }}>
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.salesData && reportData.salesData.slice(0, 10).map((sale, index) => (
                    <tr key={index} style={{ backgroundColor: 'var(--background)' }}>
                      <td className="border px-2 py-2 text-sm text-center" style={{ borderColor: 'var(--border)' }}>{formatTimestamp(sale.date)}</td>
                      <td className="border px-2 py-2 text-sm text-center" style={{ borderColor: 'var(--border)' }}>{sale.invoiceNo}</td>
                      <td className="border px-2 py-2 text-sm text-center" style={{ borderColor: 'var(--border)' }}>{sale.productName}</td>
                      <td className="border px-2 py-2 text-sm text-center" style={{ borderColor: 'var(--border)' }}>{sale.batchNo}</td>
                      <td className="border px-2 py-2 text-sm text-center" style={{ borderColor: 'var(--border)' }}>{sale.unit || 'N/A'}</td>
                      <td className="border px-2 py-2 text-sm text-center" style={{ borderColor: 'var(--border)' }}>{sale.quantitySold || 0}</td>
                      <td className="border px-2 py-2 text-sm text-center" style={{ borderColor: 'var(--border)' }}>₹{(sale.unitPrice || 0).toLocaleString()}</td>
                      <td className="border px-2 py-2 text-sm text-center font-medium" style={{ borderColor: 'var(--border)' }}>₹{(sale.totalSales || 0).toLocaleString()}</td>
                      <td className="border px-2 py-2 text-sm text-center" style={{ borderColor: 'var(--border)' }}>{sale.customerName || 'N/A'}</td>
                      <td className="border px-2 py-2 text-sm text-center" style={{ borderColor: 'var(--border)' }}>{sale.paymentMode || 'N/A'}</td>
                      <td className="border px-2 py-2 text-sm text-center" style={{ borderColor: 'var(--border)' }}>{sale.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.salesData && reportData.salesData.length > 10 && (
                <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
                  Showing first 10 of {reportData.salesData.length} transactions. Export for complete data.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Analysis */}
        <div className="bg-white">
          <h3 className="text-lg font-semibold mb-4">Payment Method Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border" style={{ borderColor: 'var(--border)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--muted)' }}>
                  <th className="border px-2 py-2 text-center text-sm font-medium" style={{ borderColor: 'var(--border)' }}>Payment Method</th>
                  <th className="border px-2 py-2 text-center text-sm font-medium" style={{ borderColor: 'var(--border)' }}>Transactions</th>
                  <th className="border px-2 py-2 text-center text-sm font-medium" style={{ borderColor: 'var(--border)' }}>Amount</th>
                  <th className="border px-2 py-2 text-center text-sm font-medium" style={{ borderColor: 'var(--border)' }}>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {reportData.paymentMethods && reportData.paymentMethods.map((method, index) => (
                  <tr key={index} style={{ backgroundColor: 'var(--background)' }}>
                    <td className="border px-2 py-2 text-sm text-center" style={{ borderColor: 'var(--border)' }}>{method.method || 'N/A'}</td>
                    <td className="border px-2 py-2 text-sm text-center" style={{ borderColor: 'var(--border)' }}>{method.transactions || 0}</td>
                    <td className="border px-2 py-2 text-sm text-center" style={{ borderColor: 'var(--border)' }}>₹{(method.amount || 0).toLocaleString()}</td>
                    <td className="border px-2 py-2 text-sm text-center" style={{ borderColor: 'var(--border)' }}>{method.percentage || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Fertilizer Products</CardTitle>
            <CardDescription>Products ranked by total revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.topProducts && reportData.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--success-bg)' }}>
                      <span className="text-sm font-bold" style={{ color: 'var(--success)' }}>{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{product.totalQuantity} units • {product.transactions} transactions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">₹{(product.totalRevenue || 0).toLocaleString()}</div>
                    <div className="text-sm" style={{ color: 'var(--success)' }}>₹{(product.avgPrice || 0).toFixed(2)}/unit avg</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Print Controls */}
        <div className="no-print flex justify-between items-center p-4 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Page Layout:</span>
            <select
              value={reportOrientation}
              onChange={(e) => setReportOrientation(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
            >
              <option value="portrait">Portrait (A4)</option>
              <option value="landscape">Landscape (A4)</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoDetectOrientation}
                onChange={(e) => setAutoDetectOrientation(e.target.checked)}
              />
              Auto-detect optimal layout
            </label>
          </div>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 text-white"
            style={{
              backgroundColor: 'var(--primary)',
              '&:hover': { backgroundColor: 'var(--primary-hover)' }
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary)'}
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
        </div>
      </div>
    );
  };

  const renderInventoryReport = () => {
    if (!reportData || !reportData.summary) {
      console.warn('No inventory report data available:', reportData);
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No inventory data available. Please ensure products are added to the system.</p>
        </div>
      );
    }

    console.log('Rendering inventory report with data:', {
      summaryKeys: Object.keys(reportData.summary),
      hasInventoryData: !!reportData.inventoryData,
      inventoryDataLength: reportData.inventoryData?.length
    });

    return (
      <div id="report-content" className={`space-y-6 ${reportOrientation === 'landscape' ? 'print-landscape' : 'print-portrait'}`}>
        {/* Report Header with Company Logo and Details */}
        {renderReportHeader("Inventory Report", "Current stock levels and inventory analysis")}

        {/* Inventory Content */}
        <div className="space-y-6">
          {renderInventoryContent()}
        </div>
      </div>
    );
  };

  const renderInventoryContent = () => {
    if (!reportData || !reportData.summary) {
      console.warn('No inventory content data available');
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No inventory summary data available.</p>
        </div>
      );
    }

    // Safe access with default values
    const summary = reportData.summary || {};
    const totalProducts = summary.totalProducts || 0;
    const totalValue = summary.totalValue || summary.totalInventoryValue || 0;
    const lowStockItems = summary.lowStockItems || summary.lowStockProducts || 0;
    const nearExpiryItems = summary.nearExpiryItems || summary.nearExpiryProducts || 0;
    const outOfStockItems = summary.outOfStockItems || summary.outOfStockProducts || 0;
    const totalClosingStock = summary.totalClosingStock || 0;

    console.log('Inventory content summary:', {
      totalProducts,
      totalValue,
      lowStockItems,
      nearExpiryItems,
      outOfStockItems,
      totalClosingStock
    });

    return (
      <div className="space-y-6">
        {/* Inventory Summary - Fertilizer Industry Specific */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">fertilizer products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">total stock worth</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'var(--warning)' }}>{lowStockItems}</div>
              <p className="text-xs text-muted-foreground">need restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Near Expiry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'var(--destructive)' }}>{nearExpiryItems}</div>
              <p className="text-xs text-muted-foreground">expiring in 6 months</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'var(--destructive)' }}>{outOfStockItems}</div>
              <p className="text-xs text-muted-foreground">products unavailable</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Stock Quantity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClosingStock.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Kg/L in stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Stock Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
                {totalProducts > 0 ? Math.round(((totalProducts - lowStockItems - outOfStockItems) / totalProducts) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">healthy stock levels</p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Data Table - Fertilizer Format */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Inventory Report - Fertilizer Stock
            </CardTitle>
            <CardDescription>
              Complete inventory data with mandatory fields for fertilizer business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border" style={{ borderColor: 'var(--border)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--muted)' }}>
                    {reportData.mandatoryFields && reportData.mandatoryFields.map((field, index) => (
                      <th key={index} className="border px-3 py-2 text-left text-sm font-medium" style={{ borderColor: 'var(--border)' }}>
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.inventoryData && reportData.inventoryData.slice(0, 10).map((item, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'var(--background)' : 'var(--muted)' }}>
                      <td className="border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }}>{item.productName || 'N/A'}</td>
                      <td className="border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }}>{item.batchNo || 'N/A'}</td>
                      <td className="border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }}>{item.unit || 'Kg'}</td>
                      <td className="border px-3 py-2 text-sm text-right" style={{ borderColor: 'var(--border)' }}>{item.openingStock || 0}</td>
                      <td className="border px-3 py-2 text-sm text-right" style={{ borderColor: 'var(--border)', color: 'var(--success)' }}>{item.purchases || 0}</td>
                      <td className="border px-3 py-2 text-sm text-right" style={{ borderColor: 'var(--border)', color: 'var(--destructive)' }}>{item.sales || 0}</td>
                      <td className="border px-3 py-2 text-sm text-right font-medium" style={{ borderColor: 'var(--border)' }}>{item.closingStock || 0}</td>
                      <td className="border px-3 py-2 text-sm text-right" style={{ borderColor: 'var(--border)' }}>{item.reorderLevel || 0}</td>
                      <td className="border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }}>{formatTimestamp(item.expiryDate)}</td>
                      <td className="border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }}>{item.supplierName || 'N/A'}</td>
                      <td className="border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }}>
                        <Badge variant={item.remarks === 'Low Stock' ? 'destructive' : 'secondary'}>
                          {item.remarks || '—'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.inventoryData && reportData.inventoryData.length > 10 && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing first 10 of {reportData.inventoryData.length} products. Export for complete data.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        {reportData.categoryBreakdown && reportData.categoryBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Inventory by Category</CardTitle>
              <CardDescription>Product distribution across fertilizer categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.categoryBreakdown.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                    <div>
                      <div className="font-medium">{category.category || 'Uncategorized'}</div>
                      <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{category.products || 0} products • {(category.stock || 0).toLocaleString()} Kg/L</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">₹{(category.value || 0).toLocaleString()}</div>
                      <div className="w-32 rounded-full h-2" style={{ backgroundColor: 'var(--muted-foreground)' }}>
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${totalValue > 0 ? ((category.value || 0) / totalValue) * 100 : 0}%`,
                            backgroundColor: 'var(--primary)'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stock Movement Report */}
        {reportData.stockMovementData && reportData.stockMovementData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Stock Movement Report</CardTitle>
              <CardDescription>Detailed stock in/out transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      {reportData.stockMovementFields && reportData.stockMovementFields.map((field, index) => (
                        <th key={index} className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.stockMovementData.slice(0, 15).map((movement, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{new Date().toISOString().split('T')[0]}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{movement.productName || 'N/A'}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{movement.batchNo || 'N/A'}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-right" style={{ color: 'var(--success)' }}>{movement.qtyIn || 0}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-right" style={{ color: 'var(--destructive)' }}>{movement.qtyOut || 0}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-right font-medium">{movement.balance || 0}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{movement.reason || 'N/A'}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{movement.transactionRef || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.stockMovementData.length > 15 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Showing first 15 of {reportData.stockMovementData.length} movements. Export for complete data.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderFinancialReport = () => {
    if (!reportData || !reportData.summary) return null;

    return (
      <div id="report-content" className="space-y-6">
        {/* Report Header with Company Logo and Details */}
        {renderReportHeader("Financial Report", "Financial performance and profitability analysis")}

        {/* Financial Content */}
        <div className="space-y-6">
          {renderFinancialContent()}
        </div>
      </div>
    );
  };

  const renderFinancialContent = () => {
    if (!reportData || !reportData.summary) return null;

    // Safe access with default values
    const summary = reportData.summary || {};
    const totalSalesRevenue = summary.totalSalesRevenue || 0;
    const totalCOGS = summary.totalCOGS || 0;
    const grossProfit = summary.grossProfit || 0;
    const grossProfitMargin = summary.grossProfitMargin || 0;
    const _operatingExpenses = summary.operatingExpenses || 0;
    const netProfit = summary.netProfit || 0;
    const netProfitMargin = summary.netProfitMargin || 0;

    return (
      <div className="space-y-6">
        {/* Financial Summary - Fertilizer Industry Specific */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sales Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalSalesRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">fertilizer sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cost of Goods Sold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalCOGS.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">purchase costs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'var(--success)' }}>₹{grossProfit.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{grossProfitMargin.toFixed(1)}% margin</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'var(--success)' }}>₹{netProfit.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{netProfitMargin.toFixed(1)}% net margin</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Financial Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Financial Report - Monthly Breakdown
            </CardTitle>
            <CardDescription>
              Monthly financial performance with mandatory fields for fertilizer business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    {reportData.mandatoryFields && reportData.mandatoryFields.map((field, index) => (
                      <th key={index} className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.monthlyFinancialData && reportData.monthlyFinancialData.map((month, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{month.month || 'N/A'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right">₹{(month.totalSalesRevenue || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right">₹{(month.cogs || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right font-medium" style={{ color: 'var(--success)' }}>₹{(month.grossProfit || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right">₹{(month.operatingExpenses || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right font-medium" style={{ color: 'var(--success)' }}>₹{(month.netProfit || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{month.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.monthlyFinancialData && reportData.monthlyFinancialData.length === 0 && (
                <p className="text-sm text-gray-500 mt-2 text-center py-4">
                  No financial data available for the selected period.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profit & Loss Summary */}
        {reportData.quarterlyData && (
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Summary</CardTitle>
              <CardDescription>Quarterly P&L statement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      {reportData.profitLossFields && reportData.profitLossFields.map((field, index) => (
                        <th key={index} className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{reportData.quarterlyData.period || 'N/A'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right">₹{(reportData.quarterlyData.totalSales || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right">₹{(reportData.quarterlyData.cogs || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right" style={{ color: 'var(--success)' }}>₹{(reportData.quarterlyData.grossProfit || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right">₹{(reportData.quarterlyData.expenses || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right font-medium" style={{ color: 'var(--success)' }}>₹{(reportData.quarterlyData.netProfit || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-center">{(reportData.quarterlyData.profitMargin || 0).toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderProfitAnalysisReport = () => {
    if (!reportData || !reportData.summary) return null;

    return (
      <div id="report-content" className="space-y-6">
        {/* Report Header with Company Logo and Details */}
        {renderReportHeader("Profit Analysis Report", "Detailed profitability and margin analysis")}

        {/* Profit Analysis Content */}
        <div className="space-y-6">
          {renderProfitAnalysisContent()}
        </div>
      </div>
    );
  };

  const renderProfitAnalysisContent = () => {
    if (!reportData || !reportData.summary) return null;

    // Use the same data as financial report since profit report is similar
    const summary = reportData.summary || {};
    const grossProfit = summary.grossProfit || 0;
    const grossProfitMargin = summary.grossProfitMargin || 0;
    const netProfit = summary.netProfit || 0;
    const netProfitMargin = summary.netProfitMargin || 0;

    return (
      <div className="space-y-6">
        {/* Profit Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Gross Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'var(--success)' }}>₹{grossProfit.toLocaleString()}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Margin: {grossProfitMargin.toFixed(1)}%
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min(grossProfitMargin, 100)}%`,
                      backgroundColor: 'var(--success)'
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Net Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>₹{netProfit.toLocaleString()}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                After expenses ({netProfitMargin.toFixed(1)}%)
              </div>
              <div className="mt-2 text-xs">
                <div className="flex justify-between">
                  <span>Operating Expenses:</span>
                  <span>₹{(summary.operatingExpenses || 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Percent className="h-4 w-4" />
                ROI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{(netProfitMargin * 0.5).toFixed(1)}%</div>
              <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Return on Investment
              </div>
              <div className="mt-2">
                <Badge variant={netProfitMargin > 15 ? "default" : "secondary"}>
                  {netProfitMargin > 15 ? "Excellent" : netProfitMargin > 10 ? "Good" : "Needs Improvement"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profit Analysis Table - Same as Financial Report */}
        {reportData.monthlyFinancialData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Profit Analysis Report
              </CardTitle>
              <CardDescription>
                Monthly profit analysis with mandatory fields for fertilizer business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      {reportData.mandatoryFields && reportData.mandatoryFields.map((field, index) => (
                        <th key={index} className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.monthlyFinancialData.map((month, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                        <td className="border border-border px-3 py-2 text-sm">{month.month || 'N/A'}</td>
                        <td className="border border-border px-3 py-2 text-sm text-right">₹{(month.totalSalesRevenue || 0).toLocaleString()}</td>
                        <td className="border border-border px-3 py-2 text-sm text-right">₹{(month.cogs || 0).toLocaleString()}</td>
                        <td className="border border-border px-3 py-2 text-sm text-right font-medium text-green-600 dark:text-green-400">₹{(month.grossProfit || 0).toLocaleString()}</td>
                        <td className="border border-border px-3 py-2 text-sm text-right">₹{(month.operatingExpenses || 0).toLocaleString()}</td>
                        <td className="border border-border px-3 py-2 text-sm text-right font-medium text-green-600 dark:text-green-400">₹{(month.netProfit || 0).toLocaleString()}</td>
                        <td className="border border-border px-3 py-2 text-sm">{month.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profit Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Profit vs Costs Breakdown
              </CardTitle>
              <CardDescription>Visual representation of profit margins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border-l-4" style={{ backgroundColor: 'var(--success-bg)', borderLeftColor: 'var(--success)' }}>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--success-text)' }}>Gross Profit</div>
                    <div className="text-sm" style={{ color: 'var(--success)' }}>Revenue - COGS</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: 'var(--success-text)' }}>₹{grossProfit.toLocaleString()}</div>
                    <div className="text-sm" style={{ color: 'var(--success)' }}>{grossProfitMargin.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border-l-4" style={{ backgroundColor: 'var(--primary-bg)', borderLeftColor: 'var(--primary)' }}>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--primary-text)' }}>Net Profit</div>
                    <div className="text-sm" style={{ color: 'var(--primary)' }}>After all expenses</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: 'var(--primary-text)' }}>₹{netProfit.toLocaleString()}</div>
                    <div className="text-sm" style={{ color: 'var(--primary)' }}>{netProfitMargin.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border-l-4" style={{ backgroundColor: 'var(--warning-bg)', borderLeftColor: 'var(--warning)' }}>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--warning-text)' }}>Operating Expenses</div>
                    <div className="text-sm" style={{ color: 'var(--warning)' }}>Total operational costs</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: 'var(--warning-text)' }}>₹{(summary.operatingExpenses || 0).toLocaleString()}</div>
                    <div className="text-sm" style={{ color: 'var(--warning)' }}>{summary.totalSalesRevenue > 0 ? (((summary.operatingExpenses || 0) / summary.totalSalesRevenue) * 100).toFixed(1) : 0}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                  <div>
                    <div className="font-medium">Total Transactions</div>
                    <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Number of sales</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{(summary.totalTransactions || 0).toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                  <div>
                    <div className="font-medium">Average Transaction</div>
                    <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Per sale value</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">₹{(summary.avgTransactionValue || 0).toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--primary-bg)' }}>
                  <div className="text-sm font-medium mb-2" style={{ color: 'var(--primary-text)' }}>Profit Health Score</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-full h-3" style={{ backgroundColor: 'var(--muted)' }}>
                      <div
                        className="h-3 rounded-full"
                        style={{
                          width: `${Math.min((netProfitMargin / 30) * 100, 100)}%`,
                          backgroundColor: 'var(--primary)'
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--primary-text)' }}>
                      {netProfitMargin > 25 ? "Excellent" :
                       netProfitMargin > 15 ? "Good" :
                       netProfitMargin > 10 ? "Average" : "Poor"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Profit Optimization Recommendations
            </CardTitle>
            <CardDescription>AI-powered suggestions to improve profitability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {netProfitMargin < 15 && (
                <div className="p-4 rounded-lg border-l-4" style={{ backgroundColor: 'var(--destructive-bg)', borderLeftColor: 'var(--destructive)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4" style={{ color: 'var(--destructive)' }} />
                    <span className="font-medium" style={{ color: 'var(--destructive-text)' }}>Low Profit Margin</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--destructive-text)' }}>
                    Consider reviewing fertilizer pricing or reducing operational costs to improve margins.
                  </p>
                </div>
              )}

              {netProfitMargin >= 15 && (
                <div className="p-4 rounded-lg border-l-4" style={{ backgroundColor: 'var(--success-bg)', borderLeftColor: 'var(--success)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4" style={{ color: 'var(--success)' }} />
                    <span className="font-medium" style={{ color: 'var(--success-text)' }}>Healthy Margins</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--success-text)' }}>
                    Your profit margins are healthy. Focus on scaling fertilizer operations to increase absolute profits.
                  </p>
                </div>
              )}

              <div className="p-4 rounded-lg border-l-4" style={{ backgroundColor: 'var(--primary-bg)', borderLeftColor: 'var(--primary)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                  <span className="font-medium" style={{ color: 'var(--primary-text)' }}>Inventory Optimization</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--primary-text)' }}>
                  Focus on fast-moving fertilizer products to improve inventory turnover and cash flow.
                </p>
              </div>

              <div className="p-4 rounded-lg border-l-4" style={{ backgroundColor: 'var(--accent-bg)', borderLeftColor: 'var(--accent)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                  <span className="font-medium" style={{ color: 'var(--accent-text)' }}>Growth Opportunities</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--accent-text)' }}>
                  Consider expanding high-margin fertilizer categories to boost overall profitability.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
            <div className="text-lg">Generating report...</div>
            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Fetching data from database</div>
          </div>
        </div>
      );
    }

    switch (reportType) {
      case 'sales':
        return renderSalesReport();
      case 'inventory':
        return renderInventoryReport();
      case 'financial':
        return renderFinancialReport();
      case 'profit':
        return renderProfitAnalysisReport();
      default:
        return <div className="text-center py-8">Select a report type to view data</div>;
    }
  };

  return (
    <div className="space-y-6 p-6 bg-background text-foreground min-h-screen">
      {/* Print styles are now in global print.css */}
      {/* Enhanced Header */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-8 w-8" style={{ color: 'var(--primary)' }} />
            Reports & Analytics
          </h1>
          <p style={{ color: 'var(--muted-foreground)' }}>
            Comprehensive business insights and performance metrics
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={generateReport} disabled={isGenerating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>

          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>

          {/* Page Orientation Controls */}
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1">
            <Printer className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            <Select value={reportOrientation} onValueChange={setReportOrientation}>
              <SelectTrigger className="w-32 border-0 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auto-detect toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto-detect"
              checked={autoDetectOrientation}
              onChange={(e) => setAutoDetectOrientation(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="auto-detect" className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Auto-detect
            </label>
          </div>

          <Button variant="outline" size="sm" onClick={() => exportReport(exportFormat)} disabled={isGenerating}>
            <Download className="h-4 w-4 mr-2" />
            Export {exportFormat.toUpperCase()}
          </Button>

          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>

          <Button variant="outline" size="sm" onClick={testSalesData}>
            🧪 Test Sales Data
          </Button>

          <Button variant="outline" size="sm" onClick={scheduleReport}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>

          <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')}>
            ← Dashboard
          </Button>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Reports</TabsTrigger>
          <TabsTrigger value="financial">Financial Reports</TabsTrigger>
          <TabsTrigger value="profit">Profit Analysis</TabsTrigger>
          <TabsTrigger value="gst">GST Reports</TabsTrigger>
          <TabsTrigger value="invoice">Invoice & Bank</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Report Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Report Configuration
              </CardTitle>
              <CardDescription>
                Configure your report parameters and export options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales Report</SelectItem>
                      <SelectItem value="inventory">Inventory Report</SelectItem>
                      <SelectItem value="financial">Financial Report</SelectItem>
                      <SelectItem value="profit">Profit Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="this_week">This Week</SelectItem>
                      <SelectItem value="this_month">This Month</SelectItem>
                      <SelectItem value="last_month">Last Month</SelectItem>
                      <SelectItem value="this_year">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Export Format</label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Actions</label>
                  <div className="flex space-x-2">
                    <Button onClick={generateReport} disabled={loading}>
                      Generate Report
                    </Button>
                    <Button variant="outline" onClick={() => exportReport(exportFormat)}>
                      Export {exportFormat.toUpperCase()}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Content */}
          {renderReportContent()}
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="mb-4">
            <Button 
              onClick={() => { setReportType('sales'); generateReport(); }} 
              disabled={loading}
              className="mb-4"
            >
              {loading ? 'Generating...' : 'Generate Sales Report'}
            </Button>
          </div>
          {reportType === 'sales' ? renderSalesReport() : 
            <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>Click "Generate Sales Report" to view sales analytics</div>
          }
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="mb-4">
            <Button 
              onClick={() => { setReportType('inventory'); generateReport(); }} 
              disabled={loading}
              className="mb-4"
            >
              {loading ? 'Generating...' : 'Generate Inventory Report'}
            </Button>
          </div>
          {reportType === 'inventory' ? renderInventoryReport() : 
            <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>Click "Generate Inventory Report" to view inventory analytics</div>
          }
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="mb-4">
            <Button 
              onClick={() => { setReportType('financial'); generateReport(); }} 
              disabled={loading}
              className="mb-4"
            >
              {loading ? 'Generating...' : 'Generate Financial Report'}
            </Button>
          </div>
          {reportType === 'financial' ? renderFinancialReport() : 
            <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>Click "Generate Financial Report" to view financial analytics</div>
          }
        </TabsContent>

        <TabsContent value="profit" className="space-y-6">
          <div className="mb-4">
            <Button 
              onClick={() => { setReportType('profit'); generateReport(); }} 
              disabled={loading}
              className="mb-4"
            >
              {loading ? 'Generating...' : 'Generate Profit Analysis'}
            </Button>
          </div>
          {reportType === 'profit' ? renderProfitAnalysisReport() : 
            <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>Click "Generate Profit Analysis" to view detailed profit analytics</div>
          }
        </TabsContent>

        {/* GST Reports Tab */}
        <TabsContent value="gst" className="space-y-6">
          <GSTReports />
        </TabsContent>

        {/* Invoice & Bank Menu (Blank Details) */}
        <TabsContent value="invoice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice & Bank Details
              </CardTitle>
              <CardDescription>
                Select a recent sale to preview in the invoice format. Missing fields are shown as blanks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2 items-center">
                <label className="text-sm">Sale:</label>
                <Select value={selectedSaleId} onValueChange={setSelectedSaleId}>
                  <SelectTrigger className="w-72">
                    <SelectValue placeholder="Choose a sale" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesList.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.saleNumber || s.id} • {s.customerName || '—'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="ml-auto flex items-center gap-2">
                  <label className="text-sm">Orientation:</label>
                  <Select value={pdfOrientation} onValueChange={setPdfOrientation}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                  <label className="text-sm flex items-center gap-1">
                    <input type="checkbox" checked={compactInvoice} onChange={e => setCompactInvoice(e.target.checked)} />
                    Compact font
                  </label>
                  <Button variant="outline" size="sm" onClick={loadSales}>Refresh</Button>
                </div>
              </div>
              <div id="printable-invoice">
                <InvoicePreview sale={selectedSale || null} settings={systemSettings || null} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={openInvoicePreviewWindow}>
                  <Eye className="h-4 w-4 mr-2" /> Preview (New Window)
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint} title="Prints exactly what you see in the preview">
                  <Printer className="h-4 w-4 mr-2" /> Print Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
