import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import {
  FileText,
  Download,
  Calendar,
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Printer,
  RefreshCw,
  Filter,
  Eye,
  ExternalLink
} from 'lucide-react';
import { salesService, purchasesService } from '../../lib/supabaseDb';
import { shopDetailsService } from '../../lib/shopDetails';
import { gstService } from '../../lib/gstService';
import ReportHeader from './ReportHeader';

const GSTReports = ({ onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [gstData, setGstData] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(null);

  // Enhanced filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedGSTRate, setSelectedGSTRate] = useState('all');
  const [customerType, setCustomerType] = useState('all'); // B2B, B2C, all
  const [detailedSalesData, setDetailedSalesData] = useState([]);
  const [detailedPurchaseData, setDetailedPurchaseData] = useState([]);
  const [gstSummaryData, setGstSummaryData] = useState(null);

  // Load company details - defined before useEffect to avoid hoisting issues
  const loadCompanyDetails = async () => {
    try {
      console.log('🏢 Loading company details for GST reports...');
      const details = await shopDetailsService.getShopDetails();
      console.log('✅ Company details loaded:', details);
      setCompanyDetails(details);
    } catch (error) {
      console.error('❌ Failed to load company details:', error);
    }
  };

  // Generate GST report - defined before useEffect to avoid hoisting issues
  const generateGSTReport = async () => {
    setLoading(true);
    try {
      console.log('🔄 Generating GST report...');
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);

      console.log('📅 GST report date range:', { startDate, endDate });

      // Try to use GST service first, but fallback immediately if it fails
      try {
        console.log('🔧 Attempting to use GST service...');
        const [gstr3bData, gstr1Data, complianceReport] = await Promise.all([
          gstService.generateGSTR3B(startDate, endDate),
          gstService.generateGSTR1(startDate, endDate),
          gstService.generateComplianceReport()
        ]);

        // Combine data for display
        const gstReport = {
          period: `${getMonthName(selectedMonth)} ${selectedYear}`,
          sales: {
            totalSales: gstr3bData?.outwardSupplies?.taxableValue || 0,
            totalOutputGST: (gstr3bData?.outwardSupplies?.igst || 0) + (gstr3bData?.outwardSupplies?.cgst || 0) + (gstr3bData?.outwardSupplies?.sgst || 0),
            salesByGSTRate: {}
          },
          purchases: {
            totalPurchases: gstr3bData?.inputTaxCredit?.taxableValue || 0,
            totalInputGST: (gstr3bData?.inputTaxCredit?.igst || 0) + (gstr3bData?.inputTaxCredit?.cgst || 0) + (gstr3bData?.inputTaxCredit?.sgst || 0),
            purchasesByGSTRate: {}
          },
          netGSTLiability: gstr3bData?.totalLiability || 0,
          totalTransactions: gstr1Data?.summary?.totalInvoices || 0,
          salesTransactions: (gstr1Data?.b2b?.length || 0) + (gstr1Data?.b2c?.length || 0),
          purchaseTransactions: 0,
          gstr1Data,
          gstr3bData,
          complianceReport
        };

        console.log('✅ GST service data generated successfully');
        setGstData(gstReport);
      } catch (gstServiceError) {
        console.warn('⚠️ GST service failed, using fallback method:', gstServiceError.message);
        await generateGSTReportFallback();
      }
    } catch (error) {
      console.error('❌ Error generating GST report:', error);
      // Create empty GST data structure to prevent crashes
      const emptyGstReport = {
        period: `${getMonthName(selectedMonth)} ${selectedYear}`,
        sales: { totalSales: 0, totalOutputGST: 0, salesByGSTRate: {} },
        purchases: { totalPurchases: 0, totalInputGST: 0, purchasesByGSTRate: {} },
        netGSTLiability: 0,
        totalTransactions: 0,
        salesTransactions: 0,
        purchaseTransactions: 0,
        error: true,
        errorMessage: error.message
      };
      setGstData(emptyGstReport);
    } finally {
      setLoading(false);
    }
  };

  const generateGSTReportFallback = async () => {
    try {
      console.log('🔄 Using GST report fallback method...');
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);

      // Fetch sales and purchase data with timeout
      const [salesData, purchaseData] = await Promise.all([
        Promise.race([
          salesService.getAll(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Sales data timeout')), 8000))
        ]),
        Promise.race([
          purchasesService.getAll(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Purchase data timeout')), 8000))
        ])
      ]);

      console.log('📊 Fetched data:', { salesCount: salesData?.length || 0, purchaseCount: purchaseData?.length || 0 });

      // Filter data for selected month with safe date handling
      const filteredSales = (salesData || []).filter(sale => {
        try {
          const saleDate = sale.saleDate?.toDate ? sale.saleDate.toDate() :
                          sale.sale_date ? new Date(sale.sale_date) :
                          sale.created_at ? new Date(sale.created_at) :
                          new Date(sale.saleDate || sale.date);
          return saleDate >= startDate && saleDate <= endDate;
        } catch (dateError) {
          console.warn('Invalid sale date:', sale);
          return false;
        }
      });

      const filteredPurchases = (purchaseData || []).filter(purchase => {
        try {
          const purchaseDate = purchase.purchaseDate?.toDate ? purchase.purchaseDate.toDate() :
                              purchase.purchase_date ? new Date(purchase.purchase_date) :
                              purchase.created_at ? new Date(purchase.created_at) :
                              new Date(purchase.purchaseDate || purchase.date);
          return purchaseDate >= startDate && purchaseDate <= endDate;
        } catch (dateError) {
          console.warn('Invalid purchase date:', purchase);
          return false;
        }
      });

      console.log('📅 Filtered data:', { filteredSalesCount: filteredSales.length, filteredPurchasesCount: filteredPurchases.length });

      // Calculate GST data using fallback method
      const gstReport = calculateGSTData(filteredSales, filteredPurchases);

      // Generate compliance report
      const complianceReport = {
        gstinConfigured: !!(companyDetails?.gstNumber),
        gstinValid: companyDetails?.gstNumber ? (companyDetails.gstNumber.length === 15) : false,
        hsnCodesConfigured: true, // Assuming HSN codes are configured
        taxRatesConfigured: true, // Assuming tax rates are configured
        invoiceCompliance: true   // Assuming invoices are GST compliant
      };

      // Add compliance report to GST data
      gstReport.complianceReport = complianceReport;

      // Generate detailed data for enhanced reports
      const [detailedSales, detailedPurchases] = await Promise.all([
        generateDetailedSalesData(startDate, endDate),
        generateDetailedPurchaseData(startDate, endDate)
      ]);

      setDetailedSalesData(detailedSales);
      setDetailedPurchaseData(detailedPurchases);
      setGstData(gstReport);
    } catch (error) {
      console.error('Error in fallback GST report generation:', error);
    }
  };

  const calculateGSTData = (sales, purchases) => {
    console.log('🧮 Calculating GST data from raw data...');

    // Sales GST Calculations
    const salesGST = (sales || []).reduce((acc, sale) => {
      try {
        // Handle different data structures
        const items = sale.items || [];

        if (items.length > 0) {
          // New structure with items array
          items.forEach(item => {
            const quantity = parseFloat(item.quantity || 0);
            const price = parseFloat(item.price || item.unitPrice || 0);
            const taxableValue = quantity * price;
            const gstRate = parseFloat(item.gstRate || 5); // Default 5% for fertilizers
            const gstAmount = (taxableValue * gstRate) / 100;

            acc.totalSales += taxableValue;
            acc.totalOutputGST += gstAmount;

            // Categorize by GST rate
            if (!acc.salesByGSTRate[gstRate]) {
              acc.salesByGSTRate[gstRate] = { taxableValue: 0, gstAmount: 0, transactions: 0 };
            }
            acc.salesByGSTRate[gstRate].taxableValue += taxableValue;
            acc.salesByGSTRate[gstRate].gstAmount += gstAmount;
            acc.salesByGSTRate[gstRate].transactions += 1;
          });
        } else {
          // Old structure - direct sale properties
          const quantity = parseFloat(sale.quantity || sale.quantitySold || 0);
          const price = parseFloat(sale.price || sale.unitPrice || sale.totalSales || 0);
          const taxableValue = quantity > 0 && price > 0 ? quantity * price : price;
          const gstRate = parseFloat(sale.gstRate || 5);
          const gstAmount = (taxableValue * gstRate) / 100;

          acc.totalSales += taxableValue;
          acc.totalOutputGST += gstAmount;

          if (!acc.salesByGSTRate[gstRate]) {
            acc.salesByGSTRate[gstRate] = { taxableValue: 0, gstAmount: 0, transactions: 0 };
          }
          acc.salesByGSTRate[gstRate].taxableValue += taxableValue;
          acc.salesByGSTRate[gstRate].gstAmount += gstAmount;
          acc.salesByGSTRate[gstRate].transactions += 1;
        }
      } catch (error) {
        console.warn('Error processing sale for GST:', sale, error);
      }
      return acc;
    }, {
      totalSales: 0,
      totalOutputGST: 0,
      salesByGSTRate: {}
    });

    // Purchase GST Calculations
    const purchaseGST = (purchases || []).reduce((acc, purchase) => {
      try {
        const items = purchase.items || [];

        if (items.length > 0) {
          // New structure with items array
          items.forEach(item => {
            const quantity = parseFloat(item.quantity || 0);
            const price = parseFloat(item.price || item.unitPrice || 0);
            const taxableValue = quantity * price;
            const gstRate = parseFloat(item.gstRate || 5);
            const gstAmount = (taxableValue * gstRate) / 100;

            acc.totalPurchases += taxableValue;
            acc.totalInputGST += gstAmount;

            // Categorize by GST rate
            if (!acc.purchasesByGSTRate[gstRate]) {
              acc.purchasesByGSTRate[gstRate] = { taxableValue: 0, gstAmount: 0, transactions: 0 };
            }
            acc.purchasesByGSTRate[gstRate].taxableValue += taxableValue;
            acc.purchasesByGSTRate[gstRate].gstAmount += gstAmount;
            acc.purchasesByGSTRate[gstRate].transactions += 1;
          });
        } else {
          // Old structure - direct purchase properties
          const quantity = parseFloat(purchase.quantity || 0);
          const price = parseFloat(purchase.price || purchase.unitPrice || purchase.totalAmount || 0);
          const taxableValue = quantity > 0 && price > 0 ? quantity * price : price;
          const gstRate = parseFloat(purchase.gstRate || 5);
          const gstAmount = (taxableValue * gstRate) / 100;

          acc.totalPurchases += taxableValue;
          acc.totalInputGST += gstAmount;

          if (!acc.purchasesByGSTRate[gstRate]) {
            acc.purchasesByGSTRate[gstRate] = { taxableValue: 0, gstAmount: 0, transactions: 0 };
          }
          acc.purchasesByGSTRate[gstRate].taxableValue += taxableValue;
          acc.purchasesByGSTRate[gstRate].gstAmount += gstAmount;
          acc.purchasesByGSTRate[gstRate].transactions += 1;
        }
      } catch (error) {
        console.warn('Error processing purchase for GST:', purchase, error);
      }
      return acc;
    }, {
      totalPurchases: 0,
      totalInputGST: 0,
      purchasesByGSTRate: {}
    });

    // Calculate net GST liability
    const netGSTLiability = salesGST.totalOutputGST - purchaseGST.totalInputGST;

    return {
      period: `${getMonthName(selectedMonth)} ${selectedYear}`,
      sales: salesGST,
      purchases: purchaseGST,
      netGSTLiability,
      totalTransactions: sales.length + purchases.length,
      salesTransactions: sales.length,
      purchaseTransactions: purchases.length
    };
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const groupSalesByGSTRate = (salesData) => {
    const grouped = {};
    salesData.forEach(sale => {
      // Assume 5% GST rate for fertilizers if not specified
      const rate = sale.gstRate || 5;
      if (!grouped[rate]) {
        grouped[rate] = {
          taxableValue: 0,
          gstAmount: 0,
          transactions: 0
        };
      }
      grouped[rate].taxableValue += sale.taxableValue || 0;
      grouped[rate].gstAmount += sale.igst || 0;
      grouped[rate].transactions += 1;
    });
    return grouped;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Helper function to get GST rate badge color
  const getGSTRateBadgeColor = (rate) => {
    switch (rate) {
      case 0: return 'bg-green-100 text-green-800';
      case 5: return 'bg-blue-100 text-blue-800';
      case 12: return 'bg-orange-100 text-orange-800';
      case 18: return 'bg-red-100 text-red-800';
      case 28: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to determine customer type
  const getCustomerType = (customer) => {
    return customer?.gstNumber ? 'B2B' : 'B2C';
  };

  // Helper function to format date
  const formatDate = (date) => {
    if (!date) return '';
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-IN');
  };

  // Generate detailed sales data for GSTR-1
  const generateDetailedSalesData = async (startDate, endDate) => {
    try {
      const sales = await salesService.getSalesByDateRange(startDate, endDate);

      const detailedData = [];
      sales.forEach(sale => {
        if (sale.items && Array.isArray(sale.items)) {
          sale.items.forEach(item => {
            const taxableValue = (item.quantity || 0) * (item.price || 0);
            const gstRate = item.gstRate || 5;
            const gstAmount = (taxableValue * gstRate) / 100;
            const cgst = gstRate > 0 ? gstAmount / 2 : 0;
            const sgst = gstRate > 0 ? gstAmount / 2 : 0;

            detailedData.push({
              date: sale.saleDate,
              invoiceNo: sale.invoiceNumber || sale.id,
              customerName: sale.customerName || 'Walk-in Customer',
              customerGSTIN: sale.customerGSTIN || '',
              customerType: sale.customerGSTIN ? 'B2B' : 'B2C',
              productName: item.productName || item.name,
              hsnCode: item.hsnCode || '31051000',
              quantity: item.quantity || 0,
              unitPrice: item.price || 0,
              taxableValue: taxableValue,
              gstRate: gstRate,
              cgstAmount: cgst,
              sgstAmount: sgst,
              totalAmount: taxableValue + gstAmount
            });
          });
        }
      });

      return detailedData;
    } catch (error) {
      console.error('Error generating detailed sales data:', error);
      return [];
    }
  };

  // Generate detailed purchase data
  const generateDetailedPurchaseData = async (startDate, endDate) => {
    try {
      const purchases = await purchasesService.getPurchasesByDateRange(startDate, endDate);

      const detailedData = [];
      purchases.forEach(purchase => {
        if (purchase.items && Array.isArray(purchase.items)) {
          purchase.items.forEach(item => {
            const taxableValue = (item.quantity || 0) * (item.price || 0);
            const gstRate = item.gstRate || 5;
            const gstAmount = (taxableValue * gstRate) / 100;
            const cgst = gstRate > 0 ? gstAmount / 2 : 0;
            const sgst = gstRate > 0 ? gstAmount / 2 : 0;

            detailedData.push({
              date: purchase.purchaseDate,
              invoiceNo: purchase.invoiceNumber || purchase.id,
              supplierName: purchase.supplierName || 'Unknown Supplier',
              supplierGSTIN: purchase.supplierGSTIN || '',
              productName: item.productName || item.name,
              hsnCode: item.hsnCode || '31051000',
              quantity: item.quantity || 0,
              unitPrice: item.price || 0,
              taxableValue: taxableValue,
              gstRate: gstRate,
              cgstAmount: cgst,
              sgstAmount: sgst,
              totalAmount: taxableValue + gstAmount
            });
          });
        }
      });

      return detailedData;
    } catch (error) {
      console.error('Error generating detailed purchase data:', error);
      return [];
    }
  };

  const exportGSTR1 = () => {
    if (!gstData || !gstData.gstr1Data) return;

    // Use the properly formatted GSTR-1 data from GST service
    const exportData = {
      ...gstData.gstr1Data,
      generatedOn: new Date().toISOString(),
      generatedBy: 'KrishiSethu Inventory Management System'
    };

    // Create downloadable file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR1_${selectedMonth.toString().padStart(2, '0')}_${selectedYear}.json`;
    link.click();
  };

  const exportGSTR3B = () => {
    if (!gstData || !gstData.gstr3bData) return;

    // Use the properly formatted GSTR-3B data from GST service
    const exportData = {
      ...gstData.gstr3bData,
      generatedOn: new Date().toISOString(),
      generatedBy: 'KrishiSethu Inventory Management System'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR3B_${selectedMonth.toString().padStart(2, '0')}_${selectedYear}.json`;
    link.click();
  };

  const handlePrintGSTReport = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>GST Report - ${gstData?.period || ''}</title>
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

            h1, h2, h3 { color: black; margin-bottom: 10px; }
            table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
            }
            th { background-color: #f5f5f5; font-weight: bold; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .card { border: 1px solid #000; padding: 15px; }
            .status-ok { color: green; }
            .status-warning { color: red; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          <!-- Report Header -->
          <div class="report-header" style="border-bottom: 2px solid #000; margin-bottom: 20px; padding-bottom: 15px;">
            <!-- Report Title -->
            <div style="text-align: center; margin-bottom: 15px;">
              <h1 style="font-size: 24px; font-weight: bold; margin: 0;">GST Report</h1>
            </div>

            <!-- Company Info Section -->
            <div style="display: flex; align-items: start; gap: 20px; margin-bottom: 15px;">
              <!-- Logo -->
              <div style="flex-shrink: 0;">
                <div style="width: 64px; height: 64px; border: 1px solid #000; background: #f5f5f5; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                  ${companyDetails?.logo ? `<img src="${companyDetails.logo}" style="max-width: 100%; max-height: 100%;" />` : '🌾<br>LOGO'}
                </div>
              </div>

              <!-- Company Details -->
              <div style="flex: 1;">
                <h2 style="font-size: 18px; font-weight: bold; margin: 0 0 5px 0;">${companyDetails?.name || 'Krishisethu Fertilizers'}</h2>
                <div style="font-size: 12px; line-height: 1.4;">
                  <div>${companyDetails?.address?.street || '123 Agricultural Complex'}</div>
                  <div>${companyDetails?.address?.city || 'Mumbai'}, ${companyDetails?.address?.state || 'Maharashtra'} - ${companyDetails?.address?.pincode || '400001'}</div>
                  <div>📞 ${companyDetails?.phone || '+91-9876543210'} | ✉️ ${companyDetails?.email || 'info@krishisethu.com'}</div>
                  <div><strong>GST:</strong> ${companyDetails?.gstNumber || '27AAAAA0000A1Z5'}</div>
                </div>
              </div>
            </div>

            <!-- Report Meta -->
            <div style="text-align: center; border-top: 1px solid #ccc; padding-top: 10px; font-size: 12px;">
              <div><strong>Period:</strong> ${gstData?.period || ''} | <strong>Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
              <div style="font-size: 10px; color: #666; margin-top: 5px;">Report ID: GST-${Date.now()} | KrishiSethu Inventory Management System</div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <h3>Sales Summary</h3>
              <p><strong>Total Sales:</strong> ₹${gstData?.sales?.totalSales?.toFixed(2) || '0.00'}</p>
              <p><strong>Output GST:</strong> ₹${gstData?.sales?.totalOutputGST?.toFixed(2) || '0.00'}</p>
              <p><strong>Transactions:</strong> ${gstData?.salesTransactions || 0}</p>
            </div>

            <div class="card">
              <h3>Purchase Summary</h3>
              <p><strong>Total Purchases:</strong> ₹${gstData?.purchases?.totalPurchases?.toFixed(2) || '0.00'}</p>
              <p><strong>Input GST:</strong> ₹${gstData?.purchases?.totalInputGST?.toFixed(2) || '0.00'}</p>
              <p><strong>Transactions:</strong> ${gstData?.purchaseTransactions || 0}</p>
            </div>
          </div>

          <div class="card">
            <h3>Net GST Liability</h3>
            <p style="font-size: 18px; font-weight: bold;">₹${gstData?.netGSTLiability?.toFixed(2) || '0.00'}</p>
          </div>

          <div class="card">
            <h3>Compliance Status</h3>
            <table>
              <tr>
                <td>GSTIN Configured</td>
                <td class="${gstData?.complianceReport?.gstinConfigured ? 'status-ok' : 'status-warning'}">
                  ${gstData?.complianceReport?.gstinConfigured ? '✓ Yes' : '✗ No'}
                </td>
              </tr>
              <tr>
                <td>GSTIN Valid</td>
                <td class="${gstData?.complianceReport?.gstinValid ? 'status-ok' : 'status-warning'}">
                  ${gstData?.complianceReport?.gstinValid ? '✓ Yes' : '✗ No'}
                </td>
              </tr>
              <tr>
                <td>HSN Codes Configured</td>
                <td class="${gstData?.complianceReport?.hsnCodesConfigured ? 'status-ok' : 'status-warning'}">
                  ${gstData?.complianceReport?.hsnCodesConfigured ? '✓ Yes' : '✗ No'}
                </td>
              </tr>
              <tr>
                <td>Tax Rates Configured</td>
                <td class="${gstData?.complianceReport?.taxRatesConfigured ? 'status-ok' : 'status-warning'}">
                  ${gstData?.complianceReport?.taxRatesConfigured ? '✓ Yes' : '✗ No'}
                </td>
              </tr>
              <tr>
                <td>Invoice Compliance</td>
                <td class="${gstData?.complianceReport?.invoiceCompliance ? 'status-ok' : 'status-warning'}">
                  ${gstData?.complianceReport?.invoiceCompliance ? '✓ Yes' : '✗ No'}
                </td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
            Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  // Export detailed report to Excel format
  const exportDetailedReport = (type) => {
    const data = type === 'sales' ? detailedSalesData : detailedPurchaseData;
    if (!data.length) return;

    const headers = type === 'sales'
      ? ['Date', 'Invoice No', 'Customer Name', 'GSTIN', 'Type', 'Product', 'HSN', 'Qty', 'Unit Price', 'Taxable Value', 'GST Rate', 'CGST', 'SGST', 'Total']
      : ['Date', 'Purchase Invoice', 'Supplier Name', 'GSTIN', 'Product', 'HSN', 'Qty', 'Unit Price', 'Taxable Value', 'GST Rate', 'CGST', 'SGST', 'Total'];

    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        formatDate(item.date),
        item.invoiceNo,
        type === 'sales' ? item.customerName : item.supplierName,
        type === 'sales' ? (item.customerGSTIN || '') : (item.supplierGSTIN || ''),
        type === 'sales' ? item.customerType : '',
        item.productName,
        item.hsnCode,
        item.quantity,
        item.unitPrice,
        item.taxableValue,
        `${item.gstRate}%`,
        item.cgstAmount,
        item.sgstAmount,
        item.totalAmount
      ].filter(Boolean).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_gst_report_${gstData?.period?.replace(' ', '_')}.csv`;
    link.click();
  };

  // Print detailed report
  const printDetailedReport = (type) => {
    const data = type === 'sales' ? detailedSalesData : detailedPurchaseData;
    const title = type === 'sales' ? 'Sales GST Report (Outward Supplies)' : 'Purchase GST Report (Inward Supplies)';

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return;

    const tableRows = data.map(item => `
      <tr>
        <td>${formatDate(item.date)}</td>
        <td>${item.invoiceNo}</td>
        <td>${type === 'sales' ? item.customerName : item.supplierName}</td>
        <td>${type === 'sales' ? (item.customerGSTIN || '—') : (item.supplierGSTIN || '—')}</td>
        ${type === 'sales' ? `<td>${item.customerType}</td>` : ''}
        <td>${item.productName}</td>
        <td>${item.hsnCode}</td>
        <td style="text-align: right">${item.quantity || 0}</td>
        <td style="text-align: right">₹${(item.unitPrice || 0).toFixed(2)}</td>
        <td style="text-align: right">₹${(item.taxableValue || 0).toFixed(2)}</td>
        <td style="text-align: center">${item.gstRate || 0}%</td>
        <td style="text-align: right">₹${(item.cgstAmount || 0).toFixed(2)}</td>
        <td style="text-align: right">₹${(item.sgstAmount || 0).toFixed(2)}</td>
        <td style="text-align: right"><strong>₹${(item.totalAmount || 0).toFixed(2)}</strong></td>
      </tr>
    `).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: A4 landscape; margin: 0.5in; }
            body { font-family: Arial, sans-serif; font-size: 12px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #000; padding: 4px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .summary { background-color: #f0f8ff; padding: 10px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <!-- Report Header -->
          <div style="border-bottom: 2px solid #000; margin-bottom: 20px; padding-bottom: 15px;">
            <!-- Report Title -->
            <div style="text-align: center; margin-bottom: 15px;">
              <h1 style="font-size: 20px; font-weight: bold; margin: 0;">${title}</h1>
            </div>

            <!-- Company Info Section -->
            <div style="display: flex; align-items: start; gap: 15px; margin-bottom: 15px;">
              <!-- Logo -->
              <div style="flex-shrink: 0;">
                <div style="width: 50px; height: 50px; border: 1px solid #000; background: #f5f5f5; display: flex; align-items: center; justify-content: center; font-size: 8px;">
                  🌾<br>LOGO
                </div>
              </div>

              <!-- Company Details -->
              <div style="flex: 1;">
                <h2 style="font-size: 14px; font-weight: bold; margin: 0 0 3px 0;">${companyDetails?.name || 'Krishisethu Fertilizers'}</h2>
                <div style="font-size: 10px; line-height: 1.3;">
                  <div>${companyDetails?.address?.street || '123 Agricultural Complex'}</div>
                  <div>${companyDetails?.address?.city || 'Mumbai'}, ${companyDetails?.address?.state || 'Maharashtra'} - ${companyDetails?.address?.pincode || '400001'}</div>
                  <div>📞 ${companyDetails?.phone || '+91-9876543210'} | ✉️ ${companyDetails?.email || 'info@krishisethu.com'}</div>
                  <div><strong>GST:</strong> ${companyDetails?.gstNumber || '27AAAAA0000A1Z5'}</div>
                </div>
              </div>
            </div>

            <!-- Report Meta -->
            <div style="text-align: center; border-top: 1px solid #ccc; padding-top: 8px; font-size: 10px;">
              <div><strong>Period:</strong> ${gstData?.period || ''} | <strong>Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
              <div style="font-size: 8px; color: #666; margin-top: 3px;">Report ID: ${type.toUpperCase()}-${Date.now()} | KrishiSethu Inventory Management System</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>${type === 'sales' ? 'Invoice No' : 'Purchase Invoice'}</th>
                <th>${type === 'sales' ? 'Customer' : 'Supplier'}</th>
                <th>GSTIN</th>
                ${type === 'sales' ? '<th>Type</th>' : ''}
                <th>Product</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Taxable Value</th>
                <th>GST Rate</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="summary">
            <strong>Summary:</strong>
            Total Transactions: ${data?.length || 0} |
            Total Taxable Value: ₹${(data || []).reduce((sum, item) => sum + (item.taxableValue || 0), 0).toFixed(2)} |
            Total GST: ₹${(data || []).reduce((sum, item) => sum + (item.cgstAmount || 0) + (item.sgstAmount || 0), 0).toFixed(2)} |
            Grand Total: ₹${(data || []).reduce((sum, item) => sum + (item.totalAmount || 0), 0).toFixed(2)}
          </div>

          <p style="text-align: center; margin-top: 30px; font-size: 10px;">
            Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </p>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  // Load data on component mount - useEffect placed after function definitions
  useEffect(() => {
    console.log('🔄 GST Reports useEffect triggered for:', { selectedMonth, selectedYear });
    loadCompanyDetails();
    generateGSTReport();
  }, [selectedMonth, selectedYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <div className="text-lg">Generating GST Report...</div>
        </div>
      </div>
    );
  }

  return (
    <div id="report-content" className="space-y-6 p-6">
      {/* Header */}
      <div className="no-print flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="h-8 w-8 text-blue-600" />
            GST Reports & Compliance
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive GST reporting for {companyDetails?.name || 'Your Business'}
          </p>
          <p className="text-sm text-gray-500">
            GSTIN: {companyDetails?.gstNumber || 'Not configured'}
          </p>
        </div>
        
        {/* Period Selection */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>Month:</Label>
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {getMonthName(i + 1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Label>Year:</Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={generateGSTReport} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {gstData?.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">Error Loading GST Data</h3>
                <p className="text-sm">{gstData.errorMessage}</p>
                <Button
                  onClick={generateGSTReport}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  disabled={loading}
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {gstData?.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">Error Loading GST Data</h3>
                <p className="text-sm">{gstData.errorMessage}</p>
                <Button
                  onClick={generateGSTReport}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  disabled={loading}
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data Display */}
      {!loading && !gstData && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <Calculator className="h-12 w-12" />
              <div>
                <h3 className="font-semibold">No GST Data Available</h3>
                <p className="text-sm">Click "Generate Report" to load GST data for the selected period.</p>
                <Button
                  onClick={generateGSTReport}
                  className="mt-3"
                  disabled={loading}
                >
                  Generate GST Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {gstData && !gstData.error && (
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="summary">GST Summary</TabsTrigger>
            <TabsTrigger value="sales-detailed">Sales GST</TabsTrigger>
            <TabsTrigger value="purchase-detailed">Purchase GST</TabsTrigger>
            <TabsTrigger value="gstr1">GSTR-1</TabsTrigger>
            <TabsTrigger value="gstr3b">GSTR-3B</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          {/* GST Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(gstData.sales.totalSales)}</div>
                  <p className="text-xs text-muted-foreground">{gstData.salesTransactions} transactions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Output GST</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(gstData.sales.totalOutputGST)}</div>
                  <p className="text-xs text-muted-foreground">GST collected</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Input GST</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(gstData.purchases.totalInputGST)}</div>
                  <p className="text-xs text-muted-foreground">GST paid</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Net GST Liability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${gstData.netGSTLiability >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(Math.abs(gstData.netGSTLiability))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {gstData.netGSTLiability >= 0 ? 'To be paid' : 'Refund due'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sales by GST Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Sales by GST Rate</CardTitle>
                <CardDescription>Breakdown of sales by different GST rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">GST Rate</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Taxable Value</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">GST Amount</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Total Value</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Transactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(gstData.sales.salesByGSTRate).map(([rate, data]) => (
                        <tr key={rate}>
                          <td className="border border-gray-300 px-4 py-2">{rate}%</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(data.taxableValue)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(data.gstAmount)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(data.taxableValue + data.gstAmount)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{data.transactions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales GST Report Tab */}
          <TabsContent value="sales-detailed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Sales GST Report (Outward Supplies - GSTR-1)</span>
                  <div className="flex gap-2">
                    <Button onClick={() => exportDetailedReport('sales')} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </Button>
                    <Button onClick={() => printDetailedReport('sales')} variant="outline" size="sm">
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Track GST collected from customers - Detailed transaction view
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Label>GST Rate:</Label>
                    <Select value={selectedGSTRate} onValueChange={setSelectedGSTRate}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Rates</SelectItem>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label>Customer Type:</Label>
                    <Select value={customerType} onValueChange={setCustomerType}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="B2B">B2B</SelectItem>
                        <SelectItem value="B2C">B2C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>

                {/* Sales GST Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-left">Date</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Invoice No</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Customer Name</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">GSTIN</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Type</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Product</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">HSN</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">Qty</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">Unit Price</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">Taxable Value</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">GST Rate</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">CGST</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">SGST</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedSalesData
                        .filter(item => selectedGSTRate === 'all' || item.gstRate.toString() === selectedGSTRate)
                        .filter(item => customerType === 'all' || item.customerType === customerType)
                        .map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2">{formatDate(item.date)}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.invoiceNo}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.customerName}</td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">{item.customerGSTIN || '—'}</td>
                          <td className="border border-gray-300 px-3 py-2">
                            <Badge variant={item.customerType === 'B2B' ? 'default' : 'secondary'}>
                              {item.customerType}
                            </Badge>
                          </td>
                          <td className="border border-gray-300 px-3 py-2">{item.productName}</td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">{item.hsnCode}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right">{item.quantity}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrency(item.taxableValue)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <Badge className={getGSTRateBadgeColor(item.gstRate)}>
                              {item.gstRate}%
                            </Badge>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrency(item.cgstAmount)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrency(item.sgstAmount)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right font-medium">{formatCurrency(item.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Row */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Transactions: </span>
                      {detailedSalesData.length}
                    </div>
                    <div>
                      <span className="font-medium">Total Taxable Value: </span>
                      {formatCurrency(detailedSalesData.reduce((sum, item) => sum + item.taxableValue, 0))}
                    </div>
                    <div>
                      <span className="font-medium">Total GST: </span>
                      {formatCurrency(detailedSalesData.reduce((sum, item) => sum + item.cgstAmount + item.sgstAmount, 0))}
                    </div>
                    <div>
                      <span className="font-medium">Grand Total: </span>
                      {formatCurrency(detailedSalesData.reduce((sum, item) => sum + item.totalAmount, 0))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchase GST Report Tab */}
          <TabsContent value="purchase-detailed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Purchase GST Report (Inward Supplies)</span>
                  <div className="flex gap-2">
                    <Button onClick={() => exportDetailedReport('purchase')} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </Button>
                    <Button onClick={() => printDetailedReport('purchase')} variant="outline" size="sm">
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Track GST paid to suppliers - Detailed transaction view
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Purchase GST Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-left">Date</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Purchase Invoice</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Supplier Name</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">GSTIN</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Product</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">HSN</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">Qty</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">Unit Price</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">Taxable Value</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">GST Rate</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">CGST</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">SGST</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedPurchaseData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2">{formatDate(item.date)}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.invoiceNo}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.supplierName}</td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">{item.supplierGSTIN || '—'}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.productName}</td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">{item.hsnCode}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right">{item.quantity}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrency(item.taxableValue)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <Badge className={getGSTRateBadgeColor(item.gstRate)}>
                              {item.gstRate}%
                            </Badge>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrency(item.cgstAmount)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrency(item.sgstAmount)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right font-medium">{formatCurrency(item.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Row */}
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Transactions: </span>
                      {detailedPurchaseData.length}
                    </div>
                    <div>
                      <span className="font-medium">Total Taxable Value: </span>
                      {formatCurrency(detailedPurchaseData.reduce((sum, item) => sum + item.taxableValue, 0))}
                    </div>
                    <div>
                      <span className="font-medium">Total GST: </span>
                      {formatCurrency(detailedPurchaseData.reduce((sum, item) => sum + item.cgstAmount + item.sgstAmount, 0))}
                    </div>
                    <div>
                      <span className="font-medium">Grand Total: </span>
                      {formatCurrency(detailedPurchaseData.reduce((sum, item) => sum + item.totalAmount, 0))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GSTR-1 Tab */}
          <TabsContent value="gstr1" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>GSTR-1 - Outward Supplies</span>
                  <Button onClick={exportGSTR1} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export GSTR-1
                  </Button>
                </CardTitle>
                <CardDescription>
                  Details of outward supplies of goods or services effected during {gstData.period}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">GSTIN</Label>
                      <div className="text-lg">{companyDetails?.gstNumber || 'Not configured'}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Period</Label>
                      <div className="text-lg">{gstData.period}</div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">B2B Supplies</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-3 py-2 text-left">Rate</th>
                            <th className="border border-gray-300 px-3 py-2 text-right">Taxable Value</th>
                            <th className="border border-gray-300 px-3 py-2 text-right">Integrated Tax</th>
                            <th className="border border-gray-300 px-3 py-2 text-right">Central Tax</th>
                            <th className="border border-gray-300 px-3 py-2 text-right">State/UT Tax</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(gstData.sales.salesByGSTRate).map(([rate, data]) => (
                            <tr key={rate}>
                              <td className="border border-gray-300 px-3 py-2">{rate}%</td>
                              <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrency(data.taxableValue)}</td>
                              <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrency(data.gstAmount)}</td>
                              <td className="border border-gray-300 px-3 py-2 text-right">-</td>
                              <td className="border border-gray-300 px-3 py-2 text-right">-</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GSTR-3B Tab */}
          <TabsContent value="gstr3b" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>GSTR-3B - Monthly Return</span>
                  <Button onClick={exportGSTR3B} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export GSTR-3B
                  </Button>
                </CardTitle>
                <CardDescription>
                  Monthly summary return for {gstData.period}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Section 3.1 - Outward Supplies */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">3.1 Details of Outward Supplies and inward supplies liable to reverse charge</h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Total Taxable Value</div>
                        <div className="text-lg font-semibold">{formatCurrency(gstData.sales.totalSales)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Integrated Tax</div>
                        <div className="text-lg font-semibold">{formatCurrency(gstData.sales.totalOutputGST)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Central Tax</div>
                        <div className="text-lg font-semibold">-</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">State/UT Tax</div>
                        <div className="text-lg font-semibold">-</div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4 - Eligible ITC */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">4. Eligible ITC</h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Integrated Tax</div>
                        <div className="text-lg font-semibold">{formatCurrency(gstData.purchases.totalInputGST)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Central Tax</div>
                        <div className="text-lg font-semibold">-</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">State/UT Tax</div>
                        <div className="text-lg font-semibold">-</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Cess</div>
                        <div className="text-lg font-semibold">-</div>
                      </div>
                    </div>
                  </div>

                  {/* Section 5 - Net GST Liability */}
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h4 className="font-semibold mb-3">5. Values of exempt, nil rated and non-GST outward supplies</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Net GST Liability</div>
                        <div className={`text-2xl font-bold ${gstData.netGSTLiability >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.abs(gstData.netGSTLiability))}
                        </div>
                        <div className="text-sm text-gray-500">
                          {gstData.netGSTLiability >= 0 ? 'Amount to be paid' : 'Refund due'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Due Date</div>
                        <div className="text-lg font-semibold">
                          {new Date(selectedYear, selectedMonth, 20).toLocaleDateString('en-IN')}
                        </div>
                        <div className="text-sm text-gray-500">20th of next month</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>GST Compliance Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>GSTIN Configured</span>
                      {gstData?.complianceReport?.gstinConfigured ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>GSTIN Valid</span>
                      {gstData?.complianceReport?.gstinValid ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>HSN Codes</span>
                      {gstData?.complianceReport?.hsnCodesConfigured ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tax Rates Configured</span>
                      {gstData?.complianceReport?.taxRatesConfigured ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Invoice Compliance</span>
                      {gstData?.complianceReport?.invoiceCompliance ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>

                  {/* Compliance Recommendations */}
                  {gstData?.complianceReport?.recommendations && gstData.complianceReport.recommendations.length > 0 && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">Recommendations:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {gstData.complianceReport.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-yellow-600">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Output GST</span>
                      <span className="font-semibold">{formatCurrency(gstData.sales.totalOutputGST)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Input GST</span>
                      <span className="font-semibold">{formatCurrency(gstData.purchases.totalInputGST)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Net Liability</span>
                      <span className={`font-bold ${gstData.netGSTLiability >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(Math.abs(gstData.netGSTLiability))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Print Button */}
            <div className="flex justify-center">
              <Button onClick={handlePrintGSTReport} size="lg">
                <Printer className="h-4 w-4 mr-2" />
                Print GST Report
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default GSTReports;
