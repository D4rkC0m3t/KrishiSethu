import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Shield, 
  Eye, 
  Download, 
  Filter, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Database, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Lock,
  Unlock,
  Activity
} from 'lucide-react';

const SecurityAuditLogger = ({ onNavigate }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    eventType: 'all',
    severity: 'all',
    searchTerm: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    securityEvents: 0,
    dataAccess: 0,
    authEvents: 0,
    riskLevel: 'low'
  });

  // Mock audit log data - In production, this would come from actual audit tables
  const generateMockAuditLogs = () => {
    const eventTypes = [
      { type: 'AUTH_LOGIN', description: 'User login attempt', severity: 'low' },
      { type: 'AUTH_LOGOUT', description: 'User logout', severity: 'low' },
      { type: 'AUTH_FAILED', description: 'Failed login attempt', severity: 'medium' },
      { type: 'DATA_ACCESS', description: 'Database table accessed', severity: 'low' },
      { type: 'DATA_MODIFY', description: 'Data modification', severity: 'medium' },
      { type: 'DATA_DELETE', description: 'Data deletion', severity: 'high' },
      { type: 'PERMISSION_CHANGE', description: 'User permissions modified', severity: 'high' },
      { type: 'TENANT_ACCESS', description: 'Cross-tenant data access attempt', severity: 'critical' },
      { type: 'API_ACCESS', description: 'API endpoint accessed', severity: 'low' },
      { type: 'EXPORT_DATA', description: 'Data export operation', severity: 'medium' },
      { type: 'BACKUP_CREATE', description: 'Backup created', severity: 'low' },
      { type: 'BACKUP_RESTORE', description: 'Backup restored', severity: 'high' },
      { type: 'SYSTEM_CONFIG', description: 'System configuration changed', severity: 'medium' },
      { type: 'SECURITY_SCAN', description: 'Security scan performed', severity: 'low' }
    ];

    const users = ['admin@krishisethu.com', 'manager@krishisethu.com', 'user@krishisethu.com'];
    const logs = [];

    for (let i = 0; i < 50; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days

      logs.push({
        id: `audit-${i + 1}`,
        timestamp,
        eventType: eventType.type,
        description: eventType.description,
        severity: eventType.severity,
        user,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        tenantId: 'tenant-123',
        resource: getRandomResource(),
        success: Math.random() > 0.1, // 90% success rate
        details: generateEventDetails(eventType.type)
      });
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  };

  const getRandomResource = () => {
    const resources = ['products', 'customers', 'suppliers', 'sales', 'users', 'settings', 'reports'];
    return resources[Math.floor(Math.random() * resources.length)];
  };

  const generateEventDetails = (eventType) => {
    const details = {
      'AUTH_LOGIN': 'Successful authentication via email/password',
      'AUTH_LOGOUT': 'User session terminated',
      'AUTH_FAILED': 'Invalid credentials provided',
      'DATA_ACCESS': 'Read operation on database table',
      'DATA_MODIFY': 'Update operation performed',
      'DATA_DELETE': 'Record deletion executed',
      'PERMISSION_CHANGE': 'User role permissions updated',
      'TENANT_ACCESS': 'Attempted access to restricted tenant data',
      'API_ACCESS': 'REST API endpoint called',
      'EXPORT_DATA': 'Data exported to external format',
      'BACKUP_CREATE': 'System backup operation initiated',
      'BACKUP_RESTORE': 'Data restore from backup',
      'SYSTEM_CONFIG': 'Application configuration modified',
      'SECURITY_SCAN': 'Multi-tenant security verification'
    };
    return details[eventType] || 'Security event logged';
  };

  // Load audit logs
  useEffect(() => {
    const mockLogs = generateMockAuditLogs();
    setAuditLogs(mockLogs);
    setFilteredLogs(mockLogs);

    // Calculate stats
    const securityEvents = mockLogs.filter(log => 
      ['PERMISSION_CHANGE', 'TENANT_ACCESS', 'SECURITY_SCAN'].includes(log.eventType)
    ).length;
    
    const dataAccess = mockLogs.filter(log => 
      ['DATA_ACCESS', 'DATA_MODIFY', 'DATA_DELETE'].includes(log.eventType)
    ).length;
    
    const authEvents = mockLogs.filter(log => 
      log.eventType.startsWith('AUTH_')
    ).length;

    const criticalEvents = mockLogs.filter(log => log.severity === 'critical').length;
    const riskLevel = criticalEvents > 5 ? 'high' : criticalEvents > 2 ? 'medium' : 'low';

    setStats({
      totalEvents: mockLogs.length,
      securityEvents,
      dataAccess,
      authEvents,
      riskLevel
    });
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...auditLogs];

    // Date range filter
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(log => log.timestamp >= startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => log.timestamp <= endDate);
    }

    // Event type filter
    if (filters.eventType !== 'all') {
      filtered = filtered.filter(log => log.eventType === filters.eventType);
    }

    // Severity filter
    if (filters.severity !== 'all') {
      filtered = filtered.filter(log => log.severity === filters.severity);
    }

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.description.toLowerCase().includes(searchLower) ||
        log.user.toLowerCase().includes(searchLower) ||
        log.eventType.toLowerCase().includes(searchLower) ||
        log.details.toLowerCase().includes(searchLower)
      );
    }

    setFilteredLogs(filtered);
  }, [filters, auditLogs]);

  // Export audit logs
  const exportAuditLogs = (format = 'json') => {
    const timestamp = new Date().toISOString();
    const exportData = {
      timestamp,
      totalLogs: filteredLogs.length,
      filters: filters,
      logs: filteredLogs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString()
      })),
      stats
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `krishisethu-audit-logs-${timestamp.replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const csvRows = [
        ['Timestamp', 'Event Type', 'Description', 'User', 'Severity', 'Success', 'Resource', 'IP Address', 'Details'],
        ...filteredLogs.map(log => [
          log.timestamp.toISOString(),
          log.eventType,
          log.description,
          log.user,
          log.severity,
          log.success ? 'Success' : 'Failed',
          log.resource,
          log.ipAddress,
          log.details
        ])
      ];

      const csvContent = csvRows.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `krishisethu-audit-logs-${timestamp.replace(/[:.]/g, '-')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Get severity icon and color
  const getSeverityDisplay = (severity) => {
    switch (severity) {
      case 'critical':
        return { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-600 bg-red-100', text: 'Critical' };
      case 'high':
        return { icon: <XCircle className="h-4 w-4" />, color: 'text-orange-600 bg-orange-100', text: 'High' };
      case 'medium':
        return { icon: <Info className="h-4 w-4" />, color: 'text-yellow-600 bg-yellow-100', text: 'Medium' };
      case 'low':
        return { icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600 bg-green-100', text: 'Low' };
      default:
        return { icon: <Info className="h-4 w-4" />, color: 'text-gray-600 bg-gray-100', text: 'Unknown' };
    }
  };

  // Get event type icon
  const getEventTypeIcon = (eventType) => {
    if (eventType.startsWith('AUTH_')) return <User className="h-4 w-4" />;
    if (eventType.startsWith('DATA_')) return <Database className="h-4 w-4" />;
    if (eventType.includes('PERMISSION') || eventType.includes('TENANT')) return <Shield className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  // Real-time audit logging function (for production use)
  const logSecurityEvent = async (eventType, description, severity = 'low', details = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const auditEntry = {
        event_type: eventType,
        description,
        severity,
        user_id: user?.id,
        user_email: user?.email,
        tenant_id: user?.id, // In multi-tenant setup
        ip_address: 'Unknown', // Would get from request in real app
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        details: JSON.stringify(details),
        success: true
      };

      // In production, save to audit_logs table
      console.log('🔍 SECURITY AUDIT:', auditEntry);
      
      // Add to local state for demo
      setAuditLogs(prev => [{
        id: `audit-${Date.now()}`,
        timestamp: new Date(),
        eventType,
        description,
        severity,
        user: user?.email || 'Unknown',
        userAgent: navigator.userAgent,
        ipAddress: 'Unknown',
        tenantId: user?.id || 'Unknown',
        resource: 'system',
        success: true,
        details: JSON.stringify(details)
      }, ...prev]);

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  // Expose logging function globally
  useEffect(() => {
    window.logSecurityEvent = logSecurityEvent;
    return () => {
      delete window.logSecurityEvent;
    };
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Security Audit Logger
          </h2>
          <p className="text-gray-600 mt-2">Comprehensive audit logging for all tenant operations and security events</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => exportAuditLogs('json')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </button>
          <button
            onClick={() => exportAuditLogs('csv')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Events</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalEvents}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Security Events</p>
              <p className="text-2xl font-bold text-purple-900">{stats.securityEvents}</p>
            </div>
            <Shield className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Data Access</p>
              <p className="text-2xl font-bold text-green-900">{stats.dataAccess}</p>
            </div>
            <Database className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Risk Level</p>
              <p className={`text-2xl font-bold capitalize ${
                stats.riskLevel === 'high' ? 'text-red-900' :
                stats.riskLevel === 'medium' ? 'text-orange-900' :
                'text-green-900'
              }`}>{stats.riskLevel}</p>
            </div>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              stats.riskLevel === 'high' ? 'bg-red-500' :
              stats.riskLevel === 'medium' ? 'bg-orange-500' :
              'bg-green-500'
            }`}>
              {stats.riskLevel === 'high' ? <AlertTriangle className="h-5 w-5 text-white" /> :
               stats.riskLevel === 'medium' ? <Info className="h-5 w-5 text-white" /> :
               <CheckCircle className="h-5 w-5 text-white" />}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
            <select
              value={filters.eventType}
              onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="AUTH_LOGIN">Authentication</option>
              <option value="DATA_ACCESS">Data Access</option>
              <option value="DATA_MODIFY">Data Modification</option>
              <option value="PERMISSION_CHANGE">Permissions</option>
              <option value="TENANT_ACCESS">Tenant Access</option>
              <option value="SECURITY_SCAN">Security Scans</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Showing {filteredLogs.length} of {auditLogs.length} audit log entries
          </p>
          <button
            onClick={() => setFilters({
              startDate: '',
              endDate: '',
              eventType: 'all',
              severity: 'all',
              searchTerm: ''
            })}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => {
                const severityDisplay = getSeverityDisplay(log.severity);
                
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {log.timestamp.toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {log.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getEventTypeIcon(log.eventType)}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.eventType}</div>
                          <div className="text-xs text-gray-500">{log.description}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.user}</div>
                          <div className="text-xs text-gray-500">{log.ipAddress}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${severityDisplay.color}`}>
                        {severityDisplay.icon}
                        {severityDisplay.text}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        log.success ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      }`}>
                        {log.success ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {log.success ? 'Success' : 'Failed'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </div>
                      <div className="text-xs text-gray-500">Resource: {log.resource}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Audit Logs Found</h3>
            <p className="text-gray-500">No security events match your current filters.</p>
          </div>
        )}
      </div>

      {/* Recent Critical Events */}
      {auditLogs.filter(log => log.severity === 'critical' || log.severity === 'high').length > 0 && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Critical Events
          </h3>
          <div className="space-y-3">
            {auditLogs
              .filter(log => log.severity === 'critical' || log.severity === 'high')
              .slice(0, 5)
              .map(log => (
                <div key={log.id} className="bg-white rounded-lg p-4 border border-red-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        log.severity === 'critical' ? 'bg-red-100' : 'bg-orange-100'
                      }`}>
                        {log.severity === 'critical' ? 
                          <AlertTriangle className="h-4 w-4 text-red-600" /> :
                          <Info className="h-4 w-4 text-orange-600" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{log.eventType}</p>
                        <p className="text-sm text-gray-600">{log.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{log.user}</p>
                      <p className="text-xs text-gray-500">
                        {log.timestamp.toLocaleDateString()} {log.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Test Security Logging */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-600 mb-4">🧪 Test Security Logging</h3>
        <p className="text-sm text-blue-700 mb-4">
          Use these buttons to test the security audit logging system:
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => logSecurityEvent('TEST_EVENT', 'Manual test event triggered', 'low', { testType: 'manual' })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all text-sm"
          >
            Log Test Event
          </button>
          <button
            onClick={() => logSecurityEvent('SECURITY_SCAN', 'Security scan initiated from audit logger', 'medium', { source: 'audit_logger' })}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all text-sm"
          >
            Log Security Scan
          </button>
          <button
            onClick={() => logSecurityEvent('DATA_EXPORT', 'Audit logs exported', 'medium', { format: 'json', count: filteredLogs.length })}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all text-sm"
          >
            Log Export Event
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Security Audit Logging</h4>
            <p className="text-sm text-yellow-700 mt-1">
              This system logs all security-related events, data access, and tenant operations. 
              In production, logs are automatically generated for authentication, data access, 
              permissions changes, and cross-tenant access attempts. Use the export functionality 
              for compliance reporting and security analysis.
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              <strong>Integration:</strong> Call <code className="bg-yellow-100 px-1 rounded">window.logSecurityEvent(type, description, severity, details)</code> 
              from anywhere in your application to log security events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityAuditLogger;
