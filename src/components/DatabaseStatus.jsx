/**
 * 🗄️ DATABASE STATUS COMPONENT
 * 
 * Real-time database health monitoring and diagnostics display
 */

import React, { useState } from 'react'
import { useDatabaseStatus } from '../hooks/useDatabase'

const DatabaseStatus = ({ detailed = false, className = '' }) => {
  const { 
    status, 
    healthData, 
    color, 
    text, 
    icon, 
    detailed: detailedStatus, 
    isReady, 
    hasError, 
    isLoading,
    lastCheck 
  } = useDatabaseStatus()

  const [showDetails, setShowDetails] = useState(false)

  const getColorClasses = (color) => {
    const colorMap = {
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colorMap[color] || colorMap.gray
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className={`database-status ${className}`}>
      {/* Main Status Badge */}
      <div 
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border cursor-pointer transition-all duration-200 hover:shadow-md ${getColorClasses(color)}`}
        onClick={() => detailed && setShowDetails(!showDetails)}
        title={detailed ? 'Click for details' : text}
      >
        <span className="mr-2">{icon}</span>
        <span>{text}</span>
        {detailed && (
          <span className="ml-2 text-xs">
            {showDetails ? '▼' : '▶'}
          </span>
        )}
      </div>

      {/* Detailed Status Panel */}
      {detailed && showDetails && (
        <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="space-y-3">
            {/* Connection Status */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Connection:</span>
              <span className={`text-sm ${status.connected ? 'text-green-600' : 'text-red-600'}`}>
                {detailedStatus?.connection || 'Unknown'}
              </span>
            </div>

            {/* Schema Status */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Schema:</span>
              <span className={`text-sm ${healthData?.schema?.valid ? 'text-green-600' : 'text-orange-600'}`}>
                {detailedStatus?.schema || 'Unknown'}
              </span>
            </div>

            {/* Data Status */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Data:</span>
              <span className="text-sm text-gray-800">
                {detailedStatus?.data || 'Unknown'}
              </span>
            </div>

            {/* Views Status */}
            {detailedStatus?.views !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">CamelCase Views:</span>
                <span className="text-sm text-gray-800">
                  {detailedStatus.views} available
                </span>
              </div>
            )}

            {/* Last Check */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Last Check:</span>
              <span className="text-sm text-gray-500">
                {formatTimestamp(lastCheck)}
              </span>
            </div>

            {/* Recommendations */}
            {detailedStatus?.recommendations && detailedStatus.recommendations.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <div className="text-sm font-medium text-gray-600 mb-2">Recommendations:</div>
                <ul className="space-y-1">
                  {detailedStatus.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-orange-600 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error Details */}
            {hasError && status.error && (
              <div className="pt-2 border-t border-gray-100">
                <div className="text-sm font-medium text-red-600 mb-1">Error Details:</div>
                <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                  {status.error}
                </div>
              </div>
            )}

            {/* Health Data Summary */}
            {healthData && (
              <div className="pt-2 border-t border-gray-100">
                <div className="text-sm font-medium text-gray-600 mb-2">Health Summary:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-medium">Overall Status</div>
                    <div className={`capitalize ${
                      healthData.overall === 'healthy' ? 'text-green-600' :
                      healthData.overall === 'needs_data' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {healthData.overall}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-medium">Total Records</div>
                    <div className="text-gray-800">
                      {healthData.data?.totalRecords || 0}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for headers/navbars
export const DatabaseStatusBadge = ({ className = '' }) => {
  return <DatabaseStatus detailed={false} className={className} />
}

// Detailed version for admin/settings pages
export const DatabaseStatusPanel = ({ className = '' }) => {
  return <DatabaseStatus detailed={true} className={className} />
}

// Loading state component
export const DatabaseStatusLoading = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-yellow-100 text-yellow-800 border-yellow-200 ${className}`}>
      <span className="mr-2">⏳</span>
      <span>Connecting to database...</span>
    </div>
  )
}

// Error state component
export const DatabaseStatusError = ({ error, onRetry, className = '' }) => {
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-red-100 text-red-800 border-red-200 ${className}`}>
      <span className="mr-2">❌</span>
      <span>Database Error</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-2 text-xs underline hover:no-underline"
          title={error}
        >
          Retry
        </button>
      )}
    </div>
  )
}

export default DatabaseStatus