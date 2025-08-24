import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const OrganizationSetup = ({ userId, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orgData, setOrgData] = useState({
    name: '',
    description: '',
    industry: '',
    address: '',
    phone: '',
    email: '',
    gst_number: '',
    pan_number: ''
  });

  const industries = [
    'Agriculture & Farming',
    'Food & Beverages',
    'Retail & Distribution',
    'Manufacturing',
    'Healthcare',
    'Education',
    'Technology',
    'Services',
    'Other'
  ];

  const handleInputChange = (field, value) => {
    setOrgData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep1 = () => {
    return orgData.name && orgData.industry && orgData.email;
  };

  const validateStep2 = () => {
    return orgData.address && orgData.phone;
  };

  const createOrganization = async () => {
    setLoading(true);
    try {
      // 1. Create organization slug from name
      const slug = orgData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      // 1. Create organization
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: orgData.name,
          slug: slug,
          description: orgData.description,
          website: `https://${slug}.com`, // Generate website from slug
          phone: orgData.phone,
          email: orgData.email,
          address: {
            street: orgData.address,
            gst_number: orgData.gst_number,
            pan_number: orgData.pan_number
          },
          settings: {
            industry: orgData.industry,
            currency: 'INR',
            timezone: 'Asia/Kolkata'
          },
          subscription_plan: 'free',
          subscription_status: 'trial',
          is_active: true
        }])
        .select()
        .single();

      if (orgError) throw orgError;

      // 2. Update user profile to link to organization
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          organization_id: organization.id,
          role: 'owner', // First user becomes owner
          is_active: true
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 3. Create default categories
      const defaultCategories = [
        { name: 'Raw Materials', description: 'Basic materials and components' },
        { name: 'Finished Goods', description: 'Ready to sell products' },
        { name: 'Supplies', description: 'Office and operational supplies' }
      ];

      const { error: categoriesError } = await supabase
        .from('categories')
        .insert(defaultCategories.map(cat => ({
          ...cat,
          organization_id: organization.id,
          created_by: userId
        })));

      if (categoriesError) throw categoriesError;

      onComplete({ organization, isNewOrg: true });
    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Error creating organization: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl">🏢</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Your Organization</h2>
          <p className="text-gray-600">Let's get your inventory management system ready</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name *
            </label>
            <input
              type="text"
              value={orgData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Your Company Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry *
            </label>
            <select
              value={orgData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Industry</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Email *
            </label>
            <input
              type="email"
              value={orgData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="business@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={orgData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Brief description of your business..."
            />
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={() => setStep(2)}
            disabled={!validateStep1()}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: Contact Details
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl">📍</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Information</h2>
          <p className="text-gray-600">Add your business location and contact details</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Address *
            </label>
            <textarea
              value={orgData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Complete business address..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={orgData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="+91 9876543210"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Number
              </label>
              <input
                type="text"
                value={orgData.gst_number}
                onChange={(e) => handleInputChange('gst_number', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="22AAAAA0000A1Z5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PAN Number
              </label>
              <input
                type="text"
                value={orgData.pan_number}
                onChange={(e) => handleInputChange('pan_number', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="AAAAA0000A"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep(1)}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Back
          </button>
          <button
            onClick={createOrganization}
            disabled={!validateStep2() || loading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Complete Setup'}
          </button>
        </div>
      </div>
    );
  }
};

export default OrganizationSetup;
