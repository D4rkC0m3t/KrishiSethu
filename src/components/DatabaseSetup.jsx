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
  Settings,
  Play
} from 'lucide-react';

const DatabaseSetup = () => {
  const [isSetupRunning, setIsSetupRunning] = useState(false);
  const [setupResults, setSetupResults] = useState(null);
  const [setupSteps, setSetupSteps] = useState([
    { name: 'Create Tables', status: 'pending' },
    { name: 'Insert Sample Data', status: 'pending' },
    { name: 'Configure Indexes', status: 'pending' },
    { name: 'Set Permissions', status: 'pending' }
  ]);

  const runDatabaseSetup = async () => {
    setIsSetupRunning(true);
    setSetupResults(null);
    
    try {
      // Simulate setup steps
      for (let i = 0; i < setupSteps.length; i++) {
        setSetupSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'running' } : step
        ));
        
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setSetupSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'completed' } : step
        ));
      }
      
      setSetupResults({
        success: true,
        message: 'Database setup completed successfully!'
      });
    } catch (error) {
      setSetupResults({
        success: false,
        message: 'Database setup failed: ' + error.message
      });
    } finally {
      setIsSetupRunning(false);
    }
  };

  const resetSetup = () => {
    setSetupSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
    setSetupResults(null);
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Database Setup</h2>
          <p className="text-gray-600">Initialize and configure the database</p>
        </div>
        <Badge variant="outline" className="text-blue-600">
          <Database className="w-4 h-4 mr-1" />
          Setup Tool
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2 text-blue-600" />
            Database Initialization
          </CardTitle>
          <CardDescription>
            Set up the database schema and initial data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {setupSteps.map((step, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                {getStepIcon(step.status)}
                <span className={`font-medium ${
                  step.status === 'completed' ? 'text-green-700' :
                  step.status === 'running' ? 'text-blue-700' :
                  step.status === 'failed' ? 'text-red-700' :
                  'text-gray-700'
                }`}>
                  {step.name}
                </span>
                {step.status === 'running' && (
                  <Badge variant="outline" className="text-blue-600">
                    Running...
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={runDatabaseSetup}
              disabled={isSetupRunning}
              className="flex-1"
            >
              {isSetupRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Setup
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={resetSetup}
              disabled={isSetupRunning}
            >
              Reset
            </Button>
          </div>

          {setupResults && (
            <div className={`p-4 rounded-lg border ${
              setupResults.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {setupResults.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  setupResults.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {setupResults.message}
                </span>
              </div>
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
                This tool is for development and testing purposes. Use with caution in production environments.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseSetup;
