import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Database, Search, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { analyzeDatabaseCompletely, quickProfilesAnalysis } from '../../utils/databaseAnalysis';

const DatabaseAnalysisPanel = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quickResult, setQuickResult] = useState(null);

  const runFullAnalysis = async () => {
    setLoading(true);
    try {
      console.log('🚀 Starting full database analysis...');
      const result = await analyzeDatabaseCompletely();
      setAnalysis(result);
    } catch (error) {
      console.error('❌ Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runQuickAnalysis = async () => {
    setLoading(true);
    try {
      console.log('🚀 Starting quick profiles analysis...');
      const result = await quickProfilesAnalysis();
      setQuickResult(result);
    } catch (error) {
      console.error('❌ Quick analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    return status === 'success' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Analysis Tools
          </CardTitle>
          <CardDescription>
            Analyze the Supabase database structure, schema, and data to identify issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={runQuickAnalysis} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Quick Profiles Check
            </Button>
            <Button onClick={runFullAnalysis} disabled={loading}>
              <Database className="h-4 w-4 mr-2" />
              Full Database Analysis
            </Button>
            {loading && <RefreshCw className="h-4 w-4 animate-spin mt-2" />}
          </div>
        </CardContent>
      </Card>

      {/* Quick Analysis Results */}
      {quickResult && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Profiles Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Badge className="bg-green-100 text-green-800">
                  Found Table: {quickResult.tableName}
                </Badge>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Available Columns ({quickResult.schema.length}):</h4>
                <div className="flex flex-wrap gap-2">
                  {quickResult.schema.map(col => (
                    <Badge key={col} variant="outline">{col}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Sample Data:</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(quickResult.sample, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(analysis.connection?.status)}
                Database Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Status:</strong> <Badge variant={analysis.connection?.status === 'success' ? 'default' : 'destructive'}>{analysis.connection?.status}</Badge></p>
                <p><strong>URL:</strong> {analysis.connection?.url}</p>
                {analysis.connection?.error && (
                  <p className="text-red-600"><strong>Error:</strong> {analysis.connection.error}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Table Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Table Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analysis.tables).map(([tableName, info]) => (
                  <div key={tableName} className="border rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {info.exists ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}
                      <strong>{tableName}</strong>
                    </div>
                    {info.exists ? (
                      <div className="text-sm space-y-1">
                        <p>Rows: {info.rowCount}</p>
                        <p>Columns: {info.schema?.length || 0}</p>
                        <p>Has Data: {info.hasData ? 'Yes' : 'No'}</p>
                      </div>
                    ) : (
                      <p className="text-red-600 text-sm">{info.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Schema Details for Profiles */}
          {analysis.schemas.profiles && (
            <Card>
              <CardHeader>
                <CardTitle>Profiles Table Schema Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Name Columns:</h4>
                    <div className="space-y-1">
                      {analysis.schemas.profiles.nameColumns.map(col => (
                        <Badge key={col} className="mr-2">{col}</Badge>
                      ))}
                      {analysis.schemas.profiles.nameColumns.length === 0 && <p className="text-red-500">None found</p>}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Role Columns:</h4>
                    <div className="space-y-1">
                      {analysis.schemas.profiles.roleColumns.map(col => (
                        <Badge key={col} className="mr-2">{col}</Badge>
                      ))}
                      {analysis.schemas.profiles.roleColumns.length === 0 && <p className="text-red-500">None found</p>}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Trial Columns:</h4>
                    <div className="space-y-1">
                      {analysis.schemas.profiles.trialColumns.map(col => (
                        <Badge key={col} className="mr-2">{col}</Badge>
                      ))}
                      {analysis.schemas.profiles.trialColumns.length === 0 && <p className="text-red-500">None found</p>}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Active Columns:</h4>
                    <div className="space-y-1">
                      {analysis.schemas.profiles.activeColumns.map(col => (
                        <Badge key={col} className="mr-2">{col}</Badge>
                      ))}
                      {analysis.schemas.profiles.activeColumns.length === 0 && <p className="text-red-500">None found</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sample Data */}
          {analysis.data.profiles && analysis.data.profiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sample Profiles Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                  {JSON.stringify(analysis.data.profiles[0], null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-lg">{rec.includes('❌') ? '❌' : rec.includes('⚠️') ? '⚠️' : '✅'}</span>
                    <span className="text-sm">{rec.replace(/^[❌⚠️✅]\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Errors */}
          {analysis.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.errors.map((error, index) => (
                    <p key={index} className="text-red-600 text-sm">{error}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseAnalysisPanel;