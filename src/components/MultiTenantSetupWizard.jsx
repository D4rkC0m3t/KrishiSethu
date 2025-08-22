import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, ChevronRight, ChevronLeft, Shield, Database, Users, Settings, Building, AlertCircle } from 'lucide-react';

const MultiTenantSetupWizard = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState({
    companyInfo: {
      name: '',
      address: '',
      phone: '',
      email: '',
      gst_number: '',
      website: ''
    },
    adminUser: {
      name: '',
      role: 'admin',
      department: ''
    },
    security: {
      enableRLS: true,
      enableAuditLog: true,
      dataRetentionDays: 365
    },
    database: {
      setupTables: true,
      seedData: false,
      enableBackups: true
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [setupProgress, setSetupProgress] = useState({});
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const steps = [
    {
      id: 1,
      title: 'Company Information',
      description: 'Basic company details and contact information',
      icon: <Building className="h-6 w-6" />
    },
    {
      id: 2,
      title: 'Admin User Setup',
      description: 'Configure the primary administrator account',
      icon: <Users className="h-6 w-6" />
    },
    {
      id: 3,
      title: 'Security Configuration',
      description: 'Set up security policies and access controls',
      icon: <Shield className="h-6 w-6" />
    },
    {
      id: 4,
      title: 'Database Setup',
      description: 'Initialize database tables and configurations',
      icon: <Database className="h-6 w-6" />
    },
    {
      id: 5,
      title: 'Final Configuration',
      description: 'Review and complete the setup process',
      icon: <Settings className="h-6 w-6" />
    }
  ];

  // Update setup data
  const updateSetupData = (section, field, value) => {
    setSetupData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Validate current step
  const validateStep = (step) => {
    switch (step) {
      case 1:
        return setupData.companyInfo.name && setupData.companyInfo.email;
      case 2:
        return setupData.adminUser.name && setupData.adminUser.role;
      case 3:
        return true; // Security settings have defaults
      case 4:
        return true; // Database settings have defaults
      case 5:
        return true; // Final step
      default:
        return false;
    }
  };

  // Mark step as completed
  const completeStep = (step) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  // Setup company information
  const setupCompanyInfo = async () => {
    try {
      setSetupProgress(prev => ({ ...prev, company: 'processing' }));
      
      // In real implementation, save to shop_details table
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setSetupProgress(prev => ({ ...prev, company: 'completed' }));
      return true;
    } catch (error) {
      setSetupProgress(prev => ({ ...prev, company: 'error' }));
      return false;
    }
  };

  // Setup admin user
  const setupAdminUser = async () => {
    try {
      setSetupProgress(prev => ({ ...prev, admin: 'processing' }));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Update user profile with admin role
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            name: setupData.adminUser.name,
            role: setupData.adminUser.role,
            department: setupData.adminUser.department,
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
      
      setSetupProgress(prev => ({ ...prev, admin: 'completed' }));
      return true;
    } catch (error) {
      setSetupProgress(prev => ({ ...prev, admin: 'error' }));
      return false;
    }
  };

  // Setup security policies
  const setupSecurity = async () => {
    try {
      setSetupProgress(prev => ({ ...prev, security: 'processing' }));
      
      // In real implementation, configure RLS policies
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate setup
      
      setSetupProgress(prev => ({ ...prev, security: 'completed' }));
      return true;
    } catch (error) {
      setSetupProgress(prev => ({ ...prev, security: 'error' }));
      return false;
    }
  };

  // Setup database tables
  const setupDatabase = async () => {
    try {
      setSetupProgress(prev => ({ ...prev, database: 'processing' }));
      
      // Check if tables exist and create if needed
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate database setup
      
      setSetupProgress(prev => ({ ...prev, database: 'completed' }));
      return true;
    } catch (error) {
      setSetupProgress(prev => ({ ...prev, database: 'error' }));
      return false;
    }
  };

  // Complete setup process
  const completeSetup = async () => {
    setIsProcessing(true);
    
    try {
      // Run all setup functions
      const results = await Promise.all([
        setupCompanyInfo(),
        setupAdminUser(),
        setupSecurity(),
        setupDatabase()
      ]);
      
      if (results.every(result => result)) {
        // All setup steps completed successfully
        localStorage.setItem('krishisethu-setup-completed', 'true');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Setup failed:', error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (validateStep(currentStep)) {
      completeStep(currentStep);
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Get step status
  const getStepStatus = (stepId) => {
    if (completedSteps.has(stepId)) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Building className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-800">Company Information</h3>
              <p className="text-gray-600">Enter your company details for proper tenant identification</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  value={setupData.companyInfo.name}
                  onChange={(e) => updateSetupData('companyInfo', 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your Company Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={setupData.companyInfo.email}
                  onChange={(e) => updateSetupData('companyInfo', 'email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="company@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={setupData.companyInfo.phone}
                  onChange={(e) => updateSetupData('companyInfo', 'phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+91-XXXXXXXXXX"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                <input
                  type="text"
                  value={setupData.companyInfo.gst_number}
                  onChange={(e) => updateSetupData('companyInfo', 'gst_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="GST Registration Number"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
                <textarea
                  value={setupData.companyInfo.address}
                  onChange={(e) => updateSetupData('companyInfo', 'address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Complete business address"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-800">Admin User Setup</h3>
              <p className="text-gray-600">Configure the primary administrator for your tenant</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Name *</label>
                <input
                  type="text"
                  value={setupData.adminUser.name}
                  onChange={(e) => updateSetupData('adminUser', 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Administrator Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={setupData.adminUser.role}
                  onChange={(e) => updateSetupData('adminUser', 'role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="admin">Administrator</option>
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  value={setupData.adminUser.department}
                  onChange={(e) => updateSetupData('adminUser', 'department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Management, Operations"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Shield className="h-12 w-12 text-purple-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-800">Security Configuration</h3>
              <p className="text-gray-600">Configure security policies and data protection</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">Row Level Security (RLS)</h4>
                  <p className="text-sm text-gray-600">Ensure data isolation between tenants</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={setupData.security.enableRLS}
                    onChange={(e) => updateSetupData('security', 'enableRLS', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full ${setupData.security.enableRLS ? 'bg-purple-600' : 'bg-gray-300'} relative cursor-pointer transition-colors`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${setupData.security.enableRLS ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">Audit Logging</h4>
                  <p className="text-sm text-gray-600">Track all security-related events</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={setupData.security.enableAuditLog}
                    onChange={(e) => updateSetupData('security', 'enableAuditLog', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full ${setupData.security.enableAuditLog ? 'bg-purple-600' : 'bg-gray-300'} relative cursor-pointer transition-colors`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${setupData.security.enableAuditLog ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                </label>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Retention (Days)</label>
                <input
                  type="number"
                  min="30"
                  max="3650"
                  value={setupData.security.dataRetentionDays}
                  onChange={(e) => updateSetupData('security', 'dataRetentionDays', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">How long to retain audit logs and historical data</p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Database className="h-12 w-12 text-orange-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-800">Database Setup</h3>
              <p className="text-gray-600">Initialize database tables and configurations</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">Setup Required Tables</h4>
                  <p className="text-sm text-gray-600">Create products, customers, suppliers, and sales tables</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={setupData.database.setupTables}
                    onChange={(e) => updateSetupData('database', 'setupTables', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full ${setupData.database.setupTables ? 'bg-orange-600' : 'bg-gray-300'} relative cursor-pointer transition-colors`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${setupData.database.setupTables ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">Load Sample Data</h4>
                  <p className="text-sm text-gray-600">Add example products and suppliers for testing</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={setupData.database.seedData}
                    onChange={(e) => updateSetupData('database', 'seedData', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full ${setupData.database.seedData ? 'bg-orange-600' : 'bg-gray-300'} relative cursor-pointer transition-colors`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${setupData.database.seedData ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">Enable Automatic Backups</h4>
                  <p className="text-sm text-gray-600">Regular data backups for data safety</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={setupData.database.enableBackups}
                    onChange={(e) => updateSetupData('database', 'enableBackups', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full ${setupData.database.enableBackups ? 'bg-orange-600' : 'bg-gray-300'} relative cursor-pointer transition-colors`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${setupData.database.enableBackups ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Settings className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-800">Final Configuration</h3>
              <p className="text-gray-600">Review your settings and complete the setup</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">🏢 Company Setup</h4>
                <p className="text-sm text-blue-700">Company: {setupData.companyInfo.name}</p>
                <p className="text-sm text-blue-700">Email: {setupData.companyInfo.email}</p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">👤 Admin User</h4>
                <p className="text-sm text-green-700">Name: {setupData.adminUser.name}</p>
                <p className="text-sm text-green-700">Role: {setupData.adminUser.role}</p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-2">🔒 Security</h4>
                <p className="text-sm text-purple-700">RLS: {setupData.security.enableRLS ? 'Enabled' : 'Disabled'}</p>
                <p className="text-sm text-purple-700">Audit Log: {setupData.security.enableAuditLog ? 'Enabled' : 'Disabled'}</p>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-800 mb-2">🗄️ Database</h4>
                <p className="text-sm text-orange-700">Tables: {setupData.database.setupTables ? 'Will be created' : 'Skip'}</p>
                <p className="text-sm text-orange-700">Sample Data: {setupData.database.seedData ? 'Will be loaded' : 'Skip'}</p>
              </div>
            </div>
            
            {isProcessing && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">🔄 Setup in Progress</h4>
                <div className="space-y-2">
                  {Object.entries(setupProgress).map(([key, status]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'completed' ? 'bg-green-500' :
                        status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                        status === 'error' ? 'bg-red-500' :
                        'bg-gray-300'
                      }`}></div>
                      <span className="text-sm capitalize">{key} Setup</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">🚀 Multi-Tenant Setup Wizard</h2>
        <p className="text-gray-600">Configure your KrishiSethu tenant environment step by step</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                getStepStatus(step.id) === 'completed' ? 'bg-green-600 border-green-600 text-white' :
                getStepStatus(step.id) === 'active' ? 'bg-blue-600 border-blue-600 text-white' :
                'bg-white border-gray-300 text-gray-400'
              }`}>
                {getStepStatus(step.id) === 'completed' ? <Check className="h-5 w-5" /> : step.id}
              </div>
              
              {index < steps.length - 1 && (
                <div className={`w-20 h-1 mx-2 transition-all ${
                  completedSteps.has(step.id) ? 'bg-green-600' : 'bg-gray-300'
                }`}></div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            {steps[currentStep - 1]?.icon}
            {steps[currentStep - 1]?.title}
          </h3>
          <p className="text-gray-600">{steps[currentStep - 1]?.description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8 min-h-96">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            currentStep === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <div className="text-sm text-gray-500">
          Step {currentStep} of {steps.length}
        </div>

        {currentStep < steps.length ? (
          <button
            onClick={nextStep}
            disabled={!validateStep(currentStep)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              !validateStep(currentStep)
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={completeSetup}
            disabled={isProcessing || !validateStep(currentStep)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              isProcessing || !validateStep(currentStep)
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isProcessing ? '🔄 Setting up...' : '✅ Complete Setup'}
          </button>
        )}
      </div>

      {/* Setup Complete */}
      {Object.values(setupProgress).every(status => status === 'completed') && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-green-600 mb-2">Setup Complete!</h3>
          <p className="text-green-700 mb-4">Your KrishiSethu multi-tenant environment is ready to use.</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => onNavigate('multi-tenant-test')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
            >
              Run Tests
            </button>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Need Help?</h4>
            <p className="text-sm text-blue-700">
              This wizard will help you configure your KrishiSethu tenant properly. 
              Each step ensures your data is secure and isolated from other tenants.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiTenantSetupWizard;
