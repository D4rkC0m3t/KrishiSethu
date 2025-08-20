// Real-time Alerts Service for Krishisethu Inventory Management
// Handles email, SMS, and push notifications for inventory alerts

class AlertsService {
  constructor() {
    this.alertRules = this.loadAlertRules();
    this.alertHistory = this.loadAlertHistory();
    this.isEnabled = true;
    this.emailService = null;
    this.smsService = null;
    this.webhookEndpoints = this.loadWebhookEndpoints();
  }

  // Load alert rules from localStorage
  loadAlertRules() {
    try {
      const saved = localStorage.getItem('alertRules');
      return saved ? JSON.parse(saved) : this.getDefaultAlertRules();
    } catch (error) {
      console.error('Error loading alert rules:', error);
      return this.getDefaultAlertRules();
    }
  }

  // Get default alert rules
  getDefaultAlertRules() {
    return {
      lowStock: {
        enabled: true,
        threshold: 10,
        channels: ['push', 'email'],
        frequency: 'daily',
        template: 'Product {{productName}} is running low ({{currentStock}} remaining)'
      },
      outOfStock: {
        enabled: true,
        threshold: 0,
        channels: ['push', 'email', 'sms'],
        frequency: 'immediate',
        template: 'URGENT: {{productName}} is out of stock!'
      },
      expiringSoon: {
        enabled: true,
        threshold: 7, // days
        channels: ['push', 'email'],
        frequency: 'daily',
        template: 'Product {{productName}} expires in {{daysUntilExpiry}} days'
      },
      expired: {
        enabled: true,
        threshold: 0,
        channels: ['push', 'email', 'sms'],
        frequency: 'immediate',
        template: 'EXPIRED: {{productName}} has expired on {{expiryDate}}'
      },
      highValue: {
        enabled: true,
        threshold: 10000, // value threshold
        channels: ['push', 'email'],
        frequency: 'immediate',
        template: 'High-value product {{productName}} (₹{{value}}) needs attention'
      }
    };
  }

  // Load alert history
  loadAlertHistory() {
    try {
      const saved = localStorage.getItem('alertHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading alert history:', error);
      return [];
    }
  }

  // Save alert history
  saveAlertHistory() {
    try {
      localStorage.setItem('alertHistory', JSON.stringify(this.alertHistory));
    } catch (error) {
      console.error('Error saving alert history:', error);
    }
  }

  // Load webhook endpoints
  loadWebhookEndpoints() {
    try {
      const saved = localStorage.getItem('webhookEndpoints');
      return saved ? JSON.parse(saved) : {
        email: process.env.REACT_APP_EMAIL_WEBHOOK || '',
        sms: process.env.REACT_APP_SMS_WEBHOOK || '',
        slack: process.env.REACT_APP_SLACK_WEBHOOK || ''
      };
    } catch (error) {
      console.error('Error loading webhook endpoints:', error);
      return {};
    }
  }

  // Check products for alerts
  async checkProductAlerts(products) {
    if (!this.isEnabled || !products || products.length === 0) {
      return [];
    }

    const alerts = [];
    const now = new Date();

    for (const product of products) {
      try {
        // Check stock levels
        const stockAlerts = this.checkStockAlerts(product);
        alerts.push(...stockAlerts);

        // Check expiry dates
        const expiryAlerts = this.checkExpiryAlerts(product, now);
        alerts.push(...expiryAlerts);

        // Check high-value products
        const valueAlerts = this.checkValueAlerts(product);
        alerts.push(...valueAlerts);

      } catch (error) {
        console.error(`Error checking alerts for product ${product.id}:`, error);
      }
    }

    // Process and send alerts
    for (const alert of alerts) {
      await this.processAlert(alert);
    }

    return alerts;
  }

