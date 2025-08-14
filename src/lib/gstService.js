/**
 * GST Service - Comprehensive GST calculations and compliance
 * Handles all GST-related operations for Indian businesses
 */

import { salesService, purchasesService } from './firestore';
import { shopDetailsService } from './shopDetails';

class GSTService {
  constructor() {
    // Standard GST rates for different product categories
    this.gstRates = {
      fertilizers: 5,      // Most fertilizers are at 5%
      seeds: 0,            // Seeds are generally exempt
      pesticides: 18,      // Pesticides at 18%
      equipment: 18,       // Agricultural equipment at 18%
      services: 18         // Services at 18%
    };

    // HSN codes for agricultural products
    this.hsnCodes = {
      urea: '31021000',
      dap: '31031000',
      npk: '31051000',
      organic: '31010000',
      seeds: '12010000',
      pesticides: '38080000'
    };
  }

  /**
   * Calculate GST for a given amount and rate
   */
  calculateGST(amount, gstRate) {
    const gstAmount = (amount * gstRate) / 100;
    return {
      taxableAmount: amount,
      gstRate: gstRate,
      gstAmount: gstAmount,
      totalAmount: amount + gstAmount,
      cgst: gstRate <= 5 ? 0 : gstAmount / 2,  // For inter-state
      sgst: gstRate <= 5 ? 0 : gstAmount / 2,  // For inter-state
      igst: gstAmount  // For intra-state (assuming most transactions are intra-state)
    };
  }

  /**
   * Get GST rate for a product category
   */
  getGSTRate(category) {
    return this.gstRates[category?.toLowerCase()] || 5; // Default 5% for fertilizers
  }

  /**
   * Get HSN code for a product
   */
  getHSNCode(productType) {
    return this.hsnCodes[productType?.toLowerCase()] || '31051000'; // Default NPK HSN
  }

  /**
   * Generate GSTR-1 data for a given period
   */
  async generateGSTR1(startDate, endDate) {
    try {
      const sales = await salesService.getAll();
      const filteredSales = this.filterByDateRange(sales, startDate, endDate, 'saleDate');
      
      const gstr1Data = {
        gstin: await this.getGSTIN(),
        period: this.formatPeriod(startDate),
        b2b: [],  // Business to Business
        b2c: [],  // Business to Consumer
        summary: {
          totalTaxableValue: 0,
          totalTax: 0,
          totalInvoices: filteredSales.length
        }
      };

      // Process each sale
      filteredSales.forEach(sale => {
        const saleGST = this.calculateSaleGST(sale);
        
        if (sale.customerGSTIN) {
          // B2B transaction
          gstr1Data.b2b.push({
            ctin: sale.customerGSTIN,
            invoiceNumber: sale.invoiceNumber || sale.id,
            invoiceDate: this.formatDate(sale.saleDate),
            invoiceValue: saleGST.totalAmount,
            taxableValue: saleGST.taxableAmount,
            igst: saleGST.igst,
            cgst: saleGST.cgst,
            sgst: saleGST.sgst
          });
        } else {
          // B2C transaction
          gstr1Data.b2c.push({
            invoiceNumber: sale.invoiceNumber || sale.id,
            invoiceDate: this.formatDate(sale.saleDate),
            invoiceValue: saleGST.totalAmount,
            taxableValue: saleGST.taxableAmount,
            igst: saleGST.igst
          });
        }

        gstr1Data.summary.totalTaxableValue += saleGST.taxableAmount;
        gstr1Data.summary.totalTax += saleGST.gstAmount;
      });

      return gstr1Data;
    } catch (error) {
      console.error('Error generating GSTR-1:', error);
      throw error;
    }
  }

  /**
   * Generate GSTR-3B data for a given period
   */
  async generateGSTR3B(startDate, endDate) {
    try {
      const [sales, purchases] = await Promise.all([
        salesService.getAll(),
        purchasesService.getAll()
      ]);

      const filteredSales = this.filterByDateRange(sales, startDate, endDate, 'saleDate');
      const filteredPurchases = this.filterByDateRange(purchases, startDate, endDate, 'purchaseDate');

      // Calculate outward supplies (sales)
      const outwardSupplies = this.calculateOutwardSupplies(filteredSales);
      
      // Calculate input tax credit (purchases)
      const inputTaxCredit = this.calculateInputTaxCredit(filteredPurchases);

      // Calculate net liability
      const netLiability = {
        igst: Math.max(0, outwardSupplies.igst - inputTaxCredit.igst),
        cgst: Math.max(0, outwardSupplies.cgst - inputTaxCredit.cgst),
        sgst: Math.max(0, outwardSupplies.sgst - inputTaxCredit.sgst),
        cess: 0
      };

      return {
        gstin: await this.getGSTIN(),
        period: this.formatPeriod(startDate),
        outwardSupplies,
        inputTaxCredit,
        netLiability,
        totalLiability: netLiability.igst + netLiability.cgst + netLiability.sgst,
        dueDate: this.calculateDueDate(startDate)
      };
    } catch (error) {
      console.error('Error generating GSTR-3B:', error);
      throw error;
    }
  }

