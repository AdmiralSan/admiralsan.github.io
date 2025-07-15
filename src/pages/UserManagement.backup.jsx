import React from 'react';
import ClerkUserManagementSimple from '../components/ClerkUserManagementSimple';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [updatingRole, setUpdatingRole] = useState(false);

  const { user: currentUser } = useUser();
  const { hasPermission, userRole: currentUserRole, updateUserRole } = usePermissions();

  // Check permissions
  const canViewUsers = hasPermission(PERMISSIONS.users.view);
  const canEditUsers = hasPermission(PERMISSIONS.users.edit);
  const canManageRoles = hasPermission(PERMISSIONS.users.roles);
  const canDeleteUsers = hasPermission(PERMISSIONS.users.delete);

  useEffect(() => {
    if (canViewUsers) {
      fetchUsers();
    }
  }, [canViewUsers]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      setUpdatingRole(true);
      const result = await updateUserRole(userId, newRole);
      
      if (result.success) {
        // Update local state
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId 
              ? { ...user, role: newRole, updated_at: new Date().toISOString() }
              : user
          )
        );
        setShowEditModal(false);
        setSelectedUser(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingRole(false);
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
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (error) throw error;

        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage users and their permissions</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          
          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Roles</option>
            {getAllRoles().map(role => (
              <option key={role} value={role}>
                {getRoleInfo(role)?.name || role}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {getAllRoles().map(role => {
          const count = users.filter(user => user.role === role).length;
          const roleInfo = getRoleInfo(role);
          return (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {roleInfo?.name || role}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                </div>
                <div className={`p-2 rounded-full ${getRoleBadgeColor(role)}`}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Updated
                </th>
                {canEditUsers && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email)}&background=3B82F6&color=fff`}
                        alt={user.full_name || user.email}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.full_name || 'No name'}
                          {user.id === currentUser?.id && (
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-300">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {getRoleInfo(user.role)?.name || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {new Date(user.updated_at).toLocaleDateString()}
                  </td>
                  {canEditUsers && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {canManageRoles && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit Role
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPermissionsModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          View Permissions
                        </button>
                        {canDeleteUsers && user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {users.length === 0 ? 'No users found.' : 'No users match your search criteria.'}
            </p>
          </div>
        )}
      </motion.div>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Edit User Role
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  User: {selectedUser.full_name || selectedUser.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Current Role: {getRoleInfo(selectedUser.role)?.name || selectedUser.role}
                </p>
                
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Role
                </label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={updatingRole}
                >
                  {getAllRoles().map(role => {
                    const roleInfo = getRoleInfo(role);
                    return (
                      <option key={role} value={role}>
                        {roleInfo?.name || role} - {roleInfo?.description}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500"
                  disabled={updatingRole}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRoleUpdate(selectedUser.id, selectedUser.role)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={updatingRole}
                >
                  {updatingRole ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permissions Modal */}
      <AnimatePresence>
        {showPermissionsModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowPermissionsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                User Permissions
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  User: {selectedUser.full_name || selectedUser.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Role: {getRoleInfo(selectedUser.role)?.name || selectedUser.role}
                </p>
              </div>
              
              <div className="space-y-4">
                {Object.entries(PERMISSIONS).map(([category, perms]) => {
                  const userPermissions = ROLES[selectedUser.role]?.permissions || [];
                  const categoryPermissions = Object.values(perms);
                  const hasAnyInCategory = categoryPermissions.some(perm => userPermissions.includes(perm));
                  
                  if (!hasAnyInCategory) return null;
                  
                  return (
                    <div key={category} className="border dark:border-gray-600 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 capitalize">
                        {category}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(perms).map(([action, permission]) => (
                          <div key={permission} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={userPermissions.includes(permission)}
                              readOnly
                              className="h-4 w-4 text-blue-600 rounded"
                            />
                            <label className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                              {action}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
