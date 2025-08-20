import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Calendar,
  Mail,
  Phone,
  Building,
  Search,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Shield,
  Bell
} from 'lucide-react';

const AdminControlPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTrials: 0,
    expiredTrials: 0,
    paidUsers: 0,
    expiringIn3Days: 0
  });

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
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
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: allUsers, error } = await supabase
        .from('profiles')
        .select('trial_end, is_active, is_paid, account_type');

      if (error) throw error;

      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const stats = {
        totalUsers: allUsers.length,
        activeTrials: allUsers.filter(u => !u.is_paid && u.is_active).length,
        expiredTrials: allUsers.filter(u => !u.is_paid && !u.is_active).length,
        paidUsers: allUsers.filter(u => u.is_paid).length,
        expiringIn3Days: allUsers.filter(u => {
          if (u.is_paid || !u.is_active) return false;
          const trialEnd = new Date(u.trial_end);
          return trialEnd <= threeDaysFromNow && trialEnd > now;
        }).length
      };

      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getTrialStatus = (user) => {
    const now = new Date();
    const trialEnd = new Date(user.trial_end);
    const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

    if (user.is_paid) {
      return { status: 'paid', label: 'Paid', color: 'bg-green-500', daysLeft: null };
    } else if (!user.is_active) {
      return { status: 'disabled', label: 'Disabled', color: 'bg-red-500', daysLeft: 0 };
    } else if (daysLeft <= 0) {
      return { status: 'expired', label: 'Expired', color: 'bg-red-500', daysLeft: 0 };
    } else if (daysLeft <= 3) {
      return { status: 'expiring', label: `${daysLeft} days left`, color: 'bg-orange-500', daysLeft };
    } else {
      return { status: 'active', label: `${daysLeft} days left`, color: 'bg-blue-500', daysLeft };
    }
  };

  const handleUserAction = async (userId, action, value = null) => {
    try {
      let updateData = {};
      let actionDetails = { action, userId };

      switch (action) {
        case 'disable':
          updateData = { is_active: false, disabled_reason: 'admin_action' };
          actionDetails.reason = 'Account disabled by admin';
          break;
        case 'enable':
          updateData = { is_active: true, disabled_reason: null };
          actionDetails.reason = 'Account enabled by admin';
          break;
        case 'extend_trial':
          const currentTrialEnd = users.find(u => u.id === userId)?.trial_end;
          const newTrialEnd = new Date(currentTrialEnd);
          newTrialEnd.setDate(newTrialEnd.getDate() + (value || 7));
          updateData = { 
            trial_end: newTrialEnd.toISOString(),
            trial_extended_count: supabase.sql`trial_extended_count + 1`
          };
          actionDetails.days_extended = value || 7;
          break;
        case 'mark_paid':
          updateData = { is_paid: true, account_type: 'paid' };
          actionDetails.reason = 'Marked as paid by admin';
          break;
        case 'reset_trial':
          const newTrialStart = new Date();
          const newTrialEndDate = new Date(newTrialStart.getTime() + 30 * 24 * 60 * 60 * 1000);
          updateData = {
            trial_start: newTrialStart.toISOString(),
            trial_end: newTrialEndDate.toISOString(),
            is_active: true,
            is_paid: false,
            trial_extended_count: 0
          };
          actionDetails.reason = 'Trial reset by admin';
          break;
      }

      // Update user
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log admin action
      const { error: logError } = await supabase
        .from('admin_actions')
        .insert({
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          target_user_id: userId,
          action_type: action,
          action_details: actionDetails
        });

      if (logError) console.error('Error logging admin action:', logError);

      // Reload data
      await loadUsers();
      await loadStats();

      alert(`Action "${action}" completed successfully!`);
    } catch (error) {
      console.error('Error performing user action:', error);
      alert('Failed to perform action. Please try again.');
    }
  };

  const sendNotification = async (userId, type) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      let message = '';
      switch (type) {
        case 'trial_warning':
          const trialStatus = getTrialStatus(user);
          message = `Your trial expires in ${trialStatus.daysLeft} days. Upgrade now to continue using KrishiSethu.`;
          break;
        case 'trial_expired':
          message = 'Your trial has expired. Please upgrade to continue using KrishiSethu.';
          break;
        case 'account_disabled':
          message = 'Your account has been temporarily disabled. Please contact support.';
          break;
      }

      // Log notification
      const { error } = await supabase
        .from('notification_logs')
        .insert({
          user_id: userId,
          notification_type: type,
          message,
          email_sent: true // In real implementation, integrate with email service
        });

      if (error) throw error;

      alert('Notification sent successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification.');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.company_name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (filterStatus) {
      case 'active':
        return user.is_active && !user.is_paid;
      case 'expired':
        return !user.is_active || (new Date() > new Date(user.trial_end) && !user.is_paid);
      case 'paid':
        return user.is_paid;
      case 'expiring':
        const trialStatus = getTrialStatus(user);
        return trialStatus.status === 'expiring';
      default:
        return true;
    }
  });

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Company', 'Phone', 'Trial Start', 'Trial End', 'Status', 'Account Type', 'Created At'].join(','),
      ...filteredUsers.map(user => [
        user.name || '',
        user.email || '',
        user.company_name || '',
        user.phone || '',
        user.trial_start ? new Date(user.trial_start).toLocaleDateString() : '',
        user.trial_end ? new Date(user.trial_end).toLocaleDateString() : '',
        user.is_active ? 'Active' : 'Disabled',
        user.account_type || 'trial',
        user.created_at ? new Date(user.created_at).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
          <p className="text-gray-600">Manage users, trials, and system settings</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadUsers} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportUsers} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Trials</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeTrials}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">{stats.expiringIn3Days}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Users</p>
                <p className="text-2xl font-bold text-green-600">{stats.paidUsers}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">{stats.expiredTrials}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Users</option>
                <option value="active">Active Trials</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired</option>
                <option value="paid">Paid Users</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user accounts, trial periods, and subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Contact</th>
                    <th className="text-left p-2">Trial Status</th>
                    <th className="text-left p-2">Account</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const trialStatus = getTrialStatus(user);
                    return (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{user.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.company_name && (
                              <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {user.company_name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            {user.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge className={`${trialStatus.color} text-white`}>
                            {trialStatus.label}
                          </Badge>
                          {user.trial_extended_count > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              Extended {user.trial_extended_count} times
                            </div>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            {user.is_active ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-sm">
                              {user.account_type || 'trial'}
                            </span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {user.is_active ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUserAction(user.id, 'disable')}
                              >
                                Disable
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUserAction(user.id, 'enable')}
                              >
                                Enable
                              </Button>
                            )}
                            
                            {!user.is_paid && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUserAction(user.id, 'extend_trial', 7)}
                                >
                                  +7 Days
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUserAction(user.id, 'mark_paid')}
                                >
                                  Mark Paid
                                </Button>
                              </>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendNotification(user.id, 'trial_warning')}
                            >
                              <Bell className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found matching your criteria.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminControlPanel;

// Trial Status Banner Component
export const TrialStatusBanner = ({ user, onUpgrade }) => {
  const [trialInfo, setTrialInfo] = useState(null);

  useEffect(() => {
    if (user) {
      const now = new Date();
      const trialEnd = new Date(user.trial_end);
      const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

      setTrialInfo({
        daysLeft: Math.max(0, daysLeft),
        isExpired: now > trialEnd,
        isExpiringSoon: daysLeft <= 3 && daysLeft > 0,
        isPaid: user.is_paid
      });
    }
  }, [user]);

  if (!trialInfo || trialInfo.isPaid) return null;

  if (trialInfo.isExpired) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Trial Expired</h3>
              <p className="text-sm text-red-700">
                Your 30-day trial has ended. Upgrade now to continue using KrishiSethu.
              </p>
            </div>
          </div>
          <Button onClick={onUpgrade} className="bg-red-600 hover:bg-red-700">
            Upgrade Now
          </Button>
        </div>
      </div>
    );
  }

  if (trialInfo.isExpiringSoon) {
    return (
      <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-orange-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-orange-800">Trial Ending Soon</h3>
              <p className="text-sm text-orange-700">
                Your trial expires in {trialInfo.daysLeft} day{trialInfo.daysLeft !== 1 ? 's' : ''}.
                Upgrade to continue using all features.
              </p>
            </div>
          </div>
          <Button onClick={onUpgrade} className="bg-orange-600 hover:bg-orange-700">
            Upgrade Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-blue-400 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Free Trial Active</h3>
            <p className="text-sm text-blue-700">
              {trialInfo.daysLeft} days remaining in your free trial.
            </p>
          </div>
        </div>
        <Button onClick={onUpgrade} variant="outline">
          Upgrade Early
        </Button>
      </div>
    </div>
  );
};
