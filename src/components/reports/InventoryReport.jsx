import React, { useState, useEffect } from 'react';
import ReportTemplate, { 
  ReportSummaryCard, 
  ReportTable, 
  ReportSection, 
  ReportGrid,
  PrintButton 
} from './ReportTemplate';
import { reportsService } from '../../lib/reports';
import { productsService, salesService, purchasesService } from '../../lib/supabaseDb';
import { 
  Package, 
  AlertTriangle, 
  XCircle, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Download,
  FileText,
  Loader2
} from 'lucide-react';

const InventoryReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all required data
      const [products, sales, purchases] = await Promise.all([
        productsService.getAll(),
        salesService.getAll(),
        purchasesService.getAll()
      ]);

      // Generate report data
      const data = reportsService.generateInventoryReport(products, sales, purchases);
      setReportData(data);
    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('inventory-report');
    if (element) {
      try {
        await reportsService.generatePDF(
          element, 
          `inventory-report-${new Date().toISOString().split('T')[0]}.pdf`
        );
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
      }
    }
  };

  const handleDownloadExcel = async () => {
    if (!reportData) return;

    try {
      const excelData = reportData.products.map(product => [
        product.name,
        product.category,
        product.currentStock,
        product.reorderPoint,
        reportsService.formatCurrency(product.sellingPrice),
        reportsService.formatCurrency(product.stockValue),
        product.status
      ]);

      await reportsService.generateExcel(
        excelData,
        `inventory-report-${new Date().toISOString().split('T')[0]}.xlsx`,
        {
          sheetName: 'Inventory Report',
          headers: [
            'Product Name',
            'Category', 
            'Current Stock',
            'Reorder Point',
            'Selling Price',
            'Stock Value',
            'Status'
          ]
        }
      );
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Failed to generate Excel file. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Generating inventory report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadReportData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  const { summary, products, sales, purchases } = reportData;

  return (
    <div className="max-w-7xl mx-auto p-6 print:p-0 print:max-w-none">
      {/* Action Buttons */}
      <div className="no-print mb-6 flex gap-3 justify-end">
        <PrintButton onClick={handlePrintReport} />
        <button
          onClick={handleDownloadPDF}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Download PDF
        </button>
        <button
          onClick={handleDownloadExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Excel
        </button>
      </div>

      {/* Report Content */}
      <div id="inventory-report">
        <ReportTemplate 
          title="Inventory Report"
          subtitle={`Complete inventory analysis as of ${reportsService.getCurrentDate()}`}
        >
          {/* Summary Section */}
          <ReportSection title="Executive Summary">
            <ReportGrid columns={4}>
              <ReportSummaryCard
                title="Total Products"
                value={reportsService.formatNumber(summary.totalProducts)}
                subtitle="Active inventory items"
                icon={<Package />}
                color="blue"
              />
              <ReportSummaryCard
                title="Low Stock Items"
                value={reportsService.formatNumber(summary.lowStockProducts)}
                subtitle="Need reordering"
                icon={<AlertTriangle />}
                color="yellow"
              />
              <ReportSummaryCard
                title="Out of Stock"
                value={reportsService.formatNumber(summary.outOfStockProducts)}
                subtitle="Immediate attention required"
                icon={<XCircle />}
                color="red"
              />
              <ReportSummaryCard
                title="Total Inventory Value"
                value={reportsService.formatCurrency(summary.totalValue)}
                subtitle="Current stock value"
                icon={<DollarSign />}
                color="green"
              />
            </ReportGrid>
          </ReportSection>

          {/* Financial Performance */}
          <ReportSection title="Monthly Financial Performance">
            <ReportGrid columns={4}>
              <ReportSummaryCard
                title="Monthly Revenue"
                value={reportsService.formatCurrency(summary.monthlyRevenue)}
                subtitle="Current month sales"
                icon={<TrendingUp />}
                color="green"
              />
              <ReportSummaryCard
                title="Monthly Costs"
                value={reportsService.formatCurrency(summary.monthlyCost)}
                subtitle="Current month purchases"
                icon={<TrendingDown />}
                color="red"
              />
              <ReportSummaryCard
                title="Monthly Profit"
                value={reportsService.formatCurrency(summary.monthlyProfit)}
                subtitle={`${summary.profitMargin.toFixed(1)}% margin`}
                icon={<DollarSign />}
                color={summary.monthlyProfit >= 0 ? "green" : "red"}
              />
              <ReportSummaryCard
                title="Profit Margin"
                value={`${summary.profitMargin.toFixed(1)}%`}
                subtitle="Revenue to profit ratio"
                icon={summary.profitMargin >= 0 ? <TrendingUp /> : <TrendingDown />}
                color={summary.profitMargin >= 20 ? "green" : summary.profitMargin >= 10 ? "yellow" : "red"}
              />
            </ReportGrid>
          </ReportSection>

          {/* Product Details */}
          <ReportSection title="Product Inventory Details">
            <ReportTable
              headers={[
                'Product Name',
                'Category',
                'Current Stock',
                'Reorder Point',
                'Selling Price',
                'Stock Value',
                'Status'
              ]}
              data={products.map(product => [
                product.name,
                product.category,
                reportsService.formatNumber(product.currentStock),
                product.reorderPoint,
                reportsService.formatCurrency(product.sellingPrice),
                reportsService.formatCurrency(product.stockValue),
                <span 
                  key={product.name}
                  className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${product.status === 'Out of Stock' ? 'bg-red-100 text-red-800' :
                      product.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'}
                  `}
                >
                  {product.status}
                </span>
              ])}
            />
          </ReportSection>

          {/* Recent Sales */}
          {sales.length > 0 && (
            <ReportSection title="Recent Sales (Current Month)">
              <ReportTable
                headers={['Date', 'Customer', 'Items', 'Amount', 'Payment Method']}
                data={sales.slice(0, 10).map(sale => [
                  sale.date,
                  sale.customer,
                  reportsService.formatNumber(sale.items),
                  reportsService.formatCurrency(sale.totalAmount),
                  sale.paymentMethod
                ])}
              />
              {sales.length > 10 && (
                <p className="text-sm text-gray-600 mt-2">
                  Showing 10 of {sales.length} sales transactions
                </p>
              )}
            </ReportSection>
          )}

          {/* Recent Purchases */}
          {purchases.length > 0 && (
            <ReportSection title="Recent Purchases (Current Month)">
              <ReportTable
                headers={['Date', 'Supplier', 'Items', 'Amount', 'Status']}
                data={purchases.slice(0, 10).map(purchase => [
                  purchase.date,
                  purchase.supplier,
                  reportsService.formatNumber(purchase.items),
                  reportsService.formatCurrency(purchase.totalAmount),
                  purchase.status
                ])}
              />
              {purchases.length > 10 && (
                <p className="text-sm text-gray-600 mt-2">
                  Showing 10 of {purchases.length} purchase transactions
                </p>
              )}
            </ReportSection>
          )}
        </ReportTemplate>
      </div>
    </div>
  );
};

export default InventoryReport;
