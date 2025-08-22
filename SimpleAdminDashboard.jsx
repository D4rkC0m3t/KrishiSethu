import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const SimpleAdminDashboard = ({ currentUser, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive, admin

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

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_active: !currentStatus }
          : user
      ));
    } catch (err) {
      console.error('Error updating user status:', err);
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

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, account_type: newType }
          : user
      ));
    } catch (err) {
      console.error('Error updating admin status:', err);
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

      // Update local state
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(`Failed to delete user: ${err.message}`);
    }
  };

  const filteredUsers = users.filter(user => {
    switch (filter) {
      case 'active':
        return user.is_active === true;
      case 'inactive':
        return user.is_active === false;
      case 'admin':
        return user.account_type === 'admin';
      default:
        return true;
    }
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    admin: users.filter(u => u.account_type === 'admin').length,
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🛡️ Admin Dashboard</h1>
          <p>Welcome back, {currentUser?.email}</p>
        </div>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadUsers} className="retry-btn">Retry</button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card active">
          <div className="stat-number">{stats.active}</div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat-card inactive">
          <div className="stat-number">{stats.inactive}</div>
          <div className="stat-label">Inactive Users</div>
        </div>
        <div className="stat-card admin">
          <div className="stat-number">{stats.admin}</div>
          <div className="stat-label">Admin Users</div>
        </div>
      </div>

      <div className="controls">
        <div className="filter-controls">
          <label htmlFor="filter">Filter users:</label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Users ({stats.total})</option>
            <option value="active">Active Users ({stats.active})</option>
            <option value="inactive">Inactive Users ({stats.inactive})</option>
            <option value="admin">Admin Users ({stats.admin})</option>
          </select>
        </div>
        <button onClick={loadUsers} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="users-section">
        <h2>Users ({filteredUsers.length})</h2>
        
        {filteredUsers.length === 0 ? (
          <div className="no-users">
            <p>No users found matching the current filter.</p>
          </div>
        ) : (
          <div className="users-grid">
            {filteredUsers.map(user => (
              <div key={user.id} className={`user-card ${user.is_active ? 'active' : 'inactive'} ${user.account_type === 'admin' ? 'admin' : ''}`}>
                <div className="user-header">
                  <div className="user-info">
                    <h3>{user.full_name || 'Unknown User'}</h3>
                    <p>{user.email}</p>
                  </div>
                  <div className="user-badges">
                    <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {user.account_type === 'admin' && (
                      <span className="status-badge admin">Admin</span>
                    )}
                  </div>
                </div>

                <div className="user-details">
                  <div className="detail-row">
                    <span>Company:</span>
                    <span>{user.company || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span>Phone:</span>
                    <span>{user.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span>Joined:</span>
                    <span>{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-row">
                    <span>Last Login:</span>
                    <span>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>

                <div className="user-actions">
                  <button
                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                    className={`action-btn ${user.is_active ? 'deactivate' : 'activate'}`}
                  >
                    {user.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                  </button>
                  
                  <button
                    onClick={() => toggleAdminStatus(user.id, user.account_type)}
                    className={`action-btn ${user.account_type === 'admin' ? 'demote' : 'promote'}`}
                    disabled={user.id === currentUser?.id}
                  >
                    {user.account_type === 'admin' ? '👤 Make User' : '👑 Make Admin'}
                  </button>
                  
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="action-btn delete"
                    disabled={user.id === currentUser?.id}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          color: white;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
        }

        .header-content h1 {
          color: #4f46e5;
          font-size: 2.5rem;
          margin-bottom: 5px;
        }

        .header-content p {
          color: #6b7280;
          font-size: 1.1rem;
        }

        .logout-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .logout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
        }

        .error-message {
          background: #fee2e2;
          color: #991b1b;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .retry-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          padding: 25px;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
          transition: transform 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
        }

        .stat-number {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .stat-card.total .stat-number { color: #3b82f6; }
        .stat-card.active .stat-number { color: #10b981; }
        .stat-card.inactive .stat-number { color: #ef4444; }
        .stat-card.admin .stat-number { color: #8b5cf6; }

        .stat-label {
          color: #6b7280;
          font-size: 1rem;
          font-weight: 500;
        }

        .controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 30px;
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
        }

        .filter-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filter-controls label {
          font-weight: 600;
          color: #374151;
        }

        .filter-controls select {
          padding: 10px 15px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          font-size: 1rem;
        }

        .refresh-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .refresh-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
        }

        .users-section {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 30px;
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
        }

        .users-section h2 {
          color: #4f46e5;
          margin-bottom: 25px;
          font-size: 1.8rem;
        }

        .no-users {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 20px;
        }

        .user-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          border-left: 4px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .user-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .user-card.active {
          border-left-color: #10b981;
        }

        .user-card.inactive {
          border-left-color: #ef4444;
        }

        .user-card.admin {
          border-left-color: #8b5cf6;
        }

        .user-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .user-info h3 {
          color: #1f2937;
          margin-bottom: 5px;
          font-size: 1.2rem;
        }

        .user-info p {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .user-badges {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          text-align: center;
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

        .user-details {
          margin-bottom: 20px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          font-size: 0.9rem;
        }

        .detail-row span:first-child {
          color: #6b7280;
          font-weight: 500;
        }

        .detail-row span:last-child {
          color: #1f2937;
          font-weight: 600;
        }

        .user-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
          transition: all 0.3s ease;
          flex: 1;
          min-width: 100px;
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

        .action-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default SimpleAdminDashboard;
