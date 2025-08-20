import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Download,
  Upload,
  Database,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const BackupDataManagement = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);

  const handleCreateBackup = async () => {
    setIsProcessing(true);
    try {
      // Simulate backup creation
      await new Promise(resolve => setTimeout(resolve, 3000));
      setLastBackup(new Date());
      console.log('Backup created successfully');
    } catch (error) {
      console.error('Backup failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreBackup = async (file) => {
    setIsProcessing(true);
    try {
      // Simulate backup restoration
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('Backup restored successfully');
    } catch (error) {
      console.error('Restore failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Backup & Data Management</h2>
          <p className="text-gray-600">Secure your data with automated backups</p>
        </div>
        <Badge variant="outline" className="text-green-600">
          <Shield className="w-4 h-4 mr-1" />
          Data Security
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2 text-blue-600" />
              Create Backup
            </CardTitle>
            <CardDescription>
              Create a complete backup of your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center space-x-3">
                <Database className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-medium">Full Database Backup</p>
                  <p className="text-sm text-gray-600">
                    Includes all products, customers, sales, and settings
                  </p>
                </div>
              </div>
            </div>
            
            {lastBackup && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Last backup: {lastBackup.toLocaleString()}</span>
              </div>
            )}

            <Button
              onClick={handleCreateBackup}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Restore Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2 text-orange-600" />
              Restore Backup
            </CardTitle>
            <CardDescription>
              Restore data from a previous backup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-orange-50">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="font-medium">Restore from Backup</p>
                  <p className="text-sm text-gray-600">
                    This will replace all current data
                  </p>
                </div>
              </div>
            </div>

            <input
              type="file"
              accept=".backup,.json,.sql"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleRestoreBackup(file);
              }}
              className="hidden"
              id="restore-backup"
            />

            <Button
              variant="outline"
              onClick={() => document.getElementById('restore-backup').click()}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Select Backup File
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Backup Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-purple-600" />
            Automatic Backups
          </CardTitle>
          <CardDescription>
            Configure automatic backup schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Daily Backups</p>
                <p className="text-sm text-gray-500">Automatic backup every day at 2:00 AM</p>
              </div>
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Enabled
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Weekly Backups</p>
                <p className="text-sm text-gray-500">Full backup every Sunday at 1:00 AM</p>
              </div>
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Enabled
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Important:</p>
              <p className="text-sm text-red-700 mt-1">
                Always verify your backups and store them in a secure location. 
                Restoring a backup will permanently replace all current data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupDataManagement;
