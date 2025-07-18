// clerkRoleMapping.js - Maps Clerk organization roles to application permissions

import { PERMISSIONS } from './permissions';

// Define the available Clerk roles and their descriptions
export const CLERK_ROLES = {
  'admin': {
    name: 'Administrator',
    description: 'Full system access',
    defaultClerkRole: 'admin',
    appRole: 'admin'
  },
  'manager': {
    name: 'Manager',
    description: 'Management access with some restrictions',
    defaultClerkRole: 'manager', // This would be a custom role in Clerk
    appRole: 'manager'
  },
  'staff': {
    name: 'Staff',
    description: 'Basic operational access',
    defaultClerkRole: 'member', // Default Clerk role
    appRole: 'staff'
  },
  'accountant': {
    name: 'Accountant',
    description: 'Financial and accounting access',
    defaultClerkRole: 'finance', // This would be a custom role in Clerk
    appRole: 'accountant'
  },
  'sales': {
    name: 'Sales Representative',
    description: 'Sales and customer management',
    defaultClerkRole: 'sales', // This would be a custom role in Clerk
    appRole: 'sales'
  },
  'viewer': {
    name: 'Viewer',
    description: 'Read-only access',
    defaultClerkRole: 'guest', // Default Clerk role
    appRole: 'viewer'
  }
};

// Maps a Clerk role to our application role
export const mapClerkRoleToAppRole = (clerkRole) => {
  // First check for direct matches with our custom roles
  for (const [appRole, details] of Object.entries(CLERK_ROLES)) {
    if (details.defaultClerkRole === clerkRole) {
      return appRole;
    }
  }

  // Default mappings for standard Clerk roles
  switch (clerkRole) {
    case 'admin':
      return 'admin';
    case 'member':
      return 'staff';
    case 'guest':
      return 'viewer';
    default:
      return 'viewer'; // Default to viewer for unknown roles
  }
};

// Maps an application role to the corresponding Clerk role
export const mapAppRoleToClerkRole = (appRole) => {
  return CLERK_ROLES[appRole]?.defaultClerkRole || 'member';
};

// Gets the permissions for a given Clerk role
export const getPermissionsForClerkRole = (clerkRole) => {
  const appRole = mapClerkRoleToAppRole(clerkRole);
  return getPermissionsForAppRole(appRole);
};

// Gets the permissions for an application role
export const getPermissionsForAppRole = (appRole) => {
  switch (appRole) {
    case 'admin':
      return [
        // All permissions
        ...Object.values(PERMISSIONS.dashboard),
        ...Object.values(PERMISSIONS.products),
        ...Object.values(PERMISSIONS.inventory),
        ...Object.values(PERMISSIONS.warehouses),
        ...Object.values(PERMISSIONS.suppliers),
        ...Object.values(PERMISSIONS.users),
        ...Object.values(PERMISSIONS.settings),
        ...Object.values(PERMISSIONS.reports),
        ...Object.values(PERMISSIONS.billing)
      ];
    
    case 'manager':
      return [
        // Dashboard
        ...Object.values(PERMISSIONS.dashboard),
        
        // Products (all)
        ...Object.values(PERMISSIONS.products),
        
        // Inventory (all)
        ...Object.values(PERMISSIONS.inventory),
        
        // Warehouses (view, edit)
        PERMISSIONS.warehouses.view,
        PERMISSIONS.warehouses.edit,
        
        // Suppliers (view, create, edit)
        PERMISSIONS.suppliers.view,
        PERMISSIONS.suppliers.create,
        PERMISSIONS.suppliers.edit,
        
        // Users (view only)
        PERMISSIONS.users.view,
        
        // Settings (view only)
        PERMISSIONS.settings.view,
        
        // Reports (all)
        ...Object.values(PERMISSIONS.reports),
        
        // Billing (view, create, edit)
        PERMISSIONS.billing.view,
        PERMISSIONS.billing.create,
        PERMISSIONS.billing.edit
      ];
    
    case 'staff':
      return [
        // Dashboard (view only)
        PERMISSIONS.dashboard.view,
        
        // Products (view, create, edit)
        PERMISSIONS.products.view,
        PERMISSIONS.products.create,
        PERMISSIONS.products.edit,
        
        // Inventory (view, edit)
        PERMISSIONS.inventory.view,
        PERMISSIONS.inventory.edit,
        
        // Warehouses (view only)
        PERMISSIONS.warehouses.view,
        
        // Suppliers (view only)
        PERMISSIONS.suppliers.view,
        
        // Billing (view only)
        PERMISSIONS.billing.view
      ];
    
    case 'accountant':
      return [
        // Dashboard (view, analytics)
        ...Object.values(PERMISSIONS.dashboard),
        
        // Reports (all)
        ...Object.values(PERMISSIONS.reports),
        
        // Billing (all)
        ...Object.values(PERMISSIONS.billing),
        
        // Products (view only)
        PERMISSIONS.products.view,
        
        // Inventory (view, reports)
        PERMISSIONS.inventory.view,
        PERMISSIONS.inventory.reports
      ];
    
    case 'sales':
      return [
        // Dashboard (view only)
        PERMISSIONS.dashboard.view,
        
        // Products (view only)
        PERMISSIONS.products.view,
        
        // Inventory (view only)
        PERMISSIONS.inventory.view,
        
        // Billing (view, create)
        PERMISSIONS.billing.view,
        PERMISSIONS.billing.create
      ];
    
    case 'viewer':
      return [
        // Read-only permissions
        PERMISSIONS.dashboard.view,
        PERMISSIONS.products.view,
        PERMISSIONS.inventory.view,
        PERMISSIONS.warehouses.view,
        PERMISSIONS.suppliers.view,
        PERMISSIONS.reports.view,
        PERMISSIONS.billing.view
      ];
    
    default:
      return []; // No permissions for unknown roles
  }
};

export default {
  CLERK_ROLES,
  mapClerkRoleToAppRole,
  mapAppRoleToClerkRole,
  getPermissionsForClerkRole,
  getPermissionsForAppRole
};
