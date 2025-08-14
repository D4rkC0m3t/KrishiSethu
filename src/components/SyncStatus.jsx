import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Database,
  Upload
} from 'lucide-react';
import offlineStorage from '../lib/offlineStorage';
import { triggerBackgroundSync, checkOfflineData } from '../utils/pwaUtils';

const SyncStatus = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState({ sales: [], inventory: [], totalUnsynced: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncStats, setSyncStats] = useState({ total: 0, unsynced: 0 });

  useEffect(() => {
    // Network status listeners
    const handleOnline = () => {
      setIsOnline(true);
      checkAndUpdateOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial data check
    checkAndUpdateOfflineData();

    // Periodic check for offline data
    const interval = setInterval(checkAndUpdateOfflineData, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const checkAndUpdateOfflineData = async () => {
    try {
      const data = await checkOfflineData();
      setOfflineData(data);

      // Get database stats
      const stats = await offlineStorage.getStats();
      const totalItems = Object.values(stats).reduce((sum, stat) => sum + stat.total, 0);
      const unsyncedItems = Object.values(stats).reduce((sum, stat) => sum + stat.unsynced, 0);
      
      setSyncStats({ total: totalItems, unsynced: unsyncedItems });
    } catch (error) {
      console.error('Error checking offline data:', error);
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      alert('Cannot sync while offline. Please check your internet connection.');
      return;
    }

    setIsSyncing(true);
    try {
      const success = await triggerBackgroundSync('all');
      if (success) {
        setLastSyncTime(new Date());
        
        // Wait a bit then refresh data
        setTimeout(checkAndUpdateOfflineData, 2000);
        
        // Show success notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Sync Completed', {
            body: 'All offline data has been synced successfully.',
            icon: '/logo192.png'
          });
        }
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
      alert('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (offlineData.totalUnsynced > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (offlineData.totalUnsynced > 0) return `${offlineData.totalUnsynced} pending`;
    return 'Synced';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (offlineData.totalUnsynced > 0) return <Clock className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${getStatusColor()} text-white`}>
              {getStatusIcon()}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Sync Status</span>
                <Badge variant={isOnline ? 'default' : 'destructive'}>
                  {getStatusText()}
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600 mt-1">
                {isOnline ? (
                  <>
                    {offlineData.totalUnsynced > 0 ? (
                      <span className="text-yellow-600">
                        {offlineData.sales.length} sales, {offlineData.inventory.length} inventory updates pending
                      </span>
                    ) : (
                      <span className="text-green-600">All data synchronized</span>
                    )}
                  </>
                ) : (
                  <span className="text-red-600">Working offline - data will sync when online</span>
                )}
              </div>
              
              {lastSyncTime && (
                <div className="text-xs text-gray-500 mt-1">
                  Last sync: {lastSyncTime.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Database stats */}
            <div className="text-center">
              <div className="text-xs text-gray-500">Offline DB</div>
              <div className="text-sm font-medium">
                {syncStats.total} items
              </div>
              {syncStats.unsynced > 0 && (
                <div className="text-xs text-yellow-600">
                  {syncStats.unsynced} unsynced
                </div>
              )}
            </div>

            {/* Manual sync button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing || offlineData.totalUnsynced === 0}
              className="flex items-center gap-2"
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </div>

        {/* Detailed breakdown when there's pending data */}
        {offlineData.totalUnsynced > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span>Pending Sales:</span>
                <Badge variant="outline">{offlineData.sales.length}</Badge>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span>Pending Inventory Updates:</span>
                <Badge variant="outline">{offlineData.inventory.length}</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Network status indicator */}
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Connected to internet</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-red-600">No internet connection</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncStatus;
