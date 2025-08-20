/**
 * QR Code Generator Utility for E-Invoices
 * Generates real-time QR codes based on invoice details
 * Compliant with GST E-Invoice QR code standards
 */

import QRCode from 'qrcode';

/**
 * Generate QR code data string for E-Invoice
 * Format: IRN|AckNo|AckDt|Irp|Seller GSTIN|Buyer GSTIN|DocNo|DocTyp|DocDt|TotInvVal|ItemCnt|MainHsnCode|IrnStatus
 */
export const generateEInvoiceQRData = (invoiceData, items = []) => {
  try {
    const {
      irn = '',
      ack_number = '',
      ack_date = '',
      seller_gstin = '29ABCDE1234F1Z5',
      buyer_gstin = '',
      invoice_number = '',
      invoice_date = '',
      total_amount = 0,
      invoice_type = 'INV'
    } = invoiceData;

    // Format date to YYYY-MM-DD
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    };

    // Get main HSN code (most common HSN from items)
    const getMainHsnCode = (items) => {
      if (!items || items.length === 0) return '38089199'; // Default HSN for fertilizers
      
      const hsnCounts = {};
      items.forEach(item => {
        const hsn = item.hsn_code || item.hsn || '38089199';
        hsnCounts[hsn] = (hsnCounts[hsn] || 0) + 1;
      });
      
      return Object.keys(hsnCounts).reduce((a, b) => 
        hsnCounts[a] > hsnCounts[b] ? a : b
      );
    };

    // Build QR data string according to GST standards
    const qrDataParts = [
      irn || 'PENDING',                           // IRN
      ack_number || 'PENDING',                    // Acknowledgment Number
      formatDate(ack_date) || formatDate(new Date()), // Acknowledgment Date
      '',                                         // IRP (Invoice Registration Portal) - usually empty
      seller_gstin,                               // Seller GSTIN
      buyer_gstin || '',                          // Buyer GSTIN
      invoice_number,                             // Document Number
      invoice_type,                               // Document Type (INV, CRN, DBN)
      formatDate(invoice_date) || formatDate(new Date()), // Document Date
      parseFloat(total_amount).toFixed(2),        // Total Invoice Value
      items.length.toString(),                    // Item Count
      getMainHsnCode(items),                      // Main HSN Code
      irn ? 'ACT' : 'PEN'                        // IRN Status (ACT=Active, PEN=Pending)
    ];

    return qrDataParts.join('|');
  } catch (error) {
    console.error('Error generating QR data:', error);
    return `ERROR|${invoiceData.invoice_number || 'UNKNOWN'}|${new Date().toISOString()}`;
  }
};

/**
 * Generate QR code image as Data URL
 */
export const generateQRCodeImage = async (qrData, options = {}) => {
  try {
    const defaultOptions = {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };

    const qrOptions = { ...defaultOptions, ...options };
    const qrCodeDataURL = await QRCode.toDataURL(qrData, qrOptions);
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code image:', error);
    throw error;
  }
};

/**
 * Generate QR code for E-Invoice with complete data
 */
export const generateEInvoiceQRCode = async (invoiceData, items = [], options = {}) => {
  try {
    console.log('🔄 Generating real-time QR code for invoice:', invoiceData.invoice_number);
    
    // Generate QR data string
    const qrData = generateEInvoiceQRData(invoiceData, items);
    console.log('📊 QR Data:', qrData);
    
    // Generate QR code image
    const qrCodeImage = await generateQRCodeImage(qrData, options);
    
    console.log('✅ QR code generated successfully');
    
    return {
      qrData,
      qrCodeImage,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error generating E-Invoice QR code:', error);
    throw error;
  }
};

/**
 * Generate simplified QR code for quick invoice lookup
 */
export const generateSimpleInvoiceQR = async (invoiceNumber, totalAmount, options = {}) => {
  try {
    const qrData = `INV:${invoiceNumber}|AMT:${totalAmount}|DATE:${new Date().toISOString().split('T')[0]}`;
    const qrCodeImage = await generateQRCodeImage(qrData, options);
    
    return {
      qrData,
      qrCodeImage,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating simple QR code:', error);
    throw error;
  }
};

/**
 * Validate QR code data format
 */
export const validateQRData = (qrData) => {
  try {
    const parts = qrData.split('|');
    return {
      isValid: parts.length >= 10,
      partCount: parts.length,
      hasIRN: parts[0] && parts[0] !== 'PENDING',
      hasAckNumber: parts[1] && parts[1] !== 'PENDING',
      format: parts.length >= 13 ? 'GST_STANDARD' : 'SIMPLIFIED'
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
};

/**
 * Generate QR code for different invoice types
 */
export const generateQRByInvoiceType = async (invoiceType, invoiceData, items = []) => {
  const typeConfigs = {
    'b2b': {
      includeGSTIN: true,
      includeIRN: true,
      errorLevel: 'M'
    },
    'b2c': {
      includeGSTIN: false,
      includeIRN: false,
      errorLevel: 'L'
    },
    'export': {
      includeGSTIN: true,
      includeIRN: true,
      errorLevel: 'H'
    }
  };

  const config = typeConfigs[invoiceType] || typeConfigs['b2b'];
  
  return await generateEInvoiceQRCode(invoiceData, items, {
    errorCorrectionLevel: config.errorLevel,
    width: 200
  });
};

export default {
  generateEInvoiceQRData,
  generateQRCodeImage,
  generateEInvoiceQRCode,
  generateSimpleInvoiceQR,
  validateQRData,
  generateQRByInvoiceType
};
