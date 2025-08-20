import { format } from 'date-fns';
import { reportsService } from './reports';

/**
 * Professional Invoice Generation Service
 * Handles invoice creation, formatting, and export functionality
 */
class InvoiceService {
  constructor() {
    this.companyInfo = {
      name: 'Inventory Management System',
      address: '123 Business Street, City, State 12345',
      phone: '+1 (555) 123-4567',
      email: 'info@inventory.com',
      website: 'www.inventory.com',
      gst: 'GST123456789',
      pan: 'ABCDE1234F',
      bankDetails: {
        bankName: 'State Bank of India',
        accountNumber: '1234567890',
        ifscCode: 'SBIN0001234',
        branch: 'Main Branch'
      }
    };
    
    this.invoiceSettings = {
      prefix: 'INV',
      startingNumber: 1001,
      taxRate: 18, // GST rate in percentage
      currency: 'INR',
      paymentTerms: 'Payment due within 30 days',
      notes: 'Thank you for your business!'
    };
  }

  /**
   * Generate invoice number
   * @param {number} customNumber - Custom invoice number (optional)
   * @returns {string} Formatted invoice number
   */
  generateInvoiceNumber(customNumber = null) {
    const number = customNumber || (this.invoiceSettings.startingNumber + Date.now() % 10000);
    return `${this.invoiceSettings.prefix}-${number}`;
  }

  /**
   * Calculate invoice totals
   * @param {Array} items - Invoice items
   * @param {number} taxRate - Tax rate percentage
   * @returns {object} Calculated totals
   */
  calculateTotals(items, taxRate = this.invoiceSettings.taxRate) {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.rate);
    }, 0);

    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    return {
      subtotal,
      taxRate,
      taxAmount,
      total,
      roundOff: Math.round(total) - total,
      grandTotal: Math.round(total)
    };
  }

  /**
   * Convert number to words (Indian format)
   * @param {number} amount - Amount to convert
   * @returns {string} Amount in words
   */
  numberToWords(amount) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertHundreds(num) {
      let result = '';
      if (num > 99) {
        result += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      if (num > 19) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      } else if (num > 9) {
        result += teens[num - 10] + ' ';
        return result;
      }
      if (num > 0) {
        result += ones[num] + ' ';
      }
      return result;
    }

    if (amount === 0) return 'Zero Rupees Only';

    let result = '';
    const crores = Math.floor(amount / 10000000);
    amount %= 10000000;
    const lakhs = Math.floor(amount / 100000);
    amount %= 100000;
    const thousands = Math.floor(amount / 1000);
    amount %= 1000;
    const hundreds = amount;

    if (crores > 0) {
      result += convertHundreds(crores) + 'Crore ';
    }
    if (lakhs > 0) {
      result += convertHundreds(lakhs) + 'Lakh ';
    }
    if (thousands > 0) {
      result += convertHundreds(thousands) + 'Thousand ';
    }
    if (hundreds > 0) {
      result += convertHundreds(hundreds);
    }

    return result.trim() + ' Rupees Only';
  }

  /**
   * Create invoice data structure from sales data
   * @param {object} saleData - Sales transaction data
   * @param {object} customerData - Customer information
   * @returns {object} Formatted invoice data
   */
  createInvoiceFromSale(saleData, customerData = null) {
    const invoiceNumber = this.generateInvoiceNumber();
    const invoiceDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms

    // Format items for invoice
    const items = saleData.items?.map((item, index) => ({
      srNo: index + 1,
      description: item.name || item.productName || 'Product',
      hsn: item.hsn || '1234',
      quantity: item.quantity || 1,
      unit: item.unit || 'Nos',
      rate: item.sellingPrice || item.price || 0,
      amount: (item.quantity || 1) * (item.sellingPrice || item.price || 0)
    })) || [];

    const totals = this.calculateTotals(items);

    return {
      invoiceNumber,
      invoiceDate,
      dueDate,
      customer: {
        name: customerData?.name || saleData.customerName || 'Walk-in Customer',
        address: customerData?.address || 'Customer Address',
        phone: customerData?.phone || saleData.customerPhone || '',
        email: customerData?.email || saleData.customerEmail || '',
        gst: customerData?.gst || ''
      },
      items,
      totals,
      paymentMethod: saleData.paymentMethod || 'Cash',
      notes: this.invoiceSettings.notes,
      terms: this.invoiceSettings.paymentTerms,
      amountInWords: this.numberToWords(totals.grandTotal)
    };
  }

  /**
   * Create custom invoice
   * @param {object} invoiceData - Custom invoice data
   * @returns {object} Formatted invoice data
   */
  createCustomInvoice(invoiceData) {
    const {
      customer,
      items,
      invoiceDate = new Date(),
      dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      customInvoiceNumber = null
    } = invoiceData;

    const invoiceNumber = customInvoiceNumber || this.generateInvoiceNumber();
    const formattedItems = items.map((item, index) => ({
      srNo: index + 1,
      description: item.description || item.name,
      hsn: item.hsn || '1234',
      quantity: item.quantity || 1,
      unit: item.unit || 'Nos',
      rate: item.rate || item.price || 0,
      amount: (item.quantity || 1) * (item.rate || item.price || 0)
    }));

    const totals = this.calculateTotals(formattedItems);

    return {
      invoiceNumber,
      invoiceDate,
      dueDate,
      customer,
      items: formattedItems,
      totals,
      notes: invoiceData.notes || this.invoiceSettings.notes,
      terms: invoiceData.terms || this.invoiceSettings.paymentTerms,
      amountInWords: this.numberToWords(totals.grandTotal)
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
      currency: this.invoiceSettings.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }

  /**
   * Format date for display
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  formatDate(date) {
    return format(new Date(date), 'dd/MM/yyyy');
  }

  /**
   * Generate PDF invoice
   * @param {HTMLElement} element - Invoice HTML element
   * @param {string} invoiceNumber - Invoice number for filename
   */
  async generateInvoicePDF(element, invoiceNumber) {
    const filename = `Invoice-${invoiceNumber}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    
    const options = {
      margin: 0.3,
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

    try {
      await reportsService.generatePDF(element, filename, options);
      console.log(`Invoice PDF generated: ${filename}`);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw new Error('Failed to generate invoice PDF');
    }
  }

  /**
   * Print invoice
   * @param {string} invoiceElementId - ID of invoice element to print
   */
  printInvoice(invoiceElementId = 'invoice-content') {
    const printContent = document.getElementById(invoiceElementId);
    if (!printContent) {
      throw new Error('Invoice element not found');
    }

    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .no-print { display: none !important; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .border { border: 1px solid #000; }
            .bg-gray-50 { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  /**
   * Get company information
   * @returns {object} Company information
   */
  getCompanyInfo() {
    return this.companyInfo;
  }

  /**
   * Update company information
   * @param {object} newInfo - New company information
   */
  updateCompanyInfo(newInfo) {
    this.companyInfo = { ...this.companyInfo, ...newInfo };
  }

  /**
   * Get invoice settings
   * @returns {object} Invoice settings
   */
  getInvoiceSettings() {
    return this.invoiceSettings;
  }

  /**
   * Update invoice settings
   * @param {object} newSettings - New invoice settings
   */
  updateInvoiceSettings(newSettings) {
    this.invoiceSettings = { ...this.invoiceSettings, ...newSettings };
  }
}

// Create and export singleton instance
export const invoiceService = new InvoiceService();
export default invoiceService;
