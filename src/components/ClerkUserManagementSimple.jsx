import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useUser, useOrganization } from '@clerk/clerk-react';
import { usePermissions } from '../contexts/PermissionsContext';
import { supabase } from '../supabaseClient';
import { ROLES, PERMISSIONS, getAllRoles, getRoleInfo } from '../utils/permissions';

const ClerkUserManagementSimple = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [operationLoading, setOperationLoading] = useState(false);

  const { user: currentUser, getToken } = useAuth();
  const { organization, invitations, memberships } = useOrganization({
    invitations: {
      infinite: true,
    },
    memberships: {
      infinite: true,
    },
  });
  const { hasPermission, userRole: currentUserRole, updateUserRole } = usePermissions();

  // Form state for inviting users
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'basic_member'
  });

  // Form state for editing user roles
  const [editForm, setEditForm] = useState({
    role: 'basic_member'
  });

  // Check permissions
  const canViewUsers = hasPermission(PERMISSIONS.users.view);
  const canInviteUsers = hasPermission(PERMISSIONS.users.create);
  const canEditUsers = hasPermission(PERMISSIONS.users.edit);
  const canManageRoles = hasPermission(PERMISSIONS.users.roles);
  const canDeleteUsers = hasPermission(PERMISSIONS.users.delete);

  useEffect(() => {
    if (canViewUsers && organization) {
      fetchUsers();
    }
  }, [canViewUsers, organization, memberships, invitations]);

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

      if (!organization) {
        setError('No organization found');
        return;
      }

      // Get organization members and invitations
      const allMembers = memberships?.data || [];
      const allInvitations = invitations?.data || [];

      // Get additional user data from Supabase
      const userIds = allMembers.map(member => member.publicUserData.userId);
      
      let supabaseUsers = [];
      if (userIds.length > 0) {
        const { data, error: supabaseError } = await supabase
          .from('users')
          .select('id, role, created_at, updated_at, last_login, full_name')
          .in('id', userIds);

        if (supabaseError) {
          console.warn('Could not fetch user roles from Supabase:', supabaseError);
        } else {
          supabaseUsers = data || [];
        }
      }

      // Merge Clerk organization data with Supabase data
      const mergedUsers = allMembers.map(member => {
        const supabaseUser = supabaseUsers.find(su => su.id === member.publicUserData.userId) || {};
        return {
          id: member.publicUserData.userId,
          email: member.publicUserData.identifier,
          firstName: member.publicUserData.firstName,
          lastName: member.publicUserData.lastName,
          imageUrl: member.publicUserData.imageUrl,
          role: supabaseUser.role || 'staff',
          clerkRole: member.role,
          joinedAt: member.createdAt,
          dbCreatedAt: supabaseUser.created_at,
          dbUpdatedAt: supabaseUser.updated_at,
          lastLogin: supabaseUser.last_login,
          status: 'active',
          membership: member
        };
      });

      // Add pending invitations
      const pendingInvites = allInvitations.map(invitation => ({
        id: invitation.id,
        email: invitation.emailAddress,
        firstName: '',
        lastName: '',
        imageUrl: '',
        role: 'staff',
        clerkRole: invitation.role,
        invitedAt: invitation.createdAt,
        status: 'pending',
        invitation: invitation
      }));

      setUsers([...mergedUsers, ...pendingInvites]);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!canInviteUsers) {
      setError('Insufficient permissions to invite users');
      return;
    }

    if (!organization) {
      setError('No organization found');
      return;
    }

    try {
      setOperationLoading(true);
      setError(null);

      // Send invitation through Clerk
      await organization.inviteMembers({
        emailAddresses: [inviteForm.email],
        role: inviteForm.role
      });

      setSuccess('Invitation sent successfully');
      setShowInviteModal(false);
      setInviteForm({
        email: '',
        role: 'basic_member'
      });
      await fetchUsers();
    } catch (err) {
      console.error('Error inviting user:', err);
      setError(err.message);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleUpdateUserRole = async (e) => {
    e.preventDefault();
    if (!canManageRoles) {
      setError('Insufficient permissions to manage roles');
      return;
    }

    if (!selectedUser || !organization) return;

    try {
      setOperationLoading(true);
      setError(null);

      // Update role in Clerk organization
      if (selectedUser.membership) {
        await organization.updateMember({
          userId: selectedUser.id,
          role: editForm.role
        });
      }

      // Also update role in Supabase
      await supabase
        .from('users')
        .upsert({
          id: selectedUser.id,
          email: selectedUser.email,
          full_name: `${selectedUser.firstName} ${selectedUser.lastName}`.trim(),
          role: editForm.role,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      setSuccess('User role updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err.message);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleRemoveUser = async (user) => {
    if (!canDeleteUsers) {
      setError('Insufficient permissions to remove users');
      return;
    }

    if (user.id === currentUser?.id) {
      setError('Cannot remove your own account');
      return;
    }

    if (!organization) {
      setError('No organization found');
      return;
    }

    const action = user.status === 'pending' ? 'revoke this invitation' : 'remove this user';
    
    if (window.confirm(`Are you sure you want to ${action}? This action cannot be undone.`)) {
      try {
        setOperationLoading(true);

        if (user.status === 'pending' && user.invitation) {
          // Revoke invitation
          await user.invitation.revoke();
        } else if (user.membership) {
          // Remove member
          await user.membership.destroy();
        }

        // Also remove from Supabase if it's an active user
        if (user.status === 'active') {
          await supabase
            .from('users')
            .delete()
            .eq('id', user.id);
        }

        setSuccess(user.status === 'pending' ? 'Invitation revoked successfully' : 'User removed successfully');
        await fetchUsers();
      } catch (err) {
        console.error('Error removing user:', err);
        setError(err.message);
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const handleResendInvitation = async (invitation) => {
    if (!canInviteUsers) {
      setError('Insufficient permissions to resend invitations');
      return;
    }

    try {
      setOperationLoading(true);
      await invitation.attemptToRevoke();
      
      // Send new invitation
      await organization.inviteMembers({
        emailAddresses: [invitation.emailAddress],
        role: invitation.role
      });

      setSuccess('Invitation resent successfully');
      await fetchUsers();
    } catch (err) {
      console.error('Error resending invitation:', err);
      setError(err.message);
    } finally {
      setOperationLoading(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      role: user.clerkRole || 'basic_member'
    });
    setShowEditModal(true);
  };

  const openInviteModal = () => {
    setInviteForm({
      email: '',
      role: 'basic_member'
    });
    setShowInviteModal(true);
  };

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const email = user.email || '';
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
      case 'basic_member': return 'bg-green-100 text-green-800';
      case 'admin_member': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'banned': return 'bg-red-100 text-red-800';
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

  if (!organization) {
    return (
      <div className="text-center py-20">
        <div className="text-yellow-500 text-xl mb-4">No Organization</div>
        <p className="text-gray-600">You need to be part of an organization to manage users.</p>
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
            <p className="text-gray-600">Manage organization members and invitations</p>
            <p className="text-sm text-gray-500">Organization: {organization.name}</p>
          </div>
          {canInviteUsers && (
            <button
              onClick={openInviteModal}
              disabled={operationLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <span>+</span>
              Invite User
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
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
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
                        {user.imageUrl ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.imageUrl}
                            alt={`${user.firstName} ${user.lastName}`}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.firstName?.[0] || user.email?.[0] || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.status === 'pending' ? 'Invited User' : `${user.firstName} ${user.lastName}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.joinedAt || user.invitedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {canEditUsers && user.status === 'active' && (
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-900"
                          disabled={operationLoading}
                        >
                          Edit
                        </button>
                      )}
                      {canInviteUsers && user.status === 'pending' && user.invitation && (
                        <button
                          onClick={() => handleResendInvitation(user.invitation)}
                          className="text-green-600 hover:text-green-900"
                          disabled={operationLoading}
                        >
                          Resend
                        </button>
                      )}
                      {canDeleteUsers && user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleRemoveUser(user)}
                          className="text-red-600 hover:text-red-900"
                          disabled={operationLoading}
                        >
                          {user.status === 'pending' ? 'Revoke' : 'Remove'}
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
                : 'No users have been invited yet'
              }
            </p>
          </div>
        )}
      </motion.div>

      {/* Invite User Modal */}
      <AnimatePresence>
        {showInviteModal && (
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
                <h3 className="text-lg font-medium text-gray-900">Invite User</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={operationLoading}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleInviteUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="basic_member">Basic Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
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
                    Send Invitation
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
                <h3 className="text-lg font-medium text-gray-900">Edit User Role</h3>
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

              <div className="mb-4">
                <div className="text-sm text-gray-600">
                  User: {selectedUser.firstName} {selectedUser.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  Email: {selectedUser.email}
                </div>
              </div>

              <form onSubmit={handleUpdateUserRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="basic_member">Basic Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

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
                    Update Role
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

export default ClerkUserManagementSimple;
