import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

// FORCE REFRESH - Updated Invoice Component

const fmtCurrency = (n) => (typeof n === 'number' ? n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—');
const fmt = (v) => (v !== undefined && v !== null && v !== '' ? v : '—');

// Date format dd-MMM-yy (e.g., 8-Jul-25)
const formatShortDate = (d) => {
  const date = d?.seconds ? new Date(d.seconds * 1000) : (d ? new Date(d) : null);
  if (!date || isNaN(date)) return '—';
  const day = date.getDate();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mon = months[date.getMonth()];
  const yr = date.getFullYear().toString().slice(-2);
  return `${day}-${mon}-${yr}`;
};

// Number to words (Indian system)
const numberToWordsIndian = (num) => {
  if (num === 0) return 'Zero';
  const ones = ['', 'One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const toWordsBelow1000 = (n) => {
    let str = '';
    if (n > 99) {
      str += ones[Math.floor(n/100)] + ' Hundred';
      n = n % 100;
      if (n) str += ' ';
    }
    if (n > 19) {
      str += tens[Math.floor(n/10)];
      if (n % 10) str += ' ' + ones[n % 10];
    } else if (n > 0) {
      str += ones[n];
    }
    return str.trim();
  };
  const parts = [
    { d: 10000000, w: 'Crore' },
    { d: 100000, w: 'Lakh' },
    { d: 1000, w: 'Thousand' },
    { d: 100, w: 'Hundred' }
  ];
  let n = Math.floor(Math.abs(num));
  let words = '';
  for (const p of parts) {
    if (n >= p.d) {
      const q = Math.floor(n / p.d);
      const rem = p.d === 100 ? q : q; // q is already block size for Indian system
      words += (words ? ' ' : '') + toWordsBelow1000(rem) + ' ' + p.w;
      n = n % p.d;
    }
  }
  if (n) words += (words ? ' ' : '') + toWordsBelow1000(n);
  return words.trim();
};

// QR Code Component
const QRCodeComponent = ({ data, size = 70 }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(data, {
          width: size,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    if (data) {
      generateQR();
    }
  }, [data, size]);

  if (!qrCodeUrl) {
    return (
      <div className="w-[70px] h-[70px] border border-black text-center flex items-center justify-center bg-white">
        <span className="text-xs text-black">Loading...</span>
      </div>
    );
  }

  return (
    <div className="w-[70px] h-[70px] border border-black bg-white p-1">
      <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
    </div>
  );
};

// Invoice preview matching the reference image exactly with proper table structure - UPDATED
const InvoicePreview = ({ sale, settings, compact }) => {
  console.log('🔥 UPDATED INVOICE COMPONENT LOADED - V3', { sale, settings, compact });
  const items = Array.isArray(sale?.items) ? sale.items : [];
  const hsn = settings?.taxSettings?.hsnCode || '38089199';
  const igst = typeof settings?.taxSettings?.igstRate === 'number' ? settings.taxSettings.igstRate : undefined;
  const cgst = typeof settings?.taxSettings?.cgstRate === 'number' ? settings.taxSettings.cgstRate : undefined;
  const sgst = typeof settings?.taxSettings?.sgstRate === 'number' ? settings.taxSettings.sgstRate : undefined;
  const gst = typeof igst === 'number' ? igst : (typeof cgst === 'number' && typeof sgst === 'number' ? (cgst + sgst) : 0);
  const invoiceTotal = sale?.total || 0;
  const taxable = sale?.subtotal || 0;
  const taxAmt = sale?.tax || 0;
  // const roundOff = sale?.roundOff || 0;

  // Generate QR code data (invoice details)
  const qrData = `Invoice: ${sale?.saleNumber || 'INV-001'}
Date: ${sale?.saleDate || new Date().toLocaleDateString()}
Amount: ₹${invoiceTotal}
Customer: ${sale?.customerName || 'Walk-in Customer'}
GSTIN: ${settings?.companyInfo?.gstNumber || ''}`;

  return (
    <div className="max-w-4xl mx-auto p-4" key="invoice-preview-updated-v2">
      {/* Title removed for clean print */}

    <div className="invoice-container w-[208mm] h-[297mm] py-[3mm] px-[3mm] mx-auto border border-black font-mono text-xs box-border bg-white text-black" style={{backgroundColor: '#ffffff', color: '#000000'}}>
      <style>{`
        .invoice-container * {
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        .invoice-container table {
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        .invoice-container td, .invoice-container th {
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        .invoice-container div, .invoice-container p, .invoice-container span, .invoice-container h1, .invoice-container h2 {
          background-color: #ffffff !important;
          color: #000000 !important;
        }
      `}</style>
      {/* Header */}
      <table className="w-full border-b border-black border-collapse" style={{minHeight: '30px', backgroundColor: '#ffffff', color: '#000000'}}>
        <tbody>
          <tr>
            <td className="border-0 align-top p-1" style={{width: '40%', backgroundColor: '#ffffff', color: '#000000'}}>
              <div className="text-xs leading-tight text-black">
                <p className="mb-0.5 text-black"><strong>Ack No.:</strong> {fmt(sale?.ackNo) || '112525754315713'}</p>
                <p className="mb-0.5 text-black"><strong>Ack Date:</strong> {sale?.ackDate ? formatShortDate(sale.ackDate) : formatShortDate(sale?.saleDate) || '8-Jul-25'}</p>
                <p className="break-all text-black text-[8px]"><strong>IRN:</strong> {fmt(sale?.irn) || '76652a80d75c144cd3691aec0d7c8b0ae6cc1b3c12739791afdb08381b3b2c2e'}</p>
              </div>
            </td>
            <td className="border-0 text-center align-top p-1" style={{width: '35%', backgroundColor: '#ffffff', color: '#000000'}}>
              <div className="text-xs italic mt-1 flex items-center justify-center h-full text-black">(ORIGINAL FOR RECIPIENT)</div>
            </td>
            <td className="border-0 text-right align-top p-1" style={{width: '25%', backgroundColor: '#ffffff', color: '#000000'}}>
              <div className="ml-auto">
                <QRCodeComponent data={qrData} size={70} />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Logo and Company Info Section */}
      <div className="border-b border-black bg-white text-black" style={{backgroundColor: '#ffffff', color: '#000000'}}>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="border-0 align-top p-2" style={{width: '25%', backgroundColor: '#ffffff', color: '#000000'}}>
                {/* Company Logo */}
                <div className="w-[100px] h-[80px] border border-black bg-white flex items-center justify-center">
                  {settings?.companyInfo?.logo ? (
                    <img
                      src={settings.companyInfo.logo}
                      alt="Company Logo"
                      className="max-w-full max-h-full object-contain"
                      style={{maxWidth: '100%', maxHeight: '100%'}}
                    />
                  ) : (
                    <span className="text-xs text-black text-center">LOGO</span>
                  )}
                </div>
              </td>
              <td className="border-0 text-center align-top p-2" style={{width: '75%', backgroundColor: '#ffffff', color: '#000000'}}>
                {/* Company Info */}
                <div className="text-center leading-tight">
                  <h1 className="text-lg font-bold mb-0.5 text-black">TAX INVOICE</h1>
                  <h2 className="font-bold text-sm mb-0.5 text-black">{fmt(settings?.companyInfo?.name) || 'Krishisethu Fertilizers'}</h2>
                  <p className="text-xs mb-0.5 text-black">{fmt(settings?.companyInfo?.address?.street) || '123 Agricultural Complex, Mumbai'}, {fmt(settings?.companyInfo?.address?.city) || 'Mumbai'}, {fmt(settings?.companyInfo?.address?.district) || 'Maharashtra'}</p>
                  <p className="text-xs mb-0.5 text-black">GSTIN: {fmt(settings?.companyInfo?.gstNumber) || '27AAAAA0000A1Z5'}, State Name: {fmt(settings?.companyInfo?.address?.state) || 'Maharashtra'}, Code: {fmt(settings?.companyInfo?.stateCode) || '27'}</p>
                  <p className="text-xs text-black">Mobile Number: {fmt(settings?.companyInfo?.phone) || '+91-9876543210'}, E-Mail: {fmt(settings?.companyInfo?.email) || 'info@krishisethu.com'}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <table className="w-full border-collapse">
        <tbody>


        {/* Invoice details (boxed, aligned) */}
        <tr>
          <td className="p-0" colSpan={9}>
            <table className="w-full border border-black border-collapse text-xs">
              <tbody>
                <tr>
                  <td className="border p-0.5">Invoice No.: {fmt(sale?.saleNumber)}</td>
                  <td className="border p-0.5">e-WayBill No.: {fmt(sale?.ewaybillNo) || '142155410771'}</td>
                </tr>
                <tr>
                  <td className="border p-0.5">Invoice Date: {sale?.saleDate ? formatShortDate(sale?.saleDate) : '8-Jul-25'}</td>
                  <td className="border p-0.5">e-WayBill Date: {sale?.ewaybillDate ? formatShortDate(sale?.ewaybillDate) : '8-Jul-25'}</td>
                </tr>
                <tr>
                  <td className="border p-0.5">Despatch through: {fmt(sale?.despatchThrough) || 'Four Wheeler/Tata Ac'}</td>
                  <td className="border p-0.5">Other References: {fmt(sale?.otherRef) || ''}</td>
                </tr>
                <tr>
                  <td className="border p-0.5">Destination: {fmt(sale?.destination) || 'Ballari'}</td>
                  <td className="border p-0.5">Vehicle No: {fmt(sale?.vehicleNo) || 'KA18A8523'}</td>
                </tr>
                <tr>
                  <td className="border p-0.5">Mode/Terms of payment: {fmt(sale?.paymentMethod) || ''}</td>
                  <td className="border p-0.5">Date & Time of Supply: {fmt(sale?.supplyDateTime) || ''}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        {/* Parties blocks */}
        <tr>
          <td className="border-b border-black p-1" colSpan={9}>
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="border border-black p-1 align-top w-1/2">
                    <div className="font-semibold">Buyer (if other than consignee)</div>
                    <div className="mt-[2px]">NAME: {fmt(sale?.consigneeName) || '——————————————————————'}</div>
                    <div>ADDRESS: {fmt(sale?.consigneeAddress) || '—————————————————————————————————————————————'}</div>
                    <div>GSTIN/UIN: {fmt(sale?.consigneeGSTIN) || '——————————————'}</div>
                    <div>State Name: {fmt(sale?.consigneeState) || '—————————'} Code: {fmt(sale?.consigneeStateCode) || '——'}</div>
                    <div>Contact person: {fmt(sale?.consigneeContactPerson) || '————————————'}</div>
                    <div>Contact Details: {fmt(sale?.consigneePhone) || '————————————'}</div>
                  </td>
                  <td className="border border-black p-1 align-top w-1/2">
                    <div className="font-semibold">Buyer</div>
                    <div className="mt-[2px]">{fmt(sale?.customerName)}</div>
                    <div>ADDRESS: {fmt(sale?.customerAddress)}</div>
                    <div>GSTIN/UIN: {fmt(sale?.customerGSTIN)}</div>
                    <div>State Name: {fmt(sale?.customerState)} Code: {fmt(sale?.customerStateCode)}</div>
                    <div>Mobile Number: {fmt(sale?.customerPhone)}</div>
                    <div>Contact person: {fmt(sale?.customerContactPerson)}</div>
                    <div>Contact Details: {fmt(sale?.customerEmail)}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        {/* Items header */}
        <tr>
          <td colSpan={9} className="p-0">
            <table className="w-full border-y-2 border-black border-collapse text-xs">
              <colgroup>
                <col style={{width: '22px'}} />
                <col style={{width: 'auto'}} />
                <col style={{width: '70px'}} />
                <col style={{width: '50px'}} />
                <col style={{width: '60px'}} />
                <col style={{width: '70px'}} />
                <col style={{width: '55px'}} />
                <col style={{width: '60px'}} />
                <col style={{width: '70px'}} />
              </colgroup>
              <thead>
                <tr>
                  <th className="border border-black">Sr</th>
                  <th className="border border-black text-left">Description</th>
                  <th className="border border-black">HSN</th>
                  <th className="border border-black">GST %</th>
                  <th className="border border-black">Mft</th>
                  <th className="border border-black">Expiry</th>
                  <th className="border border-black">Qty</th>
                  <th className="border border-black">Rate</th>
                  <th className="border border-black">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(items.length ? items : Array.from({ length: 6 })).map((row, i) => (
                  <tr key={i}>
                    <td className="border border-black text-center">{i + 1}</td>
                    <td className="border border-black">
                      <div className="font-medium">{fmt(row?.productName) || 'PRODUCT NAME'}</div>
                      <div className="text-[8px]">LOT/Batch: {fmt(row?.batchNo) || '—'}</div>
                    </td>
                    <td className="border border-black text-center">{row?.hsn || hsn}</td>
                    <td className="border border-black text-center">{typeof row?.gstRate === 'number' ? `${row.gstRate}%` : (gst ? `${gst}%` : '—')}</td>
                    <td className="border border-black text-center whitespace-nowrap">{formatShortDate(row?.mfgDate)}</td>
                    <td className="border border-black text-center whitespace-nowrap">{formatShortDate(row?.expiryDate)}</td>
                    <td className="border border-black text-center whitespace-nowrap">{row?.quantity ? `${row.quantity} ${row?.unit || 'PCS'}` : '—'}</td>
                    <td className="border border-black text-right whitespace-nowrap">{fmtCurrency(row?.unitPrice)}</td>
                    <td className="border border-black text-right whitespace-nowrap">{fmtCurrency(row?.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>

        {/* Items subtotal row within table (qty rollup) */}
        <tr>
          <td className="p-0" colSpan={9}>
            <table className="w-full border-collapse text-xs">
              <colgroup>
                <col style={{width: '22px'}} />
                <col style={{width: 'auto'}} />
                <col style={{width: '70px'}} />
                <col style={{width: '50px'}} />
                <col style={{width: '60px'}} />
                <col style={{width: '70px'}} />
                <col style={{width: '55px'}} />
                <col style={{width: '60px'}} />
                <col style={{width: '70px'}} />
              </colgroup>
              <tbody>
                <tr>
                  <td className="border border-black text-left p-1" colSpan={8}>{items?.reduce((sum, r) => sum + (r?.quantity || 0), 0)} {items?.[0]?.unit || 'PCS'}</td>
                  <td className="border border-black text-right p-1">{fmtCurrency(taxable)}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        {/* Totals like original */}
        <tr>
          <td className="p-0" colSpan={9}>
            <table className="w-full border-collapse text-xs">
              <tbody>
                <tr>
                  <td className="border border-black text-center w-[60px] p-0.5">HSN/SAC</td>
                  <td className="border border-black text-center w-[90px] p-0.5">{hsn}</td>
                  <td className="border border-black text-center p-0.5">Taxable Value</td>
                  <td className="border border-black text-right w-[100px] p-0.5">{fmtCurrency(taxable)}</td>
                  <td className="border border-black text-center w-[50px] p-0.5">IGST @{gst}%</td>
                  <td className="border border-black text-right w-[100px] p-0.5">{fmtCurrency(taxAmt)}</td>
                </tr>
                <tr>
                  <td className="border border-black" colSpan={4}></td>
                  <td className="border border-black text-right p-0.5">Round Off</td>
                  <td className="border border-black text-right p-0.5">{fmtCurrency(sale?.roundOff ?? 0)}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        {/* Amount in words + Invoice total */}
        <tr>
          <td className="p-0" colSpan={9}>
            <table className="w-full border-collapse text-xs">
              <tbody>
                <tr>
                  <td className="border border-black p-0.5" colSpan={3}>Amount In Words : <b>INR {numberToWordsIndian(Math.round(invoiceTotal || 0))} Only.</b></td>
                </tr>
                <tr>
                  <td className="border border-black p-0.5" colSpan={2}>Total Taxable Value: ₹{fmtCurrency(taxable)} | IGST @{gst}%: ₹{fmtCurrency(taxAmt)} | Total: ₹{fmtCurrency((taxable||0)+(taxAmt||0))}</td>
                  <td className="border border-black w-[210px]">
                    <div className="grid grid-cols-2">
                      <div className="border-r border-black p-0.5">Invoice Total</div>
                      <div className="p-0.5 text-right font-bold">₹ {fmtCurrency((invoiceTotal || 0) + (sale?.roundOff || 0))}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-0.5" colSpan={2}>Round Off: {fmtCurrency(sale?.roundOff || 0)}</td>
                  <td className="border border-black w-[210px]">
                    <div className="grid grid-cols-2">
                      <div className="border-r border-black p-0.5">Invoice Total</div>
                      <div className="p-0.5 text-right font-bold">₹ {fmtCurrency((invoiceTotal || 0) + (sale?.roundOff || 0))}</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        {/* Outstanding + Bank */}
        <tr>
          <td className="p-0" colSpan={9}>
            <table className="w-full border-collapse text-xs">
              <tbody>
                <tr>
                  <td className="border border-black align-top">
                    <div className="font-semibold border-b border-black p-0.5">Outstanding Details</div>
                    <div className="grid grid-cols-2 p-0.5 gap-1">
                      <div>Previous Outstanding</div><div className="text-right">₹ {fmtCurrency(sale?.previousOutstanding || 0)}</div>
                      <div>Current Invoice</div><div className="text-right">₹ {fmtCurrency(invoiceTotal)}</div>
                      <div>Total Outstanding</div><div className="text-right font-semibold">₹ {fmtCurrency((sale?.previousOutstanding || 0) + invoiceTotal)}</div>
                    </div>
                  </td>
                  <td className="border border-black align-top">
                    <div className="font-semibold border-b border-black p-0.5">Company's Bank Details</div>
                    <div className="grid grid-cols-2 p-0.5 gap-1">
                      <div>Bank Name</div><div className="text-right text-[8px]">{settings?.bankDetails?.bankName || 'SBI CA No - 00000030730537246'}</div>
                      <div>A/c No.</div><div className="text-right">{settings?.bankDetails?.accountNumber || '00000030730537246'}</div>
                      <div>Branch & IFSC Code</div><div className="text-right text-[8px]">{(settings?.bankDetails?.branch && settings?.bankDetails?.ifsc) ? `${settings.bankDetails.branch} & ${settings.bankDetails.ifsc}` : 'Holagunda & SBIN0011088'}</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        {/* Signatures */}
        <tr>
          <td className="p-0" colSpan={9}>
            <table className="w-full border-collapse text-xs">
              <tbody>
                <tr>
                  <td className="border-t border-black text-left p-2">customer signature & seal</td>
                  <td className="border-t border-black text-right p-2">Authorized Signatory</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
      </table>
    </div>
    </div>
  );
};

export default InvoicePreview;

