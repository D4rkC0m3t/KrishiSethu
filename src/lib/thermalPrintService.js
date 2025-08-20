// Thermal Print Service - Generate ESC/POS commands for thermal receipt printing

class ThermalPrintService {
  constructor() {
    // ESC/POS Commands
    this.ESC = '\x1B';
    this.GS = '\x1D';
    this.commands = {
      INIT: '\x1B\x40',           // Initialize printer
      ALIGN_LEFT: '\x1B\x61\x00',
      ALIGN_CENTER: '\x1B\x61\x01',
      ALIGN_RIGHT: '\x1B\x61\x02',
      BOLD_ON: '\x1B\x45\x01',
      BOLD_OFF: '\x1B\x45\x00',
      UNDERLINE_ON: '\x1B\x2D\x01',
      UNDERLINE_OFF: '\x1B\x2D\x00',
      DOUBLE_HEIGHT: '\x1B\x21\x10',
      DOUBLE_WIDTH: '\x1B\x21\x20',
      NORMAL_SIZE: '\x1B\x21\x00',
      CUT_PAPER: '\x1D\x56\x00',
      FEED_LINE: '\x0A',
      FEED_LINES: (n) => '\x1B\x64' + String.fromCharCode(n),
      DRAWER_OPEN: '\x1B\x70\x00\x19\xFA'
    };
  }

  // Generate thermal receipt for fertilizer shop
  generateReceipt(receiptData) {
    const { shopDetails, billNumber, customer, items, totals, payment, date } = receiptData;
    
    let receipt = '';
    
    // Initialize printer
    receipt += this.commands.INIT;
    
    // Shop Header
    receipt += this.commands.ALIGN_CENTER;
    receipt += this.commands.DOUBLE_HEIGHT;
    receipt += this.commands.BOLD_ON;
    receipt += (shopDetails?.name || 'VK FERTILIZERS') + '\n';
    receipt += this.commands.NORMAL_SIZE;
    receipt += this.commands.BOLD_OFF;
    
    receipt += this.formatAddress(shopDetails?.address) + '\n';
    receipt += `Contact: ${shopDetails?.phone || '8688765111'}\n`;
    receipt += `GSTIN: ${shopDetails?.gstNumber || '29ABCDE1234F1Z5'}\n`;
    receipt += this.commands.FEED_LINE;
    
    // License Information
    receipt += `FLZ Lic: ${shopDetails?.fertilizerLicense || 'FL/2024/001'}\n`;
    receipt += `Seed Lic: ${shopDetails?.seedLicense || 'SD/2024/001'}\n`;
    receipt += `Pesticide Lic: ${shopDetails?.pesticideLicense || 'PS/2024/001'}\n`;
    receipt += this.commands.FEED_LINE;
    
    // Invoice Header
    receipt += this.commands.BOLD_ON;
    receipt += 'RETAIL INVOICE\n';
    receipt += this.commands.BOLD_OFF;
    receipt += this.printLine('-', 32);
    
    // Invoice Details
    receipt += this.commands.ALIGN_LEFT;
    receipt += `Invoice No: ${billNumber}\n`;
    receipt += `Date: ${new Date(date).toLocaleDateString('en-IN')}\n`;
    receipt += `Time: ${new Date(date).toLocaleTimeString('en-IN')}\n`;
    receipt += `Cashier: Admin\n`;
    receipt += `Customer: ${customer?.name || 'Walk-in Customer'}\n`;
    if (customer?.phone) {
      receipt += `Phone: ${customer.phone}\n`;
    }
    receipt += this.commands.FEED_LINE;
    
    // Items Header
    receipt += this.printLine('-', 32);
    receipt += this.commands.BOLD_ON;
    receipt += this.padText('Item', 16) + this.padText('Qty', 4) + this.padText('Rate', 6) + this.padText('Amt', 6) + '\n';
    receipt += this.commands.BOLD_OFF;
    receipt += this.printLine('-', 32);
    
    // Items
    let srNo = 1;
    items.forEach(item => {
      // Item name (truncate if too long)
      const itemName = this.truncateText(item.name, 30);
      receipt += `${srNo}. ${itemName}\n`;
      
      // Batch and expiry if available
      if (item.batchNo) {
        receipt += `   Batch: ${item.batchNo}`;
        if (item.expiryDate) {
          receipt += ` Exp: ${new Date(item.expiryDate).toLocaleDateString('en-IN')}`;
        }
        receipt += '\n';
      }
      
      // HSN and GST
      receipt += `   HSN: ${item.hsn || 'N/A'} GST: ${item.gstRate || '5'}%\n`;
      
      // Quantity, Rate, Amount
      const qty = item.quantity.toString();
      const rate = item.price.toFixed(2);
      const amount = (item.price * item.quantity).toFixed(2);
      
      receipt += '   ' + this.padText(qty + ' ' + (item.unit || 'PCS'), 12) + 
                 this.padText('₹' + rate, 8) + 
                 this.padText('₹' + amount, 8) + '\n';
      
      receipt += this.commands.FEED_LINE;
      srNo++;
    });
    
    receipt += this.printLine('-', 32);
    
    // Totals
    const taxableAmount = (totals.subtotal - totals.discount).toFixed(2);
    const gstAmount = totals.tax.toFixed(2);
    const totalAmount = totals.total.toFixed(2);
    
    receipt += this.commands.ALIGN_RIGHT;
    receipt += `Taxable Amount: ₹${taxableAmount}\n`;
    if (totals.discount > 0) {
      receipt += `Discount: -₹${totals.discount.toFixed(2)}\n`;
    }
    receipt += `GST @5%: ₹${gstAmount}\n`;
    receipt += this.printLine('-', 32);
    receipt += this.commands.BOLD_ON;
    receipt += this.commands.DOUBLE_HEIGHT;
    receipt += `TOTAL: ₹${totalAmount}\n`;
    receipt += this.commands.NORMAL_SIZE;
    receipt += this.commands.BOLD_OFF;
    receipt += this.commands.FEED_LINE;
    
    // Payment Method
    receipt += this.commands.ALIGN_LEFT;
    receipt += `Payment: ${payment.method.toUpperCase()}\n`;
    receipt += this.commands.FEED_LINE;
    
    // Bank Details
    if (shopDetails?.bankName) {
      receipt += this.commands.BOLD_ON;
      receipt += 'Bank Details:\n';
      receipt += this.commands.BOLD_OFF;
      receipt += `${shopDetails.bankName}\n`;
      receipt += `A/C: ${shopDetails.accountNumber || 'N/A'}\n`;
      receipt += `IFSC: ${shopDetails.ifscCode || 'N/A'}\n`;
      receipt += this.commands.FEED_LINE;
    }
    
    // Footer
    receipt += this.commands.ALIGN_CENTER;
    receipt += this.commands.BOLD_ON;
    receipt += 'Thank you for your purchase!\n';
    receipt += this.commands.BOLD_OFF;
    receipt += 'Keep fertilizers in cool, dry place\n';
    receipt += `For queries: ${shopDetails?.phone || '8688765111'}\n`;
    receipt += this.commands.FEED_LINE;
    
    // QR Code (if supported)
    receipt += this.generateQRCode(billNumber);
    
    // Cut paper
    receipt += this.commands.FEED_LINES(3);
    receipt += this.commands.CUT_PAPER;
    
    return receipt;
  }

