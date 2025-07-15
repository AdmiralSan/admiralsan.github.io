import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useUser } from '@clerk/clerk-react';
import { usePermissions } from '../contexts/PermissionsContext';
import { supabase } from '../supabaseClient';
import { ROLES, PERMISSIONS, getAllRoles, getRoleInfo } from '../utils/permissions';

const ClerkUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [updatingRole, setUpdatingRole] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);

  const { user: currentUser, getToken } = useAuth();
  const { hasPermission, userRole: currentUserRole, updateUserRole } = usePermissions();

  // Form state for creating/editing users
  const [userForm, setUserForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'staff',
    phoneNumber: '',
    password: ''
  });

  // Check permissions
  const canViewUsers = hasPermission(PERMISSIONS.users.view);
  const canCreateUsers = hasPermission(PERMISSIONS.users.create);
  const canEditUsers = hasPermission(PERMISSIONS.users.edit);
  const canManageRoles = hasPermission(PERMISSIONS.users.roles);
  const canDeleteUsers = hasPermission(PERMISSIONS.users.delete);

  useEffect(() => {
    if (canViewUsers) {
      fetchUsers();
    }
  }, [canViewUsers]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get users from Clerk via API
      const token = await getToken();
      const response = await fetch('/api/clerk/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users from Clerk');
      }

      const clerkUsers = await response.json();

      // Also get user roles from Supabase
      const { data: supabaseUsers, error: supabaseError } = await supabase
        .from('users')
        .select('id, role, created_at, updated_at, last_login');

      if (supabaseError) {
        console.warn('Could not fetch user roles from Supabase:', supabaseError);
      }

      // Merge Clerk data with Supabase role data
      const mergedUsers = clerkUsers.map(clerkUser => {
        const supabaseUser = supabaseUsers?.find(su => su.id === clerkUser.id) || {};
        return {
          ...clerkUser,
          role: supabaseUser.role || 'staff',
          dbCreatedAt: supabaseUser.created_at,
          dbUpdatedAt: supabaseUser.updated_at,
          lastLogin: supabaseUser.last_login
        };
      });

      setUsers(mergedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!canCreateUsers) {
      setError('Insufficient permissions to create users');
      return;
    }

    try {
      setOperationLoading(true);
      setError(null);

      const token = await getToken();
      const response = await fetch('/api/clerk/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailAddress: userForm.email,
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          phoneNumber: userForm.phoneNumber,
          password: userForm.password,
          publicMetadata: {
            role: userForm.role
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const newUser = await response.json();

      // Also create user record in Supabase
      await supabase
        .from('users')
        .insert({
          id: newUser.id,
          email: userForm.email,
          full_name: `${userForm.firstName} ${userForm.lastName}`.trim(),
          role: userForm.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      setSuccess('User created successfully');
      setShowCreateModal(false);
      setUserForm({
        email: '',
        firstName: '',
        lastName: '',
        role: 'staff',
        phoneNumber: '',
        password: ''
      });
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!canEditUsers) {
      setError('Insufficient permissions to edit users');
      return;
    }

    if (!selectedUser) return;

    try {
      setOperationLoading(true);
      setError(null);

      const token = await getToken();
      const response = await fetch(`/api/clerk/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          phoneNumber: userForm.phoneNumber,
          publicMetadata: {
            role: userForm.role
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      // Also update Supabase record
      await supabase
        .from('users')
        .update({
          full_name: `${userForm.firstName} ${userForm.lastName}`.trim(),
          role: userForm.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      setSuccess('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!canDeleteUsers) {
      setError('Insufficient permissions to delete users');
      return;
    }

    if (userId === currentUser?.id) {
      setError('Cannot delete your own account');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        setOperationLoading(true);
        const token = await getToken();
        
        const response = await fetch(`/api/clerk/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete user');
        }

        // Also delete from Supabase
        await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        setSuccess('User deleted successfully');
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      } catch (err) {
        setError(err.message);
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    if (!canManageRoles) {
      setError('Insufficient permissions to manage roles');
      return;
    }

    try {
      setUpdatingRole(true);
      const result = await updateUserRole(userId, newRole);
      
      if (result.success) {
        // Update local state
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId 
              ? { ...user, role: newRole, dbUpdatedAt: new Date().toISOString() }
              : user
          )
        );
        setSuccess('Role updated successfully');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!canEditUsers) {
      setError('Insufficient permissions to reset passwords');
      return;
    }

    if (window.confirm('Are you sure you want to send a password reset email to this user?')) {
      try {
        setOperationLoading(true);
        const token = await getToken();
        
        const response = await fetch(`/api/clerk/users/${userId}/reset-password`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send password reset');
        }

        setSuccess('Password reset email sent successfully');
      } catch (err) {
        setError(err.message);
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setUserForm({
      email: user.emailAddresses?.[0]?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || 'staff',
      phoneNumber: user.phoneNumbers?.[0]?.phoneNumber || '',
      password: ''
    });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setUserForm({
      email: '',
      firstName: '',
      lastName: '',
      role: 'staff',
      phoneNumber: '',
      password: ''
    });
    setShowCreateModal(true);
  };

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const email = user.emailAddresses?.[0]?.emailAddress || '';
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    
    const matchesSearch = 
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  if (!canViewUsers) {
    return (
      <div className="text-center py-20">
        <div className="text-red-500 text-xl mb-4">Access Denied</div>
        <p className="text-gray-600">You don't have permission to view user management.</p>
      </div>
    );
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError(null)}
            >
              <span className="sr-only">Dismiss</span>
              ×
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{success}</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setSuccess(null)}
            >
              <span className="sr-only">Dismiss</span>
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage system users, roles, and permissions</p>
          </div>
          {canCreateUsers && (
            <button
              onClick={openCreateModal}
              disabled={operationLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <span>+</span>
              Add User
            </button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              {getAllRoles().map(role => (
                <option key={role} value={role}>
                  {getRoleInfo(role).name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
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
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full"
                          src={user.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user.firstName} ${user.lastName}`)}&background=random`}
                          alt={`${user.firstName} ${user.lastName}`}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.emailAddresses?.[0]?.emailAddress}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {getRoleInfo(user.role).name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.phoneNumbers?.[0]?.phoneNumber || 'Not provided'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.lastSignInAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.banned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {canEditUsers && (
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-900"
                          disabled={operationLoading}
                        >
                          Edit
                        </button>
                      )}
                      {canEditUsers && (
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          disabled={operationLoading}
                        >
                          Reset Password
                        </button>
                      )}
                      {canDeleteUsers && user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={operationLoading}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No users found</div>
            <p className="text-gray-400 mt-2">
              {searchTerm || filterRole !== 'all' 
                ? 'Try adjusting your search criteria' 
                : 'No users have been created yet'
              }
            </p>
          </div>
        )}
      </motion.div>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={operationLoading}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={userForm.firstName}
                      onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={userForm.lastName}
                      onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={userForm.phoneNumber}
                    onChange={(e) => setUserForm({...userForm, phoneNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 8 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {getAllRoles().map(role => (
                      <option key={role} value={role}>
                        {getRoleInfo(role).name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={operationLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={operationLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {operationLoading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
                    Create User
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={operationLoading}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={userForm.firstName}
                      onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={userForm.lastName}
                      onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={userForm.phoneNumber}
                    onChange={(e) => setUserForm({...userForm, phoneNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {canManageRoles && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {getAllRoles().map(role => (
                        <option key={role} value={role}>
                          {getRoleInfo(role).name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    disabled={operationLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={operationLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {operationLoading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
                    Update User
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClerkUserManagement;
