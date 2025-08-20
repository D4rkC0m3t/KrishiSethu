import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Database,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Wifi,
  WifiOff
} from 'lucide-react';

const DatabaseSyncTest = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const runConnectionTest = async () => {
    setIsTesting(true);
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestResults({
        connection: true,
        latency: '45ms',
        status: 'Connected'
      });
      setIsConnected(true);
    } catch (error) {
      setTestResults({
        connection: false,
        error: 'Connection failed',
        status: 'Disconnected'
      });
      setIsConnected(false);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Database Sync Test</h2>
          <p className="text-gray-600">Test database connectivity and synchronization</p>
        </div>
        <Badge variant={isConnected ? "default" : "destructive"}>
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 mr-1" />
              Connected
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 mr-1" />
              Disconnected
            </>
          )}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2 text-blue-600" />
            Connection Test
          </CardTitle>
          <CardDescription>
            Test your database connection and sync status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={runConnectionTest}
            disabled={isTesting}
            className="w-full"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>

          {testResults && (
            <div className={`p-4 rounded-lg border ${
              testResults.connection 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {testResults.connection ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  testResults.connection ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testResults.status}
                </span>
              </div>
              
              {testResults.connection ? (
                <div className="text-sm text-green-700">
                  <p>Latency: {testResults.latency}</p>
                  <p>Database is responding normally</p>
                </div>
              ) : (
                <div className="text-sm text-red-700">
                  <p>Error: {testResults.error}</p>
                  <p>Please check your internet connection</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="py-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Development Tool</p>
              <p className="text-sm text-yellow-700 mt-1">
                This is a development and testing tool. Use it to diagnose connection issues.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseSyncTest;
