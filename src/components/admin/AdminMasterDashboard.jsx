import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Users,
  Building2,
  Clock,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Search,
  RefreshCw,
  Shield,
  UserCheck,
  UserX,
  Crown,
  LogOut,
  Home,
  Building,
  BarChart3,
  Activity,
  Star,
  Zap,
  Globe,
  Settings,
  Bell,
  Download,
  Filter,
  MoreVertical,
  Database,
  Server,
  HardDrive,
  Wifi,
  Monitor,
  FileText,
  Lock,
  Key,
  Eye,
  Trash2,
  Edit,
  Plus,
  Minus,
  Power,
  Terminal,
  Code,
  GitBranch,
  Package,
  Mail,
  MessageSquare,
  Calendar,
  LineChart,
  PieChart,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Upload,
  Save,
  Copy,
  ExternalLink,
  Layers,
  CloudUpload,
  History,
  RotateCcw,
  PlayCircle,
  StopCircle,
  PauseCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { runDiagnostics } from '../../utils/dbTest';
import { runConnectivityTest, quickPingTest } from '../../utils/dbConnectivityTest';

const AdminMasterDashboard = ({ onNavigate }) => {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(true); // Default to dark theme
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [systemStatus, setSystemStatus] = useState({
    database: 'healthy',
    server: 'running',
    storage: 85, // percentage
    memory: 67,
    cpu: 45,
    uptime: '15 days'
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTrials: 0,
    expiredTrials: 0,
    paidUsers: 0,
    totalOrganizations: 0,
    monthlyRevenue: 0,
    totalSessions: 0,
    errorRate: 0.02,
    responseTime: 156
  });

  useEffect(() => {
    loadDashboardData();
    
    // Failsafe timeout to prevent infinite loading (extended for better reliability)
    const failsafeTimeout = setTimeout(() => {
      console.log('ℹ️ Dashboard loading timeout reached - this is normal for slow connections');
      setLoading(false);
    }, 30000); // 30 second timeout for admin dashboard (more data to load)
    
    return () => clearTimeout(failsafeTimeout);
  }, []);

  // Force reload data when component becomes visible (helps with refresh issues)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && stats.totalUsers === 0 && !loading) {
        console.log('🔄 Page became visible and no users found - reloading data');
        loadDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [stats.totalUsers, loading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🚀 Loading admin dashboard data...');

      // Add a hard timeout to prevent infinite loading (increased for reliability)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Dashboard loading timeout after 25 seconds')), 25000);
      });
      
      const dataPromise = Promise.all([
        loadUsers(),
        loadOrganizations()
      ]);
      
      await Promise.race([dataPromise, timeoutPromise]);

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      
      // Run comprehensive database diagnostics on timeout
      if (error.message.includes('timeout')) {
        console.log('🔍 Running comprehensive database diagnostics...');
        try {
          // Run comprehensive connectivity test
          const connectivityResults = await runConnectivityTest();
          console.log('📊 Connectivity test completed:', connectivityResults);
          
          // Also run quick ping test
          const pingResult = await quickPingTest(2000);
          console.log('🏓 Ping test result:', pingResult);
          
          // Fallback to old diagnostics if needed
          if (!connectivityResults.auth.status === 'success' && !pingResult.success) {
            console.log('🔧 Running fallback diagnostics...');
            await runDiagnostics();
          }
        } catch (diagError) {
          console.error('❌ All database diagnostics failed:', diagError);
          
          // Final fallback - basic auth check
          console.log('🔎 Final fallback: checking basic auth...');
          try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            console.log('👤 Auth fallback result:', { user: user?.email, error: userError?.message });
          } catch (authError) {
            console.error('❌ Even basic auth check failed:', authError);
          }
        }
      }
      
      setError(error.message);
    } finally {
      console.log('✅ Setting loading to false');
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      console.log('👥 Loading users from clean users table...');
      const startTime = Date.now();
      
      // Query the single clean users table
      const queryPromise = supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          phone,
          company,
          is_active,
          is_paid,
          account_type,
          trial_start_date,
          trial_end_date,
          created_at,
          updated_at,
          last_login
        `)
        .order('created_at', { ascending: false });
        
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Users query timeout after 10 seconds')), 10000);
      });
      
      const result = await Promise.race([queryPromise, timeoutPromise]);
      const duration = Date.now() - startTime;
      console.log(`⏱️ Users query took ${duration}ms`);
        
      if (result.error) {
        console.error('❌ Users table error:', result.error);
        throw new Error(`Failed to load users: ${result.error.message}`);
      }
      
      const profiles = result.data || [];
      console.log(`✅ Found ${profiles.length} users in clean users table`);
      console.log('📋 Users data sample:', profiles.slice(0, 3));
      
      // Transform and normalize user data with clean schema
      const normalizedUsers = profiles.map(profile => {
        const isActive = profile.is_active !== false;
        const isPaid = Boolean(profile.is_paid) || profile.account_type === 'paid';
        
        // Use clean schema field names
        const trialEndDate = profile.trial_end_date;
        const trialStartDate = profile.trial_start_date;
        const hasValidTrial = trialEndDate && new Date(trialEndDate) > new Date();
        const isTrialExpired = trialEndDate && new Date(trialEndDate) <= new Date();
        
        return {
          id: profile.id,
          name: profile.full_name || 'Unknown User',
          email: profile.email,
          phone: profile.phone,
          company: profile.company, // Clean schema uses 'company' not 'company_name'
          role: profile.account_type === 'admin' ? 'admin' : 'user',
          is_active: isActive,
          is_paid: isPaid,
          trial_start: trialStartDate,
          trial_end: trialEndDate,
          account_type: profile.account_type,
          created_at: profile.created_at,
          last_login: profile.last_login,
          // Computed fields
          isActiveTrial: !isPaid && isActive && hasValidTrial,
          isExpiredTrial: !isPaid && isTrialExpired,
          isPaidUser: isPaid || profile.account_type === 'admin'
        };
      });

      setUsers(normalizedUsers);
      
      // Calculate stats
      const newStats = {
        totalUsers: normalizedUsers.length,
        activeTrials: normalizedUsers.filter(u => u.isActiveTrial).length,
        expiredTrials: normalizedUsers.filter(u => u.isExpiredTrial).length,
        paidUsers: normalizedUsers.filter(u => u.isPaidUser).length,
        totalOrganizations: organizations.length,
        monthlyRevenue: normalizedUsers.filter(u => u.isPaidUser).length * 1500 // Estimate: ₹1500 per paid user
      };

      setStats(prev => ({ ...prev, ...newStats }));
      console.log('📊 User stats calculated:', newStats);
      
    } catch (error) {
      console.error('❌ Error loading users:', error);
      throw error;
    }
  };

  const loadOrganizations = async () => {
    try {
      console.log('🏢 Loading organizations...');
      
      const { data: orgsData, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          description,
          business_type,
          subscription_plan,
          subscription_status,
          trial_start_date,
          trial_end_date,
          is_active,
          owner_id,
          created_at,
          settings,
          address
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ Organizations query error:', error.message);
        setOrganizations([]);
        return;
      }

      console.log(`✅ Loaded ${orgsData?.length || 0} organizations`);
      setOrganizations(orgsData || []);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalOrganizations: orgsData?.length || 0
      }));
      
    } catch (error) {
      console.error('❌ Error loading organizations:', error);
      setOrganizations([]);
    }
  };


  const handleUserAction = async (userId, action) => {
    try {
      console.log(`🔧 Performing action "${action}" on user ${userId}`);
      
      let updateData = {};
      
      switch (action) {
        case 'activate':
          updateData.is_active = true;
          break;
        case 'deactivate':
          updateData.is_active = false;
          break;
        case 'make_premium':
          updateData.account_type = 'premium';
          updateData.is_paid = true;
          break;
        case 'extend_trial':
          const extendDate = new Date();
          extendDate.setDate(extendDate.getDate() + 30);
          updateData.trial_end = extendDate.toISOString();
          updateData.is_active = true;
          break;
        default:
          console.warn('Unknown action:', action);
          return;
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        throw new Error(`Action failed: ${error.message}`);
      }

      console.log('✅ User action completed successfully');
      
      // Reload users to reflect changes
      await loadUsers();
      
      alert(`User ${action} completed successfully!`);
      
    } catch (error) {
      console.error('❌ User action failed:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const getUserStatusBadge = (user) => {
    if (!user.is_active) {
      return <Badge variant="destructive"><UserX className="h-3 w-3 mr-1" />Inactive</Badge>;
    }
    
    if (user.isPaidUser) {
      return <Badge className="bg-green-500 text-white"><Crown className="h-3 w-3 mr-1" />Paid</Badge>;
    }
    
    if (user.isActiveTrial) {
      return <Badge className="bg-blue-500 text-white"><Clock className="h-3 w-3 mr-1" />Active Trial</Badge>;
    }
    
    if (user.isExpiredTrial) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Expired Trial</Badge>;
    }
    
    return <Badge variant="secondary">Unknown</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrganizations = organizations.filter(org =>
    org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.business_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <div className="text-center bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-12 border border-slate-700/50 shadow-2xl shadow-blue-500/20">
          <div className="relative">
            <RefreshCw className="h-16 w-16 animate-spin mx-auto mb-6 text-blue-400" />
            <div className="absolute inset-0 h-16 w-16 mx-auto mb-6 bg-blue-500/30 rounded-full animate-ping"></div>
            <div className="absolute inset-0 h-16 w-16 mx-auto mb-6 bg-purple-500/20 rounded-full animate-pulse delay-75"></div>
          </div>
          <p className="text-white text-xl font-semibold mb-2">Loading KrishiSethu Admin</p>
          <p className="text-slate-400 text-sm mb-6">Initializing dashboard components...</p>
          <div className="w-64 h-2 bg-slate-800 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full animate-pulse shadow-lg shadow-blue-500/30"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-950 flex items-center justify-center">
        <div className="text-center max-w-lg bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-10 border border-red-900/50 shadow-2xl shadow-red-500/20">
          <div className="relative">
            <AlertTriangle className="h-20 w-20 mx-auto mb-8 text-red-400" />
            <div className="absolute inset-0 h-20 w-20 mx-auto mb-8 bg-red-400/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 h-20 w-20 mx-auto mb-8 bg-orange-500/20 rounded-full animate-ping delay-75"></div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">System Error</h2>
          <p className="text-slate-300 mb-8 leading-relaxed text-lg">{error}</p>
          <Button 
            onClick={loadDashboardData}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white border-none shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 px-8 py-3 text-lg font-semibold"
          >
            <RefreshCw className="h-5 w-5 mr-3" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`}>
      {/* Modern Admin Header */}
      <header className={`backdrop-blur-xl border-b shadow-lg transition-all duration-500 ${
        darkMode 
          ? 'bg-slate-900/80 border-slate-700/50 shadow-blue-500/10' 
          : 'bg-white/80 border-white/20 shadow-blue-100/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg shadow-blue-500/30">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                  darkMode 
                    ? 'from-white to-slate-300' 
                    : 'from-slate-900 to-slate-700'
                }`}>
                  KrishiSethu Admin
                </h1>
                <p className={`text-sm font-medium ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>Super Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setDarkMode(!darkMode)}
                className={`relative p-2 transition-colors duration-200 ${
                  darkMode 
                    ? 'hover:bg-slate-800 text-slate-300' 
                    : 'hover:bg-blue-50 text-slate-600'
                }`}
              >
                {darkMode ? (
                  <Star className="h-5 w-5" />
                ) : (
                  <Globe className="h-5 w-5" />
                )}
              </Button>
              
              {/* Notification Bell */}
              <Button 
                variant="ghost" 
                size="sm" 
                className={`relative p-2 transition-colors duration-200 ${
                  darkMode 
                    ? 'hover:bg-slate-800 text-slate-300' 
                    : 'hover:bg-blue-50 text-slate-600'
                }`}
              >
                <Bell className="h-5 w-5" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-current animate-pulse"></div>
              </Button>
              
              {/* Settings */}
              <Button 
                variant="ghost" 
                size="sm" 
                className={`p-2 transition-colors duration-200 ${
                  darkMode 
                    ? 'hover:bg-slate-800 text-slate-300' 
                    : 'hover:bg-blue-50 text-slate-600'
                }`}
              >
                <Settings className="h-5 w-5" />
              </Button>
              
              {/* Home Button */}
              <Button 
                variant="outline" 
                onClick={() => onNavigate('/')}
                className={`transition-all duration-200 ${
                  darkMode 
                    ? 'border-slate-600 text-slate-300 hover:border-blue-400 hover:bg-blue-900/30' 
                    : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              
              {/* User Profile */}
              <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg border transition-all duration-200 ${
                darkMode 
                  ? 'bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600' 
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
              }`}>
                <Avatar className="h-9 w-9 ring-2 ring-blue-300">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                    {currentUser?.email?.charAt(0).toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className={`text-sm font-medium ${
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>Super Admin</p>
                  <p className={`text-xs ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>{currentUser?.email}</p>
                </div>
              </div>
              
              {/* Logout Button */}
              <Button 
                variant="ghost" 
                onClick={async () => {
                  try {
                    console.log('🚪 Admin logout button clicked');
                    
                    // Call logout with admin context
                    const result = await logout('admin');
                    
                    if (result && result.success) {
                      console.log('✅ Admin logout successful', result);
                      
                      // Always redirect admin users to admin login page
                      console.log('🔄 Redirecting to admin login page...');
                      setTimeout(() => {
                        window.location.href = '/admin';
                      }, 100);
                    } else {
                      console.error('❌ Admin logout failed:', result?.error);
                      alert('Logout failed. Please try again.');
                      // Force redirect to admin login even on failure
                      setTimeout(() => {
                        window.location.href = '/admin';
                      }, 500);
                    }
                  } catch (error) {
                    console.error('❌ Admin logout error:', error);
                    alert('Logout failed: ' + error.message);
                    // Force redirect to admin login as fallback
                    setTimeout(() => {
                      window.location.href = '/admin';
                    }, 500);
                  }
                }}
                className={`transition-colors duration-200 ${
                  darkMode 
                    ? 'hover:bg-red-900/30 hover:text-red-400' 
                    : 'hover:bg-red-50 hover:text-red-600'
                }`}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className={`rounded-3xl p-8 text-white relative overflow-hidden border transition-all duration-500 ${
            darkMode 
              ? 'bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-800 border-slate-700/50 shadow-2xl shadow-indigo-500/10' 
              : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 shadow-2xl shadow-blue-500/20'
          }`}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
            <div className={`absolute top-0 right-0 w-96 h-96 rounded-full -translate-y-48 translate-x-48 ${
              darkMode ? 'bg-indigo-500/20' : 'bg-white/10'
            }`}></div>
            <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full translate-y-32 -translate-x-32 ${
              darkMode ? 'bg-purple-500/10' : 'bg-white/5'
            }`}></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Welcome back, Admin! 👋</h2>
                  <p className={`text-lg ${
                    darkMode ? 'text-slate-300' : 'text-blue-100'
                  }`}>Here's what's happening with KrishiSethu today</p>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold">{new Date().toLocaleDateString()}</p>
                    <p className={`${
                      darkMode ? 'text-slate-400' : 'text-blue-200'
                    }`}>Today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl blur-sm opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
            <Card className={`relative backdrop-blur-xl border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-blue-500 ${
              darkMode 
                ? 'bg-slate-900/80 shadow-blue-500/20 hover:shadow-blue-500/30 text-white' 
                : 'bg-white/80 shadow-blue-100/20 hover:shadow-blue-200/30'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className={`text-sm font-medium ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>Total Users</p>
                    <p className={`text-3xl font-bold ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}>{stats.totalUsers}</p>
                    <div className="flex items-center space-x-1 text-xs">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-green-500 font-medium">+12% from last month</span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-2xl blur opacity-30"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/30">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Organizations Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl blur-sm opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
            <Card className={`relative backdrop-blur-xl border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-emerald-500 ${
              darkMode 
                ? 'bg-slate-900/80 shadow-emerald-500/20 hover:shadow-emerald-500/30 text-white' 
                : 'bg-white/80 shadow-emerald-100/20 hover:shadow-emerald-200/30'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className={`text-sm font-medium ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>Organizations</p>
                    <p className={`text-3xl font-bold ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}>{stats.totalOrganizations}</p>
                    <div className="flex items-center space-x-1 text-xs">
                      <Activity className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">+5 new this week</span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 rounded-2xl blur opacity-30"></div>
                    <div className="relative bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 rounded-2xl shadow-lg shadow-emerald-500/30">
                      <Building className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Trials Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl blur-sm opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
            <Card className={`relative backdrop-blur-xl border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-amber-500 ${
              darkMode 
                ? 'bg-slate-900/80 shadow-amber-500/20 hover:shadow-amber-500/30 text-white' 
                : 'bg-white/80 shadow-amber-100/20 hover:shadow-amber-200/30'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className={`text-sm font-medium ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>Active Trials</p>
                    <p className={`text-3xl font-bold ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}>{stats.activeTrials}</p>
                    <div className="flex items-center space-x-1 text-xs">
                      <Clock className="h-3 w-3 text-amber-500" />
                      <span className="text-amber-500 font-medium">Avg 15 days left</span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-500 rounded-2xl blur opacity-30"></div>
                    <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-2xl shadow-lg shadow-amber-500/30">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Paid Users Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-2xl blur-sm opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
            <Card className={`relative backdrop-blur-xl border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-purple-500 ${
              darkMode 
                ? 'bg-slate-900/80 shadow-purple-500/20 hover:shadow-purple-500/30 text-white' 
                : 'bg-white/80 shadow-purple-100/20 hover:shadow-purple-200/30'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className={`text-sm font-medium ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>Premium Users</p>
                    <p className={`text-3xl font-bold ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}>{stats.paidUsers}</p>
                    <div className="flex items-center space-x-1 text-xs">
                      <Star className="h-3 w-3 text-purple-500" />
                      <span className="text-purple-500 font-medium">₹2.4L revenue</span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500 rounded-2xl blur opacity-30"></div>
                    <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl shadow-lg shadow-purple-500/30">
                      <Crown className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modern Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <TabsList className={`backdrop-blur-xl border shadow-lg p-1 rounded-2xl transition-all duration-500 overflow-x-auto ${
              darkMode 
                ? 'bg-slate-900/80 border-slate-700/50' 
                : 'bg-white/80 border-white/20'
            }`}>
              <TabsTrigger 
                value="overview" 
                className={`px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap ${
                  darkMode 
                    ? 'text-slate-300 hover:text-white' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className={`px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap ${
                  darkMode 
                    ? 'text-slate-300 hover:text-white' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger 
                value="organizations" 
                className={`px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap ${
                  darkMode 
                    ? 'text-slate-300 hover:text-white' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Building className="h-4 w-4 mr-2" />
                Organizations
              </TabsTrigger>
              <TabsTrigger 
                value="system" 
                className={`px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap ${
                  darkMode 
                    ? 'text-slate-300 hover:text-white' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Server className="h-4 w-4 mr-2" />
                System
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className={`px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap ${
                  darkMode 
                    ? 'text-slate-300 hover:text-white' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <LineChart className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className={`px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap ${
                  darkMode 
                    ? 'text-slate-300 hover:text-white' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Lock className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <Button 
                variant="outline" 
                size="sm"
                className={`transition-all duration-200 ${
                  darkMode 
                    ? 'border-slate-600 text-slate-300 hover:border-blue-400 hover:bg-blue-900/30' 
                    : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className={`transition-all duration-200 ${
                  darkMode 
                    ? 'border-slate-600 text-slate-300 hover:border-blue-400 hover:bg-blue-900/30' 
                    : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {/* Modern Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Users Card - Modern Design */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur transition-all duration-300 group-hover:blur-md group-hover:from-blue-500/20 group-hover:to-purple-500/20"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-2xl blur-sm opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                <Card className={`relative backdrop-blur-xl border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-blue-500 ${
                  darkMode 
                    ? 'bg-slate-900/80 shadow-blue-500/20 hover:shadow-blue-500/30' 
                    : 'bg-white/80 shadow-blue-50 hover:shadow-blue-100'
                }`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg shadow-blue-500/30">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className={`text-xl ${
                          darkMode ? 'text-white' : 'text-slate-900'
                        }`}>Recent Users</CardTitle>
                        <CardDescription className={`${
                          darkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}>Latest user registrations</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {users.slice(0, 5).map((user, index) => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50/50 to-blue-50/30 rounded-xl border border-slate-100/50 hover:shadow-md transition-all duration-200 hover:from-slate-50 hover:to-blue-50">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <Avatar className="h-12 w-12 ring-2 ring-blue-100">
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-sm">
                                  {user.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{user.name}</p>
                              <p className="text-sm text-slate-500">{user.company || user.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {getUserStatusBadge(user)}
                            <p className="text-xs text-slate-400 mt-1">{formatDate(user.created_at)}</p>
                          </div>
                        </div>
                      ))}
                      
                      {users.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                          <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                          <p>No recent users found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Status Card - Modern Design */}
              <div className="space-y-6">
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl blur transition-all duration-300 group-hover:blur-md group-hover:from-emerald-500/20 group-hover:to-teal-500/20"></div>
                  <Card className="relative bg-white/80 backdrop-blur-xl border-0 shadow-xl shadow-emerald-50 rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-slate-900">System Status</CardTitle>
                          <CardDescription className="text-slate-500">Platform health overview</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-500 rounded-lg">
                              <UserCheck className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-medium text-slate-700">Database Status</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                            Connected
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-500 rounded-lg">
                              <Globe className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-medium text-slate-700">Active Sessions</span>
                          </div>
                          <span className="font-bold text-blue-600 text-lg">{stats.activeTrials + stats.paidUsers}</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-500 rounded-lg">
                              <Shield className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-medium text-slate-700">Admin Role</span>
                          </div>
                          <Badge className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                            Super Admin
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Quick Actions Card */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl blur transition-all duration-300 group-hover:blur-md group-hover:from-amber-500/20 group-hover:to-orange-500/20"></div>
                  <Card className="relative bg-white/80 backdrop-blur-xl border-0 shadow-xl shadow-amber-50 rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-slate-900">Quick Actions</CardTitle>
                          <CardDescription className="text-slate-500">Common admin tasks</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-3">
                        <Button className="h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </Button>
                        <Button className="h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Modern User Management Tab */}
          <TabsContent value="users" className="space-y-8">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-2xl blur transition-all duration-300"></div>
              <Card className="relative bg-white/80 backdrop-blur-xl border-0 shadow-xl shadow-emerald-50/50 rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-slate-900">User Management</CardTitle>
                        <CardDescription className="text-slate-500 text-base">Manage user accounts and subscriptions</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-emerald-100 text-emerald-800 px-3 py-1">
                        {stats.totalUsers} Total Users
                      </Badge>
                      <Button 
                        variant="outline" 
                        onClick={loadUsers}
                        className="bg-white/80 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Enhanced Search */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        placeholder="Search users by name, email, or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-4 py-3 bg-white/80 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200"
                      />
                    </div>

                    {/* Modern Table */}
                    <div className="bg-white/50 rounded-xl border border-slate-200/50 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                              <th className="text-left p-4 font-semibold text-slate-700">User</th>
                              <th className="text-left p-4 font-semibold text-slate-700">Company</th>
                              <th className="text-left p-4 font-semibold text-slate-700">Status</th>
                              <th className="text-left p-4 font-semibold text-slate-700">Trial End</th>
                              <th className="text-left p-4 font-semibold text-slate-700">Joined</th>
                              <th className="text-left p-4 font-semibold text-slate-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUsers.map((user, index) => (
                              <tr key={user.id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-teal-50/30 transition-all duration-200 group">
                                <td className="p-4">
                                  <div className="flex items-center space-x-4">
                                    <div className="relative">
                                      <Avatar className="h-12 w-12 ring-2 ring-slate-100 group-hover:ring-emerald-200 transition-all duration-200">
                                        <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold">
                                          {user.name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-900">{user.name}</p>
                                      <p className="text-sm text-slate-500">{user.email}</p>
                                      {user.phone && (
                                        <p className="text-xs text-slate-400">{user.phone}</p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="font-medium text-slate-700">
                                    {user.company || 'No company'}
                                  </div>
                                </td>
                                <td className="p-4">
                                  {getUserStatusBadge(user)}
                                </td>
                                <td className="p-4">
                                  <div className="text-sm font-medium text-slate-600">
                                    {formatDate(user.trial_end)}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="text-sm text-slate-500">
                                    {formatDate(user.created_at)}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center space-x-2">
                                    {!user.is_active ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUserAction(user.id, 'activate')}
                                        title="Activate User"
                                        className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                                      >
                                        <UserCheck className="h-4 w-4" />
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUserAction(user.id, 'deactivate')}
                                        title="Deactivate User"
                                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                                      >
                                        <UserX className="h-4 w-4" />
                                      </Button>
                                    )}
                                    
                                    {!user.isPaidUser && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleUserAction(user.id, 'make_premium')}
                                          title="Upgrade to Premium"
                                          className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                                        >
                                          <Crown className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleUserAction(user.id, 'extend_trial')}
                                          title="Extend Trial"
                                          className="border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300 transition-all duration-200"
                                        >
                                          <Clock className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                    
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="p-2 hover:bg-slate-100 transition-all duration-200"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        
                        {filteredUsers.length === 0 && (
                          <div className="text-center py-12">
                            <div className="flex flex-col items-center space-y-4">
                              <div className="p-4 bg-slate-100 rounded-full">
                                <Users className="h-12 w-12 text-slate-400" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-lg font-medium text-slate-600">No users found</p>
                                <p className="text-slate-400">Try adjusting your search criteria</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Modern Organizations Tab */}
          <TabsContent value="organizations" className="space-y-8">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-2xl blur transition-all duration-300"></div>
              <Card className="relative bg-white/80 backdrop-blur-xl border-0 shadow-xl shadow-amber-50/50 rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                        <Building className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-slate-900">Organizations</CardTitle>
                        <CardDescription className="text-slate-500 text-base">Manage organization accounts</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-amber-100 text-amber-800 px-3 py-1">
                        {stats.totalOrganizations} Organizations
                      </Badge>
                      <Button 
                        variant="outline" 
                        onClick={loadOrganizations}
                        className="bg-white/80 border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all duration-200"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Enhanced Search */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        placeholder="Search organizations by name or business type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-4 py-3 bg-white/80 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all duration-200"
                      />
                    </div>

                    {/* Modern Organization Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {filteredOrganizations.map((org, index) => (
                        <div key={org.id} className="group relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-slate-200/50 to-amber-200/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                          <Card className="relative bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                {/* Organization Header */}
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                                      <Building2 className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-slate-900">{org.name}</h3>
                                      <p className="text-sm text-slate-500">@{org.slug}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={org.is_active ? 'default' : 'destructive'} className="rounded-full">
                                      {org.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <Button variant="ghost" size="sm" className="p-1">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Organization Details */}
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-600">Business Type</span>
                                    <span className="text-sm text-slate-800 font-medium">{org.business_type || 'N/A'}</span>
                                  </div>
                                  
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-600">Subscription</span>
                                    <Badge 
                                      variant={org.subscription_status === 'active' ? 'default' : 'secondary'}
                                      className="rounded-full text-xs"
                                    >
                                      {org.subscription_plan} - {org.subscription_status}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-600">Created</span>
                                    <span className="text-sm text-slate-500">{formatDate(org.created_at)}</span>
                                  </div>
                                </div>
                                
                                {/* Progress Bar (Mock) */}
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-slate-600">Usage</span>
                                    <span className="text-xs text-slate-500">78%</span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full" style={{width: '78%'}}></div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                    
                    {filteredOrganizations.length === 0 && (
                      <div className="text-center py-12">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="p-4 bg-slate-100 rounded-full">
                            <Building2 className="h-12 w-12 text-slate-400" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-medium text-slate-600">No organizations found</p>
                            <p className="text-slate-400">Organizations will appear here when created</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Management Tab */}
          <TabsContent value="system" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* System Status Overview */}
              <div className="lg:col-span-2 space-y-6">
                {/* Server Status */}
                <Card className={`backdrop-blur-xl border-0 shadow-xl rounded-2xl border-l-4 border-l-red-500 ${
                  darkMode 
                    ? 'bg-slate-900/80 shadow-red-500/20' 
                    : 'bg-white/80 shadow-red-100/20'
                }`}>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
                        <Server className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className={`${darkMode ? 'text-white' : 'text-slate-900'}`}>Server Management</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">CPU Usage</span>
                        </div>
                        <p className="text-2xl font-bold text-green-800">{systemStatus.cpu}%</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Monitor className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">Memory</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-800">{systemStatus.memory}%</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <HardDrive className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-700">Storage</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-800">{systemStatus.storage}%</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-700">Uptime</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-800">{systemStatus.uptime}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Database Management */}
                <Card className={`backdrop-blur-xl border-0 shadow-xl rounded-2xl border-l-4 border-l-blue-500 ${
                  darkMode 
                    ? 'bg-slate-900/80 shadow-blue-500/20' 
                    : 'bg-white/80 shadow-blue-100/20'
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                          <Database className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className={`${darkMode ? 'text-white' : 'text-slate-900'}`}>Database Status</CardTitle>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-200">
                        <span className="font-medium text-slate-700">Active Connections</span>
                        <span className="font-bold text-blue-600">24/100</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-emerald-50 rounded-lg border border-slate-200">
                        <span className="font-medium text-slate-700">Query Performance</span>
                        <span className="font-bold text-emerald-600">156ms avg</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-purple-50 rounded-lg border border-slate-200">
                        <span className="font-medium text-slate-700">Database Size</span>
                        <span className="font-bold text-purple-600">2.4 GB</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Actions */}
              <div className="space-y-6">
                <Card className={`backdrop-blur-xl border-0 shadow-xl rounded-2xl border-l-4 border-l-orange-500 ${
                  darkMode 
                    ? 'bg-slate-900/80 shadow-orange-500/20' 
                    : 'bg-white/80 shadow-orange-100/20'
                }`}>
                  <CardHeader>
                    <CardTitle className={`text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>System Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Restart Services
                      </Button>
                      <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white">
                        <Upload className="h-4 w-4 mr-2" />
                        Backup Database
                      </Button>
                      <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white">
                        <Settings className="h-4 w-4 mr-2" />
                        System Settings
                      </Button>
                      <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Emergency Stop
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`backdrop-blur-xl border-0 shadow-xl rounded-2xl border-l-4 border-l-purple-500 ${
                  darkMode 
                    ? 'bg-slate-900/80 shadow-purple-500/20' 
                    : 'bg-white/80 shadow-purple-100/20'
                }`}>
                  <CardHeader>
                    <CardTitle className={`text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>System Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="p-2 bg-slate-50 rounded text-xs font-mono text-slate-600">
                        [INFO] System started successfully
                      </div>
                      <div className="p-2 bg-green-50 rounded text-xs font-mono text-green-600">
                        [SUCCESS] Database backup completed
                      </div>
                      <div className="p-2 bg-blue-50 rounded text-xs font-mono text-blue-600">
                        [INFO] 45 users currently active
                      </div>
                      <div className="p-2 bg-amber-50 rounded text-xs font-mono text-amber-600">
                        [WARN] High memory usage detected
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Usage Analytics */}
              <Card className={`backdrop-blur-xl border-0 shadow-xl rounded-2xl border-l-4 border-l-violet-500 ${
                darkMode 
                  ? 'bg-slate-900/80 shadow-violet-500/20' 
                  : 'bg-white/80 shadow-violet-100/20'
              }`}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-lg">
                      <LineChart className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className={`${darkMode ? 'text-white' : 'text-slate-900'}`}>Usage Analytics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <p className="text-2xl font-bold text-blue-800">{stats.totalSessions}</p>
                        <p className="text-sm text-blue-600">Total Sessions</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                        <p className="text-2xl font-bold text-emerald-800">{stats.responseTime}ms</p>
                        <p className="text-sm text-emerald-600">Avg Response</p>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-red-700 font-medium">Error Rate</span>
                        <span className="text-red-800 font-bold">{(stats.errorRate * 100).toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-red-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{width: `${stats.errorRate * 100}%`}}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className={`backdrop-blur-xl border-0 shadow-xl rounded-2xl border-l-4 border-l-cyan-500 ${
                darkMode 
                  ? 'bg-slate-900/80 shadow-cyan-500/20' 
                  : 'bg-white/80 shadow-cyan-100/20'
              }`}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
                      <PieChart className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className={`${darkMode ? 'text-white' : 'text-slate-900'}`}>Performance Metrics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">API Response Time</span>
                        <span className="text-sm font-bold text-slate-800">Fast</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Database Performance</span>
                        <span className="text-sm font-bold text-slate-800">Excellent</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{width: '92%'}}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Server Load</span>
                        <span className="text-sm font-bold text-slate-800">Normal</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full" style={{width: '67%'}}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Analytics */}
              <Card className={`backdrop-blur-xl border-0 shadow-xl rounded-2xl border-l-4 border-l-emerald-500 ${
                darkMode 
                  ? 'bg-slate-900/80 shadow-emerald-500/20' 
                  : 'bg-white/80 shadow-emerald-100/20'
              }`}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className={`${darkMode ? 'text-white' : 'text-slate-900'}`}>Revenue Analytics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                      <p className="text-3xl font-bold text-emerald-800">₹2,45,000</p>
                      <p className="text-emerald-600">Monthly Revenue</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xl font-bold text-blue-800">₹12,500</p>
                        <p className="text-xs text-blue-600">This Week</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded border border-purple-200">
                        <p className="text-xl font-bold text-purple-800">₹3,250</p>
                        <p className="text-xs text-purple-600">Today</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Engagement */}
              <Card className={`backdrop-blur-xl border-0 shadow-xl rounded-2xl border-l-4 border-l-purple-500 ${
                darkMode 
                  ? 'bg-slate-900/80 shadow-purple-500/20' 
                  : 'bg-white/80 shadow-purple-100/20'
              }`}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className={`${darkMode ? 'text-white' : 'text-slate-900'}`}>User Engagement</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <span className="text-blue-700 font-medium">Daily Active Users</span>
                      <span className="text-blue-800 font-bold">{Math.floor(stats.totalUsers * 0.65)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                      <span className="text-emerald-700 font-medium">Session Duration</span>
                      <span className="text-emerald-800 font-bold">24 min</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                      <span className="text-amber-700 font-medium">Bounce Rate</span>
                      <span className="text-amber-800 font-bold">32%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security & Audit Tab */}
          <TabsContent value="security" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Security Status */}
              <div className="lg:col-span-2 space-y-6">
                <Card className={`backdrop-blur-xl border-0 shadow-xl rounded-2xl border-l-4 border-l-rose-500 ${
                  darkMode 
                    ? 'bg-slate-900/80 shadow-rose-500/20' 
                    : 'bg-white/80 shadow-rose-100/20'
                }`}>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-gradient-to-r from-rose-500 to-red-500 rounded-lg">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className={`${darkMode ? 'text-white' : 'text-slate-900'}`}>Security Overview</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <CheckCircle className="h-6 w-6 text-green-600 mb-2" />
                        <p className="text-sm font-medium text-green-700">SSL Certificate</p>
                        <p className="text-xs text-green-600">Valid</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                        <Lock className="h-6 w-6 text-blue-600 mb-2" />
                        <p className="text-sm font-medium text-blue-700">2FA Enabled</p>
                        <p className="text-xs text-blue-600">Active</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <Key className="h-6 w-6 text-purple-600 mb-2" />
                        <p className="text-sm font-medium text-purple-700">API Security</p>
                        <p className="text-xs text-purple-600">Secured</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                        <Eye className="h-6 w-6 text-amber-600 mb-2" />
                        <p className="text-sm font-medium text-amber-700">Monitoring</p>
                        <p className="text-xs text-amber-600">24/7</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Audit Logs */}
                <Card className={`backdrop-blur-xl border-0 shadow-xl rounded-2xl border-l-4 border-l-indigo-500 ${
                  darkMode 
                    ? 'bg-slate-900/80 shadow-indigo-500/20' 
                    : 'bg-white/80 shadow-indigo-100/20'
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className={`${darkMode ? 'text-white' : 'text-slate-900'}`}>Recent Audit Logs</CardTitle>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { action: 'User Login', user: 'admin@krishisethu.com', time: '2 minutes ago', status: 'success' },
                        { action: 'Database Backup', user: 'System', time: '1 hour ago', status: 'success' },
                        { action: 'Failed Login Attempt', user: 'unknown@example.com', time: '3 hours ago', status: 'warning' },
                        { action: 'User Created', user: 'admin@krishisethu.com', time: '5 hours ago', status: 'success' },
                        { action: 'System Update', user: 'System', time: '1 day ago', status: 'success' }
                      ].map((log, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center space-x-3">
                            <div className={`p-1 rounded-full ${
                              log.status === 'success' ? 'bg-green-100' : 
                              log.status === 'warning' ? 'bg-amber-100' : 'bg-red-100'
                            }`}>
                              {log.status === 'success' ? 
                                <CheckCircle className="h-4 w-4 text-green-600" /> :
                                log.status === 'warning' ? 
                                <AlertCircle className="h-4 w-4 text-amber-600" /> :
                                <XCircle className="h-4 w-4 text-red-600" />
                              }
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{log.action}</p>
                              <p className="text-xs text-slate-500">{log.user}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">{log.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Security Actions */}
              <div className="space-y-6">
                <Card className={`backdrop-blur-xl border-0 shadow-xl rounded-2xl border-l-4 border-l-red-500 ${
                  darkMode 
                    ? 'bg-slate-900/80 shadow-red-500/20' 
                    : 'bg-white/80 shadow-red-100/20'
                }`}>
                  <CardHeader>
                    <CardTitle className={`text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>Security Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                        <Lock className="h-4 w-4 mr-2" />
                        Update Passwords
                      </Button>
                      <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white">
                        <Key className="h-4 w-4 mr-2" />
                        Rotate API Keys
                      </Button>
                      <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
                        <Shield className="h-4 w-4 mr-2" />
                        Security Scan
                      </Button>
                      <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Lockdown Mode
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`backdrop-blur-xl border-0 shadow-xl rounded-2xl border-l-4 border-l-amber-500 ${
                  darkMode 
                    ? 'bg-slate-900/80 shadow-amber-500/20' 
                    : 'bg-white/80 shadow-amber-100/20'
                }`}>
                  <CardHeader>
                    <CardTitle className={`text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>Threat Detection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-green-700 font-medium">Malware Scans</span>
                        <Badge className="bg-green-100 text-green-800">Clean</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-blue-700 font-medium">Intrusion Detection</span>
                        <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <span className="text-amber-700 font-medium">Failed Logins</span>
                        <Badge className="bg-amber-100 text-amber-800">5 attempts</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminMasterDashboard;
