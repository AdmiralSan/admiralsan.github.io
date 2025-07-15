// Permission definitions for the application
export const PERMISSIONS = {
  // Dashboard permissions
  dashboard: {
    view: 'dashboard:view',
    analytics: 'dashboard:analytics'
  },
  
  // Product permissions
  products: {
    view: 'products:view',
    create: 'products:create',
    edit: 'products:edit',
    delete: 'products:delete',
    export: 'products:export'
  },
  
  // Inventory permissions
  inventory: {
    view: 'inventory:view',
    edit: 'inventory:edit',
    transfer: 'inventory:transfer',
    adjust: 'inventory:adjust',
    reports: 'inventory:reports'
  },
  
  // Warehouse permissions
  warehouses: {
    view: 'warehouses:view',
    create: 'warehouses:create',
    edit: 'warehouses:edit',
    delete: 'warehouses:delete',
    manage: 'warehouses:manage'
  },
  
  // Supplier permissions
  suppliers: {
    view: 'suppliers:view',
    create: 'suppliers:create',
    edit: 'suppliers:edit',
    delete: 'suppliers:delete'
  },
  
  // User management permissions
  users: {
    view: 'users:view',
    create: 'users:create',
    edit: 'users:edit',
    delete: 'users:delete',
    roles: 'users:roles'
  },
  
  // Settings permissions
  settings: {
    view: 'settings:view',
    edit: 'settings:edit',
    system: 'settings:system'
  },
  
  // Reports permissions
  reports: {
    view: 'reports:view',
    generate: 'reports:generate',
    export: 'reports:export'
  },
  
  // Billing permissions
  billing: {
    view: 'billing:view',
    create: 'billing:create',
    edit: 'billing:edit',
    process: 'billing:process'
  }
};

// Role definitions with their permissions
export const ROLES = {
  admin: {
    name: 'Administrator',
    description: 'Full system access',
    permissions: [
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
    ]
  },
  
  manager: {
    name: 'Manager',
    description: 'Management access with some restrictions',
    permissions: [
      // Dashboard
      ...Object.values(PERMISSIONS.dashboard),
      
      // Products (all except delete)
      PERMISSIONS.products.view,
      PERMISSIONS.products.create,
      PERMISSIONS.products.edit,
      PERMISSIONS.products.export,
      
      // Inventory (all)
      ...Object.values(PERMISSIONS.inventory),
      
      // Warehouses (view, edit, manage)
      PERMISSIONS.warehouses.view,
      PERMISSIONS.warehouses.edit,
      PERMISSIONS.warehouses.manage,
      
      // Suppliers (all except delete)
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
    ]
  },
  
  staff: {
    name: 'Staff',
    description: 'Basic operational access',
    permissions: [
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
      
      // Settings (view only)
      PERMISSIONS.settings.view,
      
      // Reports (view only)
      PERMISSIONS.reports.view,
      
      // Billing (view only)
      PERMISSIONS.billing.view
    ]
  },
  
  viewer: {
    name: 'Viewer',
    description: 'Read-only access',
    permissions: [
      // Dashboard (view only)
      PERMISSIONS.dashboard.view,
      
      // Products (view only)
      PERMISSIONS.products.view,
      
      // Inventory (view only)
      PERMISSIONS.inventory.view,
      
      // Warehouses (view only)
      PERMISSIONS.warehouses.view,
      
      // Suppliers (view only)
      PERMISSIONS.suppliers.view,
      
      // Reports (view only)
      PERMISSIONS.reports.view,
      
      // Billing (view only)
      PERMISSIONS.billing.view
    ]
  }
};

// Utility functions
export const hasPermission = (userRole, permission) => {
  if (!userRole || !ROLES[userRole]) {
    return false;
  }
  
  return ROLES[userRole].permissions.includes(permission);
};

export const getRolePermissions = (role) => {
  return ROLES[role]?.permissions || [];
};

export const getAllRoles = () => {
  return Object.keys(ROLES);
};

export const getRoleInfo = (role) => {
  return ROLES[role] || null;
};
