import { supabase } from '../lib/supabase';
import NotificationService from './notificationService';

/**
 * User Management Service
 * Handles user account operations, trial management, and admin functions
 */
export class UserManagementService {

  /**
   * Get all users with their trial status
   */
  static async getAllUsers(filters = {}) {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          user_subscriptions (
            id,
            plan_id,
            start_date,
            end_date,
            is_active,
            amount_paid
          )
        `);

      // Apply filters
      if (filters.status) {
        switch (filters.status) {
          case 'active':
            query = query.eq('is_active', true).eq('is_paid', false);
            break;
          case 'expired':
            query = query.eq('is_active', false);
            break;
          case 'paid':
            query = query.eq('is_paid', true);
            break;
        }
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID with full details
   */
  static async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_subscriptions (*),
          notification_logs (*)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Disable user account
   */
  static async disableUser(userId, reason, adminId) {
    try {
      // Update user status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_active: false,
          disabled_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log admin action
      await this.logAdminAction(adminId, userId, 'disable_account', { reason });

      // Send notification to user
      const user = await this.getUserById(userId);
      await NotificationService.sendAccountDisabledNotification(user, reason);

      return true;
    } catch (error) {
      console.error('Error disabling user:', error);
      throw error;
    }
  }

  /**
   * Enable user account
   */
  static async enableUser(userId, adminId) {
    try {
      // Update user status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_active: true,
          disabled_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log admin action
      await this.logAdminAction(adminId, userId, 'enable_account', {});

      return true;
    } catch (error) {
      console.error('Error enabling user:', error);
      throw error;
    }
  }

  /**
   * Extend user trial
   */
  static async extendTrial(userId, days, adminId) {
    try {
      // Get current user
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');

      // Calculate new trial end date
      const currentTrialEnd = new Date(user.trial_end);
      const newTrialEnd = new Date(currentTrialEnd.getTime() + days * 24 * 60 * 60 * 1000);

      // Update user
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          trial_end: newTrialEnd.toISOString(),
          trial_extended_count: (user.trial_extended_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log admin action
      await this.logAdminAction(adminId, userId, 'extend_trial', { 
        days_extended: days,
        new_trial_end: newTrialEnd.toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error extending trial:', error);
      throw error;
    }
  }

  /**
   * Mark user as paid
   */
  static async markUserAsPaid(userId, adminId) {
    try {
      // Update user status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_paid: true,
          account_type: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log admin action
      await this.logAdminAction(adminId, userId, 'mark_paid', {});

      return true;
    } catch (error) {
      console.error('Error marking user as paid:', error);
      throw error;
    }
  }

  /**
   * Reset user trial
   */
  static async resetTrial(userId, adminId) {
    try {
      const now = new Date();
      const newTrialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Update user
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          trial_start: now.toISOString(),
          trial_end: newTrialEnd.toISOString(),
          trial_extended_count: 0,
          is_active: true,
          is_paid: false,
          account_type: 'trial',
          disabled_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log admin action
      await this.logAdminAction(adminId, userId, 'reset_trial', {
        new_trial_start: now.toISOString(),
        new_trial_end: newTrialEnd.toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error resetting trial:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  static async deleteUser(userId, adminId) {
    try {
      // Note: This will cascade delete due to foreign key constraints
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      // Log admin action
      await this.logAdminAction(adminId, userId, 'delete_account', {});

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats() {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('trial_end, is_active, is_paid, account_type, created_at');

      if (error) throw error;

      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const stats = {
        total: users.length,
        active_trials: users.filter(u => !u.is_paid && u.is_active).length,
        expired_trials: users.filter(u => !u.is_paid && !u.is_active).length,
        paid_users: users.filter(u => u.is_paid).length,
        expiring_soon: users.filter(u => {
          if (u.is_paid || !u.is_active) return false;
          const trialEnd = new Date(u.trial_end);
          return trialEnd <= threeDaysFromNow && trialEnd > now;
        }).length,
        new_this_month: users.filter(u => {
          const created = new Date(u.created_at);
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          return created >= monthStart;
        }).length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  /**
   * Log admin action
   */
  static async logAdminAction(adminId, targetUserId, actionType, actionDetails) {
    try {
      const { error } = await supabase
        .from('admin_actions')
        .insert({
          admin_id: adminId,
          target_user_id: targetUserId,
          action_type: actionType,
          action_details: actionDetails
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  /**
   * Get admin action history
   */
  static async getAdminActions(filters = {}) {
    try {
      let query = supabase
        .from('admin_actions')
        .select(`
          *,
          admin:admin_id (name, email),
          target_user:target_user_id (name, email)
        `);

      if (filters.adminId) {
        query = query.eq('admin_id', filters.adminId);
      }

      if (filters.targetUserId) {
        query = query.eq('target_user_id', filters.targetUserId);
      }

      if (filters.actionType) {
        query = query.eq('action_type', filters.actionType);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(filters.limit || 100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching admin actions:', error);
      throw error;
    }
  }

  /**
   * Check if user is admin
   */
  static async isAdmin(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.account_type === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Create admin user
   */
  static async createAdmin(email, name, password) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
      });

      if (authError) throw authError;

      // Update profile to admin
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          account_type: 'admin',
          is_paid: true,
          trial_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      return authData.user;
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  }
}

export default UserManagementService;
