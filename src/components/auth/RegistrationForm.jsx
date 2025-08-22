import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, User, Mail, Phone, Building, Eye, EyeOff } from 'lucide-react';

const RegistrationForm = ({ onSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    companyName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔄 Starting user registration...');
      
      // First, try to create user profile data that will be available immediately
      const trialEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      // Sign up user with Supabase Auth with minimal metadata to avoid triggers
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // Keep metadata minimal to avoid database trigger issues
          data: {
            name: formData.name
          }
        }
      });

      if (signUpError) {
        console.error('❌ Auth signup failed:', signUpError);
        
        // Handle specific auth errors
        if (signUpError.message.includes('Database error')) {
          throw new Error('Registration temporarily unavailable. This usually indicates a database configuration issue. Please try again later or contact support.');
        } else if (signUpError.message.includes('already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        } else if (signUpError.message.includes('invalid email')) {
          throw new Error('Please enter a valid email address.');
        } else {
          throw new Error(signUpError.message || 'Registration failed. Please try again.');
        }
      }

      if (data.user) {
        console.log('✅ Auth user created:', data.user.id);
        
        // Wait a moment for any database triggers to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to create user profile in the users table (which exists)
        try {
          const profileData = {
            id: data.user.id,
            email: formData.email,
            name: formData.name,
            phone: formData.phone || null,
            company_name: formData.companyName || null,
            role: 'trial',
            account_type: 'trial',
            is_active: true,
            is_paid: false,
            trial_start_date: new Date().toISOString(),
            trial_end_date: trialEndDate.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('🔄 Creating user profile...');
          console.log('📋 Profile data to insert:', profileData);
          
          const { error: profileError } = await supabase
            .from('users')
            .upsert(profileData, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });

          if (profileError) {
            console.warn('⚠️ Profile creation failed:', profileError.message);
            console.warn('⚠️ Profile error details:', profileError);
            // Don't throw error here - auth user was created successfully
            // Profile can be created later when user logs in
          } else {
            console.log('✅ User profile created successfully');
            
            // Verify the profile was actually created
            const { data: verifyData, error: verifyError } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();
              
            if (verifyError) {
              console.warn('⚠️ Profile verification failed:', verifyError);
            } else {
              console.log('✅ Profile verified in database:', verifyData);
            }
          }
        } catch (profileErr) {
          console.warn('⚠️ Profile creation exception:', profileErr.message);
          // Don't throw error - auth was successful
        }

        // Show success message regardless of profile creation
        console.log('✅ Registration completed successfully');
        onSuccess && onSuccess({
          message: data.user.email_confirmed_at 
            ? 'Registration successful! You can now sign in.' 
            : 'Registration successful! Please check your email to verify your account before signing in.',
          user: data.user
        });
      } else {
        throw new Error('User creation failed - no user data returned.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-green-700">
          Start Your 30-Day Free Trial
        </CardTitle>
        <CardDescription>
          Get full access to KrishiSethu Inventory Management for 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
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
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+91-9876543210"
                value={formData.phone}
                onChange={handleInputChange}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="companyName"
                name="companyName"
                type="text"
                placeholder="Your company name"
                value={formData.companyName}
                onChange={handleInputChange}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">🎉 What you get with your free trial:</h4>
            <ul className="text-sm text-green-700 space-y-1">
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
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegistrationForm;
