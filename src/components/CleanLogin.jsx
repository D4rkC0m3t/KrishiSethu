import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
  CheckCircle
} from 'lucide-react';

const CleanLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    company: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear message when user starts typing
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = () => {
    if (!formData.email) {
      setMessage({ type: 'error', text: 'Email is required' });
      return false;
    }
    if (!validateEmail(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return false;
    }
    if (!formData.password) {
      setMessage({ type: 'error', text: 'Password is required' });
      return false;
    }
    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return false;
    }
    if (!isLogin) {
      if (!formData.fullName.trim()) {
        setMessage({ type: 'error', text: 'Full name is required' });
        return false;
      }
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      if (data.user) {
        // Update last login time
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);

        setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
        
        // Redirect will be handled by AuthContext
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.message.includes('Invalid login credentials')) {
        setMessage({ type: 'error', text: 'Invalid email or password' });
      } else if (error.message.includes('Email not confirmed')) {
        setMessage({ type: 'error', text: 'Please check your email and click the confirmation link' });
      } else {
        setMessage({ type: 'error', text: error.message || 'Login failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Create auth user with metadata
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            name: formData.fullName.trim(), // fallback
            phone: formData.phone.trim() || null,
            company: formData.company.trim() || null
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        setMessage({ 
          type: 'success', 
          text: 'Registration successful! Please check your email to verify your account, then sign in.' 
        });
        
        // Switch to login mode and clear form
        setTimeout(() => {
          setIsLogin(true);
          setFormData({
            email: formData.email, // keep email for convenience
            password: '',
            fullName: '',
            phone: '',
            company: ''
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.message.includes('User already registered')) {
        setMessage({ type: 'error', text: 'An account with this email already exists. Please sign in instead.' });
      } else if (error.message.includes('Password should be at least')) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      } else if (error.message.includes('signup is disabled')) {
        setMessage({ type: 'error', text: 'New registrations are currently disabled. Please contact support.' });
      } else {
        setMessage({ type: 'error', text: error.message || 'Registration failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setMessage({ type: 'error', text: 'Please enter your email address first' });
      return;
    }

    if (!validateEmail(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password reset email sent! Please check your inbox.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send password reset email. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 rounded-full bg-gradient-to-r from-emerald-200/30 to-teal-200/30 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full bg-gradient-to-r from-green-200/30 to-emerald-200/30 blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        {/* Logo */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <img
            src="/Logo_Horizontal_sidebar.png"
            alt="Krishisethu Logo"
            className="h-16 object-contain filter drop-shadow-sm"
          />
        </div>

        {/* Main Card */}
        <Card className="relative w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden mt-20">
          {/* Card gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-green-500/20 rounded-2xl blur-sm -z-10"></div>
          
          <CardHeader className="text-center pb-6 pt-8 px-8">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {isLogin ? 'Welcome Back!' : 'Create Your Account'}
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              {isLogin 
                ? 'Sign in to continue to your dashboard' 
                : 'Join KrishiSethu and get 30 days free access'
              }
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            
            {/* Mode Toggle */}
            <div className="mb-8">
              <div className="relative flex bg-gray-100 rounded-xl p-1">
                <div 
                  className={`absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-in-out ${
                    isLogin ? 'left-1 right-1/2 mr-1' : 'right-1 left-1/2 ml-1'
                  }`}
                ></div>
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`relative flex-1 py-3 px-4 text-sm font-medium transition-colors duration-300 rounded-lg z-10 ${
                    isLogin
                      ? 'text-emerald-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`relative flex-1 py-3 px-4 text-sm font-medium transition-colors duration-300 rounded-lg z-10 ${
                    !isLogin
                      ? 'text-emerald-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Message Display */}
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                message.type === 'error' 
                  ? 'bg-red-50 border-l-4 border-red-400' 
                  : 'bg-emerald-50 border-l-4 border-emerald-400'
              }`}>
                {message.type === 'error' ? (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                )}
                <span className={`text-sm font-medium ${
                  message.type === 'error' ? 'text-red-700' : 'text-emerald-700'
                }`}>
                  {message.text}
                </span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
              
              {/* Full Name (Registration only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-semibold text-gray-700">
                    Full Name *
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      disabled={isLoading}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address *
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  />
                </div>
              </div>

              {/* Phone and Company (Registration only) */}
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                      Phone Number
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91-9876543210"
                        disabled={isLoading}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-semibold text-gray-700">
                      Company Name
                    </label>
                    <div className="relative group">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="Your company name"
                        disabled={isLoading}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password *
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={isLogin ? "Enter your password" : "Create a password (min 6 characters)"}
                    disabled={isLoading}
                    className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Trial Benefits (Registration only) */}
              {!isLogin && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                  <h4 className="font-bold text-emerald-800 mb-3 flex items-center">
                    <span className="mr-2">🎉</span>
                    What you get with your free trial:
                  </h4>
                  <ul className="text-sm text-emerald-700 space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0" />
                      Full inventory management system
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0" />
                      POS and sales tracking
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0" />
                      Customer and supplier management
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0" />
                      Reports and analytics
                    </li>
                    <li className="flex items-center font-semibold">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0" />
                      30 days completely free
                    </li>
                  </ul>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>

              {/* Forgot Password (Login only) */}
              {isLogin && (
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="absolute bottom-8 text-center text-gray-500 text-xs">
          © 2024 KrishiSethu. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default CleanLogin;
