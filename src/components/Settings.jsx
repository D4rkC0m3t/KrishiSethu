import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Settings as SettingsIcon,
  Building,
  Receipt,
  Package,
  Users,
  Bell,
  Database,
  Shield,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Image,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { shopDetailsService } from '../lib/shopDetails';
import { storageService } from '../lib/storage';

const Settings = ({ onNavigate }) => {
  const { currentUser, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('company');
  const [isSaving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState(null);
  
  // Company Information - Start with empty defaults for new users
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    phone: '',
    email: '',
    website: '',
    gstNumber: '',
    panNumber: '',
    logo: '',
    // Fertilizer Business Licenses
    fertilizerLicense: '',
    seedLicense: '',
    pesticideLicense: '',
    // Bank Details
    bankName: '',
    accountNumber: '',
    ifscCode: ''
  });

  // Tax Settings
  const [taxSettings, setTaxSettings] = useState({
    defaultTaxRate: 5,
    gstEnabled: true,
    taxInclusive: false,
    hsnCode: '31051000',
    igstRate: 18,
    cgstRate: 9,
    sgstRate: 9
  });

  // Inventory Settings
  const [inventorySettings, setInventorySettings] = useState({
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    autoReorderEnabled: false,
    barcodeEnabled: true,
    trackBatches: true,
    trackExpiry: true,
    expiryWarningDays: 30,
    allowNegativeStock: false
  });

  // Sales Settings
  const [salesSettings, setSalesSettings] = useState({
    invoicePrefix: 'INV',
    receiptPrefix: 'RCP',
    autoInvoiceNumber: true,
    printAfterSale: true,
    emailReceipts: false,
    smsReceipts: false,
    defaultPaymentMethod: 'cash',
    allowPartialPayments: true,
    requireCustomerInfo: false
  });

  // Purchase Settings
  const [purchaseSettings, setPurchaseSettings] = useState({
    purchasePrefix: 'PUR',
    autoApproval: false,
    requireGRN: true,
    defaultSupplier: '',
    autoCreatePO: false,
    approvalLimit: 50000
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlerts: true,
    expiryAlerts: true,
    salesAlerts: false,
    purchaseAlerts: true,
    dailyReports: false,
    weeklyReports: true,
    monthlyReports: true
  });

  // User Preferences
  const [userPreferences, setUserPreferences] = useState({
    theme: 'light',
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    currency: 'INR',
    dashboardLayout: 'default',
    autoLogout: 30,
    showTutorials: true
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    passwordPolicy: 'medium',
    sessionTimeout: 30,
    twoFactorAuth: false,
    loginAttempts: 5,
    auditLogs: true,
    dataEncryption: true
  });

  // Load all settings on component mount
  useEffect(() => {
    loadAllSettings();
  }, []);

  // Load all settings from database
  const loadAllSettings = async () => {
    try {
      // Load company info from shop details service
      const details = await shopDetailsService.getShopDetails();
      console.log('Loaded shop details:', details);
      setCompanyInfo(details);
      setLogoPreview(null);

      // Load other settings from database
      const { settingsOperations } = await import('../lib/supabaseDb');
      const systemSettings = await settingsOperations.getSystemSettings();
      console.log('Loaded system settings:', systemSettings);

      // Apply loaded settings to state
      if (systemSettings.taxSettings) {
        setTaxSettings(prev => ({ ...prev, ...systemSettings.taxSettings }));
      }
      if (systemSettings.inventorySettings) {
        setInventorySettings(prev => ({ ...prev, ...systemSettings.inventorySettings }));
      }
      if (systemSettings.salesSettings) {
        setSalesSettings(prev => ({ ...prev, ...systemSettings.salesSettings }));
      }
      if (systemSettings.purchaseSettings) {
        setPurchaseSettings(prev => ({ ...prev, ...systemSettings.purchaseSettings }));
      }
      if (systemSettings.notificationSettings) {
        setNotificationSettings(prev => ({ ...prev, ...systemSettings.notificationSettings }));
      }
      if (systemSettings.userSettings) {
        setUserPreferences(prev => ({ ...prev, ...systemSettings.userSettings }));
      }
      if (systemSettings.securitySettings) {
        setSecuritySettings(prev => ({ ...prev, ...systemSettings.securitySettings }));
      }

      console.log('All settings loaded successfully');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async (section) => {
    setSaving(true);
    try {
      if (section === 'company') {
        // Save company info using shop details service
        console.log('🔄 Saving company info:', companyInfo);
        console.log('🔄 Company name being saved:', companyInfo.name);

        // Test database connection first
        const { settingsOperations } = await import('../lib/supabaseDb');
        console.log('✅ Database connection imported successfully');

        // Test if we can access the settings table
        try {
          const testSettings = await settingsOperations.getAllSettings();
          console.log('✅ Settings table accessible, found', testSettings.length, 'settings');
        } catch (dbError) {
          console.error('❌ Settings table access failed:', dbError);
          throw new Error(`Database connection failed: ${dbError.message}`);
        }

        // Try to save using shop details service
        const result = await shopDetailsService.updateShopDetails(companyInfo);
        console.log('✅ Company information saved to shop details service:', result);

        // Verify the save by reading it back
        const savedDetails = await shopDetailsService.getShopDetails();
        console.log('🔍 Verification - saved details:', savedDetails);
        console.log('🔍 Verification - company name:', savedDetails?.name);
      } else {
        // Save other settings to database using settings service
        console.log(`🔄 Saving ${section} settings...`);

        // Test database connection first
        const { settingsOperations } = await import('../lib/supabaseDb');
        console.log('✅ Database connection imported successfully for', section);

        // Test if we can access the settings table
        try {
          const testSettings = await settingsOperations.getAllSettings();
          console.log(`✅ Settings table accessible for ${section}, found`, testSettings.length, 'settings');
        } catch (dbError) {
          console.error(`❌ Settings table access failed for ${section}:`, dbError);
          throw new Error(`Database connection failed for ${section}: ${dbError.message}`);
        }

        let settingsData;
        switch (section) {
          case 'tax':
            settingsData = taxSettings;
            console.log('🔄 Tax settings data:', settingsData);
            break;
          case 'inventory':
            settingsData = inventorySettings;
            console.log('🔄 Inventory settings data:', settingsData);
            break;
          case 'sales':
            settingsData = salesSettings;
            console.log('🔄 Sales settings data:', settingsData);
            break;
          case 'purchase':
            settingsData = purchaseSettings;
            console.log('🔄 Purchase settings data:', settingsData);
            break;
          case 'notifications':
            settingsData = notificationSettings;
            console.log('🔄 Notification settings data:', settingsData);
            break;
          case 'user':
            settingsData = userPreferences;
            console.log('🔄 User preferences data:', settingsData);
            break;
          case 'security':
            settingsData = securitySettings;
            console.log('🔄 Security settings data:', settingsData);
            break;
          case 'all':
            // Save all sections
            console.log('🔄 Saving ALL settings sections...');

            // Save company info first
            console.log('🔄 Step 1/8: Saving company info...');
            await shopDetailsService.updateShopDetails(companyInfo);
            console.log('✅ Step 1/8: Company info saved');

            // Save all other settings sections
            const sections = [
              { name: 'tax', data: taxSettings },
              { name: 'inventory', data: inventorySettings },
              { name: 'sales', data: salesSettings },
              { name: 'purchase', data: purchaseSettings },
              { name: 'notifications', data: notificationSettings },
              { name: 'user', data: userPreferences },
              { name: 'security', data: securitySettings }
            ];

            for (let i = 0; i < sections.length; i++) {
              const { name, data } = sections[i];
              console.log(`🔄 Step ${i + 2}/8: Saving ${name} settings...`);
              console.log(`🔄 ${name} data:`, data);

              await settingsOperations.updateSettingSection(`${name}Settings`, data);
              console.log(`✅ Step ${i + 2}/8: ${name} settings saved`);
            }

            console.log('✅ All settings saved to database successfully');

            // Refresh the dashboard company details since we saved company info
            if (window.refreshDashboardCompanyDetails) {
              console.log('🔄 Refreshing dashboard company details after Save All...');
              await window.refreshDashboardCompanyDetails();
              console.log('✅ Dashboard company details refreshed after Save All');
            }

            alert('All settings saved successfully!');
            return;
          default:
            throw new Error(`Unknown settings section: ${section}`);
        }

        console.log(`🔄 Saving ${section} settings to database:`, settingsData);
        console.log(`🔄 Section key will be: ${section}Settings`);

        // Save the settings
        const result = await settingsOperations.updateSettingSection(`${section}Settings`, settingsData);
        console.log(`✅ ${section} settings saved to database successfully:`, result);

        // Verify the save by reading back some settings
        try {
          const savedSettings = await settingsOperations.getSettingsByCategory(`${section}Settings`);
          console.log(`🔍 Verification - ${section} settings count:`, savedSettings.length);
          console.log(`🔍 Verification - ${section} settings sample:`, savedSettings.slice(0, 3));
        } catch (verifyError) {
          console.warn(`⚠️ Could not verify ${section} settings save:`, verifyError);
        }
      }

      // If we saved company settings, refresh the dashboard
      if (section === 'company') {
        if (window.refreshDashboardCompanyDetails) {
          console.log('🔄 Refreshing dashboard company details...');
          await window.refreshDashboardCompanyDetails();
          console.log('✅ Dashboard company details refreshed');
        }
      }

      alert(`${section} settings saved successfully!`);
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error details:', error.details);
      console.error('❌ Error hint:', error.hint);
      console.error('❌ Full error object:', error);

      let errorMessage = 'Error saving settings. ';
      if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }

      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Test database connection
  const testDatabaseConnection = async () => {
    setTestingConnection(true);
    setConnectionTestResult(null);

    try {
      console.log('🔄 Starting database connection test...');

      const { settingsOperations } = await import('../lib/supabaseDb');
      const result = await settingsOperations.testConnection();

      setConnectionTestResult(result);

      if (result.success) {
        alert(`✅ Database Connection Successful!\n\nSettings table is working properly with ${result.settingsCount} existing settings.`);
      } else {
        alert(`❌ Database Connection Failed!\n\nError: ${result.error}\n\nPlease check the console for more details.`);
      }
    } catch (error) {
      console.error('❌ Database test error:', error);
      setConnectionTestResult({
        success: false,
        error: error.message,
        message: 'Failed to test database connection'
      });
      alert(`❌ Database Test Failed!\n\nError: ${error.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  // Clean up duplicate settings
  const cleanupDuplicates = async () => {
    setTestingConnection(true);

    try {
      console.log('🔄 Starting duplicate cleanup...');

      const { settingsOperations } = await import('../lib/supabaseDb');
      const result = await settingsOperations.cleanupDuplicateSettings();

      if (result.success) {
        if (result.duplicatesRemoved > 0) {
          alert(`✅ Cleanup Successful!\n\nRemoved ${result.duplicatesRemoved} duplicate settings.\n\nDuplicate keys cleaned: ${result.duplicateKeys.join(', ')}`);
        } else {
          alert('✅ No duplicate settings found. Database is clean!');
        }
      } else {
        alert(`❌ Cleanup Failed!\n\nError: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      alert(`❌ Cleanup Failed!\n\nError: ${error.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  // Logo upload functions
  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('Starting logo upload for file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size should be less than 2MB');
      return;
    }

    setLogoUploading(true);
    try {
      console.log('Creating preview URL...');
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);

      console.log('Uploading to Supabase Storage...');
      // Upload to Supabase Storage
      const fileName = `logo_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      console.log('Starting upload...');
      const uploadResult = await storageService.uploadFile(file, 'company/', (progress) => {
        console.log('Upload progress:', progress);
      });

      console.log('Upload completed, getting download URL...');
      const downloadURL = uploadResult.url;
      console.log('Download URL obtained:', downloadURL);

      // Update company info with logo URL
      setCompanyInfo(prev => ({
        ...prev,
        logo: downloadURL
      }));

      console.log('Logo uploaded successfully:', downloadURL);
      alert('Logo uploaded successfully! Don\'t forget to save your company information.');
    } catch (error) {
      console.error('Detailed error uploading logo:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      // Try fallback method with base64 for small files
      if (file.size < 500 * 1024) { // Less than 500KB
        try {
          console.log('Trying fallback base64 method...');
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64String = e.target.result;
            setCompanyInfo(prev => ({
              ...prev,
              logo: base64String
            }));
            console.log('Logo saved as base64');
            alert('Logo uploaded successfully using fallback method! Don\'t forget to save your company information.');
            setLogoUploading(false);
          };
          reader.onerror = () => {
            console.error('FileReader error');
            setLogoPreview(null);
            setLogoUploading(false);
            alert('Failed to upload logo. Please try again.');
          };
          reader.readAsDataURL(file);
          return; // Exit early, don't run the finally block yet
        } catch (fallbackError) {
          console.error('Fallback method also failed:', fallbackError);
        }
      }

      let errorMessage = 'Failed to upload logo. ';
      if (error.code === 'storage/unauthorized') {
        errorMessage += 'Permission denied. Please check Firebase Storage rules.';
      } else if (error.code === 'storage/canceled') {
        errorMessage += 'Upload was canceled.';
      } else if (error.code === 'storage/unknown') {
        errorMessage += 'Unknown error occurred.';
      } else if (error.message.includes('timeout')) {
        errorMessage += 'Upload timed out. Please check your internet connection.';
      } else {
        errorMessage += 'Please try again.';
      }

      alert(errorMessage);
      setLogoPreview(null);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!companyInfo.logo) return;

    if (window.confirm('Are you sure you want to remove the logo?')) {
      try {
        // If it's a Firebase Storage URL, delete the file
        if (companyInfo.logo.includes('firebasestorage.googleapis.com')) {
          // Extract the file path from the URL and delete
          // Note: This is a simplified approach
          console.log('Removing logo from storage...');
        }

        // Update company info
        setCompanyInfo(prev => ({
          ...prev,
          logo: ''
        }));

        setLogoPreview(null);
        console.log('Logo removed successfully');
      } catch (error) {
        console.error('Error removing logo:', error);
        alert('Failed to remove logo. Please try again.');
      }
    }
  };

  const handleReset = (section) => {
    if (window.confirm(`Are you sure you want to reset ${section} settings to default?`)) {
      // Reset to default values
      switch (section) {
        case 'company':
          setCompanyInfo({
            name: '',
            address: { street: '', city: '', state: '', pincode: '', country: 'India' },
            phone: '',
            email: '',
            website: '',
            gstNumber: '',
            panNumber: '',
            logo: '',
            // Reset all fields to empty
            fertilizerLicense: '',
            seedLicense: '',
            pesticideLicense: '',
            bankName: '',
            accountNumber: '',
            ifscCode: ''
          });
          setLogoPreview(null);
          break;
        case 'tax':
          setTaxSettings({
            defaultTaxRate: 5,
            gstEnabled: true,
            taxInclusive: false,
            hsnCode: '31051000',
            igstRate: 18,
            cgstRate: 9,
            sgstRate: 9
          });
          break;
        default:
          console.warn(`Unknown section: ${section}`);
          break;
      }
    }
  };

  const exportSettings = async () => {
    try {
      // Get fresh data from database
      const { settingsOperations } = await import('../lib/supabaseDb');
      const systemSettings = await settingsOperations.getSystemSettings();
      const companyDetails = await shopDetailsService.getShopDetails();

      const settings = {
        companyInfo: companyDetails,
        ...systemSettings,
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser?.email,
        version: '1.0'
      };

      const dataStr = JSON.stringify(settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `krishisethu-settings-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      console.log('Settings exported successfully');
    } catch (error) {
      console.error('Error exporting settings:', error);
      alert('Error exporting settings. Please try again.');
    }
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const settings = JSON.parse(e.target.result);
          const { settingsOperations } = await import('../lib/supabaseDb');

          // Import and save each section to database
          if (settings.companyInfo) {
            setCompanyInfo(settings.companyInfo);
            await shopDetailsService.updateShopDetails(settings.companyInfo);
          }

          if (settings.taxSettings) {
            setTaxSettings(settings.taxSettings);
            await settingsOperations.updateSettingSection('taxSettings', settings.taxSettings);
          }

          if (settings.inventorySettings) {
            setInventorySettings(settings.inventorySettings);
            await settingsOperations.updateSettingSection('inventorySettings', settings.inventorySettings);
          }

          if (settings.salesSettings) {
            setSalesSettings(settings.salesSettings);
            await settingsOperations.updateSettingSection('salesSettings', settings.salesSettings);
          }

          if (settings.purchaseSettings) {
            setPurchaseSettings(settings.purchaseSettings);
            await settingsOperations.updateSettingSection('purchaseSettings', settings.purchaseSettings);
          }

          if (settings.notificationSettings) {
            setNotificationSettings(settings.notificationSettings);
            await settingsOperations.updateSettingSection('notificationSettings', settings.notificationSettings);
          }

          if (settings.userPreferences) {
            setUserPreferences(settings.userPreferences);
            await settingsOperations.updateSettingSection('userSettings', settings.userPreferences);
          }

          if (settings.securitySettings) {
            setSecuritySettings(settings.securitySettings);
            await settingsOperations.updateSettingSection('securitySettings', settings.securitySettings);
          }

          alert('Settings imported and saved to database successfully!');
          console.log('Settings imported successfully');
        } catch (error) {
          console.error('Error importing settings:', error);
          alert('Error importing settings. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="h-8 w-8 text-blue-600" />
            System Settings
          </h1>
          <p className="text-gray-600">
            Configure your system preferences and business settings
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export Settings
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import Settings
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="hidden"
            />
          </label>
          <Button
            onClick={testDatabaseConnection}
            disabled={testingConnection || isSaving}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Database className="h-4 w-4 mr-2" />
            {testingConnection ? 'Testing...' : 'Test Database'}
          </Button>

          <Button
            onClick={cleanupDuplicates}
            disabled={testingConnection || isSaving}
            variant="outline"
            className="border-orange-600 text-orange-600 hover:bg-orange-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {testingConnection ? 'Cleaning...' : 'Clean Duplicates'}
          </Button>

          <Button
            onClick={() => handleSave('all')}
            disabled={isSaving || testingConnection}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </div>

      {/* Database Connection Status */}
      {connectionTestResult && (
        <Card className={`border-2 ${connectionTestResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="py-4">
            <div className="flex items-start space-x-3">
              {connectionTestResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-medium ${connectionTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  Database Connection {connectionTestResult.success ? 'Successful' : 'Failed'}
                </h4>
                <p className={`text-sm mt-1 ${connectionTestResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {connectionTestResult.message}
                </p>
                {connectionTestResult.success && (
                  <p className="text-sm text-green-600 mt-1">
                    Settings table is accessible with {connectionTestResult.settingsCount} existing settings.
                  </p>
                )}
                {!connectionTestResult.success && connectionTestResult.error && (
                  <p className="text-sm text-red-600 mt-1 font-mono">
                    Error: {connectionTestResult.error}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConnectionTestResult(null)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="company" className="flex items-center gap-1">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-1">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Tax</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Inventory</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-1">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Sales</span>
          </TabsTrigger>
          <TabsTrigger value="purchase" className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Purchase</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">User</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Information Tab */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Configure your company details and business information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Logo Section */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Company Logo
                </h4>
                <div className="flex items-start gap-4">
                  {/* Logo Preview */}
                  <div className="flex-shrink-0">
                    {(logoPreview || companyInfo.logo) ? (
                      <div className="relative">
                        <img
                          src={logoPreview || companyInfo.logo}
                          alt="Company Logo"
                          className="w-24 h-24 object-contain border border-gray-300 rounded-lg bg-white"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={handleLogoRemove}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                        <Image className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={logoUploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('logo-upload').click()}
                        disabled={logoUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {logoUploading ? 'Uploading...' : 'Upload Logo'}
                      </Button>

                      {logoUploading && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setLogoUploading(false);
                            setLogoPreview(null);
                          }}
                        >
                          Cancel Upload
                        </Button>
                      )}
                      {companyInfo.logo && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleLogoRemove}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Upload your company logo (PNG, JPG, max 2MB). This will appear on all reports and invoices.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <Input
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91-9876543210"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    value={companyInfo.email}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="info@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website</label>
                  <Input
                    value={companyInfo.website}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://company.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">GST Number</label>
                  <Input
                    value={companyInfo.gstNumber}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, gstNumber: e.target.value }))}
                    placeholder="27AAAAA0000A1Z5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">PAN Number</label>
                  <Input
                    value={companyInfo.panNumber}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, panNumber: e.target.value }))}
                    placeholder="AAAAA0000A"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Address Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Street Address</label>
                    <Input
                      value={companyInfo.address.street}
                      onChange={(e) => setCompanyInfo(prev => ({
                        ...prev,
                        address: { ...prev.address, street: e.target.value }
                      }))}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City</label>
                    <Input
                      value={companyInfo.address.city}
                      onChange={(e) => setCompanyInfo(prev => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      placeholder="Mumbai"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">State</label>
                    <Input
                      value={companyInfo.address.state}
                      onChange={(e) => setCompanyInfo(prev => ({
                        ...prev,
                        address: { ...prev.address, state: e.target.value }
                      }))}
                      placeholder="Maharashtra"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">PIN Code</label>
                    <Input
                      value={companyInfo.address.pincode}
                      onChange={(e) => setCompanyInfo(prev => ({
                        ...prev,
                        address: { ...prev.address, pincode: e.target.value }
                      }))}
                      placeholder="400001"
                    />
                  </div>
                </div>
              </div>

              {/* License Information */}
              <div className="space-y-4">
                <h4 className="font-medium">License Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fertilizer License No.</label>
                    <Input
                      value={companyInfo.fertilizerLicense}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, fertilizerLicense: e.target.value }))}
                      placeholder="FL/2024/001"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Seed License No.</label>
                    <Input
                      value={companyInfo.seedLicense}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, seedLicense: e.target.value }))}
                      placeholder="SD/2024/001"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pesticide License No.</label>
                    <Input
                      value={companyInfo.pesticideLicense}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, pesticideLicense: e.target.value }))}
                      placeholder="PS/2024/001"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-4">
                <h4 className="font-medium">Bank Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bank Name</label>
                    <Input
                      value={companyInfo.bankName}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="State Bank of India"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account Number</label>
                    <Input
                      value={companyInfo.accountNumber}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="12345678901234"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">IFSC Code</label>
                    <Input
                      value={companyInfo.ifscCode}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, ifscCode: e.target.value }))}
                      placeholder="SBIN0001234"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => handleReset('company')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
                <Button onClick={() => handleSave('company')} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Company Info
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Settings Tab */}
        <TabsContent value="tax" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Tax Configuration
              </CardTitle>
              <CardDescription>
                Configure tax rates and GST settings for your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Tax Rate (%)</label>
                  <Input
                    type="number"
                    value={taxSettings.defaultTaxRate}
                    onChange={(e) => setTaxSettings(prev => ({ ...prev, defaultTaxRate: parseFloat(e.target.value) }))}
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">HSN Code</label>
                  <Input
                    value={taxSettings.hsnCode}
                    onChange={(e) => setTaxSettings(prev => ({ ...prev, hsnCode: e.target.value }))}
                    placeholder="31051000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">IGST Rate (%)</label>
                  <Input
                    type="number"
                    value={taxSettings.igstRate}
                    onChange={(e) => setTaxSettings(prev => ({ ...prev, igstRate: parseFloat(e.target.value) }))}
                    placeholder="18"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CGST Rate (%)</label>
                  <Input
                    type="number"
                    value={taxSettings.cgstRate}
                    onChange={(e) => setTaxSettings(prev => ({ ...prev, cgstRate: parseFloat(e.target.value) }))}
                    placeholder="9"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SGST Rate (%)</label>
                  <Input
                    type="number"
                    value={taxSettings.sgstRate}
                    onChange={(e) => setTaxSettings(prev => ({ ...prev, sgstRate: parseFloat(e.target.value) }))}
                    placeholder="9"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Tax Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="gstEnabled"
                      checked={taxSettings.gstEnabled}
                      onChange={(e) => setTaxSettings(prev => ({ ...prev, gstEnabled: e.target.checked }))}
                    />
                    <label htmlFor="gstEnabled" className="text-sm">Enable GST</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="taxInclusive"
                      checked={taxSettings.taxInclusive}
                      onChange={(e) => setTaxSettings(prev => ({ ...prev, taxInclusive: e.target.checked }))}
                    />
                    <label htmlFor="taxInclusive" className="text-sm">Tax Inclusive Pricing</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => handleReset('tax')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
                <Button onClick={() => handleSave('tax')} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Tax Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Settings Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Management
              </CardTitle>
              <CardDescription>
                Configure inventory tracking and stock management settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Low Stock Threshold</label>
                  <Input
                    type="number"
                    value={inventorySettings.lowStockThreshold}
                    onChange={(e) => setInventorySettings(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) }))}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Critical Stock Threshold</label>
                  <Input
                    type="number"
                    value={inventorySettings.criticalStockThreshold}
                    onChange={(e) => setInventorySettings(prev => ({ ...prev, criticalStockThreshold: parseInt(e.target.value) }))}
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expiry Warning Days</label>
                  <Input
                    type="number"
                    value={inventorySettings.expiryWarningDays}
                    onChange={(e) => setInventorySettings(prev => ({ ...prev, expiryWarningDays: parseInt(e.target.value) }))}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Inventory Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoReorder"
                      checked={inventorySettings.autoReorderEnabled}
                      onChange={(e) => setInventorySettings(prev => ({ ...prev, autoReorderEnabled: e.target.checked }))}
                    />
                    <label htmlFor="autoReorder" className="text-sm">Enable Auto Reorder</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="barcodeEnabled"
                      checked={inventorySettings.barcodeEnabled}
                      onChange={(e) => setInventorySettings(prev => ({ ...prev, barcodeEnabled: e.target.checked }))}
                    />
                    <label htmlFor="barcodeEnabled" className="text-sm">Enable Barcode Scanning</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="trackBatches"
                      checked={inventorySettings.trackBatches}
                      onChange={(e) => setInventorySettings(prev => ({ ...prev, trackBatches: e.target.checked }))}
                    />
                    <label htmlFor="trackBatches" className="text-sm">Track Batch Numbers</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="trackExpiry"
                      checked={inventorySettings.trackExpiry}
                      onChange={(e) => setInventorySettings(prev => ({ ...prev, trackExpiry: e.target.checked }))}
                    />
                    <label htmlFor="trackExpiry" className="text-sm">Track Expiry Dates</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowNegative"
                      checked={inventorySettings.allowNegativeStock}
                      onChange={(e) => setInventorySettings(prev => ({ ...prev, allowNegativeStock: e.target.checked }))}
                    />
                    <label htmlFor="allowNegative" className="text-sm">Allow Negative Stock</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => handleReset('inventory')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
                <Button onClick={() => handleSave('inventory')} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Inventory Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Settings Tab */}
        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Sales Configuration
              </CardTitle>
              <CardDescription>
                Configure sales processes and invoice settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Invoice Prefix</label>
                  <Input
                    value={salesSettings.invoicePrefix}
                    onChange={(e) => setSalesSettings(prev => ({ ...prev, invoicePrefix: e.target.value }))}
                    placeholder="INV"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Receipt Prefix</label>
                  <Input
                    value={salesSettings.receiptPrefix}
                    onChange={(e) => setSalesSettings(prev => ({ ...prev, receiptPrefix: e.target.value }))}
                    placeholder="RCP"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Payment Method</label>
                  <Select
                    value={salesSettings.defaultPaymentMethod}
                    onValueChange={(value) => setSalesSettings(prev => ({ ...prev, defaultPaymentMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Sales Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoInvoice"
                      checked={salesSettings.autoInvoiceNumber}
                      onChange={(e) => setSalesSettings(prev => ({ ...prev, autoInvoiceNumber: e.target.checked }))}
                    />
                    <label htmlFor="autoInvoice" className="text-sm">Auto Generate Invoice Numbers</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="printAfterSale"
                      checked={salesSettings.printAfterSale}
                      onChange={(e) => setSalesSettings(prev => ({ ...prev, printAfterSale: e.target.checked }))}
                    />
                    <label htmlFor="printAfterSale" className="text-sm">Print Receipt After Sale</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="emailReceipts"
                      checked={salesSettings.emailReceipts}
                      onChange={(e) => setSalesSettings(prev => ({ ...prev, emailReceipts: e.target.checked }))}
                    />
                    <label htmlFor="emailReceipts" className="text-sm">Email Receipts to Customers</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="smsReceipts"
                      checked={salesSettings.smsReceipts}
                      onChange={(e) => setSalesSettings(prev => ({ ...prev, smsReceipts: e.target.checked }))}
                    />
                    <label htmlFor="smsReceipts" className="text-sm">SMS Receipts to Customers</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowPartial"
                      checked={salesSettings.allowPartialPayments}
                      onChange={(e) => setSalesSettings(prev => ({ ...prev, allowPartialPayments: e.target.checked }))}
                    />
                    <label htmlFor="allowPartial" className="text-sm">Allow Partial Payments</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requireCustomer"
                      checked={salesSettings.requireCustomerInfo}
                      onChange={(e) => setSalesSettings(prev => ({ ...prev, requireCustomerInfo: e.target.checked }))}
                    />
                    <label htmlFor="requireCustomer" className="text-sm">Require Customer Information</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => handleReset('sales')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
                <Button onClick={() => handleSave('sales')} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Sales Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Settings Tab */}
        <TabsContent value="purchase" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Purchase Management
              </CardTitle>
              <CardDescription>
                Configure purchase order and supplier management settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Purchase Order Prefix</label>
                  <Input
                    value={purchaseSettings.purchasePrefix}
                    onChange={(e) => setPurchaseSettings(prev => ({ ...prev, purchasePrefix: e.target.value }))}
                    placeholder="PUR"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Approval Limit (₹)</label>
                  <Input
                    type="number"
                    value={purchaseSettings.approvalLimit}
                    onChange={(e) => setPurchaseSettings(prev => ({ ...prev, approvalLimit: parseFloat(e.target.value) }))}
                    placeholder="50000"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Purchase Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoApproval"
                      checked={purchaseSettings.autoApproval}
                      onChange={(e) => setPurchaseSettings(prev => ({ ...prev, autoApproval: e.target.checked }))}
                    />
                    <label htmlFor="autoApproval" className="text-sm">Auto Approve Purchase Orders</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requireGRN"
                      checked={purchaseSettings.requireGRN}
                      onChange={(e) => setPurchaseSettings(prev => ({ ...prev, requireGRN: e.target.checked }))}
                    />
                    <label htmlFor="requireGRN" className="text-sm">Require Goods Receipt Note (GRN)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoCreatePO"
                      checked={purchaseSettings.autoCreatePO}
                      onChange={(e) => setPurchaseSettings(prev => ({ ...prev, autoCreatePO: e.target.checked }))}
                    />
                    <label htmlFor="autoCreatePO" className="text-sm">Auto Create PO for Low Stock</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => handleReset('purchase')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
                <Button onClick={() => handleSave('purchase')} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Purchase Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure alerts and notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Alert Types</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="lowStockAlerts"
                      checked={notificationSettings.lowStockAlerts}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, lowStockAlerts: e.target.checked }))}
                    />
                    <label htmlFor="lowStockAlerts" className="text-sm">Low Stock Alerts</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="expiryAlerts"
                      checked={notificationSettings.expiryAlerts}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, expiryAlerts: e.target.checked }))}
                    />
                    <label htmlFor="expiryAlerts" className="text-sm">Expiry Date Alerts</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="salesAlerts"
                      checked={notificationSettings.salesAlerts}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, salesAlerts: e.target.checked }))}
                    />
                    <label htmlFor="salesAlerts" className="text-sm">Sales Alerts</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="purchaseAlerts"
                      checked={notificationSettings.purchaseAlerts}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, purchaseAlerts: e.target.checked }))}
                    />
                    <label htmlFor="purchaseAlerts" className="text-sm">Purchase Alerts</label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Notification Methods</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                    />
                    <label htmlFor="emailNotifications" className="text-sm">Email Notifications</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="smsNotifications"
                      checked={notificationSettings.smsNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                    />
                    <label htmlFor="smsNotifications" className="text-sm">SMS Notifications</label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Report Frequency</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="dailyReports"
                      checked={notificationSettings.dailyReports}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, dailyReports: e.target.checked }))}
                    />
                    <label htmlFor="dailyReports" className="text-sm">Daily Reports</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="weeklyReports"
                      checked={notificationSettings.weeklyReports}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                    />
                    <label htmlFor="weeklyReports" className="text-sm">Weekly Reports</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="monthlyReports"
                      checked={notificationSettings.monthlyReports}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, monthlyReports: e.target.checked }))}
                    />
                    <label htmlFor="monthlyReports" className="text-sm">Monthly Reports</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => handleReset('notifications')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
                <Button onClick={() => handleSave('notifications')} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Preferences
              </CardTitle>
              <CardDescription>
                Customize your personal settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Theme</label>
                  <Select
                    value={userPreferences.theme}
                    onValueChange={(value) => setUserPreferences(prev => ({ ...prev, theme: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Language</label>
                  <Select
                    value={userPreferences.language}
                    onValueChange={(value) => setUserPreferences(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="mr">Marathi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Format</label>
                  <Select
                    value={userPreferences.dateFormat}
                    onValueChange={(value) => setUserPreferences(prev => ({ ...prev, dateFormat: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Format</label>
                  <Select
                    value={userPreferences.timeFormat}
                    onValueChange={(value) => setUserPreferences(prev => ({ ...prev, timeFormat: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12 Hour</SelectItem>
                      <SelectItem value="24h">24 Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Currency</label>
                  <Select
                    value={userPreferences.currency}
                    onValueChange={(value) => setUserPreferences(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Auto Logout (minutes)</label>
                  <Input
                    type="number"
                    value={userPreferences.autoLogout}
                    onChange={(e) => setUserPreferences(prev => ({ ...prev, autoLogout: parseInt(e.target.value) }))}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Display Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showTutorials"
                      checked={userPreferences.showTutorials}
                      onChange={(e) => setUserPreferences(prev => ({ ...prev, showTutorials: e.target.checked }))}
                    />
                    <label htmlFor="showTutorials" className="text-sm">Show Tutorial Tips</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => handleReset('preferences')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
                <Button onClick={() => handleSave('preferences')} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security policies and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password Policy</label>
                  <Select
                    value={securitySettings.passwordPolicy}
                    onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, passwordPolicy: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weak">Weak (6+ characters)</SelectItem>
                      <SelectItem value="medium">Medium (8+ chars, mixed case)</SelectItem>
                      <SelectItem value="strong">Strong (12+ chars, symbols)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Session Timeout (minutes)</label>
                  <Input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Login Attempts</label>
                  <Input
                    type="number"
                    value={securitySettings.loginAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, loginAttempts: parseInt(e.target.value) }))}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Security Features</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="twoFactorAuth"
                      checked={securitySettings.twoFactorAuth}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
                    />
                    <label htmlFor="twoFactorAuth" className="text-sm">Enable Two-Factor Authentication</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auditLogs"
                      checked={securitySettings.auditLogs}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, auditLogs: e.target.checked }))}
                    />
                    <label htmlFor="auditLogs" className="text-sm">Enable Audit Logs</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="dataEncryption"
                      checked={securitySettings.dataEncryption}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, dataEncryption: e.target.checked }))}
                    />
                    <label htmlFor="dataEncryption" className="text-sm">Enable Data Encryption</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => handleReset('security')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
                <Button onClick={() => handleSave('security')} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
