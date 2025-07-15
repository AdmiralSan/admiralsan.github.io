import React from 'react';
import { usePermissions } from '../contexts/PermissionsContext';

/**
 * ProtectedComponent - Renders children only if user has required permissions
 * 
 * @param {string|string[]} permission - Single permission or array of permissions required
 * @param {string} requireAll - If true, user must have ALL permissions. If false, user needs ANY permission
 * @param {React.ReactNode} children - Content to render if user has permission
 * @param {React.ReactNode} fallback - Content to render if user lacks permission
 */
const ProtectedComponent = ({ 
  permission, 
  permissions = [], 
  requireAll = true, 
  children, 
  fallback = null 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  // Show loading state while checking permissions
  if (loading) {
    return fallback;
  }

  // Handle single permission
  if (permission && typeof permission === 'string') {
    return hasPermission(permission) ? children : fallback;
  }

  // Handle multiple permissions
  const permissionList = permission ? [permission] : permissions;
  
  if (permissionList.length === 0) {
    return children; // No permissions required
  }

  const hasRequiredPermissions = requireAll 
    ? hasAllPermissions(permissionList)
    : hasAnyPermission(permissionList);

  return hasRequiredPermissions ? children : fallback;
};

export default ProtectedComponent;
