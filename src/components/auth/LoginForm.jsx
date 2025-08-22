import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Mail, Eye, EyeOff, AlertTriangle, Clock } from 'lucide-react';

const LoginForm = ({ onSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const checkTrialStatus = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return { isValid: true }; // Allow login if we can't check
      }

      const now = new Date();
      const trialEnd = new Date(profile.trial_end);
      const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

      // Check if account is disabled
      if (!profile.is_active) {
        return {
          isValid: false,
          reason: 'account_disabled',
          message: 'Your account has been disabled. Please contact support.',
          profile
        };
      }

      // Check if trial has expired and user hasn't paid
      if (now > trialEnd && !profile.is_paid) {
        // Auto-disable expired trial accounts
        await supabase
          .from('profiles')
          .update({ 
            is_active: false,
            disabled_reason: 'trial_expired'
          })
          .eq('id', userId);

        return {
          isValid: false,
          reason: 'trial_expired',
          message: 'Your 30-day trial has expired. Please upgrade to continue using the service.',
          profile: { ...profile, is_active: false }
        };
      }

      // Update last login
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);

      return {
        isValid: true,
        profile,
        daysLeft: profile.is_paid ? null : Math.max(0, daysLeft),
        isTrialUser: !profile.is_paid
      };
    } catch (error) {
      console.error('Error checking trial status:', error);
      return { isValid: true }; // Allow login if check fails
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

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
        // Check trial status
        const trialStatus = await checkTrialStatus(data.user.id);
        
        if (!trialStatus.isValid) {
          // Sign out the user if account is not valid
          await supabase.auth.signOut();
          setError(trialStatus.message);
          return;
        }

        // Successful login
        onSuccess && onSuccess({
          user: data.user,
          profile: trialStatus.profile,
          trialStatus
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      setError('Please enter your email address first');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }

      alert('Password reset email sent! Please check your inbox.');
    } catch (error) {
      setError('Failed to send password reset email. Please try again.');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-green-700">
          Welcome Back
        </CardTitle>
        <CardDescription>
          Sign in to your KrishiSethu account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-green-600 hover:text-green-700"
            >
              Forgot password?
            </button>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Create Account
              </button>
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-blue-800">New to KrishiSethu?</h4>
            </div>
            <p className="text-sm text-blue-700 mb-2">
              Get started with a 30-day free trial - no credit card required!
            </p>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>✓ Complete inventory management</li>
              <li>✓ POS system with receipt printing</li>
              <li>✓ Customer & supplier management</li>
              <li>✓ Sales reports and analytics</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
