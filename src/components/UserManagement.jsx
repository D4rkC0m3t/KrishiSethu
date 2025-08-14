import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
// Removed unused Tabs imports
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Crown,
  Star,
  User,
  Mail,
  Phone,
  Activity,
  Lock,
  Unlock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersService } from '../lib/supabaseDb';
import { realtimeService } from '../lib/realtime';
import { supabaseAuthHelpers } from '../lib/supabase';

const UserManagement = ({ onNavigate }) => {
  const { currentUser, userProfile, hasPermission, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // User form data
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    password: '',
    confirmPassword: '',
    isActive: true,
    permissions: {
      canManageProducts: false,
      canProcessSales: true,
      canViewReports: false,
      canManageUsers: false,
      canManageSettings: false,
      canManageSuppliers: false,
      canManagePurchases: false,
      canViewFinancials: false,
      canExportData: false,
      canManageInventory: false
    }
  });

  // Activity log
  const [activityLog, setActivityLog] = useState([]);
  const [showActivityDialog, setShowActivityDialog] = useState(false);

  // Role definitions
  const ROLES = {
    admin: {
      name: 'Administrator',
      description: 'Full system access and user management',
      color: 'bg-red-500',
      icon: Crown,
      level: 3
    },
    manager: {
      name: 'Manager',
      description: 'Manage operations, inventory, and reports',
      color: 'bg-blue-500',
      icon: Star,
      level: 2
    },
    staff: {
      name: 'Staff',
      description: 'Handle sales and basic operations',
      color: 'bg-green-500',
      icon: User,
      level: 1
    }
  };

  // Default permissions by role
  const DEFAULT_PERMISSIONS = {
    admin: {
      canManageProducts: true,
      canProcessSales: true,
      canViewReports: true,
      canManageUsers: true,
      canManageSettings: true,
      canManageSuppliers: true,
      canManagePurchases: true,
      canViewFinancials: true,
      canExportData: true,
      canManageInventory: true
    },
    manager: {
      canManageProducts: true,
      canProcessSales: true,
      canViewReports: true,
      canManageUsers: false,
      canManageSettings: false,
      canManageSuppliers: true,
      canManagePurchases: true,
      canViewFinancials: true,
      canExportData: true,
      canManageInventory: true
    },
    staff: {
      canManageProducts: false,
      canProcessSales: true,
      canViewReports: false,
      canManageUsers: false,
      canManageSettings: false,
      canManageSuppliers: false,
      canManagePurchases: false,
      canViewFinancials: false,
      canExportData: false,
      canManageInventory: false
    }
  };

  useEffect(() => {
    // Set up real-time subscription for users
    const unsubscribe = realtimeService.subscribeToUsers((data, error) => {
      if (error) {
        console.error('Real-time users error:', error);
        setError('Failed to sync user data. Please refresh.');
        // Fallback to manual loading
        loadUsers();
      } else if (data) {
        console.log('Real-time users update:', data);
        setUsers(data);
        setLoading(false);
      }
    });

    // Initial load if real-time fails
    loadUsers();
    loadActivityLog();

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Filter users based on search and filters
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && user.isActive) ||
        (filterStatus === 'inactive' && !user.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole, filterStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading users from Firebase...');

      const firebaseUsers = await usersService.getAll();
      console.log('Loaded users:', firebaseUsers);

      if (firebaseUsers && firebaseUsers.length > 0) {
        setUsers(firebaseUsers);
      } else {
        // If no users exist, create some sample data
        await createSampleUsers();
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users. Please try again.');
      // Fallback to empty array
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Create sample users for demo
  const createSampleUsers = async () => {
    const sampleUsers = [
        {
          id: '1',
          uid: 'admin-uid',
          name: 'System Administrator',
          email: 'admin@krishisethu.com',
          phone: '+91-9876543210',
          role: 'admin',
          isActive: true,
          lastLogin: new Date('2025-01-07T10:30:00'),
          createdAt: new Date('2024-12-01T00:00:00'),
          permissions: DEFAULT_PERMISSIONS.admin,
          loginCount: 145,
          lastActivity: 'Updated product pricing'
        },
        {
          id: '2',
          uid: 'manager-uid',
          name: 'Rajesh Kumar',
          email: 'rajesh@krishisethu.com',
          phone: '+91-9876543211',
          role: 'manager',
          isActive: true,
          lastLogin: new Date('2025-01-07T09:15:00'),
          createdAt: new Date('2024-12-15T00:00:00'),
          permissions: DEFAULT_PERMISSIONS.manager,
          loginCount: 89,
          lastActivity: 'Processed purchase order'
        },
        {
          id: '3',
          uid: 'staff-uid',
          name: 'Priya Sharma',
          email: 'priya@krishisethu.com',
          phone: '+91-9876543212',
          role: 'staff',
          isActive: true,
          lastLogin: new Date('2025-01-07T08:45:00'),
          createdAt: new Date('2025-01-02T00:00:00'),
          permissions: DEFAULT_PERMISSIONS.staff,
          loginCount: 23,
          lastActivity: 'Completed sale transaction'
        },
        {
          id: '4',
          uid: 'staff2-uid',
          name: 'Amit Patel',
          email: 'amit@krishisethu.com',
          phone: '+91-9876543213',
          role: 'staff',
          isActive: false,
          lastLogin: new Date('2025-01-05T16:20:00'),
          createdAt: new Date('2024-11-20T00:00:00'),
          permissions: DEFAULT_PERMISSIONS.staff,
          loginCount: 67,
          lastActivity: 'Account deactivated'
        }
      ];

      try {
        for (const user of sampleUsers) {
          await usersService.create(user);
        }
        // Reload users after creating samples
        const newUsers = await usersService.getAll();
        setUsers(newUsers);
      } catch (error) {
        console.error('Error creating sample users:', error);
      }
    };

  const loadActivityLog = async () => {
    // Mock activity log
    const mockActivity = [
      {
        id: '1',
        userId: '1',
        userName: 'System Administrator',
        action: 'User Created',
        details: 'Created new staff user: Priya Sharma',
        timestamp: new Date('2025-01-07T10:30:00'),
        type: 'user_management'
      },
      {
        id: '2',
        userId: '2',
        userName: 'Rajesh Kumar',
        action: 'Login',
        details: 'Successful login from 192.168.1.100',
        timestamp: new Date('2025-01-07T09:15:00'),
        type: 'authentication'
      },
      {
        id: '3',
        userId: '1',
        userName: 'System Administrator',
        action: 'Permission Updated',
        details: 'Updated permissions for Rajesh Kumar',
        timestamp: new Date('2025-01-06T15:45:00'),
        type: 'user_management'
      },
      {
        id: '4',
        userId: '4',
        userName: 'Amit Patel',
        action: 'Account Deactivated',
        details: 'User account deactivated by administrator',
        timestamp: new Date('2025-01-05T16:20:00'),
        type: 'user_management'
      }
    ];
    
    setActivityLog(mockActivity);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('permissions.')) {
      const permissionKey = name.split('.')[1];
      setUserForm(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permissionKey]: checked
        }
      }));
    } else {
      setUserForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleRoleChange = (role) => {
    setUserForm(prev => ({
      ...prev,
      role,
      permissions: { ...DEFAULT_PERMISSIONS[role] }
    }));
  };

  // Update a single permission flag (used by checkbox handlers)
  const handlePermissionChange = (permissionKey, value) => {
    setUserForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionKey]: value,
      },
    }));
  };

  const handleAddUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (userForm.password !== userForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userForm.email,
        userForm.password
      );

      const newUser = {
        uid: userCredential.user.uid,
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        isActive: userForm.isActive,
        permissions: userForm.permissions,
        createdAt: new Date(),
        lastLogin: null,
        loginCount: 0,
        lastActivity: 'Account created'
      };

      // Save user profile to Firestore
      await usersService.create(newUser);

      // Refresh users list
      await loadUsers();

      resetForm();
      setShowAddDialog(false);
      alert('User created successfully!');

      // Log activity
      logActivity('User Created', `Created new ${userForm.role} user: ${userForm.name}`);
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to create user. Please try again.');
      alert('Error creating user: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      setError(null);

      const updatedUser = {
        ...userForm,
        updatedAt: new Date()
      };

      // Update user in Firestore
      await usersService.update(selectedUser.id, updatedUser);

      // Refresh users list
      await loadUsers();

      setShowEditDialog(false);
      setSelectedUser(null);
      resetForm();
      alert('User updated successfully!');

      // Log activity
      logActivity('User Updated', `Updated user profile: ${userForm.name}`);
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user. Please try again.');
      alert('Error updating user: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      setSaving(true);
      setError(null);

      const updatedUser = {
        isActive: !user.isActive,
        updatedAt: new Date()
      };

      // Update user in Firestore
      await usersService.update(user.id, updatedUser);

      // Refresh users list
      await loadUsers();

      const action = updatedUser.isActive ? 'activated' : 'deactivated';
      alert(`User ${action} successfully!`);

      // Log activity
      logActivity(
        updatedUser.isActive ? 'User Activated' : 'User Deactivated',
        `User account ${action}: ${user.name}`
      );
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('Failed to update user status. Please try again.');
      alert('Error updating user status');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      setError(null);

      // Delete user from Firestore
      await usersService.delete(selectedUser.id);

      // Refresh users list
      await loadUsers();

      alert('User deleted successfully!');

      // Log activity
      logActivity('User Deleted', `Deleted user account: ${selectedUser.name}`);

      setShowDeleteDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user. Please try again.');
      alert('Error deleting user');
    } finally {
      setSaving(false);
    }
  };

  const logActivity = (action, details) => {
    const newActivity = {
      id: Date.now().toString(),
      userId: currentUser?.uid,
      userName: userProfile?.name,
      action,
      details,
      timestamp: new Date(),
      type: 'user_management'
    };
    
    setActivityLog(prev => [newActivity, ...prev]);
  };

  const resetForm = () => {
    setUserForm({
      name: '',
      email: '',
      phone: '',
      role: 'staff',
      password: '',
      confirmPassword: '',
      isActive: true,
      permissions: { ...DEFAULT_PERMISSIONS.staff }
    });
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '',
      confirmPassword: '',
      isActive: user.isActive,
      permissions: { ...user.permissions }
    });
    setShowEditDialog(true);
  };

  const getRoleIcon = (role) => {
    const RoleIcon = ROLES[role]?.icon || User;
    return <RoleIcon className="h-4 w-4" />;
  };

  const getRoleBadge = (role) => {
    const roleInfo = ROLES[role];
    if (!roleInfo) return null;
    
    return (
      <Badge 
        variant="outline" 
        className={`text-white ${roleInfo.color}`}
      >
        {getRoleIcon(role)}
        <span className="ml-1">{roleInfo.name}</span>
      </Badge>
    );
  };

  const getStatusBadge = (isActive) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? (
          <>
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </>
        )}
      </Badge>
    );
  };

  // Check if current user can manage users
  if (!isAdmin() && !hasPermission('manager')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have permission to manage users
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => onNavigate('dashboard')}>
              ← Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            User Management
          </h1>
          <p className="text-gray-600">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowActivityDialog(true)}>
            <Activity className="h-4 w-4 mr-2" />
            Activity Log
          </Button>
          <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isAdmin() && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account with appropriate role and permissions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name *</label>
                      <Input
                        name="name"
                        value={userForm.name}
                        onChange={handleFormChange}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email *</label>
                      <Input
                        name="email"
                        type="email"
                        value={userForm.email}
                        onChange={handleFormChange}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone</label>
                      <Input
                        name="phone"
                        value={userForm.phone}
                        onChange={handleFormChange}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Role *</label>
                      <Select name="role" value={userForm.role} onValueChange={(value) => handleFormChange({ target: { name: 'role', value } })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password *</label>
                      <div className="relative">
                        <Input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={userForm.password}
                          onChange={handleFormChange}
                          placeholder="Enter password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Confirm Password *</label>
                      <Input
                        name="confirmPassword"
                        type="password"
                        value={userForm.confirmPassword}
                        onChange={handleFormChange}
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>

                  {/* Permissions Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Permissions</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h5 className="text-xs font-medium text-gray-500 uppercase">Inventory</h5>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="canViewInventory"
                              checked={userForm.permissions.canViewInventory}
                              onChange={(e) => handlePermissionChange('canViewInventory', e.target.checked)}
                            />
                            <label htmlFor="canViewInventory" className="text-sm">View Inventory</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="canEditInventory"
                              checked={userForm.permissions.canEditInventory}
                              onChange={(e) => handlePermissionChange('canEditInventory', e.target.checked)}
                            />
                            <label htmlFor="canEditInventory" className="text-sm">Edit Inventory</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="canDeleteInventory"
                              checked={userForm.permissions.canDeleteInventory}
                              onChange={(e) => handlePermissionChange('canDeleteInventory', e.target.checked)}
                            />
                            <label htmlFor="canDeleteInventory" className="text-sm">Delete Inventory</label>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h5 className="text-xs font-medium text-gray-500 uppercase">Sales</h5>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="canViewSales"
                              checked={userForm.permissions.canViewSales}
                              onChange={(e) => handlePermissionChange('canViewSales', e.target.checked)}
                            />
                            <label htmlFor="canViewSales" className="text-sm">View Sales</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="canProcessSales"
                              checked={userForm.permissions.canProcessSales}
                              onChange={(e) => handlePermissionChange('canProcessSales', e.target.checked)}
                            />
                            <label htmlFor="canProcessSales" className="text-sm">Process Sales</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="canRefundSales"
                              checked={userForm.permissions.canRefundSales}
                              onChange={(e) => handlePermissionChange('canRefundSales', e.target.checked)}
                            />
                            <label htmlFor="canRefundSales" className="text-sm">Process Refunds</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={userForm.isActive}
                      onChange={handleFormChange}
                    />
                    <label htmlFor="isActive" className="text-sm">Account is active</label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser} disabled={saving}>
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create User
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')}>
            ← Dashboard
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md mb-4">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
              <Button variant="outline" size="sm" onClick={loadUsers} className="ml-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Last Login</th>
                    <th className="text-left py-3 px-4">Activity</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(user.isActive)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          {user.lastLogin ? (
                            <>
                              <div>{user.lastLogin.toLocaleDateString()}</div>
                              <div className="text-gray-500">{user.lastLogin.toLocaleTimeString()}</div>
                            </>
                          ) : (
                            <span className="text-gray-500">Never</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <div className="text-gray-600">{user.lastActivity}</div>
                          <div className="text-gray-500">{user.loginCount} logins</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowPermissionsDialog(true);
                            }}
                            title="Manage Permissions"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleUserStatus(user)}
                            title={user.isActive ? "Deactivate User" : "Activate User"}
                          >
                            {user.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                          {isAdmin() && user.id !== currentUser?.uid && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>




      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  name="name"
                  placeholder="Enter full name"
                  value={userForm.name}
                  onChange={handleFormChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address *</label>
                <Input
                  name="email"
                  type="email"
                  placeholder="user@krishisethu.com"
                  value={userForm.email}
                  onChange={handleFormChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  name="phone"
                  placeholder="+91-9876543210"
                  value={userForm.phone}
                  onChange={handleFormChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role *</label>
                <Select value={userForm.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Staff
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Manager
                      </div>
                    </SelectItem>
                    {isAdmin() && (
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          Administrator
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Permissions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(userForm.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`edit-${key}`}
                      name={`permissions.${key}`}
                      checked={value}
                      onChange={handleFormChange}
                    />
                    <label htmlFor={`edit-${key}`} className="text-sm">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsActive"
                name="isActive"
                checked={userForm.isActive}
                onChange={handleFormChange}
              />
              <label htmlFor="editIsActive" className="text-sm">Account is active</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>
              <Edit className="h-4 w-4 mr-2" />
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Log Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>User Activity Log</DialogTitle>
            <DialogDescription>
              Recent user management activities and system events
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activityLog.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{activity.action}</h4>
                    <Badge variant="outline" className="text-xs">
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>By: {activity.userName}</span>
                    <span>{activity.timestamp.toLocaleDateString()} {activity.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowActivityDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user "{selectedUser?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
