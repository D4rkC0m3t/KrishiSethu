import React from 'react';

/**
 * Professional POS Invoice Receipt Component - Dual Copy
 * 
 * Features:
 * - Two copies per page (Customer Copy + Audit/Office Copy)
 * - Full GST compliance with all required headers
 * - Auto-calculation for all tax components
 * - Print-optimized with page breaks
 * - Clean Tailwind styling
 * - Optional "Duplicate Copy" watermark
 */

const InvoiceDualCopy = ({
  invoiceData,
  companyInfo,
  showDuplicateWatermark = false,
  thermalWidth = null // '58mm', '80mm', or null for A4
}) => {
  // Helper functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const numberToWords = (num) => {
    if (num === 0) return 'Zero Rupees Only';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const convertHundreds = (n) => {
      let result = '';
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + ' ';
        return result;
      }
      if (n > 0) {
        result += ones[n] + ' ';
      }
      return result;
    };

    let result = '';
    const crores = Math.floor(num / 10000000);
    num %= 10000000;
    const lakhs = Math.floor(num / 100000);
    num %= 100000;
    const thousands = Math.floor(num / 1000);
    num %= 1000;
    const hundreds = num;

    if (crores > 0) result += convertHundreds(crores) + 'Crore ';
    if (lakhs > 0) result += convertHundreds(lakhs) + 'Lakh ';
    if (thousands > 0) result += convertHundreds(thousands) + 'Thousand ';
    if (hundreds > 0) result += convertHundreds(hundreds);

    return result.trim() + ' Rupees Only';
  };

  // Calculate totals with proper GST breakdown
  const calculateTotals = (items) => {
    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    const processedItems = items.map(item => {
      const itemTotal = (item.quantity || 0) * (item.rate || 0);
      const discount = item.discount || 0;
      const discountAmount = (discount / 100) * itemTotal;
      const taxableAmount = itemTotal - discountAmount;
      
      // Determine tax rates
      const gstRate = item.gstRate || 18;
      const isIGST = item.isIGST || false; // Inter-state transaction
      
      let cgstAmount = 0;
      let sgstAmount = 0; 
      let igstAmount = 0;

      if (isIGST) {
        igstAmount = (taxableAmount * gstRate) / 100;
        totalIGST += igstAmount;
      } else {
        cgstAmount = (taxableAmount * (gstRate / 2)) / 100;
        sgstAmount = (taxableAmount * (gstRate / 2)) / 100;
        totalCGST += cgstAmount;
        totalSGST += sgstAmount;
      }

      subtotal += itemTotal;

      return {
        ...item,
        itemTotal,
        discountAmount,
        taxableAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        gstRate
      };
    });

    const totalDiscount = processedItems.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalTaxableAmount = subtotal - totalDiscount;
    const totalTaxAmount = totalCGST + totalSGST + totalIGST;
    const grandTotal = totalTaxableAmount + totalTaxAmount;
    const roundOff = Math.round(grandTotal) - grandTotal;

    return {
      items: processedItems,
      subtotal,
      totalDiscount,
      totalTaxableAmount,
      totalCGST,
      totalSGST,
      totalIGST,
      totalTaxAmount,
      grandTotal,
      roundOff,
      finalTotal: Math.round(grandTotal)
    };
  };

  // Default data if not provided
  const defaultInvoiceData = {
    invoiceNumber: 'INV-001',
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    placeOfSupply: 'Maharashtra',
    reverseCharge: 'No',
    customer: {
      name: 'Walk-in Customer',
      address: 'Customer Address',
      phone: '',
      email: '',
      gst: '',
      stateCode: '27'
    },
    items: [],
    paymentMethod: 'Cash',
    notes: 'Thank you for your business!',
    terms: 'Payment due on receipt'
  };

  const defaultCompanyInfo = {
    name: 'Your Company Name',
    address: {
      street: 'Company Address',
      city: 'City',
      state: 'State',
      pincode: '123456'
    },
    phone: '+91-9999999999',
    email: 'info@company.com',
    website: 'www.company.com',
    gstNumber: '27AAAAA0000A1Z5',
    pan: 'AAAAA0000A',
    stateCode: '27',
    bankDetails: {
      bankName: 'Bank Name',
      accountNumber: '1234567890',
      ifscCode: 'BANK0001234',
      branch: 'Branch Name'
    }
  };

  const invoice = { ...defaultInvoiceData, ...invoiceData };
  const company = { ...defaultCompanyInfo, ...companyInfo };
  const totals = calculateTotals(invoice.items || []);

  // Ultra-compact invoice template for dual copy layout
  const CompactInvoiceTemplate = ({ copyType, isSecondCopy = false }) => (
    <div className={`compact-invoice-copy ${isSecondCopy ? 'mt-1' : ''}`}>
      <div className="relative bg-white border-2 border-black p-1" style={{ height: '320px', fontSize: '8px' }}>
        {/* Watermark for duplicate */}
        {showDuplicateWatermark && copyType === 'Office Copy' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 text-6xl font-bold text-gray-200 pointer-events-none z-10 opacity-20">
            DUPLICATE COPY
          </div>
        )}

        {/* Header - Ultra Compact */}
        <div className="text-center mb-1 pb-1 border-b border-black">
          <div className="flex items-center justify-between mb-1">
            <div className="w-12 h-8 border border-black flex items-center justify-center text-xs">
              {company.logo ? (
                <img src={company.logo} alt="Logo" className="max-w-full max-h-full" />
              ) : (
                'LOGO'
              )}
            </div>
            <div className="flex-1 text-center mx-1">
              <h1 className="text-sm font-bold">{company.name}</h1>
              <h2 className="text-xs font-bold">GST Invoice</h2>
              <p className="text-xs leading-none">
                {company.address.street}, {company.address.city}, {company.address.state} - {company.address.pincode}
              </p>
              <p className="text-xs leading-none">
                Phone: {company.phone} | GST: {company.gstNumber}
              </p>
            </div>
            <div className="w-12 h-8 border border-black flex items-center justify-center text-xs">
              BRAND
            </div>
          </div>
        </div>

        {/* Copy Type and Invoice Info */}
        <div className="grid grid-cols-2 gap-1 mb-1">
          <div>
            <h3 className="text-xs font-bold">{copyType}</h3>
            <p className="text-xs leading-none">Invoice No.: {invoice.invoiceNumber}</p>
            <p className="text-xs leading-none">Invoice Date: {formatDate(invoice.invoiceDate)}</p>
            <p className="text-xs leading-none">License No.: NCL/20/ADA/FR/2019/23125</p>
          </div>
          <div className="text-right">
            <p className="text-xs leading-none">Order No.: {invoice.invoiceNumber}</p>
            <p className="text-xs leading-none">Customer No.: 1755930417151</p>
            <p className="text-xs leading-none">Sales Type: Cash Sales</p>
          </div>
        </div>

        {/* Customer Details - Ultra Compact */}
        <div className="grid grid-cols-2 gap-1 mb-1">
          <div className="border border-black p-1">
            <p className="text-xs font-bold leading-none">Billed Customer (Bill to)</p>
            <p className="text-xs font-semibold leading-none">{invoice.customer.name}</p>
            <p className="text-xs leading-none">{invoice.customer.address}</p>
            <p className="text-xs leading-none">Phone: {invoice.customer.phone}</p>
            <p className="text-xs leading-none">GST No.: {invoice.customer.gst}</p>
          </div>
          <div className="border border-black p-1">
            <p className="text-xs font-bold leading-none">Ship To</p>
            <p className="text-xs leading-none">{invoice.customer.name}</p>
            <p className="text-xs leading-none">{invoice.customer.address}</p>
          </div>
        </div>

        {/* Items Table - Very Compact */}
        <div className="mb-2">
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-1 py-0.5 text-center" style={{ width: '20px' }}>S.No</th>
                <th className="border border-black px-1 py-0.5 text-left">Description of Goods</th>
                <th className="border border-black px-1 py-0.5 text-center" style={{ width: '40px' }}>Item Code</th>
                <th className="border border-black px-1 py-0.5 text-center" style={{ width: '50px' }}>HSN/SAC</th>
                <th className="border border-black px-1 py-0.5 text-center" style={{ width: '40px' }}>Batch No.</th>
                <th className="border border-black px-1 py-0.5 text-center" style={{ width: '40px' }}>Expiry Date</th>
                <th className="border border-black px-1 py-0.5 text-center" style={{ width: '50px' }}>Quantity & Unit</th>
                <th className="border border-black px-1 py-0.5 text-center" style={{ width: '30px' }}>Pack</th>
                <th className="border border-black px-1 py-0.5 text-right" style={{ width: '45px' }}>Rate/Price</th>
                <th className="border border-black px-1 py-0.5 text-right" style={{ width: '55px' }}>Total Amount</th>
                <th className="border border-black px-1 py-0.5 text-right" style={{ width: '40px' }}>Discount</th>
                <th className="border border-black px-1 py-0.5 text-right" style={{ width: '50px' }}>Taxable Amount</th>
                <th className="border border-black px-1 py-0.5 text-center" style={{ width: '25px' }}>%</th>
                <th className="border border-black px-1 py-0.5 text-right" style={{ width: '40px' }}>CGST Amount</th>
                <th className="border border-black px-1 py-0.5 text-center" style={{ width: '25px' }}>%</th>
                <th className="border border-black px-1 py-0.5 text-right" style={{ width: '40px' }}>SGST/UTGST</th>
                <th className="border border-black px-1 py-0.5 text-center" style={{ width: '25px' }}>%</th>
                <th className="border border-black px-1 py-0.5 text-right" style={{ width: '40px' }}>IGST Amount</th>
                <th className="border border-black px-1 py-0.5 text-right" style={{ width: '55px' }}>Total Amount (incl. tax)</th>
              </tr>
            </thead>
            <tbody>
              {totals.items.slice(0, 2).map((item, index) => (
                <tr key={index}>
                  <td className="border border-black px-1 py-0.5 text-center">{index + 1}</td>
                  <td className="border border-black px-1 py-0.5">{item.description || item.name}</td>
                  <td className="border border-black px-1 py-0.5 text-center">{item.itemCode || 'N/A'}</td>
                  <td className="border border-black px-1 py-0.5 text-center">{item.hsn || '31021000'}</td>
                  <td className="border border-black px-1 py-0.5 text-center">{item.batchNo || 'N/A'}</td>
                  <td className="border border-black px-1 py-0.5 text-center">{formatDate(item.expiryDate) || 'N/A'}</td>
                  <td className="border border-black px-1 py-0.5 text-center">{item.quantity} {item.unit || 'bottles'}</td>
                  <td className="border border-black px-1 py-0.5 text-center">{item.pack || 'BAG'}</td>
                  <td className="border border-black px-1 py-0.5 text-right">₹{item.rate?.toFixed(2) || '0.00'}</td>
                  <td className="border border-black px-1 py-0.5 text-right">₹{item.itemTotal?.toFixed(2) || '0.00'}</td>
                  <td className="border border-black px-1 py-0.5 text-right">₹{item.discountAmount?.toFixed(2) || '0.00'}</td>
                  <td className="border border-black px-1 py-0.5 text-right">₹{item.taxableAmount?.toFixed(2) || '0.00'}</td>
                  <td className="border border-black px-1 py-0.5 text-center">{item.igstAmount > 0 ? '0.0' : (item.gstRate / 2).toFixed(1)}</td>
                  <td className="border border-black px-1 py-0.5 text-right">₹{item.igstAmount > 0 ? '0.00' : item.cgstAmount?.toFixed(2) || '0.00'}</td>
                  <td className="border border-black px-1 py-0.5 text-center">{item.igstAmount > 0 ? '0.0' : (item.gstRate / 2).toFixed(1)}</td>
                  <td className="border border-black px-1 py-0.5 text-right">₹{item.igstAmount > 0 ? '0.00' : item.sgstAmount?.toFixed(2) || '0.00'}</td>
                  <td className="border border-black px-1 py-0.5 text-center">{item.igstAmount > 0 ? item.gstRate?.toFixed(1) || '0.0' : '0.0'}</td>
                  <td className="border border-black px-1 py-0.5 text-right">₹{item.igstAmount?.toFixed(2) || '0.00'}</td>
                  <td className="border border-black px-1 py-0.5 text-right">₹{(item.taxableAmount + (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0))?.toFixed(2) || '0.00'}</td>
                </tr>
              ))}
              
              {/* Grand Total Row */}
              <tr className="font-bold">
                <td className="border border-black px-1 py-0.5 text-center" colSpan={9}>Grand Total</td>
                <td className="border border-black px-1 py-0.5 text-right">₹{totals.subtotal?.toFixed(2) || '0.00'}</td>
                <td className="border border-black px-1 py-0.5 text-right">₹{totals.totalDiscount?.toFixed(2) || '0.00'}</td>
                <td className="border border-black px-1 py-0.5 text-right">₹{totals.totalTaxableAmount?.toFixed(2) || '0.00'}</td>
                <td className="border border-black px-1 py-0.5 text-center"></td>
                <td className="border border-black px-1 py-0.5 text-right">₹{totals.totalCGST?.toFixed(2) || '0.00'}</td>
                <td className="border border-black px-1 py-0.5 text-center"></td>
                <td className="border border-black px-1 py-0.5 text-right">₹{totals.totalSGST?.toFixed(2) || '0.00'}</td>
                <td className="border border-black px-1 py-0.5 text-center"></td>
                <td className="border border-black px-1 py-0.5 text-right">₹{totals.totalIGST?.toFixed(2) || '0.00'}</td>
                <td className="border border-black px-1 py-0.5 text-right">₹{totals.finalTotal?.toFixed(2) || '0.00'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Grand Total Display - Compact */}
        <div className="text-center text-sm font-bold mb-1">
          ₹{totals.finalTotal?.toFixed(2) || '0.00'}
        </div>
        
        <div className="text-center text-xs mb-1">
          <strong>Total Invoice Value (in words):</strong> {numberToWords(totals.finalTotal || 0)}
        </div>

        {/* Terms and Payment Info - Ultra Compact */}
        <div className="grid grid-cols-2 gap-1 mb-1">
          <div className="text-xs leading-none">
            <p><strong>Terms & Conditions:</strong> {invoice.terms}</p>
            <p>This invoice is not payable under reverse charge</p>
          </div>
          <div className="text-xs text-right leading-none">
            <p><strong>Payment Method:</strong> {invoice.paymentMethod}</p>
            <p><strong>Amount Received:</strong> ₹{totals.finalTotal?.toFixed(2) || '0.00'}</p>
            <p><strong>Change:</strong> ₹0.00</p>
          </div>
        </div>

        {/* Signature Section - Ultra Compact */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-left">
              <p className="font-bold leading-none">For {company.name}</p>
              <div className="h-4 mb-1"></div>
              <div className="border-t border-black pt-1">
                <p className="leading-none">Authorized Signatory</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold leading-none">Customer Signature</p>
            <p className="font-bold leading-none">For Acknowledgement</p>
            <div className="h-4 mb-1"></div>
          </div>
        </div>
        
        {/* Footer Note - Ultra Compact */}
        <div className="text-center text-xs mt-1 pt-1 border-t border-gray-400 leading-none">
          <p>Note: Unless otherwise stated, tax on this invoice is not payable under reverse charge</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="invoice-dual-copy bg-white max-w-[210mm] mx-auto">
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .invoice-dual-copy {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
          }
          table { font-size: 6px; }
          .text-xs { font-size: 6px; }
          .text-sm { font-size: 7px; }
          .text-lg { font-size: 9px; }
          .text-xl { font-size: 11px; }
        }
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
      `}</style>

      {/* Customer Copy */}
      <CompactInvoiceTemplate copyType="Customer Copy" isSecondCopy={false} />
      
      {/* Office/Audit Copy */}
      <CompactInvoiceTemplate copyType="Office Copy" isSecondCopy={true} />
    </div>
  );
};

export default InvoiceDualCopy;