  // Check stock level alerts
  checkStockAlerts(product) {
    const alerts = [];
    const currentStock = product.quantity || 0;

    // Out of stock
    if (currentStock === 0 && this.alertRules.outOfStock.enabled) {
      alerts.push({
        id: `out-of-stock-${product.id}-${Date.now()}`,
        type: 'outOfStock',
        productId: product.id,
        productName: product.name,
        currentStock,
        priority: 'critical',
        rule: this.alertRules.outOfStock,
        timestamp: new Date()
      });
    }
    // Low stock
    else if (currentStock <= this.alertRules.lowStock.threshold && this.alertRules.lowStock.enabled) {
      alerts.push({
        id: `low-stock-${product.id}-${Date.now()}`,
        type: 'lowStock',
        productId: product.id,
        productName: product.name,
        currentStock,
        threshold: this.alertRules.lowStock.threshold,
        priority: 'high',
        rule: this.alertRules.lowStock,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  // Check expiry alerts
  checkExpiryAlerts(product, now) {
    const alerts = [];
    
    if (!product.expiryDate) return alerts;

    const expiryDate = product.expiryDate instanceof Date ? 
      product.expiryDate : 
      new Date(product.expiryDate);

    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    // Expired
    if (daysUntilExpiry < 0 && this.alertRules.expired.enabled) {
      alerts.push({
        id: `expired-${product.id}-${Date.now()}`,
        type: 'expired',
        productId: product.id,
        productName: product.name,
        expiryDate: expiryDate.toLocaleDateString(),
        daysOverdue: Math.abs(daysUntilExpiry),
        priority: 'critical',
        rule: this.alertRules.expired,
        timestamp: new Date()
      });
    }
    // Expiring soon
    else if (daysUntilExpiry <= this.alertRules.expiringSoon.threshold && 
             daysUntilExpiry >= 0 && 
             this.alertRules.expiringSoon.enabled) {
      alerts.push({
        id: `expiring-${product.id}-${Date.now()}`,
        type: 'expiringSoon',
        productId: product.id,
        productName: product.name,
        expiryDate: expiryDate.toLocaleDateString(),
        daysUntilExpiry,
        priority: daysUntilExpiry <= 1 ? 'critical' : 'high',
        rule: this.alertRules.expiringSoon,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  // Check high-value product alerts
  checkValueAlerts(product) {
    const alerts = [];
    const productValue = (product.quantity || 0) * (product.purchasePrice || 0);

    if (productValue >= this.alertRules.highValue.threshold && 
        this.alertRules.highValue.enabled &&
        (product.quantity <= 5 || this.hasExpiryIssue(product))) {
      
      alerts.push({
        id: `high-value-${product.id}-${Date.now()}`,
        type: 'highValue',
        productId: product.id,
        productName: product.name,
        value: productValue,
        quantity: product.quantity,
        priority: 'high',
        rule: this.alertRules.highValue,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  // Check if product has expiry issues
  hasExpiryIssue(product) {
    if (!product.expiryDate) return false;
    
    const expiryDate = product.expiryDate instanceof Date ? 
      product.expiryDate : 
      new Date(product.expiryDate);
    
    const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7;
  }

  // Process and send alert
  async processAlert(alert) {
    try {
      // Check if we should send this alert (frequency control)
      if (!this.shouldSendAlert(alert)) {
        return;
      }

      // Format alert message
      const message = this.formatAlertMessage(alert);

      // Send through configured channels
      const promises = alert.rule.channels.map(channel => 
        this.sendAlertThroughChannel(channel, alert, message)
      );

      await Promise.allSettled(promises);

      // Record alert in history
      this.recordAlert(alert, message);

      console.log(`[Alerts] Processed alert: ${alert.type} for ${alert.productName}`);
    } catch (error) {
      console.error('Error processing alert:', error);
    }
  }

  // Check if alert should be sent based on frequency rules
  shouldSendAlert(alert) {
    const rule = alert.rule;
    const alertKey = `${alert.type}-${alert.productId}`;
    
    // Find last alert of same type for same product
    const lastAlert = this.alertHistory
      .filter(h => h.type === alert.type && h.productId === alert.productId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    if (!lastAlert) return true;

    const timeSinceLastAlert = Date.now() - new Date(lastAlert.timestamp).getTime();
    
    switch (rule.frequency) {
      case 'immediate':
        return true;
      case 'hourly':
        return timeSinceLastAlert > 60 * 60 * 1000;
      case 'daily':
        return timeSinceLastAlert > 24 * 60 * 60 * 1000;
      case 'weekly':
        return timeSinceLastAlert > 7 * 24 * 60 * 60 * 1000;
      default:
        return true;
    }
  }

  // Format alert message using template
  formatAlertMessage(alert) {
    let message = alert.rule.template;
    
    // Replace placeholders
    Object.keys(alert).forEach(key => {
      const placeholder = `{{${key}}}`;
      if (message.includes(placeholder)) {
        message = message.replace(new RegExp(placeholder, 'g'), alert[key]);
      }
    });

    return message;
  }

  // Send alert through specific channel
  async sendAlertThroughChannel(channel, alert, message) {
    try {
      switch (channel) {
        case 'push':
          await this.sendPushNotification(alert, message);
          break;
        case 'email':
          await this.sendEmailAlert(alert, message);
          break;
        case 'sms':
          await this.sendSMSAlert(alert, message);
          break;
        case 'webhook':
          await this.sendWebhookAlert(alert, message);
          break;
        default:
          console.warn(`Unknown alert channel: ${channel}`);
      }
    } catch (error) {
      console.error(`Error sending alert through ${channel}:`, error);
    }
  }

  // Send push notification
  async sendPushNotification(alert, message) {
    try {
      // Import notification service dynamically
      const { notificationService } = await import('./notificationService');
      
      const notificationType = alert.type === 'outOfStock' ? 'outOfStock' :
                              alert.type === 'lowStock' ? 'lowStock' :
                              alert.type === 'expired' ? 'expired' :
                              alert.type === 'expiringSoon' ? 'expiringSoon' : 'general';

      notificationService.showInventoryAlert(notificationType, {
        productId: alert.productId,
        productName: alert.productName,
        quantity: alert.currentStock,
        daysUntilExpiry: alert.daysUntilExpiry,
        priority: alert.priority
      });

      console.log(`[Alerts] Push notification sent for ${alert.type}`);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Send email alert (requires backend service)
  async sendEmailAlert(alert, message) {
    if (!this.webhookEndpoints.email) {
      console.warn('[Alerts] Email webhook not configured');
      return;
    }

    try {
      const response = await fetch(this.webhookEndpoints.email, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'inventory_alert',
          alert: alert,
          message: message,
          timestamp: new Date().toISOString(),
          priority: alert.priority
        })
      });

      if (response.ok) {
        console.log(`[Alerts] Email sent for ${alert.type}`);
      } else {
        throw new Error(`Email service responded with ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending email alert:', error);
    }
  }

  // Send SMS alert (requires backend service)
  async sendSMSAlert(alert, message) {
    if (!this.webhookEndpoints.sms) {
      console.warn('[Alerts] SMS webhook not configured');
      return;
    }

    try {
      const response = await fetch(this.webhookEndpoints.sms, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'inventory_alert',
          alert: alert,
          message: message.substring(0, 160), // SMS length limit
          timestamp: new Date().toISOString(),
          priority: alert.priority
        })
      });

      if (response.ok) {
        console.log(`[Alerts] SMS sent for ${alert.type}`);
      } else {
        throw new Error(`SMS service responded with ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending SMS alert:', error);
    }
  }

  // Send webhook alert
  async sendWebhookAlert(alert, message) {
    if (!this.webhookEndpoints.slack) {
      console.warn('[Alerts] Webhook endpoint not configured');
      return;
    }

    try {
      const response = await fetch(this.webhookEndpoints.slack, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `🚨 Inventory Alert: ${message}`,
          attachments: [{
            color: alert.priority === 'critical' ? 'danger' : 
                   alert.priority === 'high' ? 'warning' : 'good',
            fields: [
              { title: 'Product', value: alert.productName, short: true },
              { title: 'Type', value: alert.type, short: true },
              { title: 'Priority', value: alert.priority, short: true },
              { title: 'Time', value: alert.timestamp.toLocaleString(), short: true }
            ]
          }]
        })
      });

      if (response.ok) {
        console.log(`[Alerts] Webhook sent for ${alert.type}`);
      } else {
        throw new Error(`Webhook service responded with ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending webhook alert:', error);
    }
  }

  // Record alert in history
  recordAlert(alert, message) {
    this.alertHistory.push({
      ...alert,
      message,
      sentAt: new Date()
    });

    // Keep only last 1000 alerts
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }

    this.saveAlertHistory();
  }

  // Get alert statistics
  getAlertStats(days = 7) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentAlerts = this.alertHistory.filter(alert => 
      new Date(alert.timestamp) > cutoff
    );

    const stats = {
      total: recentAlerts.length,
      byType: {},
      byPriority: {},
      byDay: {}
    };

    recentAlerts.forEach(alert => {
      // By type
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
      
      // By priority
      stats.byPriority[alert.priority] = (stats.byPriority[alert.priority] || 0) + 1;
      
      // By day
      const day = new Date(alert.timestamp).toDateString();
      stats.byDay[day] = (stats.byDay[day] || 0) + 1;
    });

    return stats;
  }

  // Update alert rules
  updateAlertRules(newRules) {
    this.alertRules = { ...this.alertRules, ...newRules };
    localStorage.setItem('alertRules', JSON.stringify(this.alertRules));
  }

  // Update webhook endpoints
  updateWebhookEndpoints(endpoints) {
    this.webhookEndpoints = { ...this.webhookEndpoints, ...endpoints };
    localStorage.setItem('webhookEndpoints', JSON.stringify(this.webhookEndpoints));
  }

  // Enable/disable alerts
  setEnabled(enabled) {
    this.isEnabled = enabled;
    localStorage.setItem('alertsEnabled', enabled.toString());
  }

  // Test alert system
  async testAlert(type = 'lowStock') {
    const testAlert = {
      id: `test-${type}-${Date.now()}`,
      type: type,
      productId: 'test-product',
      productName: 'Test Product',
      currentStock: type === 'lowStock' ? 5 : 0,
      priority: type === 'outOfStock' ? 'critical' : 'high',
      rule: this.alertRules[type],
      timestamp: new Date()
    };

    if (type === 'expiringSoon') {
      testAlert.daysUntilExpiry = 3;
      testAlert.expiryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString();
    }

    await this.processAlert(testAlert);
    return testAlert;
  }
}

// Create singleton instance
export const alertsService = new AlertsService();

export default alertsService;