  /**
   * Calculate GST for a sale transaction
   */
  calculateSaleGST(sale) {
    let totalTaxableAmount = 0;
    let totalGSTAmount = 0;

    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        const itemTotal = (item.quantity || 0) * (item.price || 0);
        const gstRate = item.gstRate || this.getGSTRate(item.category);
        const gstCalc = this.calculateGST(itemTotal, gstRate);
        
        totalTaxableAmount += gstCalc.taxableAmount;
        totalGSTAmount += gstCalc.gstAmount;
      });
    } else {
      // Fallback for old data structure
      const itemTotal = (sale.quantity || 0) * (sale.price || 0);
      const gstRate = sale.gstRate || 5;
      const gstCalc = this.calculateGST(itemTotal, gstRate);
      
      totalTaxableAmount = gstCalc.taxableAmount;
      totalGSTAmount = gstCalc.gstAmount;
    }

    return {
      taxableAmount: totalTaxableAmount,
      gstAmount: totalGSTAmount,
      totalAmount: totalTaxableAmount + totalGSTAmount,
      igst: totalGSTAmount, // Assuming intra-state
      cgst: 0,
      sgst: 0
    };
  }

  /**
   * Calculate outward supplies for GSTR-3B
   */
  calculateOutwardSupplies(sales) {
    return sales.reduce((acc, sale) => {
      const saleGST = this.calculateSaleGST(sale);
      acc.taxableValue += saleGST.taxableAmount;
      acc.igst += saleGST.igst;
      acc.cgst += saleGST.cgst;
      acc.sgst += saleGST.sgst;
      return acc;
    }, {
      taxableValue: 0,
      igst: 0,
      cgst: 0,
      sgst: 0
    });
  }

  /**
   * Calculate input tax credit for GSTR-3B
   */
  calculateInputTaxCredit(purchases) {
    return purchases.reduce((acc, purchase) => {
      const purchaseGST = this.calculatePurchaseGST(purchase);
      acc.taxableValue += purchaseGST.taxableAmount;
      acc.igst += purchaseGST.igst;
      acc.cgst += purchaseGST.cgst;
      acc.sgst += purchaseGST.sgst;
      return acc;
    }, {
      taxableValue: 0,
      igst: 0,
      cgst: 0,
      sgst: 0
    });
  }

  /**
   * Calculate GST for a purchase transaction
   */
  calculatePurchaseGST(purchase) {
    let totalTaxableAmount = 0;
    let totalGSTAmount = 0;

    if (purchase.items && Array.isArray(purchase.items)) {
      purchase.items.forEach(item => {
        const itemTotal = (item.quantity || 0) * (item.price || 0);
        const gstRate = item.gstRate || this.getGSTRate(item.category);
        const gstCalc = this.calculateGST(itemTotal, gstRate);
        
        totalTaxableAmount += gstCalc.taxableAmount;
        totalGSTAmount += gstCalc.gstAmount;
      });
    } else {
      // Fallback for old data structure
      const itemTotal = (purchase.quantity || 0) * (purchase.price || 0);
      const gstRate = purchase.gstRate || 5;
      const gstCalc = this.calculateGST(itemTotal, gstRate);
      
      totalTaxableAmount = gstCalc.taxableAmount;
      totalGSTAmount = gstCalc.gstAmount;
    }

    return {
      taxableAmount: totalTaxableAmount,
      gstAmount: totalGSTAmount,
      totalAmount: totalTaxableAmount + totalGSTAmount,
      igst: totalGSTAmount, // Assuming intra-state
      cgst: 0,
      sgst: 0
    };
  }

  /**
   * Filter data by date range
   */
  filterByDateRange(data, startDate, endDate, dateField) {
    return data.filter(item => {
      const itemDate = item[dateField]?.toDate ? item[dateField].toDate() : new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }

  /**
   * Get company GSTIN
   */
  async getGSTIN() {
    try {
      const companyDetails = await shopDetailsService.getShopDetails();
      return companyDetails.gstNumber || '';
    } catch (error) {
      console.error('Error getting GSTIN:', error);
      return '';
    }
  }

  /**
   * Format period for GST returns
   */
  formatPeriod(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}${year}`;
  }

  /**
   * Format date for GST returns
   */
  formatDate(date) {
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Calculate due date for GST return
   */
  calculateDueDate(periodStartDate) {
    const nextMonth = new Date(periodStartDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(20); // GST returns are due on 20th of next month
    return nextMonth;
  }

  /**
   * Validate GST number format
   */
  validateGSTIN(gstin) {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  }

  /**
   * Generate GST compliance report
   */
  async generateComplianceReport() {
    try {
      const companyDetails = await shopDetailsService.getShopDetails();
      
      return {
        gstinConfigured: !!companyDetails.gstNumber,
        gstinValid: companyDetails.gstNumber ? this.validateGSTIN(companyDetails.gstNumber) : false,
        hsnCodesConfigured: true, // Assuming HSN codes are configured
        taxRatesConfigured: true, // Assuming tax rates are configured
        invoiceCompliance: true,  // Assuming invoices are GST compliant
        recommendations: this.getComplianceRecommendations(companyDetails)
      };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  /**
   * Get compliance recommendations
   */
  getComplianceRecommendations(companyDetails) {
    const recommendations = [];

    if (!companyDetails.gstNumber) {
      recommendations.push('Configure GSTIN in company settings');
    } else if (!this.validateGSTIN(companyDetails.gstNumber)) {
      recommendations.push('Verify GSTIN format - it appears to be invalid');
    }

    if (!companyDetails.panNumber) {
      recommendations.push('Add PAN number for complete tax compliance');
    }

    recommendations.push('Ensure all products have correct HSN codes');
    recommendations.push('Verify GST rates for all product categories');
    recommendations.push('File GST returns by 20th of every month');

    return recommendations;
  }
}

// Create singleton instance
export const gstService = new GSTService();
export default gstService;
