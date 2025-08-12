// Shop Details Service - Centralized shop information for all invoices, exports, and reports

import React from 'react';
import { settingsService } from './firestore';

// Default shop details (fallback)
const DEFAULT_SHOP_DETAILS = {
  name: 'VK Fertilizers',
  address: {
    street: 'Siababa Temple Near Darga, Holagunda',
    city: 'Holagunda',
    state: 'Karnataka',
    pincode: '585102',
    country: 'India'
  },
  phone: '8688765111',
  email: 'info@vkfertilizers.com',
  website: 'https://vkfertilizers.com',
  gstNumber: '29ABCDE1234F1Z5',
  panNumber: 'ABCDE1234F',
  logo: '', // Company logo URL
  // Fertilizer Business Licenses
  fertilizerLicense: 'FL/2024/001',
  seedLicense: 'SD/2024/001',
  pesticideLicense: 'PS/2024/001',
  // Bank Details
  bankName: 'State Bank of India',
  accountNumber: '12345678901234',
  ifscCode: 'SBIN0001234'
};

class ShopDetailsService {
  constructor() {
    this.cachedDetails = null;
    this.listeners = new Set();
  }

  // Get shop details (with caching)
  async getShopDetails() {
    if (this.cachedDetails) {
      return this.cachedDetails;
    }

    try {
      // Try to get from Firebase settings
      const settings = await settingsService.getSystemSettings();
      if (settings && settings.companyInfo) {
        this.cachedDetails = {
          ...DEFAULT_SHOP_DETAILS,
          ...settings.companyInfo
        };
      } else {
        this.cachedDetails = DEFAULT_SHOP_DETAILS;
      }
    } catch (error) {
      console.warn('Failed to load shop details from Firebase, using defaults:', error);
      this.cachedDetails = DEFAULT_SHOP_DETAILS;
    }

    return this.cachedDetails;
  }

  // Update shop details
  async updateShopDetails(newDetails) {
    try {
      // Update in Firebase using the correct method
      await settingsService.updateSettingSection('companyInfo', {
        ...this.cachedDetails,
        ...newDetails
      });

      // Update cache
      this.cachedDetails = {
        ...this.cachedDetails,
        ...newDetails
      };

      // Notify listeners
      this.notifyListeners();

      return true;
    } catch (error) {
      console.error('Failed to update shop details:', error);
      throw error;
    }
  }

  // Clear cache (force reload from Firebase)
  clearCache() {
    this.cachedDetails = null;
  }

  // Subscribe to shop details changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners of changes
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.cachedDetails);
      } catch (error) {
        console.error('Error in shop details listener:', error);
      }
    });
  }

  // Format address as string
  formatAddress(address = null) {
    const addr = address || this.cachedDetails?.address || DEFAULT_SHOP_DETAILS.address;
    if (typeof addr === 'string') return addr;
    
    const parts = [
      addr.street,
      addr.city,
      addr.state,
      addr.pincode
    ].filter(part => part && part.trim() !== '');
    
    return parts.join(', ');
  }

  // Get formatted shop header for invoices
  getInvoiceHeader() {
    const details = this.cachedDetails || DEFAULT_SHOP_DETAILS;
    return {
      name: details.name,
      address: this.formatAddress(details.address),
      phone: details.phone,
      email: details.email,
      gstNumber: details.gstNumber,
      logo: details.logo,
      fertilizerLicense: details.fertilizerLicense,
      seedLicense: details.seedLicense,
      pesticideLicense: details.pesticideLicense
    };
  }

  // Get bank details for invoices
  getBankDetails() {
    const details = this.cachedDetails || DEFAULT_SHOP_DETAILS;
    return {
      bankName: details.bankName,
      accountNumber: details.accountNumber,
      ifscCode: details.ifscCode
    };
  }

  // Get contact details
  getContactDetails() {
    const details = this.cachedDetails || DEFAULT_SHOP_DETAILS;
    return {
      phone: details.phone,
      email: details.email,
      website: details.website
    };
  }

  // Get license details
  getLicenseDetails() {
    const details = this.cachedDetails || DEFAULT_SHOP_DETAILS;
    return {
      fertilizerLicense: details.fertilizerLicense,
      seedLicense: details.seedLicense,
      pesticideLicense: details.pesticideLicense,
      gstNumber: details.gstNumber,
      panNumber: details.panNumber
    };
  }
}

// Create singleton instance
export const shopDetailsService = new ShopDetailsService();

// React hook for using shop details in components
export const useShopDetails = () => {
  const [details, setDetails] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const loadDetails = async () => {
      try {
        const shopDetails = await shopDetailsService.getShopDetails();
        if (mounted) {
          setDetails(shopDetails);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load shop details:', error);
        if (mounted) {
          setDetails(DEFAULT_SHOP_DETAILS);
          setLoading(false);
        }
      }
    };

    loadDetails();

    // Subscribe to changes
    const unsubscribe = shopDetailsService.subscribe((newDetails) => {
      if (mounted) {
        setDetails(newDetails);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { details, loading };
};

export default shopDetailsService;
