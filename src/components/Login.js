import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import AnimatedHero from './AnimatedHero';
import AnimatedTitle from './AnimatedTitle';

const Login = () => {
  const { signin, demoLogin, USER_ROLES } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState('demo'); // 'demo' or 'firebase'

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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Login Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 lg:p-8">
        <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 text-center pb-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img
              src="/Logo.png"
              alt="Krishisethu Logo"
              className="h-16 w-auto object-contain"
            />
          </div>
          <AnimatedTitle />
          <CardDescription className="text-gray-600 mt-4">
            Welcome back! Sign in to manage your fertilizer shop inventory
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Login Mode Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-3 block">Choose Login Method</label>
            <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setLoginMode('demo')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginMode === 'demo'
                    ? 'bg-white text-green-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Demo Mode
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('firebase')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginMode === 'firebase'
                    ? 'bg-white text-green-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Firebase Auth
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
              <a href="mailto:admin@krishisethu.com" className="text-primary hover:text-primary/80 font-medium">
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

      {/* Animated Hero Section */}
      <AnimatedHero />
    </div>
  );
};

export default Login;
