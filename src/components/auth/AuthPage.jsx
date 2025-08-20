import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';

const AuthPage = ({ onAuthSuccess }) => {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Start with a clean slate
        setError(null);
        setLoading(true);

        // Check current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session?.user && mounted) {
          await loadUserProfile(session.user);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setError(error.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          setLoading(true);
          await loadUserProfile(session.user);
        } catch (error) {
          console.error('Error loading profile:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    initializeAuth();

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (user) => {
    try {
      setLoading(true);
      setError(null);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setUser(user);
      setProfile(profile);
      
      // Check if we should redirect to success handler
      if (profile && profile.isActive !== false) {
        onAuthSuccess?.(user, profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError(error.message);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900">Authentication Error</h3>
          <p className="mt-2 text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KrishiSethu</h1>
          <p className="text-gray-600">Complete Inventory Management Solution</p>
        </div>

        {currentView === 'login' ? (
          <LoginForm
            onSuccess={(user) => loadUserProfile(user)}
            onSwitchToRegister={() => setCurrentView('register')}
          />
        ) : (
          <RegistrationForm
            onSuccess={(user) => loadUserProfile(user)}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )}

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