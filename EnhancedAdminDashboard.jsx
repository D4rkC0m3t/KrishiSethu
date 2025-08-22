import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';

const EnhancedAdminDashboard = ({ currentUser, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(`Failed to load users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      // Filter by status
      const statusMatch = (() => {
        switch (filter) {
          case 'active': return user.is_active === true;
          case 'inactive': return user.is_active === false;
          case 'admin': return user.account_type === 'admin';
          default: return true;
        }
      })();

      // Filter by search term
      const searchMatch = !searchTerm || 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company?.toLowerCase().includes(searchTerm.toLowerCase());

      return statusMatch && searchMatch;
    });

    // Sort users
    filtered.sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      
      if (sortBy === 'created_at' || sortBy === 'last_login') {
        const aDate = new Date(aVal);
        const bDate = new Date(bVal);
        return sortOrder === 'desc' ? bDate - aDate : aDate - bDate;
      }
      
      if (typeof aVal === 'string') {
        return sortOrder === 'desc' 
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal);
      }
      
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return filtered;
  }, [users, filter, searchTerm, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.is_active).length;
    const inactive = total - active;
    const admin = users.filter(u => u.account_type === 'admin').length;
    
    // Recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newThisWeek = users.filter(u => new Date(u.created_at) > weekAgo).length;
    const recentLogins = users.filter(u => u.last_login && new Date(u.last_login) > weekAgo).length;

    return { total, active, inactive, admin, newThisWeek, recentLogins };
  }, [users]);

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_active: !currentStatus }
          : user
      ));
    } catch (err) {
      setError(`Failed to update user: ${err.message}`);
    }
  };

  const toggleAdminStatus = async (userId, currentType) => {
    try {
      const newType = currentType === 'admin' ? 'user' : 'admin';
      
      const { error } = await supabase
        .from('users')
        .update({ 
          account_type: newType,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, account_type: newType }
          : user
      ));
    } catch (err) {
      setError(`Failed to update admin status: ${err.message}`);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      setError(`Failed to delete user: ${err.message}`);
    }
  };

  const bulkAction = async (action) => {
    if (selectedUsers.length === 0) return;

    const confirmMsg = `Are you sure you want to ${action} ${selectedUsers.length} user(s)?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      let updates = {};
      switch (action) {
        case 'activate':
          updates = { is_active: true };
          break;
        case 'deactivate':
          updates = { is_active: false };
          break;
        case 'delete':
          const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .in('id', selectedUsers);
          
          if (deleteError) throw deleteError;
          setUsers(users.filter(user => !selectedUsers.includes(user.id)));
          setSelectedUsers([]);
          return;
      }

      const { error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .in('id', selectedUsers);

      if (error) throw error;

      setUsers(users.map(user => 
        selectedUsers.includes(user.id) 
          ? { ...user, ...updates }
          : user
      ));
      setSelectedUsers([]);
    } catch (err) {
      setError(`Failed to perform bulk action: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Loading Dashboard...</h2>
        <p>Please wait while we fetch your data</p>
      </div>
    );
  }

  return (
    <div className="enhanced-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="brand">
            <span className="brand-icon">🌾</span>
            <h1>KrishiSethu Admin</h1>
          </div>
          <p>Welcome back, <strong>{currentUser?.email}</strong></p>
        </div>
        <div className="header-right">
          <button className="header-btn" onClick={loadUsers}>
            🔄 Refresh
          </button>
          <button className="header-btn logout" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="error-alert">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Users</div>
            <div className="stat-trend">+{stats.newThisWeek} this week</div>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.active}</div>
            <div className="stat-label">Active Users</div>
            <div className="stat-trend">{Math.round((stats.active/stats.total)*100)}% of total</div>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-icon">⏸️</div>
          <div className="stat-content">
            <div className="stat-number">{stats.inactive}</div>
            <div className="stat-label">Inactive Users</div>
            <div className="stat-trend">{Math.round((stats.inactive/stats.total)*100)}% of total</div>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-icon">👑</div>
          <div className="stat-content">
            <div className="stat-number">{stats.admin}</div>
            <div className="stat-label">Admin Users</div>
            <div className="stat-trend">Recent logins: {stats.recentLogins}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-panel">
        <div className="controls-left">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Users ({stats.total})</option>
            <option value="active">Active ({stats.active})</option>
            <option value="inactive">Inactive ({stats.inactive})</option>
            <option value="admin">Admins ({stats.admin})</option>
          </select>
        </div>

        <div className="controls-right">
          <select value={`${sortBy}-${sortOrder}`} onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortBy(field);
            setSortOrder(order);
          }}>
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="full_name-asc">Name A-Z</option>
            <option value="full_name-desc">Name Z-A</option>
            <option value="last_login-desc">Recent Login</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedUsers.length} user(s) selected</span>
          <div className="bulk-buttons">
            <button onClick={() => bulkAction('activate')}>✅ Activate</button>
            <button onClick={() => bulkAction('deactivate')}>⏸️ Deactivate</button>
            <button onClick={() => bulkAction('delete')} className="danger">🗑️ Delete</button>
            <button onClick={() => setSelectedUsers([])}>✕ Clear</button>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="users-section">
        <div className="section-header">
          <h2>Users ({filteredAndSortedUsers.length})</h2>
        </div>
        
        {filteredAndSortedUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h3>No users found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="users-table">
            <div className="table-header">
              <div className="table-cell">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredAndSortedUsers.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(filteredAndSortedUsers.map(u => u.id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                />
              </div>
              <div className="table-cell">User</div>
              <div className="table-cell">Company</div>
              <div className="table-cell">Status</div>
              <div className="table-cell">Joined</div>
              <div className="table-cell">Last Login</div>
              <div className="table-cell">Actions</div>
            </div>
            
            {filteredAndSortedUsers.map(user => (
              <div key={user.id} className={`table-row ${selectedUsers.includes(user.id) ? 'selected' : ''}`}>
                <div className="table-cell">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }
                    }}
                  />
                </div>
                
                <div className="table-cell">
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.full_name?.charAt(0) || user.email.charAt(0)}
                    </div>
                    <div>
                      <div className="user-name">{user.full_name || 'Unknown User'}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </div>
                </div>
                
                <div className="table-cell">
                  <span className="company-name">{user.company || 'N/A'}</span>
                </div>
                
                <div className="table-cell">
                  <div className="status-badges">
                    <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? '✅ Active' : '⏸️ Inactive'}
                    </span>
                    {user.account_type === 'admin' && (
                      <span className="status-badge admin">👑 Admin</span>
                    )}
                  </div>
                </div>
                
                <div className="table-cell">
                  <span className="date-text">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="table-cell">
                  <span className="date-text">
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
                
                <div className="table-cell">
                  <div className="action-buttons">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      className={`action-btn ${user.is_active ? 'deactivate' : 'activate'}`}
                      title={user.is_active ? 'Deactivate user' : 'Activate user'}
                    >
                      {user.is_active ? '⏸️' : '▶️'}
                    </button>
                    
                    <button
                      onClick={() => toggleAdminStatus(user.id, user.account_type)}
                      className={`action-btn ${user.account_type === 'admin' ? 'demote' : 'promote'}`}
                      disabled={user.id === currentUser?.id}
                      title={user.account_type === 'admin' ? 'Remove admin' : 'Make admin'}
                    >
                      {user.account_type === 'admin' ? '👤' : '👑'}
                    </button>
                    
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="action-btn delete"
                      disabled={user.id === currentUser?.id}
                      title="Delete user"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .enhanced-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 20px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 30px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          border-radius: 16px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.05);
        }

        .header-left .brand {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 8px;
        }

        .brand-icon {
          font-size: 2.5rem;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
          60% { transform: translateY(-2px); }
        }

        .header-left h1 {
          font-size: 2.2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }

        .header-left p {
          color: #6b7280;
          font-size: 1rem;
          margin: 0;
        }

        .header-right {
          display: flex;
          gap: 12px;
        }

        .header-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #f3f4f6;
          color: #374151;
        }

        .header-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .header-btn.logout {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .error-alert {
          background: linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%);
          color: #991b1b;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid #ef4444;
        }

        .error-alert button {
          background: none;
          border: none;
          color: #991b1b;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 4px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 25px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          font-size: 2.5rem;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }

        .stat-card.primary .stat-icon { background: #dbeafe; }
        .stat-card.success .stat-icon { background: #d1fae5; }
        .stat-card.warning .stat-icon { background: #fef3c7; }
        .stat-card.info .stat-icon { background: #ede9fe; }

        .stat-number {
          font-size: 2.2rem;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .stat-card.primary .stat-number { color: #2563eb; }
        .stat-card.success .stat-number { color: #059669; }
        .stat-card.warning .stat-number { color: #d97706; }
        .stat-card.info .stat-number { color: #7c3aed; }

        .stat-label {
          color: #6b7280;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 5px;
        }

        .stat-trend {
          color: #9ca3af;
          font-size: 0.8rem;
        }

        .controls-panel {
          background: white;
          border-radius: 16px;
          padding: 25px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.05);
          flex-wrap: wrap;
          gap: 20px;
        }

        .controls-left {
          display: flex;
          gap: 15px;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 15px;
          color: #9ca3af;
        }

        .search-box input {
          padding: 12px 15px 12px 45px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 1rem;
          width: 250px;
          transition: all 0.3s ease;
        }

        .search-box input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .controls-panel select {
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          background: white;
          font-size: 1rem;
          cursor: pointer;
        }

        .bulk-actions {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 15px 25px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .bulk-buttons {
          display: flex;
          gap: 10px;
        }

        .bulk-buttons button {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .bulk-buttons button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .bulk-buttons button.danger {
          background: #ef4444;
        }

        .users-section {
          background: white;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.05);
        }

        .section-header h2 {
          color: #1f2937;
          margin-bottom: 25px;
          font-size: 1.6rem;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .users-table {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .table-header, .table-row {
          display: grid;
          grid-template-columns: 50px 2fr 1.5fr 1.5fr 1fr 1fr 1fr;
          align-items: center;
          padding: 15px 20px;
          gap: 15px;
        }

        .table-header {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
          font-size: 0.9rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .table-row {
          border-bottom: 1px solid #f3f4f6;
          transition: all 0.2s ease;
        }

        .table-row:hover {
          background: #f8fafc;
        }

        .table-row.selected {
          background: #eff6ff;
          border-color: #dbeafe;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          text-transform: uppercase;
        }

        .user-name {
          font-weight: 600;
          color: #1f2937;
        }

        .user-email {
          font-size: 0.9rem;
          color: #6b7280;
        }

        .company-name {
          color: #374151;
          font-size: 0.9rem;
        }

        .status-badges {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
          text-align: center;
          white-space: nowrap;
        }

        .status-badge.active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-badge.admin {
          background: #ede9fe;
          color: #5b21b6;
        }

        .date-text {
          font-size: 0.9rem;
          color: #6b7280;
        }

        .action-buttons {
          display: flex;
          gap: 5px;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .action-btn:hover:not(:disabled) {
          transform: scale(1.1);
        }

        .action-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .action-btn.activate {
          background: #d1fae5;
          color: #065f46;
        }

        .action-btn.deactivate {
          background: #fef3c7;
          color: #92400e;
        }

        .action-btn.promote {
          background: #ede9fe;
          color: #5b21b6;
        }

        .action-btn.demote {
          background: #f3f4f6;
          color: #374151;
        }

        .action-btn.delete {
          background: #fee2e2;
          color: #991b1b;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .controls-panel {
            flex-direction: column;
            align-items: stretch;
          }

          .controls-left {
            flex-direction: column;
          }

          .search-box input {
            width: 100%;
          }

          .users-table {
            overflow-x: auto;
          }

          .table-header, .table-row {
            grid-template-columns: 40px 200px 120px 100px 90px 90px 100px;
            min-width: 740px;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedAdminDashboard;
