import html2pdf from 'html2pdf.js';
import ExcelJS from 'exceljs';
import { format, startOfMonth } from 'date-fns';

/**
 * Advanced Reports Generation Service
 * Supports PDF, Excel, and print-friendly HTML reports with beautiful styling
 */
class ReportsService {
  constructor() {
    this.companyInfo = {
      name: 'KrishiSethu',
      address: 'Hyderabad, Telangana, India',
      phone: '+91 9876543210',
      email: 'info@krishisethu.com',
      website: 'www.krishisethu.com',
      logo: '/Logo.png' // Company logo path
    };
  }

  /**
   * Generate PDF report from HTML element
   * @param {HTMLElement} element - HTML element to convert
   * @param {string} filename - Output filename
   * @param {object} options - PDF generation options
   */
  async generatePDF(element, filename, options = {}) {
    const defaultOptions = {
      margin: 0.5,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: false
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      }
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      await html2pdf().set(finalOptions).from(element).save();
      console.log(`PDF report generated: ${filename}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  /**
   * Generate Excel report
   * @param {Array} data - Data to export
   * @param {string} filename - Output filename
   * @param {object} options - Excel generation options
   */
  async generateExcel(data, filename, options = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(options.sheetName || 'Report');

    // Set company info
    workbook.creator = this.companyInfo.name;
    workbook.created = new Date();

    // Add headers
    if (options.headers) {
      const headerRow = worksheet.addRow(options.headers);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 30;
    }

    // Add data rows
    data.forEach(row => {
      const dataRow = worksheet.addRow(row);
      dataRow.alignment = { horizontal: 'left', vertical: 'middle' };
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    });

    // Add borders
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generate and download
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
      
      console.log(`Excel report generated: ${filename}`);
    } catch (error) {
      console.error('Error generating Excel:', error);
      throw new Error('Failed to generate Excel report');
    }
  }

  /**
   * Generate inventory summary report data
   * @param {Array} products - Products data
   * @param {Array} sales - Sales data
   * @param {Array} purchases - Purchases data
   */
  generateInventoryReport(products, sales, purchases) {
    const currentDate = new Date();
    const currentMonth = startOfMonth(currentDate);

    // Filter current month data
    const currentMonthSales = sales.filter(sale => 
      new Date(sale.createdAt?.seconds * 1000 || sale.createdAt) >= currentMonth
    );
    const currentMonthPurchases = purchases.filter(purchase => 
      new Date(purchase.createdAt?.seconds * 1000 || purchase.createdAt) >= currentMonth
    );

    // Calculate metrics
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.currentStock <= (p.reorderPoint || 10)).length;
    const outOfStockProducts = products.filter(p => p.currentStock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.sellingPrice), 0);
    
    const monthlyRevenue = currentMonthSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const monthlyCost = currentMonthPurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
    const monthlyProfit = monthlyRevenue - monthlyCost;

    return {
      summary: {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalValue,
        monthlyRevenue,
        monthlyCost,
        monthlyProfit,
        profitMargin: monthlyRevenue > 0 ? ((monthlyProfit / monthlyRevenue) * 100) : 0
      },
      products: products.map(product => ({
        name: product.name,
        category: product.category,
        currentStock: product.currentStock,
        reorderPoint: product.reorderPoint || 'Not Set',
        sellingPrice: product.sellingPrice,
        stockValue: product.currentStock * product.sellingPrice,
        status: product.currentStock === 0 ? 'Out of Stock' : 
                product.currentStock <= (product.reorderPoint || 10) ? 'Low Stock' : 'In Stock'
      })),
      sales: currentMonthSales.map(sale => ({
        date: format(new Date(sale.createdAt?.seconds * 1000 || sale.createdAt), 'yyyy-MM-dd'),
        customer: sale.customerName || 'Walk-in Customer',
        items: sale.items?.length || 0,
        totalAmount: sale.totalAmount,
        paymentMethod: sale.paymentMethod || 'Cash'
      })),
      purchases: currentMonthPurchases.map(purchase => ({
        date: format(new Date(purchase.createdAt?.seconds * 1000 || purchase.createdAt), 'yyyy-MM-dd'),
        supplier: purchase.supplierName || 'Unknown',
        items: purchase.items?.length || 0,
        totalAmount: purchase.totalAmount,
        status: purchase.status || 'Completed'
      }))
    };
  }

  /**
   * Generate sales report data
   * @param {Array} sales - Sales data
   * @param {object} dateRange - Date range filter
   */
  generateSalesReport(sales, dateRange = {}) {
    const { startDate, endDate } = dateRange;
    
    let filteredSales = sales;
    if (startDate && endDate) {
      filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.createdAt?.seconds * 1000 || sale.createdAt);
        return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
      });
    }

    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Group by date
    const dailySales = filteredSales.reduce((acc, sale) => {
      const date = format(new Date(sale.createdAt?.seconds * 1000 || sale.createdAt), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { count: 0, revenue: 0 };
      }
      acc[date].count += 1;
      acc[date].revenue += sale.totalAmount;
      return acc;
    }, {});

    // Top customers
    const customerSales = filteredSales.reduce((acc, sale) => {
      const customer = sale.customerName || 'Walk-in Customer';
      if (!acc[customer]) {
        acc[customer] = { count: 0, revenue: 0 };
      }
      acc[customer].count += 1;
      acc[customer].revenue += sale.totalAmount;
      return acc;
    }, {});

    const topCustomers = Object.entries(customerSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      summary: {
        totalSales,
        totalRevenue,
        averageOrderValue,
        period: dateRange.startDate && dateRange.endDate 
          ? `${format(new Date(dateRange.startDate), 'MMM dd, yyyy')} - ${format(new Date(dateRange.endDate), 'MMM dd, yyyy')}`
          : 'All Time'
      },
      dailySales: Object.entries(dailySales).map(([date, data]) => ({
        date,
        sales: data.count,
        revenue: data.revenue
      })),
      topCustomers,
      salesDetails: filteredSales.map(sale => ({
        date: format(new Date(sale.createdAt?.seconds * 1000 || sale.createdAt), 'yyyy-MM-dd HH:mm'),
        customer: sale.customerName || 'Walk-in Customer',
        items: sale.items?.length || 0,
        totalAmount: sale.totalAmount,
        paymentMethod: sale.paymentMethod || 'Cash',
        status: sale.status || 'Completed'
      }))
    };
  }

  /**
   * Format currency for display
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  /**
   * Format number for display
   * @param {number} number - Number to format
   * @returns {string} Formatted number string
   */
  formatNumber(number) {
    return new Intl.NumberFormat('en-IN').format(number || 0);
  }

  /**
   * Get current date formatted
   * @returns {string} Formatted date string
   */
  getCurrentDate() {
    return format(new Date(), 'MMMM dd, yyyy');
  }

  /**
   * Get current time formatted
   * @returns {string} Formatted time string
   */
  getCurrentTime() {
    return format(new Date(), 'hh:mm a');
  }
}

// Create and export singleton instance
export const reportsService = new ReportsService();
export default reportsService;
