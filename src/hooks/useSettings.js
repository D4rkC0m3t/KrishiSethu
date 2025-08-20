import { useState, useEffect, useCallback } from 'react';
// Note: These services will be implemented as the app grows
// import { settingsOperations } from '../lib/supabaseDb';
// import { shopDetailsService } from '../lib/shopDetails';

/**
 * Custom hook for managing application settings
 * Provides centralized access to all system settings from database
 */
export const useSettings = () => {
  const [settings, setSettings] = useState({
    companyInfo: {
      name: 'KrishiSethu Fertilizers',
      address: {
        street: '123 Agricultural Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      },
      phone: '+91-9876543210',
      email: 'info@krishisethu.com',
      website: 'https://krishisethu.com',
      gstNumber: '27AAAAA0000A1Z5',
      panNumber: 'ABCDE1234F',
      logo: '/Logo.png',
      fertilizerLicense: 'FL/2024/001',
      seedLicense: 'SD/2024/001',
      pesticideLicense: 'PS/2024/001',
      bankName: 'State Bank of India',
      accountNumber: '12345678901234',
      ifscCode: 'SBIN0001234'
    },
    taxSettings: {
      defaultTaxRate: 5,
      gstEnabled: true,
      taxInclusive: false,
      hsnCode: '31051000',
      igstRate: 18,
      cgstRate: 9,
      sgstRate: 9
    },
    inventorySettings: {
      lowStockThreshold: 10,
      criticalStockThreshold: 5,
      autoReorderEnabled: false,
      barcodeEnabled: true,
      trackBatches: true,
      trackExpiry: true,
      expiryWarningDays: 30,
      allowNegativeStock: false
    },
    salesSettings: {
      invoicePrefix: 'INV',
      receiptPrefix: 'RCP',
      autoInvoiceNumber: true,
      printAfterSale: true,
      emailReceipts: false,
      smsReceipts: false,
      defaultPaymentMethod: 'cash',
      allowPartialPayments: true,
      requireCustomerInfo: false
    },
    purchaseSettings: {
      purchasePrefix: 'PUR',
      autoApproval: false,
      requireGRN: true,
      defaultSupplier: '',
      autoCreatePO: false,
      approvalLimit: 50000
    },
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: false,
      lowStockAlerts: true,
      expiryAlerts: true,
      salesAlerts: false,
      purchaseAlerts: true,
      dailyReports: false,
      weeklyReports: true,
      monthlyReports: true
    },
    userSettings: {
      theme: 'light',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12h',
      currency: 'INR',
      dashboardLayout: 'default',
      autoLogout: 30,
      showTutorials: true
    },
    securitySettings: {
      passwordPolicy: 'medium',
      sessionTimeout: 30,
      twoFactorAuth: false,
      loginAttempts: 5,
      auditLogs: true,
      dataEncryption: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all settings from database
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, use default settings
      // TODO: Implement actual database loading when services are ready
      console.log('Settings loaded from defaults');
      
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a specific setting section
  const updateSettings = useCallback(async (section, data) => {
    try {
      // TODO: Implement actual database updates when services are ready
      console.log(`Updating ${section} settings:`, data);
      
      // Update local state for now
      setSettings(prev => ({
        ...prev,
        [section]: { ...prev[section], ...data }
      }));

      return true;
    } catch (err) {
      console.error(`Error updating ${section} settings:`, err);
      throw err;
    }
  }, []);

  // Get a specific setting value
  const getSetting = useCallback((path) => {
    const keys = path.split('.');
    let value = settings;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }
    
    return value;
  }, [settings]);

  // Initialize settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    loadSettings,
    updateSettings,
    getSetting,
    // Convenience getters for commonly used settings
    companyInfo: settings.companyInfo,
    taxSettings: settings.taxSettings,
    inventorySettings: settings.inventorySettings,
    salesSettings: settings.salesSettings,
    purchaseSettings: settings.purchaseSettings,
    notificationSettings: settings.notificationSettings,
    userSettings: settings.userSettings,
    securitySettings: settings.securitySettings
  };
};

export default useSettings;