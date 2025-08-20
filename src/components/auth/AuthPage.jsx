import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';
import { TrialStatusBanner } from '../admin/AdminControlPanel';

const AuthPage = ({ onAuthSuccess }) => {
  const [currentView, setCurrentView] = useState('login'); // 'login' or 'register'
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
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
    } finally {
      setLoading(false);
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
      return { valid: false, reason: 'Your account has been disabled. Please contact support.' };
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
        alert(accessCheck.reason);
        return;
      }

      // Valid user, proceed to app
      onAuthSuccess && onAuthSuccess({ user, profile });
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleLoginSuccess = async (data) => {
    const { user, profile, trialStatus } = data;
    
    setUser(user);
    setProfile(profile);

    // Proceed to app
    onAuthSuccess && onAuthSuccess({ user, profile, trialStatus });
  };

  const handleRegistrationSuccess = (data) => {
    setCurrentView('login');
    alert(data.message);
  };

  const handleUpgrade = () => {
    // Redirect to upgrade/payment page
    alert('Upgrade functionality will be implemented here. Contact admin for now.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in but we're still on auth page, show trial status
  if (user && profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="w-full max-w-md">
          <TrialStatusBanner user={profile} onUpgrade={handleUpgrade} />
          <div className="text-center">
            <p className="text-gray-600 mb-4">You are logged in as {profile.name}</p>
            <button
              onClick={() => onAuthSuccess && onAuthSuccess({ user, profile })}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">KS</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KrishiSethu</h1>
          <p className="text-gray-600">Complete Inventory Management Solution</p>
        </div>

        {/* Auth Forms */}
        {currentView === 'login' ? (
          <LoginForm
            onSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setCurrentView('register')}
          />
        ) : (
          <RegistrationForm
            onSuccess={handleRegistrationSuccess}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>&copy; 2025 KrishiSethu. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="#" className="hover:text-green-600">Privacy Policy</a>
            <a href="#" className="hover:text-green-600">Terms of Service</a>
            <a href="#" className="hover:text-green-600">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
