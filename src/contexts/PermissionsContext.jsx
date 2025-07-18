import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useOrganization, useAuth } from '@clerk/clerk-react';
import { hasPermission as checkPermission, ROLES, getRoleInfo } from '../utils/permissions';
import { supabase } from '../supabaseClient';
import { 
  mapClerkRoleToAppRole, 
  getPermissionsForAppRole, 
  getPermissionsForClerkRole
} from '../utils/clerkRoleMapping';

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

  // Get user role from Clerk organization
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

        // Primary method: Get role from organization membership
        if (organization && membership) {
          const clerkRole = membership.role;
          
          // Map Clerk organization roles to our application roles
          // Clerk default roles: admin, member, guest
          // Custom roles can be configured in Clerk Dashboard
          switch (clerkRole) {
            case 'admin':
              role = 'admin';
              break;
            case 'manager':
              role = 'manager';
              break;
            case 'member':
              role = 'staff';
              break;
            case 'guest':
              role = 'viewer';
              break;
            // Handle any custom roles you've configured in Clerk
            case 'finance':
              role = 'accountant';
              break;
            case 'sales':
              role = 'sales';
              break;
            default:
              // For any unknown role, default to staff
              role = 'staff';
          }
        } 
        // Fallback: If not in organization but has metadata
        else if (user.publicMetadata && user.publicMetadata.role) {
          role = user.publicMetadata.role;
        }
        // Last resort: First user becomes admin automatically
        else if (user.createdAt && new Date(user.createdAt).getTime() < Date.now() - 60000) {
          role = 'admin';
        }

        setUserRole(role);
        
        // Set permissions based on role using our new mapping
        const rolePermissions = getPermissionsForAppRole(role);
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

  // Update user role using Clerk's organization roles (admin only)
  const updateUserRole = async (userId, newRole) => {
    if (!hasPermission('users:roles')) {
      throw new Error('Insufficient permissions to update user roles');
    }

    if (!organization) {
      return { success: false, error: 'No organization available' };
    }

    try {
      // Convert our app role to Clerk organization role
      let clerkRole;
      switch (newRole) {
        case 'admin':
          clerkRole = 'admin';
          break;
        case 'manager':
          clerkRole = 'manager';
          break;
        case 'staff':
          clerkRole = 'member';
          break;
        case 'viewer':
          clerkRole = 'guest';
          break;
        default:
          clerkRole = 'member'; // Default to basic member
      }

      // Update the user's role in the Clerk organization
      try {
        await organization.updateMember({
          userId,
          role: clerkRole
        });
        
        console.log(`Role for user ${userId} updated to ${clerkRole} in Clerk`);
        
        // We also update Supabase for backward compatibility
        const { error: supabaseError } = await supabase
          .from('users')
          .update({
            role: newRole,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (supabaseError) {
          console.warn('Supabase role update warning:', supabaseError);
          // We don't fail if Supabase update fails, as Clerk is our source of truth
        }
        
        return { success: true };
      } catch (clerkError) {
        console.error('Clerk role update failed:', clerkError);
        return { success: false, error: `Clerk error: ${clerkError.message || 'Unknown error'}` };
      }
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
