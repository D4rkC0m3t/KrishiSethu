import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import InvoiceDualCopy from './invoice/InvoiceDualCopy';
import { Printer, Receipt, FileText } from 'lucide-react';

/**
 * Example usage of InvoiceDualCopy component in POS system
 * This shows how to integrate the invoice component with your sales data
 */

const POSInvoiceExample = ({ saleData, onClose }) => {
  const [showInvoice, setShowInvoice] = useState(false);
  const [showDuplicateWatermark, setShowDuplicateWatermark] = useState(false);
  const invoiceRef = useRef();

  // Sample data structure - replace with your actual sale data
  const sampleSaleData = {
    invoiceNumber: 'INV-2024-001',
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    placeOfSupply: 'Maharashtra',
    reverseCharge: 'No',
    customer: {
      name: 'ABC Agro Industries',
      address: '123 Farm Road, Agriculture Zone, Mumbai - 400001',
      phone: '+91-9876543210',
      email: 'contact@abcagro.com',
      gst: '27ABCDE1234F1Z5',
      stateCode: '27'
    },
    items: [
      {
        description: 'NPK Fertilizer 10:26:26',
        itemCode: 'NPK001',
        hsn: '31052000',
        batchNo: 'B001',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        quantity: 10,
        unit: 'Bag',
        pack: '50kg',
        rate: 1200,
        discount: 5, // 5% discount
        gstRate: 18,
        isIGST: false // intra-state, so CGST+SGST
      },
      {
        description: 'Urea Fertilizer',
        itemCode: 'UREA001', 
        hsn: '31021000',
        batchNo: 'B002',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        quantity: 20,
        unit: 'Bag',
        pack: '45kg',
        rate: 800,
        discount: 0,
        gstRate: 5,
        isIGST: false
      },
      {
        description: 'Organic Compost',
        itemCode: 'ORG001',
        hsn: '31010000',
        batchNo: 'B003',
        expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
        quantity: 5,
        unit: 'Bag',
        pack: '25kg',
        rate: 400,
        discount: 10, // 10% discount
        gstRate: 12,
        isIGST: false
      }
    ],
    paymentMethod: 'UPI',
    notes: 'Thank you for your business! Contact us for any queries.',
    terms: 'Payment due within 15 days. No returns after 7 days.'
  };

  // Sample company info - replace with your actual company data
  const companyInfo = {
    name: 'KrishiSethu Fertilizers',
    address: {
      street: '456 Agricultural Complex, Market Yard',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400002'
    },
    phone: '+91-9999888777',
    email: 'sales@krishisethu.com',
    website: 'www.krishisethu.com',
    gstNumber: '27ABCDE9876F1Z5',
    pan: 'ABCDE9876F',
    stateCode: '27',
    bankDetails: {
      bankName: 'State Bank of India',
      accountNumber: '1234567890123456',
      ifscCode: 'SBIN0012345',
      branch: 'Market Yard Branch'
    }
  };

  // Use actual sale data if provided, otherwise use sample
  const invoiceData = saleData || sampleSaleData;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoiceData.invoiceNumber}</title>
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
          ${invoiceRef.current?.innerHTML || ''}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1000);
  };

  const handleDownloadPDF = () => {
    // Here you would integrate with html2pdf or similar library
    // For now, just trigger print dialog
    alert('PDF download functionality would be implemented here using html2pdf.js or similar');
  };

  return (
    <div className="pos-invoice-container">
      {/* Control Buttons */}
      <div className="flex gap-3 mb-4 no-print">
        <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Receipt className="w-4 h-4 mr-2" />
              Preview Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Invoice Preview - {invoiceData.invoiceNumber}</DialogTitle>
            </DialogHeader>
            
            <div className="invoice-preview-controls mb-4 flex gap-3 no-print">
              <Button onClick={handlePrint} size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Print Invoice
              </Button>
              
              <Button onClick={handleDownloadPDF} variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showDuplicateWatermark}
                  onChange={(e) => setShowDuplicateWatermark(e.target.checked)}
                  className="rounded"
                />
                Show "Duplicate Copy" watermark
              </label>
            </div>

            <div ref={invoiceRef}>
              <InvoiceDualCopy
                invoiceData={invoiceData}
                companyInfo={companyInfo}
                showDuplicateWatermark={showDuplicateWatermark}
              />
            </div>
          </DialogContent>
        </Dialog>

        <Button onClick={handlePrint} size="sm" variant="default">
          <Printer className="w-4 h-4 mr-2" />
          Print Direct
        </Button>
      </div>

      {/* Inline Invoice Display */}
      <div className="invoice-display">
        <div ref={invoiceRef}>
          <InvoiceDualCopy
            invoiceData={invoiceData}
            companyInfo={companyInfo}
            showDuplicateWatermark={showDuplicateWatermark}
          />
        </div>
      </div>
    </div>
  );
};

export default POSInvoiceExample;
