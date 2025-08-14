import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader } from './ui/card';

import LottieHero from './LottieHero';



const Login = () => {
  const { signin, demoLogin, USER_ROLES } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState('demo'); // 'demo' or 'supabase'

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

  const validateForm = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loginMode === 'demo') {
      setIsLoading(true);
      try {
        await demoLogin(USER_ROLES.ADMIN);
      } catch (error) {
        setErrors({ general: 'Demo login failed. Please try again.' });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await signin(formData.email, formData.password);
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'Invalid email or password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setIsLoading(true);
    try {
      await demoLogin(role);
    } catch (error) {
      setErrors({ general: 'Demo login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-row bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      {/* Login Form Section */}
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
            <h1 className="text-3xl font-bold text-white">Welcome!</h1>
            <p className="text-gray-300 text-sm">Log in to KrishiSethu to continue to KrishiSethu.</p>
          </div>
        </CardHeader>

        <CardContent className="relative z-10">
          {/* Login Mode Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-300 mb-3 block">
              Choose Login Method
            </label>
            <div className="flex space-x-2 p-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <button
                type="button"
                onClick={() => setLoginMode('demo')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginMode === 'demo'
                    ? 'bg-blue-600/80 text-white shadow-sm border border-blue-500/50'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Demo Mode
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('supabase')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginMode === 'supabase'
                    ? 'bg-blue-600/80 text-white shadow-sm border border-blue-500/50'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Supabase Auth
              </button>
            </div>
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
              {errors.general}
            </div>
          )}

          {loginMode === 'demo' ? (
            <div className="space-y-4">
              <div className="text-center text-sm text-gray-600 mb-4">
                Choose a demo role to explore the system
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => handleDemoLogin(USER_ROLES.ADMIN)}
                  className="w-full"
                  disabled={isLoading}
                >
                  👑 Login as Admin
                </Button>
                <Button
                  onClick={() => handleDemoLogin(USER_ROLES.MANAGER)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  👨‍💼 Login as Manager
                </Button>
                <Button
                  onClick={() => handleDemoLogin(USER_ROLES.STAFF)}
                  className="w-full bg-gray-600 hover:bg-gray-700"
                  disabled={isLoading}
                >
                  👤 Login as Staff
                </Button>
              </div>

              {isLoading && (
                <div className="text-center text-sm text-gray-600">
                  Logging in...
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={isLoading}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <span className="text-red-500 text-sm">{errors.email}</span>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <span className="text-red-500 text-sm">{errors.password}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span>Remember me</span>
                </label>
                <a href="#forgot" className="text-sm text-green-600 hover:text-green-700">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need an account for your shop?{' '}
              <a
                href="mailto:admin@example.com"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Contact Administrator
              </a>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Accounts are created by administrators for security purposes
            </p>
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
