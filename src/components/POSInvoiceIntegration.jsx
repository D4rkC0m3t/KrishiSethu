import React from 'react';
import InvoiceDualCopy from './invoice/InvoiceDualCopy';

/**
 * Integration Guide for POS Invoice Receipt
 * 
 * This file shows how to integrate the InvoiceDualCopy component into your existing POS.jsx
 * Replace the existing receipt generation with this component for professional invoices
 */

// Example: How to modify your existing POS completeSale function
const integrationExample = `
// In your POS.jsx file, replace the existing receipt logic with:

import InvoiceDualCopy from './invoice/InvoiceDualCopy';

// Inside your completeSale function, after saving the sale:
const completeSale = async () => {
  // ... existing sale logic ...

  // After successful sale, prepare invoice data
  const invoiceData = {
    invoiceNumber: currentBillNumber,
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    placeOfSupply: shopDetails?.address?.state || 'Maharashtra',
    reverseCharge: 'No',
    customer: {
      name: selectedCustomer?.name || customerForm.name || 'Walk-in Customer',
      address: selectedCustomer?.address || customerForm.address || 'Customer Address',
      phone: selectedCustomer?.phone || customerForm.phone || '',
      email: selectedCustomer?.email || customerForm.email || '',
      gst: selectedCustomer?.gstNumber || customerForm.gstNumber || '',
      stateCode: selectedCustomer?.stateCode || '27'
    },
    items: cart.map(item => ({
      description: item.name,
      itemCode: item.id,
      hsn: item.hsn,
      batchNo: item.batchNo,
      expiryDate: item.expiryDate,
      quantity: item.quantity,
      unit: item.unit,
      pack: item.pack,
      rate: item.price,
      discount: 0, // Add discount logic if needed
      gstRate: item.gstRate || 18,
      isIGST: false // Set based on state comparison
    })),
    paymentMethod: paymentData.method,
    notes: notes,
    terms: 'Payment due on receipt'
  };

  const companyInfo = {
    name: shopDetails?.name || 'Your Company Name',
    address: shopDetails?.address || {
      street: 'Company Address',
      city: 'City',
      state: 'State',
      pincode: '123456'
    },
    phone: shopDetails?.phone || '+91-9999999999',
    email: shopDetails?.email || 'info@company.com',
    website: shopDetails?.website || 'www.company.com',
    gstNumber: shopDetails?.gstNumber || '27AAAAA0000A1Z5',
    pan: shopDetails?.pan || 'AAAAA0000A',
    stateCode: shopDetails?.stateCode || '27',
    bankDetails: shopDetails?.bankDetails || {
      bankName: 'Bank Name',
      accountNumber: '1234567890',
      ifscCode: 'BANK0001234',
      branch: 'Branch Name'
    }
  };

  // Store invoice data for receipt dialog
  setInvoiceData(invoiceData);
  setCompanyData(companyInfo);
  
  // Show receipt dialog
  setShowReceiptDialog(true);
};
`;

// Example: How to modify your receipt dialog
const receiptDialogExample = `
// Replace your existing receipt dialog content with:

<Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
  <DialogContent className="max-w-6xl max-h-[95vh] overflow-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Receipt className="h-5 w-5" />
        Sale Completed - Invoice {invoiceData?.invoiceNumber}
      </DialogTitle>
    </DialogHeader>
    
    <div className="invoice-controls flex gap-3 mb-4 no-print">
      <Button onClick={printInvoice} size="sm">
        <Printer className="w-4 h-4 mr-2" />
        Print Invoice
      </Button>
      
      <Button onClick={downloadInvoicePDF} variant="outline" size="sm">
        <FileText className="w-4 h-4 mr-2" />
        Download PDF
      </Button>
      
      <Button onClick={() => setShowReceiptDialog(false)} variant="outline" size="sm">
        Close
      </Button>
    </div>

    <div id="invoice-print-area">
      <InvoiceDualCopy
        invoiceData={invoiceData}
        companyInfo={companyData}
        showDuplicateWatermark={false}
      />
    </div>
  </DialogContent>
</Dialog>
`;

// Example: Print function
const printFunctionExample = `
// Add this print function to your POS component:

const printInvoice = () => {
  const printContent = document.getElementById('invoice-print-area');
  if (!printContent) return;

  const printWindow = window.open('', '_blank');
  
  printWindow.document.write(\`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice - \${invoiceData?.invoiceNumber}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
            .print-break { page-break-before: always; }
          }
          @page {
            size: A4;
            margin: 0.5in;
          }
        </style>
      </head>
      <body>
        \${printContent.innerHTML}
      </body>
    </html>
  \`);
  
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 1000);
};
`;

const POSInvoiceIntegration = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto bg-white">
      <h1 className="text-2xl font-bold mb-6">POS Invoice Integration Guide</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">Quick Integration Steps</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Import the <code className="bg-blue-100 px-1 rounded">InvoiceDualCopy</code> component in your POS.jsx</li>
              <li>Add invoice data state variables</li>
              <li>Modify your <code className="bg-blue-100 px-1 rounded">completeSale</code> function</li>
              <li>Update your receipt dialog</li>
              <li>Add print functionality</li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">1. Import Statement</h2>
          <pre className="bg-gray-100 border rounded-lg p-4 text-sm overflow-x-auto">
            <code>{`import InvoiceDualCopy from './invoice/InvoiceDualCopy';`}</code>
          </pre>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Add State Variables</h2>
          <pre className="bg-gray-100 border rounded-lg p-4 text-sm overflow-x-auto">
            <code>{`const [invoiceData, setInvoiceData] = useState(null);
const [companyData, setCompanyData] = useState(null);`}</code>
          </pre>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Update completeSale Function</h2>
          <pre className="bg-gray-100 border rounded-lg p-4 text-sm overflow-x-auto">
            <code>{integrationExample}</code>
          </pre>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Update Receipt Dialog</h2>
          <pre className="bg-gray-100 border rounded-lg p-4 text-sm overflow-x-auto">
            <code>{receiptDialogExample}</code>
          </pre>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Add Print Function</h2>
          <pre className="bg-gray-100 border rounded-lg p-4 text-sm overflow-x-auto">
            <code>{printFunctionExample}</code>
          </pre>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Component Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">✅ Included Headers</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>S.No, Description of Goods</li>
                <li>Item Code, HSN of Goods</li>
                <li>Batch No., Expiry Date</li>
                <li>Quantity & Unit, Pack</li>
                <li>Rate/Price, Total amount</li>
                <li>Discount/Abatements</li>
                <li>Taxable Amount</li>
                <li>CGST %, SGST/UTGST %, IGST %</li>
                <li>Tax Amounts, Total Amount (incl. tax)</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">🔧 Features</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>Auto-calculation of all totals</li>
                <li>GST compliance (CGST/SGST/IGST)</li>
                <li>Two copies per page</li>
                <li>Print-optimized with page breaks</li>
                <li>Clean Tailwind styling</li>
                <li>Optional "Duplicate Copy" watermark</li>
                <li>Number to words conversion</li>
                <li>Professional layout</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Thermal Printer Support</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 mb-2">
              For thermal printers (58mm/80mm), pass the <code>thermalWidth</code> prop:
            </p>
            <pre className="bg-yellow-100 border rounded p-2 text-sm">
              <code>{`<InvoiceDualCopy 
  thermalWidth="58mm" // or "80mm"
  invoiceData={invoiceData}
  companyInfo={companyInfo}
/>`}</code>
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
};

export default POSInvoiceIntegration;
