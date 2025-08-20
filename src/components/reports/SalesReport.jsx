import React, { useState, useEffect } from 'react';
import ReportTemplate, { 
  ReportSummaryCard, 
  ReportTable, 
  ReportSection, 
  ReportGrid,
  PrintButton 
} from './ReportTemplate';
import { reportsService } from '../../lib/reports';
import { salesService } from '../../lib/supabaseDb';
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  FileText,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const SalesReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const loadReportData = async (customDateRange = null) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch sales data
      const sales = await salesService.getAll();

      // Generate report data
      const data = reportsService.generateSalesReport(sales, customDateRange || dateRange);
      setReportData(data);
    } catch (err) {
      console.error('Error loading sales report data:', err);
      setError('Failed to load sales report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field, value) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);
  };

  const handleApplyDateFilter = () => {
    if (dateRange.startDate && dateRange.endDate) {
      loadReportData(dateRange);
    } else {
      loadReportData({});
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('sales-report');
    if (element) {
      try {
        await reportsService.generatePDF(
          element, 
          `sales-report-${new Date().toISOString().split('T')[0]}.pdf`
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
      const excelData = reportData.salesDetails.map(sale => [
        sale.date,
        sale.customer,
        sale.items,
        reportsService.formatCurrency(sale.totalAmount),
        sale.paymentMethod,
        sale.status
      ]);

      await reportsService.generateExcel(
        excelData,
        `sales-report-${new Date().toISOString().split('T')[0]}.xlsx`,
        {
          sheetName: 'Sales Report',
          headers: [
            'Date & Time',
            'Customer',
            'Items Count',
            'Total Amount',
            'Payment Method',
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
          <p className="text-gray-600">Generating sales report...</p>
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
            onClick={() => loadReportData()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  const { summary, dailySales, topCustomers, salesDetails } = reportData;

  return (
    <div className="max-w-7xl mx-auto p-6 print:p-0 print:max-w-none">
      {/* Date Range Filter */}
      <div className="no-print mb-6 bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Filter by Date Range</h3>
        <div className="flex gap-4 items-end">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="mt-1"
            />
          </div>
          <Button onClick={handleApplyDateFilter}>
            Apply Filter
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setDateRange({ startDate: '', endDate: '' });
              loadReportData({});
            }}
          >
            Clear Filter
          </Button>
        </div>
      </div>

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
      <div id="sales-report">
        <ReportTemplate 
          title="Sales Report"
          subtitle={`Sales analysis for ${summary.period}`}
        >
          {/* Summary Section */}
          <ReportSection title="Sales Summary">
            <ReportGrid columns={4}>
              <ReportSummaryCard
                title="Total Sales"
                value={reportsService.formatNumber(summary.totalSales)}
                subtitle="Number of transactions"
                icon={<ShoppingCart />}
                color="blue"
              />
              <ReportSummaryCard
                title="Total Revenue"
                value={reportsService.formatCurrency(summary.totalRevenue)}
                subtitle="Gross sales amount"
                icon={<DollarSign />}
                color="green"
              />
              <ReportSummaryCard
                title="Average Order Value"
                value={reportsService.formatCurrency(summary.averageOrderValue)}
                subtitle="Revenue per transaction"
                icon={<TrendingUp />}
                color="purple"
              />
              <ReportSummaryCard
                title="Report Period"
                value={summary.period}
                subtitle="Date range analyzed"
                icon={<Calendar />}
                color="blue"
              />
            </ReportGrid>
          </ReportSection>

          {/* Daily Sales Trend */}
          {dailySales.length > 0 && (
            <ReportSection title="Daily Sales Performance">
              <ReportTable
                headers={['Date', 'Number of Sales', 'Daily Revenue']}
                data={dailySales.map(day => [
                  day.date,
                  reportsService.formatNumber(day.sales),
                  reportsService.formatCurrency(day.revenue)
                ])}
              />
            </ReportSection>
          )}

          {/* Top Customers */}
          {topCustomers.length > 0 && (
            <ReportSection title="Top Customers">
              <ReportTable
                headers={['Customer Name', 'Number of Orders', 'Total Spent']}
                data={topCustomers.map(customer => [
                  customer.name,
                  reportsService.formatNumber(customer.count),
                  reportsService.formatCurrency(customer.revenue)
                ])}
              />
            </ReportSection>
          )}

          {/* Detailed Sales Transactions */}
          <ReportSection title="Sales Transactions">
            <ReportTable
              headers={['Date & Time', 'Customer', 'Items', 'Amount', 'Payment', 'Status']}
              data={salesDetails.map(sale => [
                sale.date,
                sale.customer,
                reportsService.formatNumber(sale.items),
                reportsService.formatCurrency(sale.totalAmount),
                sale.paymentMethod,
                <span 
                  key={sale.date + sale.customer}
                  className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${sale.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      sale.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'}
                  `}
                >
                  {sale.status}
                </span>
              ])}
            />
          </ReportSection>
        </ReportTemplate>
      </div>
    </div>
  );
};

export default SalesReport;
