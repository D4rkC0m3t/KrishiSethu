import React from 'react';

const ReportHeader = ({ 
  reportTitle, 
  period, 
  companyDetails, 
  reportId,
  systemName = "KrishiSethu Inventory Management System"
}) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const generateReportId = () => {
    if (reportId) return reportId;
    const prefix = reportTitle?.split(' ')[0]?.toUpperCase().substring(0, 3) || 'RPT';
    const timestamp = Date.now().toString().slice(-8);
    return `${prefix}-${timestamp}`;
  };

  return (
    <div className="report-header bg-white p-6 border-b-2 border-gray-300 mb-6" style={{ pageBreakAfter: 'avoid' }}>
      {/* Report Title - Top Center */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">{reportTitle}</h1>
      </div>

      {/* Company Info Section - Logo + Details */}
      <div className="flex items-start gap-6 mb-4">
        {/* Company Logo */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 border border-gray-300 bg-gray-50 flex items-center justify-center rounded">
            {companyDetails?.logo ? (
              <img 
                src={companyDetails.logo} 
                alt="Company Logo" 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-xs text-gray-500 text-center">
                <div className="text-green-600 font-bold">🌾</div>
                <div>LOGO</div>
              </div>
            )}
          </div>
        </div>

        {/* Company Details */}
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-800 mb-1">
            {companyDetails?.name || 'Krishisethu Fertilizers'}
          </h2>
          <div className="text-sm text-gray-600 space-y-1">
            <div>
              {companyDetails?.address?.street || '123 Agricultural Complex'}
            </div>
            <div>
              {companyDetails?.address?.city || 'Mumbai'}, {companyDetails?.address?.state || 'Maharashtra'} - {companyDetails?.address?.pincode || '400001'}
            </div>
            <div className="flex items-center gap-4">
              <span>📞 {companyDetails?.phone || '+91-9876543210'}</span>
              <span>✉️ {companyDetails?.email || 'info@krishisethu.com'}</span>
            </div>
            <div>
              <strong>GST:</strong> {companyDetails?.gstNumber || '27AAAAA0000A1Z5'}
            </div>
          </div>
        </div>
      </div>

      {/* Report Meta Information */}
      <div className="text-center border-t border-gray-200 pt-3">
        <div className="text-sm text-gray-600">
          <div className="mb-1">
            <strong>Period:</strong> {period} | <strong>Generated on:</strong> {formatDate(new Date())}
          </div>
          <div className="text-xs text-gray-500">
            Report ID: {generateReportId()} | {systemName}
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          .report-header {
            background: white !important;
            color: black !important;
            border-bottom: 2px solid #000 !important;
            margin-bottom: 20px !important;
            page-break-after: avoid !important;
          }
          
          .report-header h1 {
            color: black !important;
            font-size: 24px !important;
          }
          
          .report-header h2 {
            color: black !important;
            font-size: 18px !important;
          }
          
          .report-header div {
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportHeader;
