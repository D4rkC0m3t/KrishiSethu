import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Building, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  DollarSign,
  Filter,
  Search,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [expiringTrials, setExpiringTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showOrgModal, setShowOrgModal] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load platform analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('admin_get_platform_analytics');
      
      if (analyticsError) throw analyticsError;
      setAnalytics(analyticsData[0]);

      // Load organizations
      const { data: orgsData, error: orgsError } = await supabase
        .rpc('admin_get_all_organizations', {
          page_size: 100,
          page_offset: 0,
          search_term: searchTerm || null,
          status_filter: statusFilter || null
        });
      
      if (orgsError) throw orgsError;
      setOrganizations(orgsData);

      // Load expiring trials
      const { data: trialsData, error: trialsError } = await supabase
        .rpc('admin_get_expiring_trials', { days_ahead: 7 });
      
      if (trialsError) throw trialsError;
      setExpiringTrials(trialsData);

    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadAdminData();
  };

  const viewOrganization = async (orgId) => {
    try {
      const { data, error } = await supabase
        .rpc('admin_get_organization_details', { org_id: orgId });
      
      if (error) throw error;
      setSelectedOrg(data[0]);
      setShowOrgModal(true);
    } catch (error) {
      console.error('Error loading organization details:', error);
    }
  };

  const extendTrial = async (orgId, days) => {
    try {
      const { error } = await supabase
        .rpc('admin_extend_trial', {
          org_id: orgId,
          days_to_extend: days,
          reason: `Trial extended by admin for ${days} days`
        });
      
      if (error) throw error;
      
      alert(`Trial extended by ${days} days successfully!`);
      loadAdminData();
    } catch (error) {
      console.error('Error extending trial:', error);
      alert('Error extending trial: ' + error.message);
    }
  };

  const upgradeSubscription = async (orgId, plan) => {
    try {
      const { error } = await supabase
        .rpc('admin_upgrade_subscription', {
          org_id: orgId,
          new_plan: plan,
          new_status: 'active',
          subscription_months: 12
        });
      
      if (error) throw error;
      
      alert(`Subscription upgraded to ${plan} successfully!`);
      loadAdminData();
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Error upgrading subscription: ' + error.message);
    }
  };

  const toggleOrganizationStatus = async (orgId, currentStatus) => {
    try {
      const { error } = await supabase
        .rpc('admin_toggle_organization_status', {
          org_id: orgId,
          new_status: !currentStatus,
          reason: currentStatus ? 'Suspended by admin' : 'Activated by admin'
        });
      
      if (error) throw error;
      
      alert(`Organization ${currentStatus ? 'suspended' : 'activated'} successfully!`);
      loadAdminData();
    } catch (error) {
      console.error('Error toggling organization status:', error);
      alert('Error updating organization: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Super Admin Dashboard</h1>
          <p className="text-gray-600">Manage organizations, subscriptions, and platform analytics</p>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Organizations</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.total_organizations}</p>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {analytics.organizations_this_month} new this month
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.total_users}</p>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {analytics.active_users} active users
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(analytics.total_revenue)}</p>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {formatCurrency(analytics.revenue_this_month)} this month
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Expiring Trials</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.expiring_trials_count}</p>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Next 7 days
              </div>
            </div>
          </div>
        )}

        {/* Expiring Trials Alert */}
        {expiringTrials.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Trials Expiring Soon
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    {expiringTrials.map((trial) => (
                      <li key={trial.id}>
                        <strong>{trial.name}</strong> ({trial.owner_email}) - 
                        {trial.days_remaining} days remaining
                        <button
                          onClick={() => extendTrial(trial.id, 30)}
                          className="ml-2 text-blue-600 hover:text-blue-800 underline"
                        >
                          Extend 30 days
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Organizations Management */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Organizations</h2>
            
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search organizations or emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Organizations Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trial Ends
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{org.name}</div>
                        <div className="text-sm text-gray-500">{org.slug}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{org.owner_name}</div>
                        <div className="text-sm text-gray-500">{org.owner_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        org.subscription_status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : org.subscription_status === 'trial'
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {org.subscription_plan} - {org.subscription_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {org.trial_end_date ? formatDate(org.trial_end_date) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-xs">
                        <div>{org.total_users} users</div>
                        <div>{org.total_products} products</div>
                        <div>{org.total_sales} sales</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        org.is_active 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {org.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => viewOrganization(org.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => extendTrial(org.id, 30)}
                        className="text-green-600 hover:text-green-900"
                        title="Extend trial 30 days"
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => upgradeSubscription(org.id, 'premium')}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Upgrade to premium"
                      >
                        <TrendingUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleOrganizationStatus(org.id, org.is_active)}
                        className={`${org.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        title={org.is_active ? 'Suspend' : 'Activate'}
                      >
                        {org.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Organization Details Modal */}
        {showOrgModal && selectedOrg && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Organization Details</h3>
                  <button
                    onClick={() => setShowOrgModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Name:</strong> {selectedOrg.name}</div>
                      <div><strong>Slug:</strong> {selectedOrg.slug}</div>
                      <div><strong>Business Type:</strong> {selectedOrg.business_type}</div>
                      <div><strong>Created:</strong> {formatDate(selectedOrg.created_at)}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Owner Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Name:</strong> {selectedOrg.owner_name}</div>
                      <div><strong>Email:</strong> {selectedOrg.owner_email}</div>
                      <div><strong>Phone:</strong> {selectedOrg.owner_phone || 'N/A'}</div>
                      <div><strong>Last Login:</strong> {selectedOrg.last_login ? formatDate(selectedOrg.last_login) : 'Never'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Subscription</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Plan:</strong> {selectedOrg.subscription_plan}</div>
                      <div><strong>Status:</strong> {selectedOrg.subscription_status}</div>
                      <div><strong>Trial Ends:</strong> {selectedOrg.trial_end_date ? formatDate(selectedOrg.trial_end_date) : 'N/A'}</div>
                      <div><strong>Subscription Ends:</strong> {selectedOrg.subscription_end_date ? formatDate(selectedOrg.subscription_end_date) : 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Usage Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Users:</strong> {selectedOrg.total_users}</div>
                      <div><strong>Products:</strong> {selectedOrg.total_products}</div>
                      <div><strong>Sales:</strong> {selectedOrg.total_sales}</div>
                      <div><strong>Revenue:</strong> {formatCurrency(selectedOrg.total_revenue)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => extendTrial(selectedOrg.id, 30)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Extend Trial 30 Days
                  </button>
                  <button
                    onClick={() => upgradeSubscription(selectedOrg.id, 'premium')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Upgrade to Premium
                  </button>
                  <button
                    onClick={() => setShowOrgModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
