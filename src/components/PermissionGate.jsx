import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermissions } from '../contexts/PermissionsContext';

/**
 * PermissionGate - A wrapper for navigation items that checks permissions
 */
const PermissionGate = ({ 
  permission, 
  permissions = [], 
  requireAll = false, 
  children,
  showUnauthorized = false,
  unauthorizedText = "Access Denied"
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  // Don't render anything while loading
  if (loading) {
    return null;
  }

  // Handle single permission
  if (permission && typeof permission === 'string') {
    const hasAccess = hasPermission(permission);
    if (!hasAccess) {
      return showUnauthorized ? <span className="text-gray-400">{unauthorizedText}</span> : null;
    }
    return children;
  }

  // Handle multiple permissions
  const permissionList = permission ? [permission] : permissions;
  
  if (permissionList.length === 0) {
    return children; // No permissions required
  }

  const hasRequiredPermissions = requireAll 
    ? hasAllPermissions(permissionList)
    : hasAnyPermission(permissionList);

  if (!hasRequiredPermissions) {
    return showUnauthorized ? <span className="text-gray-400">{unauthorizedText}</span> : null;
  }

  return children;
};

/**
 * ProtectedNavLink - A NavLink that only renders if user has required permissions
 */
export const ProtectedNavLink = ({ 
  permission, 
  permissions = [], 
  requireAll = false,
  to,
  children,
  className,
  ...props 
}) => {
  return (
    <PermissionGate 
      permission={permission} 
      permissions={permissions} 
      requireAll={requireAll}
    >
      <NavLink to={to} className={className} {...props}>
        {children}
      </NavLink>
    </PermissionGate>
  );
};

export default PermissionGate;