  // Helper functions
  formatAddress(address) {
    if (!address) return 'Address not available';
    if (typeof address === 'string') return address;
    
    const parts = [address.street, address.city, address.state, address.pincode]
      .filter(part => part && part.trim() !== '');
    return parts.join(', ');
  }

  padText(text, width, align = 'left') {
    const str = text.toString();
    if (str.length >= width) return str.substring(0, width);
    
    const padding = ' '.repeat(width - str.length);
    
    switch (align) {
      case 'right':
        return padding + str;
      case 'center':
        const leftPad = Math.floor(padding.length / 2);
        const rightPad = padding.length - leftPad;
        return ' '.repeat(leftPad) + str + ' '.repeat(rightPad);
      default:
        return str + padding;
    }
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  printLine(char, width) {
    return char.repeat(width) + '\n';
  }

  generateQRCode(data) {
    // Simple QR code placeholder - in real implementation, use QR library
    return `QR: ${data}\n`;
  }

  // Print to thermal printer (browser)
  async printReceipt(receiptData) {
    try {
      const receiptText = this.generateReceipt(receiptData);
      
      // For web browsers, create a printable version
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${receiptData.billNumber}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                margin: 0; 
                padding: 10px;
                width: 58mm;
                background: white;
              }
              pre { 
                white-space: pre-wrap; 
                margin: 0;
                font-size: 11px;
                line-height: 1.2;
              }
              @media print {
                body { margin: 0; padding: 5px; }
                @page { size: 58mm auto; margin: 0; }
              }
            </style>
          </head>
          <body>
            <pre>${this.escapeHtml(receiptText)}</pre>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Auto-print after a short delay
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
      
      return { success: true, message: 'Receipt sent to printer' };
    } catch (error) {
      console.error('Error printing receipt:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate receipt for different paper sizes
  generateReceiptForSize(receiptData, paperSize = '58mm') {
    const widths = {
      '58mm': 32,
      '80mm': 48
    };
    
    this.paperWidth = widths[paperSize] || 32;
    return this.generateReceipt(receiptData);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Open cash drawer
  openCashDrawer() {
    // This would typically be sent to the printer
    console.log('Opening cash drawer...');
    return this.commands.DRAWER_OPEN;
  }
}

// Create singleton instance
export const thermalPrintService = new ThermalPrintService();

export default thermalPrintService;
