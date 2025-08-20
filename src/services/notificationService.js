import { supabase } from '../lib/supabase';

/**
 * Notification Service for Trial Management
 * Handles automated notifications for trial expiration, warnings, etc.
 */
export class NotificationService {
  
  /**
   * Check for users whose trials are expiring soon and send notifications
   */
  static async checkExpiringTrials() {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

      // Get users whose trials expire in 3 days or 1 day
      const { data: expiringUsers, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .eq('is_paid', false)
        .or(`trial_end.lte.${threeDaysFromNow.toISOString()},trial_end.lte.${oneDayFromNow.toISOString()}`)
        .gt('trial_end', now.toISOString());

      if (error) {
        console.error('Error fetching expiring users:', error);
        return;
      }

      for (const user of expiringUsers) {
        const trialEnd = new Date(user.trial_end);
        const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

        // Check if we've already sent a notification recently
        const { data: recentNotifications } = await supabase
          .from('notification_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('notification_type', 'trial_warning')
          .gte('sent_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

        if (recentNotifications && recentNotifications.length > 0) {
          continue; // Skip if already notified in last 24 hours
        }

        // Send notification based on days left
        if (daysLeft <= 3) {
          await this.sendTrialWarning(user, daysLeft);
        }
      }

      console.log(`Checked ${expiringUsers.length} expiring trials`);
    } catch (error) {
      console.error('Error checking expiring trials:', error);
    }
  }

  /**
   * Check for expired trials and disable accounts
   */
  static async checkExpiredTrials() {
    try {
      const now = new Date();

      // Get users whose trials have expired
      const { data: expiredUsers, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .eq('is_paid', false)
        .lt('trial_end', now.toISOString());

      if (error) {
        console.error('Error fetching expired users:', error);
        return;
      }

      for (const user of expiredUsers) {
        // Disable the account
        await supabase
          .from('profiles')
          .update({
            is_active: false,
            disabled_reason: 'trial_expired'
          })
          .eq('id', user.id);

        // Send expiration notification
        await this.sendTrialExpiredNotification(user);

        console.log(`Disabled expired trial for user: ${user.email}`);
      }

      console.log(`Processed ${expiredUsers.length} expired trials`);
    } catch (error) {
      console.error('Error checking expired trials:', error);
    }
  }

  /**
   * Send trial warning notification
   */
  static async sendTrialWarning(user, daysLeft) {
    try {
      const message = `Hi ${user.name || 'there'}! Your KrishiSethu trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Upgrade now to continue using all features without interruption.`;

      // Log the notification
      await supabase
        .from('notification_logs')
        .insert({
          user_id: user.id,
          notification_type: 'trial_warning',
          message,
          email_sent: true // In production, integrate with actual email service
        });

      // In production, integrate with email service like:
      // - SendGrid
      // - Postmark
      // - AWS SES
      // - Resend
      
      console.log(`Trial warning sent to ${user.email}: ${daysLeft} days left`);
      
      // For now, we'll just log it. In production, you would:
      // await this.sendEmail(user.email, 'Trial Expiring Soon', message);
      
    } catch (error) {
      console.error('Error sending trial warning:', error);
    }
  }

  /**
   * Send trial expired notification
   */
  static async sendTrialExpiredNotification(user) {
    try {
      const message = `Hi ${user.name || 'there'}! Your KrishiSethu trial has expired. Your account has been temporarily disabled. Upgrade now to reactivate your account and continue managing your inventory.`;

      // Log the notification
      await supabase
        .from('notification_logs')
        .insert({
          user_id: user.id,
          notification_type: 'trial_expired',
          message,
          email_sent: true
        });

      console.log(`Trial expired notification sent to ${user.email}`);
      
    } catch (error) {
      console.error('Error sending trial expired notification:', error);
    }
  }

  /**
   * Send account disabled notification
   */
  static async sendAccountDisabledNotification(user, reason) {
    try {
      const message = `Hi ${user.name || 'there'}! Your KrishiSethu account has been temporarily disabled. Reason: ${reason}. Please contact support for assistance.`;

      // Log the notification
      await supabase
        .from('notification_logs')
        .insert({
          user_id: user.id,
          notification_type: 'account_disabled',
          message,
          email_sent: true
        });

      console.log(`Account disabled notification sent to ${user.email}`);
      
    } catch (error) {
      console.error('Error sending account disabled notification:', error);
    }
  }

  /**
   * Get notification history for a user
   */
  static async getUserNotifications(userId) {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read (for in-app notifications)
   */
  static async markNotificationAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Send custom notification to user
   */
  static async sendCustomNotification(userId, type, message) {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .insert({
          user_id: userId,
          notification_type: type,
          message,
          email_sent: true
        });

      if (error) throw error;
      console.log(`Custom notification sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending custom notification:', error);
    }
  }

  /**
   * Get system notification stats
   */
  static async getNotificationStats() {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('notification_type, delivery_status')
        .gte('sent_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats = {
        total: data.length,
        trial_warnings: data.filter(n => n.notification_type === 'trial_warning').length,
        trial_expired: data.filter(n => n.notification_type === 'trial_expired').length,
        account_disabled: data.filter(n => n.notification_type === 'account_disabled').length,
        failed: data.filter(n => n.delivery_status === 'failed').length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return {};
    }
  }

  /**
   * Initialize automated trial monitoring
   * This should be called from a cron job or scheduled function
   */
  static async runDailyTrialCheck() {
    console.log('Starting daily trial check...');
    
    try {
      await this.checkExpiringTrials();
      await this.checkExpiredTrials();
      
      console.log('Daily trial check completed successfully');
    } catch (error) {
      console.error('Error in daily trial check:', error);
    }
  }
}

export default NotificationService;
