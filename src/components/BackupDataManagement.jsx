import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Archive,
  Trash2,
  Settings,
  Shield,
  HardDrive,
  Cloud,
  Server,
  FileText,
  FolderOpen,
  History,
  Target,
  Zap,
  Activity,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  Truck,
  DollarSign,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Save,
  Copy,
  ExternalLink,
  AlertCircle,
  Info,
  Plus,
  Edit,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const BackupDataManagement = ({ onNavigate }) => {
  const { currentUser, userProfile, hasPermission, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('backups');
  const [backups, setBackups] = useState([]);
  const [archives, setArchives] = useState([]);
  const [backupSettings, setBackupSettings] = useState({
    autoBackupEnabled: true,
    backupFrequency: 'daily', // daily, weekly, monthly
    backupTime: '02:00',
    retentionPeriod: 30, // days
    compressionEnabled: true,
    encryptionEnabled: true,
    cloudStorageEnabled: true,
    localBackupEnabled: false,
    notifyOnSuccess: true,
    notifyOnFailure: true,
    maxBackupSize: 500, // MB
    includeAttachments: true,
    excludeTemporaryData: true
  });
  const [storageStats, setStorageStats] = useState({
    totalUsed: 0,
    totalAvailable: 0,
    backupSize: 0,
    archiveSize: 0,
    collections: {}
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Data archiving settings
  const [archiveSettings, setArchiveSettings] = useState({
    autoArchiveEnabled: true,
    archiveAfterDays: 365,
    archiveOldSales: true,
    archiveOldPurchases: true,
    archiveOldReports: true,
    archiveInactiveCustomers: false,
    compressionLevel: 'high',
    verifyIntegrity: true
  });

  // Backup types and collections
  const BACKUP_TYPES = {
    full: {
      name: 'Full Backup',
      description: 'Complete database backup including all collections',
      icon: Database,
      collections: ['products', 'customers', 'suppliers', 'sales', 'purchases', 'users', 'settings', 'categories', 'brands', 'stock_movements'],
      estimatedSize: '50-100 MB'
    },
    incremental: {
      name: 'Incremental Backup',
      description: 'Only changes since last backup',
      icon: RefreshCw,
      collections: ['sales', 'purchases', 'stock_movements'],
      estimatedSize: '5-20 MB'
    },
    selective: {
      name: 'Selective Backup',
      description: 'Choose specific collections to backup',
      icon: Target,
      collections: [],
      estimatedSize: 'Variable'
    },
    settings: {
      name: 'Settings Backup',
      description: 'System settings and configuration only',
      icon: Settings,
      collections: ['settings', 'users'],
      estimatedSize: '1-5 MB'
    }
  };

  useEffect(() => {
    loadBackups();
    loadArchives();
    loadStorageStats();
    loadBackupSettings();
  }, []);

  const loadBackups = async () => {
    try {
      // Mock backup data - in real app, load from Firebase Storage or backend
      const mockBackups = [
        {
          id: '1',
          name: 'full_backup_2025_01_07_02_00',
          type: 'full',
          size: '87.5 MB',
          status: 'completed',
          createdAt: new Date('2025-01-07T02:00:00'),
          createdBy: 'System (Auto)',
          collections: ['products', 'customers', 'suppliers', 'sales', 'purchases', 'users', 'settings'],
          recordCount: 1247,
          compressed: true,
          encrypted: true,
          location: 'cloud',
          downloadUrl: null,
          integrity: 'verified'
        },
        {
          id: '2',
          name: 'incremental_backup_2025_01_06_14_30',
          type: 'incremental',
          size: '12.3 MB',
          status: 'completed',
          createdAt: new Date('2025-01-06T14:30:00'),
          createdBy: 'Rajesh Kumar',
          collections: ['sales', 'purchases', 'stock_movements'],
          recordCount: 156,
          compressed: true,
          encrypted: true,
          location: 'cloud',
          downloadUrl: null,
          integrity: 'verified'
        },
        {
          id: '3',
          name: 'settings_backup_2025_01_05_16_45',
          type: 'settings',
          size: '2.1 MB',
          status: 'completed',
          createdAt: new Date('2025-01-05T16:45:00'),
          createdBy: 'System Administrator',
          collections: ['settings', 'users'],
          recordCount: 45,
          compressed: true,
          encrypted: true,
          location: 'cloud',
          downloadUrl: null,
          integrity: 'verified'
        },
        {
          id: '4',
          name: 'full_backup_2025_01_04_02_00',
          type: 'full',
          size: '85.2 MB',
          status: 'failed',
          createdAt: new Date('2025-01-04T02:00:00'),
          createdBy: 'System (Auto)',
          collections: [],
          recordCount: 0,
          compressed: false,
          encrypted: false,
          location: 'cloud',
          downloadUrl: null,
          integrity: 'failed',
          error: 'Storage quota exceeded'
        }
      ];

      setBackups(mockBackups);
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  };

  const loadArchives = async () => {
    try {
      // Mock archive data
      const mockArchives = [
        {
          id: '1',
          name: 'sales_archive_2024_q4',
          type: 'sales',
          period: 'Q4 2024',
          size: '156.7 MB',
          status: 'completed',
          createdAt: new Date('2025-01-01T00:00:00'),
          recordCount: 2847,
          compressed: true,
          location: 'cloud',
          accessCount: 3,
          lastAccessed: new Date('2025-01-03T10:30:00')
        },
        {
          id: '2',
          name: 'purchases_archive_2024_q3',
          type: 'purchases',
          period: 'Q3 2024',
          size: '89.4 MB',
          status: 'completed',
          createdAt: new Date('2024-10-01T00:00:00'),
          recordCount: 1523,
          compressed: true,
          location: 'cloud',
          accessCount: 1,
          lastAccessed: new Date('2024-12-15T14:20:00')
        }
      ];

      setArchives(mockArchives);
    } catch (error) {
      console.error('Error loading archives:', error);
    }
  };

  const loadStorageStats = async () => {
    try {
      // Mock storage statistics
      const mockStats = {
        totalUsed: 342.8, // MB
        totalAvailable: 1024, // MB (1 GB)
        backupSize: 187.1,
        archiveSize: 246.1,
        collections: {
          products: { size: 15.2, records: 156 },
          customers: { size: 8.7, records: 89 },
          suppliers: { size: 3.4, records: 23 },
          sales: { size: 45.6, records: 1247 },
          purchases: { size: 32.1, records: 567 },
          users: { size: 2.3, records: 12 },
          settings: { size: 1.8, records: 8 },
          categories: { size: 0.9, records: 15 },
          brands: { size: 1.2, records: 18 },
          stock_movements: { size: 67.4, records: 3456 }
        }
      };

      setStorageStats(mockStats);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    }
  };

  const loadBackupSettings = () => {
    // Load from localStorage or Firebase
    const savedSettings = localStorage.getItem('backupSettings');
    if (savedSettings) {
      setBackupSettings(JSON.parse(savedSettings));
    }
  };

  const handleCreateBackup = async (type) => {
    if (!isAdmin()) {
      alert('Only administrators can create backups');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate backup creation
      await new Promise(resolve => setTimeout(resolve, 3000));

      const newBackup = {
        id: Date.now().toString(),
        name: `${type}_backup_${new Date().toISOString().replace(/[:.]/g, '_').split('T')[0]}_${new Date().toTimeString().split(' ')[0].replace(/:/g, '_')}`,
        type,
        size: type === 'full' ? '89.2 MB' : type === 'incremental' ? '15.7 MB' : '3.4 MB',
        status: 'completed',
        createdAt: new Date(),
        createdBy: userProfile?.name || 'User',
        collections: BACKUP_TYPES[type].collections,
        recordCount: Math.floor(Math.random() * 1000) + 100,
        compressed: backupSettings.compressionEnabled,
        encrypted: backupSettings.encryptionEnabled,
        location: backupSettings.cloudStorageEnabled ? 'cloud' : 'local',
        downloadUrl: null,
        integrity: 'verified'
      };

      setBackups(prev => [newBackup, ...prev]);
      alert(`${BACKUP_TYPES[type].name} created successfully!`);
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Error creating backup');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreBackup = async (backup) => {
    if (!isAdmin()) {
      alert('Only administrators can restore backups');
      return;
    }

    setSelectedBackup(backup);
    setShowRestoreDialog(true);
  };

  const confirmRestoreBackup = async () => {
    if (!selectedBackup) return;

    setIsProcessing(true);
    try {
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 5000));

      alert('Backup restored successfully!');
      setShowRestoreDialog(false);
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Error restoring backup');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    if (!isAdmin()) {
      alert('Only administrators can delete backups');
      return;
    }

    const backup = backups.find(b => b.id === backupId);
    setSelectedBackup(backup);
    setShowDeleteDialog(true);
  };

  const confirmDeleteBackup = async () => {
    if (!selectedBackup) return;

    try {
      setBackups(prev => prev.filter(backup => backup.id !== selectedBackup.id));
      alert('Backup deleted successfully!');
      setShowDeleteDialog(false);
      setSelectedBackup(null);
    } catch (error) {
      console.error('Error deleting backup:', error);
      alert('Error deleting backup');
    }
  };

  const handleDownloadBackup = async (backup) => {
    try {
      // Simulate download
      const blob = new Blob(['Mock backup data'], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${backup.name}.backup`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading backup:', error);
      alert('Error downloading backup');
    }
  };

  const handleArchiveData = async (type, period) => {
    if (!hasPermission('manager')) {
      alert('You do not have permission to archive data');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate archiving process
      await new Promise(resolve => setTimeout(resolve, 4000));

      const newArchive = {
        id: Date.now().toString(),
        name: `${type}_archive_${period.replace(/\s+/g, '_').toLowerCase()}`,
        type,
        period,
        size: `${Math.floor(Math.random() * 200) + 50}.${Math.floor(Math.random() * 9)} MB`,
        status: 'completed',
        createdAt: new Date(),
        recordCount: Math.floor(Math.random() * 2000) + 500,
        compressed: true,
        location: 'cloud',
        accessCount: 0,
        lastAccessed: null
      };

      setArchives(prev => [newArchive, ...prev]);
      alert(`${type} data archived successfully for ${period}!`);
      setShowArchiveDialog(false);
    } catch (error) {
      console.error('Error archiving data:', error);
      alert('Error archiving data');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveBackupSettings = () => {
    localStorage.setItem('backupSettings', JSON.stringify(backupSettings));
    setShowSettingsDialog(false);
    alert('Backup settings saved successfully!');
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBackupSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type) => {
    const config = BACKUP_TYPES[type];
    if (!config) return <Badge variant="outline">{type}</Badge>;
    
    const IconComponent = config.icon;
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.name}
      </Badge>
    );
  };

  const filteredBackups = backups.filter(backup => {
    const matchesSearch = backup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         backup.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || backup.type === filterType;
    const matchesStatus = filterStatus === 'all' || backup.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Check permissions
  if (!hasPermission('staff')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have permission to access backup and data management
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => onNavigate('dashboard')}>
              ← Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Database className="h-8 w-8 text-primary" />
              Backup & Data Management
            </h1>
            <p className="text-muted-foreground">
              Manage database backups, data archiving, and storage optimization
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Backup Settings</DialogTitle>
                  <DialogDescription>
                    Configure automatic backup and data management settings
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Auto Backup</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="autoBackupEnabled"
                          checked={backupSettings.autoBackupEnabled}
                          onChange={handleSettingsChange}
                        />
                        <span className="text-sm">Enable automatic backups</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Backup Frequency</label>
                      <Select
                        name="backupFrequency"
                        value={backupSettings.backupFrequency}
                        onValueChange={(value) => handleSettingsChange({ target: { name: 'backupFrequency', value } })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Backup Time</label>
                      <Input
                        type="time"
                        name="backupTime"
                        value={backupSettings.backupTime}
                        onChange={handleSettingsChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Retention Period (days)</label>
                      <Input
                        type="number"
                        name="retentionPeriod"
                        value={backupSettings.retentionPeriod}
                        onChange={handleSettingsChange}
                        min="1"
                        max="365"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Backup Size (MB)</label>
                      <Input
                        type="number"
                        name="maxBackupSize"
                        value={backupSettings.maxBackupSize}
                        onChange={handleSettingsChange}
                        min="10"
                        max="5000"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Storage Options</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="compressionEnabled"
                          checked={backupSettings.compressionEnabled}
                          onChange={handleSettingsChange}
                        />
                        <span className="text-sm">Enable compression</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="encryptionEnabled"
                          checked={backupSettings.encryptionEnabled}
                          onChange={handleSettingsChange}
                        />
                        <span className="text-sm">Enable encryption</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="cloudStorageEnabled"
                          checked={backupSettings.cloudStorageEnabled}
                          onChange={handleSettingsChange}
                        />
                        <span className="text-sm">Cloud storage</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="localBackupEnabled"
                          checked={backupSettings.localBackupEnabled}
                          onChange={handleSettingsChange}
                        />
                        <span className="text-sm">Local backup</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Notifications</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="notifyOnSuccess"
                          checked={backupSettings.notifyOnSuccess}
                          onChange={handleSettingsChange}
                        />
                        <span className="text-sm">Notify on success</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="notifyOnFailure"
                          checked={backupSettings.notifyOnFailure}
                          onChange={handleSettingsChange}
                        />
                        <span className="text-sm">Notify on failure</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Data Options</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="includeAttachments"
                          checked={backupSettings.includeAttachments}
                          onChange={handleSettingsChange}
                        />
                        <span className="text-sm">Include attachments</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="excludeTemporaryData"
                          checked={backupSettings.excludeTemporaryData}
                          onChange={handleSettingsChange}
                        />
                        <span className="text-sm">Exclude temporary data</span>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveBackupSettings}>
                    Save Settings
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')}>
              ← Dashboard
            </Button>
          </div>
        </div>

        {/* Storage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Storage Used</p>
                  <p className="text-2xl font-bold text-primary">
                    {storageStats.totalUsed.toFixed(1)} MB
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of {storageStats.totalAvailable} MB available
                  </p>
                </div>
                <HardDrive className="h-8 w-8 text-primary" />
              </div>
              <div className="mt-3">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${(storageStats.totalUsed / storageStats.totalAvailable) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Backup Storage</p>
                  <p className="text-2xl font-bold text-green-600">
                    {storageStats.backupSize.toFixed(1)} MB
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {backups.filter(b => b.status === 'completed').length} backups
                  </p>
                </div>
                <Cloud className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Archive Storage</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {storageStats.archiveSize.toFixed(1)} MB
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {archives.length} archives
                  </p>
                </div>
                <Archive className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Backup</p>
                  <p className="text-lg font-bold text-foreground">
                    {backups.length > 0
                      ? backups[0].createdAt.toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {backups.length > 0 && backups[0].status === 'completed' ? 'Successful' : 'Failed'}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common backup and data management operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(BACKUP_TYPES).map(([key, config]) => {
                const IconComponent = config.icon;
                return (
                  <div key={key} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <IconComponent className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="font-medium">{config.name}</h3>
                        <p className="text-sm text-muted-foreground">{config.estimatedSize}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{config.description}</p>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleCreateBackup(key)}
                      disabled={isProcessing || !isAdmin()}
                    >
                      {isProcessing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Create Backup
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Backup List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Backups ({filteredBackups.length})</CardTitle>
            <CardDescription>
              Manage and restore database backups
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredBackups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium">No backups found</p>
                <p className="text-sm">Create your first backup to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBackups.slice(0, 5).map((backup) => (
                  <div key={backup.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-foreground">{backup.name}</h4>
                          {getTypeBadge(backup.type)}
                          {getStatusBadge(backup.status)}
                          {backup.encrypted && (
                            <Badge variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Encrypted
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-2">
                          <div>Size: {backup.size}</div>
                          <div>Records: {backup.recordCount.toLocaleString()}</div>
                          <div>Created: {backup.createdAt.toLocaleDateString()}</div>
                          <div>By: {backup.createdBy}</div>
                        </div>

                        {backup.error && (
                          <div className="text-sm text-destructive mt-2">
                            Error: {backup.error}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {backup.status === 'completed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadBackup(backup)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {isAdmin() && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedBackup(backup);
                                  setShowRestoreDialog(true);
                                }}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                        {isAdmin() && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteBackup(backup.id)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>



        {/* Restore Dialog */}
        <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Restore Backup</DialogTitle>
              <DialogDescription>
                Are you sure you want to restore this backup? This will overwrite current data.
              </DialogDescription>
            </DialogHeader>
            {selectedBackup && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-200">⚠️ Warning</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    This action will replace all current data with the backup data. Make sure to create a current backup before proceeding.
                  </p>
                </div>
                <div className="space-y-2">
                  <div><strong>Backup:</strong> {selectedBackup.name}</div>
                  <div><strong>Created:</strong> {selectedBackup.createdAt.toLocaleString()}</div>
                  <div><strong>Size:</strong> {selectedBackup.size}</div>
                  <div><strong>Records:</strong> {selectedBackup.recordCount.toLocaleString()}</div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmRestoreBackup}
                disabled={isProcessing}
                variant="destructive"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Restore Backup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this backup? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteBackup}>
                Delete Backup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BackupDataManagement;
