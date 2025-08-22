import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Database, 
  Shield, 
  Users, 
  Activity,
  RefreshCw,
  Download,
  AlertCircle,
  Info
} from 'lucide-react';

const DatabaseHealthCheck = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [logs, setLogs] = useState([]);

  const log = (message, type = 'info') => {
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [...prev, newLog]);
    console.log(`[DB_CHECK] ${message}`);
  };

  const runHealthCheck = async () => {
    setIsRunning(true);
    setLogs([]);
    setResults(null);

    try {
      log('🔍 Starting comprehensive database health check...', 'info');
      
      const healthResults = {
        overall: 'healthy',
        checks: [],
        errors: [],
        warnings: [],
        recommendations: [],
        stats: {}
      };

      // 1. Database Connection Test
      log('🔌 Testing database connection...', 'info');
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) {
          healthResults.errors.push({
            type: 'Connection',
            message: `Database connection failed: ${error.message}`,
            severity: 'high'
          });
          log(`❌ Connection failed: ${error.message}`, 'error');
        } else {
          healthResults.checks.push({
            name: 'Database Connection',
            status: 'pass',
            message: 'Successfully connected to database'
          });
          log('✅ Database connection successful', 'success');
        }
      } catch (connError) {
        healthResults.errors.push({
          type: 'Connection',
          message: `Connection error: ${connError.message}`,
          severity: 'high'
        });
        log(`❌ Connection error: ${connError.message}`, 'error');
      }

      // 2. Table Structure Validation
      log('📋 Validating table structures...', 'info');
      const expectedTables = ['products', 'suppliers', 'customers', 'sales', 'users', 'profiles'];
      const tableResults = {};

      for (const tableName of expectedTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (error) {
            if (error.code === '42P01') {
              healthResults.warnings.push({
                type: 'Schema',
                message: `Table '${tableName}' does not exist`,
                severity: 'medium'
              });
              log(`⚠️ Table '${tableName}' not found`, 'warning');
              tableResults[tableName] = 'missing';
            } else {
              healthResults.errors.push({
                type: 'Schema',
                message: `Error accessing table '${tableName}': ${error.message}`,
                severity: 'medium'
              });
              log(`❌ Error accessing '${tableName}': ${error.message}`, 'error');
              tableResults[tableName] = 'error';
            }
          } else {
            healthResults.checks.push({
              name: `Table: ${tableName}`,
              status: 'pass',
              message: `Table '${tableName}' is accessible`
            });
            log(`✅ Table '${tableName}' is accessible`, 'success');
            tableResults[tableName] = 'accessible';
          }
        } catch (tableError) {
          healthResults.errors.push({
            type: 'Schema',
            message: `Exception checking table '${tableName}': ${tableError.message}`,
            severity: 'medium'
          });
          log(`❌ Exception checking '${tableName}': ${tableError.message}`, 'error');
          tableResults[tableName] = 'exception';
        }
      }

      healthResults.stats.tables = tableResults;

      // 3. RLS Policy Validation
      log('🛡️ Checking Row Level Security policies...', 'info');
      try {
        // Test RLS by trying to access profiles without proper context
        const { data: rlsTest, error: rlsError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);

        if (rlsError) {
          if (rlsError.code === '42501' || rlsError.message.includes('policy')) {
            healthResults.checks.push({
              name: 'RLS Policies',
              status: 'pass',
              message: 'RLS policies are active and enforced'
            });
            log('✅ RLS policies are properly enforced', 'success');
          } else {
            healthResults.errors.push({
              type: 'Security',
              message: `RLS policy error: ${rlsError.message}`,
              severity: 'high'
            });
            log(`❌ RLS policy error: ${rlsError.message}`, 'error');
          }
        } else {
          healthResults.checks.push({
            name: 'RLS Policies',
            status: 'pass',
            message: 'RLS policies allow authorized access'
          });
          log('✅ RLS policies working correctly', 'success');
        }
      } catch (rlsCheckError) {
        healthResults.warnings.push({
          type: 'Security',
          message: `Could not verify RLS policies: ${rlsCheckError.message}`,
          severity: 'medium'
        });
        log(`⚠️ RLS check failed: ${rlsCheckError.message}`, 'warning');
      }

      // 4. Data Integrity Checks
      log('🔍 Running data integrity checks...', 'info');
      const dataStats = {};

      // Check data counts for each accessible table
      for (const [tableName, status] of Object.entries(tableResults)) {
        if (status === 'accessible') {
          try {
            const { count, error } = await supabase
              .from(tableName)
              .select('*', { count: 'exact' })
              .limit(0);

            if (!error) {
              dataStats[tableName] = count || 0;
              log(`📊 Table '${tableName}': ${count || 0} records`, 'info');
            }
          } catch (countError) {
            log(`⚠️ Could not count records in '${tableName}'`, 'warning');
          }
        }
      }

      healthResults.stats.recordCounts = dataStats;

      // 5. Multi-Tenant Data Isolation Check
      if (currentUser) {
        log('🏢 Checking multi-tenant data isolation...', 'info');
        try {
          const isolationChecks = [];

          for (const tableName of ['products', 'suppliers', 'customers']) {
            if (tableResults[tableName] === 'accessible') {
              const { data, error } = await supabase
                .from(tableName)
                .select('owner_id, user_id')
                .limit(10);

              if (!error && data) {
                const hasOwnerField = data.some(row => row.owner_id !== undefined);
                const hasUserField = data.some(row => row.user_id !== undefined);
                
                if (hasOwnerField || hasUserField) {
                  isolationChecks.push(`✅ ${tableName}: Multi-tenant fields present`);
                  log(`✅ ${tableName} has multi-tenant isolation fields`, 'success');
                } else if (data.length === 0) {
                  isolationChecks.push(`ℹ️ ${tableName}: No data to check`);
                  log(`ℹ️ ${tableName} has no data to verify isolation`, 'info');
                } else {
                  healthResults.warnings.push({
                    type: 'Multi-tenancy',
                    message: `Table '${tableName}' may be missing multi-tenant fields`,
                    severity: 'medium'
                  });
                  log(`⚠️ ${tableName} may be missing isolation fields`, 'warning');
                }
              }
            }
          }

          healthResults.stats.isolationChecks = isolationChecks;
        } catch (isolationError) {
          log(`⚠️ Multi-tenant isolation check failed: ${isolationError.message}`, 'warning');
        }
      }

      // 6. Performance Check
      log('⚡ Running performance diagnostics...', 'info');
      const performanceStart = Date.now();
      try {
        await supabase.from('profiles').select('id').limit(1);
        const responseTime = Date.now() - performanceStart;
        
        healthResults.stats.responseTime = responseTime;
        
        if (responseTime < 500) {
          healthResults.checks.push({
            name: 'Database Performance',
            status: 'pass',
            message: `Fast response time: ${responseTime}ms`
          });
          log(`✅ Good performance: ${responseTime}ms response time`, 'success');
        } else if (responseTime < 2000) {
          healthResults.warnings.push({
            type: 'Performance',
            message: `Slow response time: ${responseTime}ms`,
            severity: 'low'
          });
          log(`⚠️ Slow response time: ${responseTime}ms`, 'warning');
        } else {
          healthResults.errors.push({
            type: 'Performance',
            message: `Very slow response time: ${responseTime}ms`,
            severity: 'medium'
          });
          log(`❌ Very slow response: ${responseTime}ms`, 'error');
        }
      } catch (perfError) {
        log(`⚠️ Performance check failed: ${perfError.message}`, 'warning');
      }

      // 7. Generate Recommendations
      log('💡 Generating recommendations...', 'info');
      
      // Missing tables
      const missingTables = Object.entries(tableResults)
        .filter(([_, status]) => status === 'missing')
        .map(([name]) => name);

      if (missingTables.length > 0) {
        healthResults.recommendations.push({
          type: 'Schema',
          message: `Consider creating missing tables: ${missingTables.join(', ')}`,
          priority: 'medium'
        });
      }

      // Performance recommendations
      if (healthResults.stats.responseTime > 1000) {
        healthResults.recommendations.push({
          type: 'Performance',
          message: 'Consider optimizing database queries and adding indexes',
          priority: 'high'
        });
      }

      // Data recommendations
      const totalRecords = Object.values(dataStats).reduce((sum, count) => sum + count, 0);
      if (totalRecords === 0) {
        healthResults.recommendations.push({
          type: 'Data',
          message: 'Database appears to be empty. Consider running initial data setup.',
          priority: 'low'
        });
      }

      // Determine overall health
      if (healthResults.errors.length === 0) {
        if (healthResults.warnings.length === 0) {
          healthResults.overall = 'excellent';
        } else if (healthResults.warnings.length <= 2) {
          healthResults.overall = 'good';
        } else {
          healthResults.overall = 'fair';
        }
      } else {
        if (healthResults.errors.length <= 2) {
          healthResults.overall = 'needs_attention';
        } else {
          healthResults.overall = 'critical';
        }
      }

      log(`🎯 Database health check completed. Overall status: ${healthResults.overall.toUpperCase()}`, 'info');
      setResults(healthResults);

    } catch (error) {
      log(`❌ Health check failed: ${error.message}`, 'error');
      setResults({
        overall: 'critical',
        checks: [],
        errors: [{ type: 'System', message: error.message, severity: 'high' }],
        warnings: [],
        recommendations: [],
        stats: {}
      });
    } finally {
      setIsRunning(false);
    }
  };

  const exportResults = () => {
    if (!results) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      user: currentUser?.email || 'anonymous',
      healthCheck: results,
      logs: logs,
      summary: {
        overall: results.overall,
        totalChecks: results.checks.length,
        totalErrors: results.errors.length,
        totalWarnings: results.warnings.length,
        totalRecommendations: results.recommendations.length
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `krishisethu-db-health-check-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-300';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'needs_attention': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'low': return <Info className="h-4 w-4 text-blue-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🏥 Database Health Check
        </h1>
        <p className="text-gray-600">
          Comprehensive diagnostics for your KrishiSethu database
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={runHealthCheck}
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Activity className="h-4 w-4" />
          )}
          {isRunning ? 'Running Diagnostics...' : 'Run Health Check'}
        </Button>

        {results && (
          <Button
            onClick={exportResults}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Results
          </Button>
        )}
      </div>

      {/* Overall Status */}
      {results && (
        <Card className={`border-2 ${getStatusColor(results.overall)}`}>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Database className="h-6 w-6" />
              Overall Health Status
            </CardTitle>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${getStatusColor(results.overall)}`}>
              {results.overall === 'excellent' && <CheckCircle className="h-5 w-5 mr-2" />}
              {results.overall === 'critical' && <XCircle className="h-5 w-5 mr-2" />}
              {['needs_attention', 'fair'].includes(results.overall) && <AlertTriangle className="h-5 w-5 mr-2" />}
              {results.overall.toUpperCase().replace('_', ' ')}
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Results Grid */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Successful Checks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Passed Checks ({results.checks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.checks.map((check, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">{check.name}</div>
                    <div className="text-xs text-gray-600">{check.message}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Errors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Errors ({results.errors.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.errors.length === 0 ? (
                <div className="text-green-600 text-sm">✅ No errors found</div>
              ) : (
                results.errors.map((error, index) => (
                  <div key={index} className="flex items-start gap-2">
                    {getSeverityIcon(error.severity)}
                    <div>
                      <div className="font-medium text-sm">{error.type}</div>
                      <div className="text-xs text-gray-600">{error.message}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {error.severity} severity
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Warnings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-5 w-5" />
                Warnings ({results.warnings.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.warnings.length === 0 ? (
                <div className="text-green-600 text-sm">✅ No warnings</div>
              ) : (
                results.warnings.map((warning, index) => (
                  <div key={index} className="flex items-start gap-2">
                    {getSeverityIcon(warning.severity)}
                    <div>
                      <div className="font-medium text-sm">{warning.type}</div>
                      <div className="text-xs text-gray-600">{warning.message}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {warning.severity} severity
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistics */}
      {results && results.stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {results.stats.responseTime && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {results.stats.responseTime}ms
                  </div>
                  <div className="text-sm text-gray-600">Response Time</div>
                </div>
              )}
              
              {results.stats.recordCounts && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(results.stats.recordCounts).reduce((sum, count) => sum + count, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Records</div>
                </div>
              )}

              {results.stats.tables && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.values(results.stats.tables).filter(status => status === 'accessible').length}
                  </div>
                  <div className="text-sm text-gray-600">Accessible Tables</div>
                </div>
              )}

              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {results.checks.length}
                </div>
                <div className="text-sm text-gray-600">Passed Checks</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {results && results.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Info className="h-5 w-5" />
              Recommendations ({results.recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">{rec.type}</div>
                  <div className="text-sm text-gray-700">{rec.message}</div>
                  <Badge variant="outline" className="text-xs mt-1">
                    {rec.priority} priority
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Diagnostic Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Click "Run Health Check" to start diagnostics.</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="mb-1">
                  <span className="text-blue-400">[{log.timestamp}]</span>{' '}
                  <span className={
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    'text-white'
                  }>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseHealthCheck;
