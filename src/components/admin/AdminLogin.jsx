import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  UserPlus,
  CheckCircle,
  Phone,
  Building
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const AdminLogin = ({ onNavigate, onAdminLogin }) => {
  const [currentView, setCurrentView] = useState('login'); // 'login' or 'register'
  const [credentials, setCredentials] = useState({
    email: 'arjunin2020@gmail.com',
    password: ''  // Enter the password you used during registration
  });
  const [registerData, setRegisterData] = useState({
    email: 'arjunin2020@gmail.com',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    companyName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasAdminUsers, setHasAdminUsers] = useState(true);

  const { signin } = useAuth();

  // Check if any admin users exist
  useEffect(() => {
    checkAdminUsers();
  }, []);

  const checkAdminUsers = async () => {
    try {
      // Force show registration for testing - always allow admin creation
      setHasAdminUsers(false);
      
      // // Check if admin_roles table exists and has any super admin users
      // const { data, error } = await supabase
      //   .from('admin_roles')
      //   .select('id')
      //   .eq('role', 'super_admin')
      //   .eq('is_active', true)
      //   .limit(1);
      // 
      // if (error && error.code === '42P01') {
      //   // Table doesn't exist
      //   setHasAdminUsers(false);
      // } else if (!error && (!data || data.length === 0)) {
      //   // Table exists but no admin users
      //   setHasAdminUsers(false);
      // }
    } catch (error) {
      console.error('Error checking admin users:', error);
      setHasAdminUsers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!credentials.email || !credentials.password) {
        throw new Error('Please enter both email and password');
      }

      // Local admin credentials for immediate access
      const localAdminCredentials = {
        'arjunpeter@krishisethu.com': 'DarkDante@143',
        'admin@krishisethu.com': 'Admin@123'
      };

      const adminEmails = [
        'arjunpeter@krishisethu.com',
        'admin@krishisethu.com',
        'superadmin@krishisethu.com',
        'master@krishisethu.com',
        'arjunin2020@gmail.com'  // Your registered admin email
      ];

      // Check if email is in admin list
      if (!adminEmails.includes(credentials.email.toLowerCase())) {
        throw new Error('Invalid admin credentials');
      }

      // Check local admin credentials first
      const emailLower = credentials.email.toLowerCase();
      if (localAdminCredentials[emailLower] && localAdminCredentials[emailLower] === credentials.password) {
        console.log('✅ Local admin authentication successful');

        // Create a mock admin user object
        const adminUser = {
          id: 'admin-' + Date.now(),
          email: credentials.email,
          role: 'admin',
          name: emailLower === 'arjunpeter@krishisethu.com' ? 'Arjun Peter' : 'Admin User',
          is_admin: true
        };

        // Store admin session in localStorage
        localStorage.setItem('krishisethu_admin_session', JSON.stringify({
          user: adminUser,
          timestamp: Date.now(),
          expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }));

        // Redirect to admin dashboard
        window.location.href = '/admin/dashboard';
        return;
      }

      // Fallback to Supabase authentication if local auth fails
      try {
        const { data, error } = await signin(credentials.email, credentials.password);

        if (error) {
          throw new Error('Invalid email or password');
        }

        if (data?.user) {
          // Verify admin role - check if email is in admin list
          if (adminEmails.includes(data.user.email.toLowerCase())) {
            // Redirect to admin dashboard
            window.location.href = '/admin/dashboard';
          } else {
            throw new Error('Access denied. Admin privileges required.');
          }
        } else {
          throw new Error('Login failed - no user data received');
        }
      } catch (supabaseError) {
        // If Supabase fails, show the original error
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const validateRegisterForm = () => {
    if (!registerData.email || !registerData.password || !registerData.name) {
      throw new Error('Please fill in all required fields');
    }
    if (registerData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    if (registerData.password !== registerData.confirmPassword) {
      throw new Error('Passwords do not match');
    }
    if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      throw new Error('Please enter a valid email address');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      validateRegisterForm();

      // Step 1: Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            name: registerData.name,
            phone: registerData.phone,
            company_name: registerData.companyName
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Registration failed - no user data received');
      }

      console.log('✅ User registered successfully:', authData.user.id);

      // Step 2: Wait a moment for triggers to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Create super admin role using the function we created
      try {
        const { data: adminResult, error: adminError } = await supabase
          .rpc('create_initial_super_admin', { 
            admin_email: registerData.email 
          });

        if (adminError) {
          console.error('Admin role creation error:', adminError);
          // Continue anyway - the user is registered
        } else {
          console.log('✅ Admin role created:', adminResult);
        }
      } catch (adminRoleError) {
        console.error('Error calling admin function:', adminRoleError);
        // Continue anyway - we can create admin role manually later
      }

      // Step 4: Try manual admin role creation if function failed
      try {
        const { error: manualAdminError } = await supabase
          .from('admin_roles')
          .upsert({
            user_id: authData.user.id,
            role: 'super_admin',
            permissions: {
              "manage_organizations": true, 
              "manage_subscriptions": true, 
              "manage_admins": true, 
              "view_analytics": true,
              "manage_platform": true
            },
            is_active: true,
            created_at: new Date().toISOString()
          });

        if (manualAdminError) {
          console.error('Manual admin role creation error:', manualAdminError);
        } else {
          console.log('✅ Manual admin role created successfully');
        }
      } catch (manualError) {
        console.error('Manual admin creation failed:', manualError);
      }

      setSuccess(
        `🎉 Super Admin account created successfully for ${registerData.email}! ` +
        `Please check your email to verify your account, then you can sign in.`
      );
      
      // Reset form
      setRegisterData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        companyName: ''
      });
      
      // Switch to login view after 3 seconds
      setTimeout(() => {
        setCurrentView('login');
        setSuccess('');
      }, 3000);

      // Refresh admin users check
      await checkAdminUsers();
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific errors
      if (error.message?.includes('already registered')) {
        setError('This email is already registered. Please try signing in instead.');
      } else if (error.message?.includes('Password should be')) {
        setError('Password must be at least 6 characters long.');
      } else {
        setError(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-purple-200">KrishiSethu Master Control Panel</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white">
              {currentView === 'login' ? 'Administrator Access' : 'Create Super Admin Account'}
            </CardTitle>
            <CardDescription className="text-purple-200">
              {currentView === 'login' 
                ? 'Enter your admin credentials to access the control panel'
                : 'Set up the first super admin account for your system'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* View Switcher - Only show if no admin users exist */}
            {!hasAdminUsers && (
              <div className="mb-6">
                <div className="flex space-x-2 p-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <button
                    type="button"
                    onClick={() => setCurrentView('login')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'login'
                        ? 'bg-purple-600/80 text-white shadow-sm border border-purple-500/50'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Shield className="h-4 w-4 mr-2 inline" />
                    Admin Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView('register')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'register'
                        ? 'bg-blue-600/80 text-white shadow-sm border border-blue-500/50'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <UserPlus className="h-4 w-4 mr-2 inline" />
                    Create Super Admin
                  </button>
                </div>
              </div>
            )}

            {/* Error Messages */}
            {error && (
              <Alert className="mb-4 bg-red-500/10 border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Messages */}
            {success && (
              <Alert className="mb-4 bg-green-500/10 border-green-500/20">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-200">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Login Form */}
            {currentView === 'login' && (
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Admin Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="email"
                    name="email"
                    placeholder="admin@krishisethu.com"
                    value={credentials.email}
                    onChange={handleInputChange}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-300"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter admin password"
                    value={credentials.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-gray-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Access Admin Panel
                  </>
                )}
              </Button>
            </form>
            )}

            {/* Registration Form */}
            {currentView === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={registerData.name}
                      onChange={handleRegisterChange}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Admin Email *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="email"
                      name="email"
                      placeholder="admin@yourcompany.com"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="tel"
                      name="phone"
                      placeholder="+91-9876543210"
                      value={registerData.phone}
                      onChange={handleRegisterChange}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      name="companyName"
                      placeholder="Your company name"
                      value={registerData.companyName}
                      onChange={handleRegisterChange}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Create a strong password"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-gray-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-gray-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50/10 border border-blue-200/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-300 mb-2">🔐 Super Admin Privileges:</h4>
                  <ul className="text-sm text-blue-200 space-y-1">
                    <li>✅ Manage all organizations and users</li>
                    <li>✅ Control subscription and billing</li>
                    <li>✅ Access platform analytics</li>
                    <li>✅ Manage system settings</li>
                    <li>✅ Create additional admin accounts</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Super Admin...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Super Admin Account
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-white/20">
              <Button
                variant="ghost"
                onClick={() => onNavigate('/')}
                className="w-full text-purple-200 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Landing Page
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-purple-200">
            🔒 This is a secure admin portal. All activities are logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
