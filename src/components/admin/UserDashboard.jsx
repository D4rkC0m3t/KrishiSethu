import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Users,
  UserCheck,
  UserX,
  Activity,
  Calendar,
  Clock,
  Settings,
  RefreshCw,
  Search,
  Filter,
  Download,
  BarChart3,
  FileText,
  Mail,
  Phone,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  LogOut,
  Home,
  UserPlus,
  Edit,
  Trash2,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const UserDashboard = ({ onNavigate }) => {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [recentTrials, setRecentTrials] = useState([]);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    trialUsers: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    loadUsers();
  }, []);

  const normalizeProfile = (p) => {
    const subscriptions = Array.isArray(p.user_subscriptions) ? p.user_subscriptions : [];
    const isPaidFromSubs = subscriptions.some((s) => (s?.is_active && (s?.amount_paid || 0) > 0));
    const role = p.role || p.account_type || (p.is_paid || isPaidFromSubs ? 'paid' : 'trial');
    const trialEnd = p.trial_end_date || p.trial_end || null;
    const isActive = p.is_active !== false;
    const isPaid = Boolean(p.is_paid) || isPaidFromSubs || role === 'paid' || role === 'premium';
    const isActiveTrial = !isPaid && isActive && (!trialEnd || new Date(trialEnd) >= new Date());
    return {
      ...p,
      role,
      is_paid: isPaid,
      is_active: isActive,
      trial_end_date: trialEnd,
      _isActiveTrial: isActiveTrial
    };
  };

  const computeStats = (list) => {
    const totalUsers = list.length;
    const activeUsers = list.filter((u) => u.is_active).length;
    const premiumUsers = list.filter((u) => u.is_paid || u.role === 'premium' || u.role === 'paid').length;
    const trialUsers = list.filter((u) => u._isActiveTrial).length;
    return { totalUsers, activeUsers, premiumUsers, trialUsers };
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Prefer profiles as the authoritative user table
      let query = supabase
        .from('profiles')
        .select(`
          *,
          user_subscriptions (
            id,
            is_active,
            end_date,
            amount_paid
          )
        `)
        .order('created_at', { ascending: false });
      let { data, error } = await query;
      
      // Fallback to users table if profiles is unavailable or empty
      if ((error && (error.code === '42P01' || (error.message || '').includes('does not exist'))) || !data || data.length === 0) {
        const fallback = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        data = fallback.data || [];
        error = fallback.error;
      }
      
      if (error) throw error;
      
      // If we have users, normalize and use them
      if (data && data.length > 0) {
        const normalized = data.map(normalizeProfile);
        console.log('Loaded users from database:', normalized.length);
        setUsers(normalized);
        
        // Calculate user statistics
        setUserStats(computeStats(normalized));
        
        // Recent trial signups (limit to 10 most recent)
        const byCreated = [...normalized].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        const trials = byCreated.filter((u) => u._isActiveTrial).slice(0, 10);
        setRecentTrials(trials);
        
        // Select the first user by default
        setSelectedUser(normalized[0]);
        loadUserActivity(normalized[0].id);
      } else {
        // If no users found, create mock data
        console.log('No users found, creating mock data');
        const mockUsers = generateMockUsers();
        setUsers(mockUsers);
        
        setUserStats(computeStats(mockUsers));
        setRecentTrials(mockUsers.filter((u) => !u.is_paid && u.is_active).slice(0, 10));
        
        // Select the first mock user
        setSelectedUser(mockUsers[0]);
        loadUserActivity(mockUsers[0].id);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      
      // Create mock data on error
      const mockUsers = generateMockUsers();
      setUsers(mockUsers);
      
      setUserStats({
        totalUsers: mockUsers.length,
        activeUsers: mockUsers.filter(user => user.is_active).length,
        premiumUsers: mockUsers.filter(user => user.is_paid || user.role === 'premium').length,
        trialUsers: mockUsers.filter(user => (!user.is_paid || user.role === 'trial') && user.is_active).length
      });
      
      // Select the first mock user
      setSelectedUser(mockUsers[0]);
      loadUserActivity(mockUsers[0].id);
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivity = async (userId) => {
    try {
      // Fetch user activity logs
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      // If we have activity data, use it
      if (data && data.length > 0) {
        setUserActivity(data);
      } else {
        // Otherwise generate mock activity
        setUserActivity(generateMockActivity(userId));
      }
    } catch (error) {
      console.error('Error loading user activity:', error);
      setUserActivity(generateMockActivity(userId));
    }
  };

  // Generate mock users for demonstration
  const generateMockUsers = () => {
    return [
      {
        id: 'user-1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'admin',
        is_active: true,
        is_paid: true,
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        last_sign_in_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        phone: '+91 98765 43210',
        avatar_url: null
      },
      {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'trial',
        is_active: true,
        is_paid: false,
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        last_sign_in_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        trial_end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        phone: '+91 87654 32109',
        avatar_url: null
      }
    ];
  };

  // Generate mock activity data for demonstration
  const generateMockActivity = (userId) => {
    const actions = [
      'login', 'logout', 'view_inventory', 'add_product', 'edit_product',
      'create_sale', 'view_reports', 'update_settings', 'view_dashboard'
    ];
    
    const mockActivity = [];
    const now = new Date();
    
    for (let i = 0; i < 20; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const timestamp = new Date(now.getTime() - i * Math.floor(Math.random() * 12) * 60 * 60 * 1000);
      
      mockActivity.push({
        id: `mock-${userId}-${i}`,
        user_id: userId,
        action: action,
        details: `User performed ${action.replace('_', ' ')}`,
        ip_address: '192.168.1.' + Math.floor(Math.random() * 255),
        created_at: timestamp.toISOString(),
        status: Math.random() > 0.1 ? 'success' : 'failed'
      });
    }
    
    return mockActivity;
  };

  // UI rendering
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>User Dashboard</CardTitle>
          <CardDescription>Overview of users and recent activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded border bg-white">
              <div className="text-sm text-gray-500">Total Users</div>
              <div className="text-2xl font-semibold">{userStats.totalUsers}</div>
            </div>
            <div className="p-4 rounded border bg-white">
              <div className="text-sm text-gray-500">Active Trials</div>
              <div className="text-2xl font-semibold text-orange-600">{userStats.trialUsers}</div>
            </div>
            <div className="p-4 rounded border bg-white">
              <div className="text-sm text-gray-500">Active Users</div>
              <div className="text-2xl font-semibold text-green-700">{userStats.activeUsers}</div>
            </div>
            <div className="p-4 rounded border bg-white">
              <div className="text-sm text-gray-500">Paid/Premium</div>
              <div className="text-2xl font-semibold text-purple-700">{userStats.premiumUsers}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="font-medium mb-2">Users ({users.length})</h2>
              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className={`p-2 rounded border ${selectedUser?.id === u.id ? 'bg-green-50 border-green-300' : 'bg-white'}`}
                    onClick={() => setSelectedUser(u)}
                  >
                    <div className="font-medium">{u.name || u.full_name || u.email}</div>
                    <div className="text-sm text-gray-500">{u.email} · {u.role || (u.is_paid ? 'paid' : 'trial')}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-medium mb-2">Recent Trial Signups</h2>
              <div className="space-y-2 max-h-80 overflow-auto">
                {recentTrials.length === 0 && (
                  <div className="text-sm text-gray-500">No recent trial users found.</div>
                )}
                {recentTrials.map((u) => {
                  const daysLeft = u.trial_end_date ? Math.max(0, Math.ceil((new Date(u.trial_end_date) - new Date()) / (1000*60*60*24))) : null;
                  return (
                    <div key={u.id} className="p-2 rounded border bg-white">
                      <div className="text-sm font-medium">{u.name || u.full_name || u.email}</div>
                      <div className="text-xs text-gray-500">Registered: {new Date(u.created_at || Date.now()).toLocaleDateString()} {daysLeft !== null ? `· ${daysLeft} days left` : ''}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;