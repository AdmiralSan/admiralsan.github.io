# Role-Based Permission System

VsdvBillsoft now includes a comprehensive role-based permission system that allows you to control what each user can see and do in the application.

## 🎯 **Features**

### **User Roles**
- **Admin**: Full system access - can manage all users, roles, and system settings
- **Manager**: Management access - can manage inventory, products, and reports, but limited user management
- **Staff**: Operational access - can perform day-to-day operations but can't delete or access sensitive areas
- **Viewer**: Read-only access - can view information but cannot make changes

### **Permission Categories**
1. **Dashboard** - View analytics and system overview
2. **Products** - Manage product catalog
3. **Inventory** - Control stock levels and movements
4. **Warehouses** - Manage storage locations
5. **Suppliers** - Handle vendor relationships
6. **Users** - Manage user accounts and permissions
7. **Settings** - Configure system preferences
8. **Reports** - Generate and export reports
9. **Billing** - Handle invoicing and payments

## 🚀 **How It Works**

### **1. User Registration**
- New users automatically get the **Staff** role by default
- The first user in the system is automatically promoted to **Admin**
- Admins can change user roles through the User Management page

### **2. Permission Checking**
The system uses several methods to control access:

#### **Navigation Protection**
```jsx
// Navigation items automatically hide if user lacks permission
<ProtectedNavLink 
  to="/users" 
  permission={PERMISSIONS.users.view}
>
  User Management
</ProtectedNavLink>
```

#### **Component Protection**
```jsx
// Components only render if user has permission
<ProtectedComponent permission={PERMISSIONS.products.create}>
  <AddProductButton />
</ProtectedComponent>
```

#### **Hook-based Checks**
```jsx
// Check permissions in component logic
const { hasPermission } = usePermissions();
const canEdit = hasPermission(PERMISSIONS.products.edit);
```

### **3. Database Security**
- Row Level Security (RLS) policies protect data at the database level
- Users can only access data they have permission to see
- Role changes are tracked and audited

## 📋 **Permission Matrix**

| Feature | Admin | Manager | Staff | Viewer |
|---------|-------|---------|-------|--------|
| **Dashboard** | ✅ Full | ✅ Full | ✅ View | ✅ View |
| **Products** | ✅ Full | ✅ Create/Edit | ✅ Create/Edit | ✅ View |
| **Inventory** | ✅ Full | ✅ Full | ✅ Edit | ✅ View |
| **Warehouses** | ✅ Full | ✅ Manage | ✅ View | ✅ View |
| **Suppliers** | ✅ Full | ✅ Create/Edit | ✅ View | ✅ View |
| **Users** | ✅ Full | ✅ View | ❌ None | ❌ None |
| **Settings** | ✅ Full | ✅ View | ✅ View | ❌ None |
| **Reports** | ✅ Full | ✅ Full | ✅ View | ✅ View |
| **Billing** | ✅ Full | ✅ Create/Edit | ✅ View | ✅ View |

## 🛠️ **User Management Interface**

### **Features**
- **User List**: View all users with their roles and join dates
- **Role Management**: Change user roles (Admin only)
- **Permission Viewer**: See exactly what permissions each user has
- **Search & Filter**: Find users by name, email, or role
- **User Statistics**: Overview of user distribution by role

### **Role Assignment**
1. Navigate to **User Management** (Admin only)
2. Click **Edit Role** next to the user you want to modify
3. Select the new role from the dropdown
4. Confirm the change

### **Permission Viewing**
1. Click **View Permissions** next to any user
2. See a detailed breakdown of what that user can access
3. Permissions are organized by category for easy understanding

## 🔒 **Security Features**

### **Database Protection**
- **Row Level Security**: Users can only access data they're authorized to see
- **Role-based Policies**: Different access levels for different roles
- **Audit Trail**: Track when roles are changed and by whom

### **Frontend Protection**
- **Route Guards**: Prevent unauthorized access to pages
- **Component Guards**: Hide UI elements based on permissions
- **API Protection**: Secure API calls with user tokens

### **Self-Protection**
- Users cannot delete their own accounts
- Role changes are logged and auditable
- Admins cannot accidentally lock themselves out

## 📚 **Developer Guide**

### **Adding New Permissions**
1. **Define Permission**: Add to `src/utils/permissions.js`
```javascript
export const PERMISSIONS = {
  // ... existing permissions
  newFeature: {
    view: 'newFeature:view',
    create: 'newFeature:create',
    edit: 'newFeature:edit'
  }
};
```

2. **Assign to Roles**: Update role definitions
```javascript
export const ROLES = {
  admin: {
    permissions: [
      // ... existing permissions
      ...Object.values(PERMISSIONS.newFeature)
    ]
  }
};
```

3. **Protect Components**: Use permission guards
```jsx
<ProtectedComponent permission={PERMISSIONS.newFeature.view}>
  <NewFeatureComponent />
</ProtectedComponent>
```

### **Custom Permission Checks**
```jsx
// Multiple permissions (require ALL)
<ProtectedComponent 
  permissions={[PERMISSIONS.products.edit, PERMISSIONS.inventory.adjust]}
  requireAll={true}
>
  <AdvancedProductEditor />
</ProtectedComponent>

// Multiple permissions (require ANY)
<ProtectedComponent 
  permissions={[PERMISSIONS.reports.view, PERMISSIONS.dashboard.analytics]}
  requireAll={false}
>
  <AnalyticsWidget />
</ProtectedComponent>
```

## 🔧 **Setup Instructions**

### **1. Database Setup**
Run the user roles schema:
```sql
-- Execute the schema-user-roles.sql file in your Supabase dashboard
```

### **2. Promote First Admin**
```sql
-- Run this once to promote the first user to admin
SELECT promote_first_user_to_admin();
```

### **3. Test the System**
1. Create a few test users with different roles
2. Log in as each user to verify permissions work correctly
3. Test the User Management interface as an admin

## 🎉 **Benefits**

### **For Administrators**
- **Complete Control**: Manage who can access what
- **Security**: Protect sensitive data and operations
- **Flexibility**: Easily adjust permissions as needs change

### **For Users**
- **Clean Interface**: Only see what you can use
- **No Confusion**: Clear understanding of your access level
- **Better Experience**: Streamlined workflow based on your role

### **For Developers**
- **Easy Implementation**: Simple permission checks throughout the app
- **Maintainable**: Centralized permission definitions
- **Secure by Default**: Protection at multiple layers

The role-based permission system makes VsdvBillsoft suitable for organizations of all sizes, from small teams to large enterprises with complex access requirements.
