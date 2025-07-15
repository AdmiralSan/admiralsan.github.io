import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useOrganization } from '@clerk/clerk-react';
import { hasPermission as checkPermission, ROLES, getRoleInfo } from '../utils/permissions';

const PermissionsContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider = ({ children }) => {
  const { user, isSignedIn } = useUser();
  const { organization, membership } = useOrganization();
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get user role from Clerk
  useEffect(() => {
    const getUserRole = () => {
      if (!isSignedIn || !user) {
        setUserRole(null);
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        let role = 'viewer'; // Default role

        // Method 1: Check organization membership role
        if (organization && membership) {
          // Map Clerk organization roles to our app roles
          const orgRole = membership.role;
          switch (orgRole) {
            case 'org:admin':
              role = 'admin';
              break;
            case 'org:member':
              role = 'staff';
              break;
            default:
              role = 'staff';
          }
        } 
        // Method 2: Check user's public metadata for role
        else if (user.publicMetadata && user.publicMetadata.role) {
          role = user.publicMetadata.role;
        }
        // Method 3: Check if user has admin role in privateMetadata
        else if (user.privateMetadata && user.privateMetadata.role) {
          role = user.privateMetadata.role;
        }
        // Method 4: First user becomes admin automatically
        else if (user.createdAt && new Date(user.createdAt).getTime() < Date.now() - 60000) {
          // If this is likely the first user (created more than 1 minute ago), make them admin
          // You might want to implement a better first-user detection logic
          role = 'admin';
        }

        setUserRole(role);
        
        // Set permissions based on role
        const rolePermissions = ROLES[role]?.permissions || [];
        setPermissions(rolePermissions);

      } catch (error) {
        console.error('Error getting user role:', error);
        // Set default permissions on error
        setUserRole('viewer');
        setPermissions(ROLES.viewer.permissions);
      } finally {
        setLoading(false);
      }
    };

    getUserRole();
  }, [user, isSignedIn, organization, membership]);

  // Check if user has a specific permission
  const hasPermission = (permission) => {
    if (!userRole) return false;
    return checkPermission(userRole, permission);
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissionList) => {
    return permissionList.some(permission => hasPermission(permission));
  };

  // Check if user has all of the specified permissions
  const hasAllPermissions = (permissionList) => {
    return permissionList.every(permission => hasPermission(permission));
  };

  // Update user role using Clerk metadata (admin only)
  const updateUserRole = async (userId, newRole) => {
    if (!hasPermission('users:roles')) {
      throw new Error('Insufficient permissions to update user roles');
    }

    try {
      // Note: This would require Clerk Backend API to update user metadata
      // For now, we'll just show an error message
      console.warn('Role updates need to be done through Clerk Dashboard or Backend API');
      return { 
        success: false, 
        error: 'Role updates must be done through Clerk Dashboard. Go to clerk.com dashboard -> Users -> Select user -> Edit metadata.' 
      };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    userRole,
    permissions,
    userProfile: user, // Use Clerk user object instead of Supabase profile
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    updateUserRole,
    roleInfo: userRole ? getRoleInfo(userRole) : null,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export default PermissionsProvider;
