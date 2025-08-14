import React from 'react';
import { invoiceService } from '../../lib/invoice';

/**
 * Professional Invoice Template Component
 * Provides beautiful, print-ready invoice layout
 */
const InvoiceTemplate = ({ invoiceData }) => {
  const companyInfo = invoiceService.getCompanyInfo();

  if (!invoiceData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No invoice data provided</p>
      </div>
    );
  }

  const {
    invoiceNumber,
    invoiceDate,
    dueDate,
    customer,
    items,
    totals,
    paymentMethod,
    notes,
    terms,
    amountInWords
  } = invoiceData;

  return (
    <div className="bg-white text-gray-900 min-h-screen print:min-h-0">
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          .print-avoid-break { page-break-inside: avoid; }
          .print-full-width { width: 100% !important; }
          .invoice-container { box-shadow: none !important; }
        }
      `}</style>

      <div id="invoice-content" className="invoice-container max-w-4xl mx-auto p-8 print:p-4 print:max-w-none">
        {/* Header */}
        <div className="border-b-2 border-blue-600 pb-6 mb-6 print:mb-4">
          <div className="flex justify-between items-start">
            {/* Company Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-blue-600 mb-3 print:text-2xl">
                {companyInfo.name}
              </h1>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{companyInfo.address}</p>
                <p>Phone: {companyInfo.phone} | Email: {companyInfo.email}</p>
                <p>Website: {companyInfo.website}</p>
                <p>GST: {companyInfo.gst} | PAN: {companyInfo.pan}</p>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="text-right">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 print:border-gray-300">
                <h2 className="text-2xl font-bold text-blue-800 mb-2 print:text-xl">
                  INVOICE
                </h2>
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Invoice #:</span> {invoiceNumber}</p>
                  <p><span className="font-semibold">Date:</span> {invoiceService.formatDate(invoiceDate)}</p>
                  <p><span className="font-semibold">Due Date:</span> {invoiceService.formatDate(dueDate)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print:mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 print:text-base">Bill To:</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 print:border-gray-400">
              <p className="font-semibold text-gray-900">{customer.name}</p>
              <p className="text-gray-600 mt-1">{customer.address}</p>
              {customer.phone && <p className="text-gray-600">Phone: {customer.phone}</p>}
              {customer.email && <p className="text-gray-600">Email: {customer.email}</p>}
              {customer.gst && <p className="text-gray-600">GST: {customer.gst}</p>}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 print:text-base">Payment Info:</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 print:border-gray-400">
              <p><span className="font-semibold">Payment Method:</span> {paymentMethod}</p>
              <p><span className="font-semibold">Terms:</span> {terms}</p>
              <div className="mt-3">
                <p className="font-semibold text-gray-800">Bank Details:</p>
                <p className="text-sm text-gray-600">{companyInfo.bankDetails.bankName}</p>
                <p className="text-sm text-gray-600">A/C: {companyInfo.bankDetails.accountNumber}</p>
                <p className="text-sm text-gray-600">IFSC: {companyInfo.bankDetails.ifscCode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8 print:mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 print:text-base">Items:</h3>
          <div className="overflow-hidden border border-gray-300 rounded-lg print:border-gray-400">
            <table className="w-full">
              <thead className="bg-blue-600 text-white print:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold print:py-2">Sr.</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold print:py-2">Description</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold print:py-2">HSN</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold print:py-2">Qty</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold print:py-2">Unit</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold print:py-2">Rate</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold print:py-2">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index} className={index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3 text-sm text-gray-900 print:py-2">{item.srNo}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 print:py-2">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center print:py-2">{item.hsn}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center print:py-2">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center print:py-2">{item.unit}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right print:py-2">
                      {invoiceService.formatCurrency(item.rate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold print:py-2">
                      {invoiceService.formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print:mb-6">
          {/* Amount in Words */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3 print:text-base">Amount in Words:</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 print:border-gray-400">
              <p className="text-blue-800 font-semibold">{amountInWords}</p>
            </div>
          </div>

          {/* Calculation Summary */}
          <div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 print:border-gray-400">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{invoiceService.formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST ({totals.taxRate}%):</span>
                  <span className="font-semibold">{invoiceService.formatCurrency(totals.taxAmount)}</span>
                </div>
                {totals.roundOff !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Round Off:</span>
                    <span className="font-semibold">{invoiceService.formatCurrency(totals.roundOff)}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2">
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-gray-800">Grand Total:</span>
                    <span className="font-bold text-blue-600">{invoiceService.formatCurrency(totals.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print:mb-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3 print:text-base">Notes:</h4>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 print:border-gray-400">
              <p className="text-yellow-800 text-sm">{notes}</p>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3 print:text-base">Terms & Conditions:</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 print:border-gray-400">
              <p className="text-gray-600 text-sm">{terms}</p>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="border-t border-gray-200 pt-6 print:pt-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-gray-600 mb-8">Customer Signature</p>
              <div className="border-b border-gray-300 w-48"></div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-2">For {companyInfo.name}</p>
              <div className="mb-8"></div>
              <div className="border-b border-gray-300 w-48"></div>
              <p className="text-sm text-gray-600 mt-1">Authorized Signatory</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500 print:mt-6">
          <p>This is a computer generated invoice and does not require physical signature.</p>
          <p className="mt-1">Generated on {invoiceService.formatDate(new Date())} | {companyInfo.website}</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplate;
