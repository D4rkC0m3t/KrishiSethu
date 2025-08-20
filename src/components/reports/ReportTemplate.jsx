import React from 'react';
import { reportsService } from '../../lib/reports';

/**
 * Base Report Template Component
 * Provides consistent styling and layout for all reports
 */
const ReportTemplate = ({
  title,
  subtitle,
  children,
  showHeader = true,
  showFooter = true,
  className = "",
  orientation = "portrait", // "portrait" or "landscape"
  pageSize = "A4" // "A4", "Letter", etc.
}) => {
  const currentDate = reportsService.getCurrentDate();
  const currentTime = reportsService.getCurrentTime();

  return (
    <div className={`bg-white text-gray-900 min-h-screen print:min-h-0 ${className}`}>
      {/* Enhanced Print Styles with A4 formatting */}
      <style>{`
        @media print {
          @page {
            size: ${pageSize} ${orientation};
            margin: 0.5in;
          }

          body {
            margin: 0;
            font-size: 12px;
            line-height: 1.4;
          }

          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          .print-avoid-break { page-break-inside: avoid; }
          .print-full-width { width: 100% !important; }

          /* A4 specific adjustments */
          .print-landscape {
            width: 11in;
            max-width: 11in;
          }
          .print-portrait {
            width: 8.27in;
            max-width: 8.27in;
          }

          /* Table adjustments for A4 */
          table {
            font-size: 10px !important;
            width: 100% !important;
          }
          th, td {
            padding: 4px 6px !important;
            font-size: 10px !important;
          }

          /* Header adjustments */
          h1 { font-size: 18px !important; }
          h2 { font-size: 16px !important; }
          h3 { font-size: 14px !important; }

          /* Card adjustments */
          .print-card {
            border: 1px solid #ccc !important;
            margin-bottom: 8px !important;
            padding: 8px !important;
          }
        }
      `}</style>

      {/* Header */}
      {showHeader && (
        <div className="border-b-2 border-blue-600 pb-6 mb-8 print:mb-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              {/* Company Logo */}
              <div className="flex-shrink-0">
                {reportsService.companyInfo.logo ? (
                  <img
                    src={reportsService.companyInfo.logo}
                    alt={`${reportsService.companyInfo.name} Logo`}
                    className="w-16 h-16 object-contain border border-gray-200 bg-white rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-500 rounded">
                    LOGO
                  </div>
                )}
                {/* Fallback logo placeholder */}
                <div className="w-16 h-16 border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-500 rounded" style={{display: 'none'}}>
                  LOGO
                </div>
              </div>

              {/* Company Info */}
              <div>
                <h1 className="text-3xl font-bold text-blue-600 mb-2 print:text-2xl">
                  {reportsService.companyInfo.name}
                </h1>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{reportsService.companyInfo.address}</p>
                  <p>
                    Phone: {reportsService.companyInfo.phone} |
                    Email: {reportsService.companyInfo.email}
                  </p>
                  <p>Website: {reportsService.companyInfo.website}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 print:border-gray-300">
                <h2 className="text-xl font-semibold text-blue-800 mb-1 print:text-lg">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm text-blue-600 mb-2">{subtitle}</p>
                )}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Generated: {currentDate}</p>
                  <p>Time: {currentTime}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-8 print:space-y-6">
        {children}
      </div>

      {/* Footer */}
      {showFooter && (
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500 print:mt-8">
          <p>
            This report was generated automatically by {reportsService.companyInfo.name} on {currentDate} at {currentTime}
          </p>
          <p className="mt-1">
            For questions about this report, please contact {reportsService.companyInfo.email}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Summary Card Component for reports
 */
export const ReportSummaryCard = ({ title, value, subtitle, icon, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    green: "bg-green-50 border-green-200 text-green-800",
    red: "bg-red-50 border-red-200 text-red-800",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800"
  };

  return (
    <div className={`border rounded-lg p-4 print:border-gray-300 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1 print:text-xl">{value}</p>
          {subtitle && (
            <p className="text-xs opacity-70 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-2xl opacity-60 print:text-xl">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Data Table Component for reports
 */
export const ReportTable = ({ 
  headers, 
  data, 
  title, 
  className = "",
  striped = true,
  bordered = true 
}) => {
  return (
    <div className={`print-avoid-break ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4 print:text-base">
          {title}
        </h3>
      )}
      
      <div className="overflow-hidden rounded-lg border border-gray-200 print:border-gray-400">
        <table className="w-full">
          <thead className="bg-gray-50 print:bg-gray-100">
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 print:py-2 print:text-xs"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className={`
                  ${striped && rowIndex % 2 === 1 ? 'bg-gray-50 print:bg-gray-50' : 'bg-white'}
                  hover:bg-gray-100 print:hover:bg-transparent
                `}
              >
                {row.map((cell, cellIndex) => (
                  <td 
                    key={cellIndex}
                    className={`
                      px-4 py-3 text-sm text-gray-900 print:py-2 print:text-xs
                      ${bordered ? 'border-b border-gray-200' : ''}
                    `}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No data available</p>
        </div>
      )}
    </div>
  );
};

/**
 * Section Component for organizing report content
 */
export const ReportSection = ({ title, children, className = "" }) => {
  return (
    <div className={`print-avoid-break ${className}`}>
      {title && (
        <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200 print:text-lg print:mb-4">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

/**
 * Grid Layout Component for summary cards
 */
export const ReportGrid = ({ children, columns = 4, className = "" }) => {
  const gridClasses = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3", 
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
  };

  return (
    <div className={`grid gap-4 print:gap-3 ${gridClasses[columns]} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Chart Placeholder Component (for future chart integration)
 */
export const ReportChart = ({ title, type, data, height = "300px" }) => {
  return (
    <div className="print-avoid-break">
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4 print:text-base">
          {title}
        </h3>
      )}
      <div 
        className="border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center print:border-gray-400"
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">{type} Chart</p>
          <p className="text-sm">Chart visualization will be displayed here</p>
          <p className="text-xs mt-2">Data points: {data?.length || 0}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Print Button Component with Orientation Options
 */
export const PrintButton = ({
  onClick,
  className = "",
  onOrientationChange,
  orientation = "portrait",
  showOrientationToggle = true
}) => {
  const handlePrint = () => {
    if (onClick) {
      onClick();
    } else {
      window.print();
    }
  };

  return (
    <div className={`no-print flex items-center gap-4 ${className}`}>
      {showOrientationToggle && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Page Layout:</label>
          <select
            value={orientation}
            onChange={(e) => onOrientationChange && onOrientationChange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="portrait">Portrait (A4)</option>
            <option value="landscape">Landscape (A4)</option>
          </select>
        </div>
      )}
      <button
        onClick={handlePrint}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print Report
      </button>
    </div>
  );
};

export default ReportTemplate;
