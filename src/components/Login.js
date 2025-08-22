import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import LottieHero from './LottieHero';
import {
  Loader2,
  User,
  Mail,
  Phone,
  Building,
  Eye,
  EyeOff,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';



// Trial Status Banner Component
const TrialStatusBanner = ({ user, onUpgrade }) => {
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
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-r-lg">
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
      <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4 rounded-r-lg">
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
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-r-lg">
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

const Login = () => {
  const { signin } = useAuth();
  const [currentView, setCurrentView] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    phone: '',
    companyName: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // Check for existing user session on component mount
  useEffect(() => {
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await loadUserProfile(user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const validateUserAccess = (profile) => {
    if (!profile) return { valid: false, reason: 'No profile found' };
    
    // Admin always has access
    const userRole = profile.role || profile.account_type;
    if (userRole === 'admin') {
      return { valid: true, reason: 'Admin account' };
    }
    
    // Check if account is active
    if (!profile.is_active) {
      return { valid: false, reason: 'Account has been disabled. Please contact support.' };
    }
    
    // Paid users always have access
    if (profile.is_paid) {
      return { valid: true, reason: 'Paid account' };
    }
    
    // Check trial period for trial users
    const now = new Date();
    const trialEnd = new Date(profile.trial_end);
    
    if (now > trialEnd) {
      return { valid: false, reason: 'Your 30-day trial has expired. Please upgrade to continue using the service.' };
    }
    
    return { valid: true, reason: 'Trial active' };
  };

  const loadUserProfile = async (user) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setUser(user);
      setProfile(profile);

      // Validate user access
      const accessCheck = validateUserAccess(profile);
      
      if (!accessCheck.valid) {
        // If trial expired, disable account
        if (accessCheck.reason.includes('trial has expired')) {
          await supabase
            .from('profiles')
            .update({
              is_active: false,
              disabled_reason: 'trial_expired'
            })
            .eq('id', user.id);
        }

        await supabase.auth.signOut();
        setErrors({ general: accessCheck.reason });
        return;
      }

      // Valid user, proceed to app (this will be handled by AuthContext)
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateLoginForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegistrationForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateLoginForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Sign in with Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) {
        throw signInError;
      }

      if (data.user) {
        // Profile will be loaded by the useEffect listener
        // The AuthContext will handle the rest automatically
        console.log('Login successful, user:', data.user.email);
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.message.includes('Invalid login credentials')) {
        setErrors({ general: 'Invalid email or password. Please try again.' });
      } else {
        setErrors({ general: error.message || 'Login failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();

    if (!validateRegistrationForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Sign up user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
            company_name: formData.companyName
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        console.log('User created successfully:', data.user.id);
        
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to update the profile with additional information
        // Use upsert to handle cases where profile doesn't exist yet
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: formData.email,
            name: formData.name,
            phone: formData.phone || null,
            company_name: formData.companyName || null,
            trial_start: new Date().toISOString(),
            trial_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            account_type: 'trial'
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('Profile upsert error:', profileError);
          // Don't throw here - registration was successful, profile issue is secondary
        } else {
          console.log('Profile updated successfully');
        }

        // Switch to login view and show success message
        setCurrentView('login');
        setErrors({ success: 'Registration successful! Please check your email to verify your account, then sign in.' });

        // Clear registration form
        setFormData(prev => ({
          ...prev,
          name: '',
          confirmPassword: '',
          phone: '',
          companyName: ''
        }));
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific Supabase errors
      if (error.message.includes('duplicate key value')) {
        setErrors({ general: 'An account with this email already exists. Please try logging in instead.' });
      } else if (error.message.includes('Password should be at least')) {
        setErrors({ password: 'Password must be at least 6 characters long.' });
      } else if (error.message.includes('Invalid email')) {
        setErrors({ email: 'Please enter a valid email address.' });
      } else if (error.message.includes('signup is disabled')) {
        setErrors({ general: 'New registrations are currently disabled. Please contact support.' });
      } else {
        setErrors({ general: error.message || 'Registration failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };



  const handleUpgrade = () => {
    // Redirect to upgrade/payment page
    setErrors({ general: 'Upgrade functionality will be implemented here. Contact admin for now.' });
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      setErrors({ general: 'Please enter your email address first' });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }

      setErrors({ success: 'Password reset email sent! Please check your inbox.' });
    } catch (error) {
      setErrors({ general: 'Failed to send password reset email. Please try again.' });
    }
  };

  // If user is logged in but we're still on login page, show trial status
  if (user && profile) {
    return (
      <div className="min-h-screen flex flex-row bg-gradient-to-br from-gray-900 via-slate-900 to-black">
        <div className="relative w-1/2 flex flex-col items-center justify-center p-4 lg:p-8">
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50 logo-container">
            <img
              src="/Logo_Horizontal_sidebar.png"
              alt="Krishisethu Logo"
              className="h-20 object-contain logo-transparent"
              style={{ background: 'transparent', backgroundColor: 'transparent' }}
            />
          </div>

          <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <CardContent className="p-6">
              <TrialStatusBanner user={profile} onUpgrade={handleUpgrade} />
              <div className="text-center">
                <p className="text-white mb-4">Welcome back, {profile.name}!</p>
                <p className="text-gray-300 text-sm mb-4">You are logged in to your KrishiSethu account</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Continue to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <LottieHero />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-row bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      {/* Auth Form Section */}
      <div className="relative w-1/2 flex flex-col items-center justify-center p-4 lg:p-8">

        {/* Logo positioned absolutely above card */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50 logo-container">
          <img
            src="/Logo_Horizontal_sidebar.png"
            alt="Krishisethu Logo"
            className="h-20 object-contain logo-transparent"
            style={{ background: 'transparent', backgroundColor: 'transparent' }}
          />
        </div>

        {/* Main login card */}
        <Card className="relative w-full max-w-lg shadow-2xl border border-white/10 bg-black/20 backdrop-blur-xl rounded-3xl overflow-hidden mt-16">
          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none"></div>
        <CardHeader className="relative space-y-1 text-center pb-6 z-10 pt-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">
              {currentView === 'register' ? 'Create Your Account' : 'Welcome Back!'}
            </h1>
            <p className="text-gray-300 text-sm">
              {currentView === 'register' ? 'Join KrishiSethu Inventory Management System' : 'Sign in to your KrishiSethu account'}
            </p>
          </div>
        </CardHeader>

        <CardContent className="relative z-10">
          {/* Access Method Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-300 mb-3 block">
              Choose Access Method
            </label>
            <div className="flex space-x-2 p-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <button
                type="button"
                onClick={() => setCurrentView('login')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'login'
                    ? 'bg-green-600/80 text-white shadow-sm border border-green-500/50'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Sign In
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
                Create Account
              </button>
            </div>
          </div>

          {/* Error and Success Messages */}
          {errors.general && (
            <div className="mb-4 p-4 bg-red-50/10 border border-red-200/20 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-red-300 text-sm">{errors.general}</span>
            </div>
          )}

          {errors.success && (
            <div className="mb-4 p-4 bg-green-50/10 border border-green-200/20 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-green-300 text-sm">{errors.success}</span>
            </div>
          )}



          {/* Login Form */}
          {currentView === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    disabled={isLoading}
                    className={`w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.email && (
                  <span className="text-red-400 text-sm">{errors.email}</span>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className={`w-full pr-10 pl-4 py-2 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.password ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-red-400 text-sm">{errors.password}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-sm text-gray-300">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-green-400 hover:text-green-300"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          )}

          {/* Registration Form */}
          {currentView === 'register' && (
            <form onSubmit={handleRegistration} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-300">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    disabled={isLoading}
                    className={`w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.name && (
                  <span className="text-red-400 text-sm">{errors.name}</span>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    disabled={isLoading}
                    className={`w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.email && (
                  <span className="text-red-400 text-sm">{errors.email}</span>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-300">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91-9876543210"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium text-gray-300">
                  Company Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Your company name"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-300">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    disabled={isLoading}
                    className={`w-full pr-10 pl-4 py-2 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-red-400 text-sm">{errors.password}</span>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                    className={`w-full pr-10 pl-4 py-2 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="text-red-400 text-sm">{errors.confirmPassword}</span>
                )}
              </div>

              <div className="bg-blue-50/10 border border-blue-200/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-300 mb-2">🎉 What you get with your free trial:</h4>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>✅ Full inventory management system</li>
                  <li>✅ POS and sales tracking</li>
                  <li>✅ Customer and supplier management</li>
                  <li>✅ Reports and analytics</li>
                  <li>✅ 30 days completely free</li>
                  <li>✅ No credit card required</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          )}

          {/* Footer Links */}
          <div className="mt-6 text-center">
            {currentView === 'login' && (
              <p className="text-sm text-gray-300">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setCurrentView('register')}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Create Account
                </button>
              </p>
            )}

            {currentView === 'register' && (
              <p className="text-sm text-gray-300">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setCurrentView('login')}
                  className="text-green-400 hover:text-green-300 font-medium"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </CardContent>
        </Card>
      </div>

      {/* Lottie Hero Section */}
      <LottieHero />
    </div>
  );
};

export default Login;
