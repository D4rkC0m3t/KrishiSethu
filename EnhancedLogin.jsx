import React, { useState } from 'react';
import { supabase } from './supabaseClient';

const EnhancedLogin = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    company: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear message when user starts typing
    if (message) setMessage('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setMessage('Email and password are required');
      return false;
    }
    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return false;
    }
    if (!isLogin && !formData.fullName) {
      setMessage('Full name is required for registration');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        // Update last login
        if (data.user) {
          await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.user.id);
        }

        setMessage('Welcome back! Login successful.');
        setTimeout(() => {
          if (onLogin) onLogin(data.user);
        }, 1000);

      } else {
        // Registration
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
              company: formData.company,
            },
          },
        });

        if (error) throw error;

        setMessage('🎉 Registration successful! Please check your email to verify your account.');
        // Clear form after successful registration
        setTimeout(() => {
          setFormData({
            email: '',
            password: '',
            fullName: '',
            phone: '',
            company: ''
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setMessage('');
    setFormData({
      email: '',
      password: '',
      fullName: '',
      phone: '',
      company: ''
    });
  };

  return (
    <div className="enhanced-auth-container">
      {/* Background with animated gradient */}
      <div className="auth-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="auth-content">
        {/* Left side - Branding */}
        <div className="auth-branding">
          <div className="brand-content">
            <div className="brand-icon">🌾</div>
            <h1>KrishiSethu</h1>
            <p className="brand-tagline">Empowering Agriculture Through Technology</p>
            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Smart Analytics</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🌱</span>
                <span>Crop Management</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🚜</span>
                <span>Farm Optimization</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <span>Mobile Friendly</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="auth-panel">
          <div className="auth-card">
            <div className="auth-header">
              <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
              <p>{isLogin ? 'Sign in to continue to KrishiSethu' : 'Join our growing community of farmers'}</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">
                  <span className="label-icon">✉️</span>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <span className="label-icon">🔒</span>
                  Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your password"
                    className="form-input"
                    minLength="6"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <>
                  <div className="form-group">
                    <label htmlFor="fullName">
                      <span className="label-icon">👤</span>
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      placeholder="Your full name"
                      className="form-input"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">
                        <span className="label-icon">📞</span>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91-9876543210"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="company">
                        <span className="label-icon">🏢</span>
                        Company
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="Your company"
                        className="form-input"
                      />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" disabled={loading} className="auth-button">
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{isLogin ? '🚀 Sign In' : '✨ Create Account'}</span>
                  </>
                )}
              </button>

              {message && (
                <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
                  {message}
                </div>
              )}
            </form>

            <div className="auth-switch">
              <p>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button type="button" onClick={switchMode} className="switch-button">
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .enhanced-auth-container {
          min-height: 100vh;
          display: flex;
          position: relative;
          overflow: hidden;
        }

        .auth-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          z-index: -1;
        }

        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          animation: float 6s ease-in-out infinite;
        }

        .orb-1 {
          width: 300px;
          height: 300px;
          background: rgba(255, 255, 255, 0.1);
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 200px;
          height: 200px;
          background: rgba(102, 126, 234, 0.2);
          top: 60%;
          right: 20%;
          animation-delay: 2s;
        }

        .orb-3 {
          width: 150px;
          height: 150px;
          background: rgba(118, 75, 162, 0.15);
          bottom: 30%;
          left: 30%;
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }

        .auth-content {
          display: flex;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          min-height: 100vh;
        }

        .auth-branding {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 40px;
          color: white;
        }

        .brand-content {
          max-width: 500px;
          text-align: center;
        }

        .brand-icon {
          font-size: 4rem;
          margin-bottom: 20px;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }

        .brand-content h1 {
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 20px;
          background: linear-gradient(45deg, #ffffff, #e0e7ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .brand-tagline {
          font-size: 1.2rem;
          margin-bottom: 40px;
          opacity: 0.9;
        }

        .feature-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 40px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.1);
          padding: 15px 20px;
          border-radius: 15px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .feature-item:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .feature-icon {
          font-size: 1.5rem;
        }

        .auth-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .auth-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 50px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.2);
          width: 100%;
          max-width: 500px;
          animation: slideIn 0.5s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .auth-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .auth-header h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 10px;
        }

        .auth-header p {
          color: #6b7280;
          font-size: 1rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #374151;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .label-icon {
          font-size: 1.1rem;
        }

        .form-input {
          padding: 16px 20px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .password-toggle:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .auth-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 18px 24px;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 10px;
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }

        .auth-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
        }

        .auth-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .auth-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .message {
          padding: 16px 20px;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 500;
          text-align: center;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .message.success {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #065f46;
          border: 1px solid #10b981;
        }

        .message.error {
          background: linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%);
          color: #991b1b;
          border: 1px solid #ef4444;
        }

        .auth-switch {
          text-align: center;
          margin-top: 30px;
          padding-top: 25px;
          border-top: 1px solid #e5e7eb;
        }

        .auth-switch p {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .switch-button {
          background: none;
          border: none;
          color: #667eea;
          font-weight: 600;
          cursor: pointer;
          margin-left: 8px;
          text-decoration: none;
          transition: all 0.2s ease;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .switch-button:hover {
          color: #4f46e5;
          background: rgba(102, 126, 234, 0.1);
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .auth-content {
            flex-direction: column;
          }

          .auth-branding {
            padding: 40px 20px;
            flex: none;
          }

          .brand-content h1 {
            font-size: 2.5rem;
          }

          .feature-list {
            grid-template-columns: 1fr;
          }

          .auth-card {
            padding: 30px;
            margin: 20px;
            border-radius: 20px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedLogin;
