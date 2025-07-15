# Clerk User Management Setup Guide

This guide will help you set up comprehensive user management for your application using Clerk authentication.

## Features Implemented

✅ **User Invitation System** - Invite users via email  
✅ **Role Management** - Assign and update user roles  
✅ **User Profile Management** - Edit user information  
✅ **Organization-based Access** - Multi-tenant support  
✅ **Permission-based UI** - Role-based access control  
✅ **Pending Invitations** - Track and manage invites  
✅ **User Removal** - Remove users or revoke invitations  

## Prerequisites

1. **Clerk Account & Setup**
   - Sign up at [clerk.com](https://clerk.com)
   - Create a new application
   - Get your publishable key and secret key

2. **Organization Feature**
   - Enable Organizations in your Clerk dashboard
   - Go to Configure → Organizations and enable it

## Installation Steps

### 1. Install Required Dependencies

```bash
npm install @clerk/clerk-react @clerk/clerk-sdk-node
```

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# Clerk Keys
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase (if using)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Clerk Configuration

Update your main App component to wrap with Clerk providers:

```jsx
import { ClerkProvider } from '@clerk/clerk-react';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      {/* Your app components */}
    </ClerkProvider>
  );
}
```

### 4. Replace UserManagement Component

Replace your existing `src/pages/UserManagement.jsx` with:

```jsx
import React from 'react';
import ClerkUserManagementSimple from '../components/ClerkUserManagementSimple';

const UserManagement = () => {
  return <ClerkUserManagementSimple />;
};

export default UserManagement;
```

### 5. Set Up Organization Structure

#### Option A: Automatic Organization Creation
Add this to your app's initialization:

```jsx
import { useUser, useOrganization } from '@clerk/clerk-react';

function AppInitializer() {
  const { user } = useUser();
  const { organization, createOrganization } = useOrganization();

  useEffect(() => {
    if (user && !organization) {
      // Create default organization for new users
      createOrganization({ name: `${user.firstName}'s Organization` });
    }
  }, [user, organization]);

  return null;
}
```

#### Option B: Manual Organization Setup
Users can create/join organizations through Clerk's built-in components:

```jsx
import { OrganizationSwitcher, CreateOrganization } from '@clerk/clerk-react';

function Header() {
  return (
    <div>
      <OrganizationSwitcher />
      {/* Or use CreateOrganization component */}
    </div>
  );
}
```

## Usage Guide

### For Administrators

1. **Invite Users**
   - Click "Invite User" button
   - Enter email address and select role
   - User receives invitation email

2. **Manage Roles**
   - Click "Edit" on any user
   - Change organization role (basic_member/admin)
   - Update application-specific roles in Supabase

3. **Remove Users**
   - Click "Remove" to remove active users
   - Click "Revoke" to cancel pending invitations

### For End Users

1. **Accept Invitation**
   - Click link in invitation email
   - Complete Clerk sign-up process
   - Automatically join organization

2. **Profile Management**
   - Users can update their own profiles
   - Change profile pictures, names, etc.

## API Endpoints (Optional)

If you need custom backend functionality, create these API routes:

### `/api/clerk/users` - GET
Fetch all organization users

### `/api/clerk/users` - POST  
Create new user (alternative to invitations)

### `/api/clerk/users/[id]` - PATCH
Update user information

### `/api/clerk/users/[id]` - DELETE
Delete user

### `/api/clerk/users/[id]/reset-password` - POST
Send password reset email

## Database Synchronization

The component automatically syncs user data between Clerk and Supabase:

```sql
-- Ensure your users table has these columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'staff';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login timestamptz;
```

## Permission System Integration

The component integrates with your existing permission system. Make sure your `PermissionsContext` provides:

- `hasPermission(permission)` - Check if user has permission
- `updateUserRole(userId, role)` - Update user role
- User permissions like:
  - `PERMISSIONS.users.view`
  - `PERMISSIONS.users.create` 
  - `PERMISSIONS.users.edit`
  - `PERMISSIONS.users.delete`
  - `PERMISSIONS.users.roles`

## Troubleshooting

### Common Issues

1. **"No organization found" error**
   - Ensure Organizations are enabled in Clerk dashboard
   - User must be part of an organization
   - Add OrganizationSwitcher component

2. **Permission errors**
   - Check your permissions system
   - Verify user roles are properly set
   - Review PermissionsContext implementation

3. **Invitation emails not sending**
   - Check Clerk email configuration
   - Verify domain settings
   - Review spam folders

### Debug Mode

Add this to see detailed organization/user data:

```jsx
import { useOrganization, useUser } from '@clerk/clerk-react';

function Debug() {
  const { organization, memberships, invitations } = useOrganization({
    invitations: { infinite: true },
    memberships: { infinite: true }
  });
  const { user } = useUser();

  console.log('Current user:', user);
  console.log('Organization:', organization);
  console.log('Memberships:', memberships);
  console.log('Invitations:', invitations);

  return null;
}
```

## Security Considerations

1. **Role Validation**
   - Always validate roles on backend
   - Use Clerk webhooks for real-time updates
   - Implement proper authorization checks

2. **Organization Isolation**
   - Ensure users can only see their organization's data
   - Implement proper RLS policies in Supabase
   - Validate organization membership

3. **Permission Checks**
   - Double-check permissions on sensitive operations
   - Use both frontend and backend validation
   - Log administrative actions

## Advanced Features

### Webhooks Integration
Set up Clerk webhooks to sync data in real-time:

```javascript
// api/webhooks/clerk.js
export async function POST(request) {
  const { type, data } = await request.json();
  
  switch (type) {
    case 'user.created':
      // Sync user to Supabase
      break;
    case 'organizationMembership.created':
      // Handle user joining organization
      break;
    // Handle other webhook events
  }
}
```

### Bulk Operations
Add bulk invite/remove functionality:

```jsx
const handleBulkInvite = async (emails) => {
  for (const email of emails) {
    await organization.inviteMembers({
      emailAddresses: [email],
      role: 'basic_member'
    });
  }
};
```

### Advanced Role Management
Implement custom role hierarchies and permissions:

```jsx
const CUSTOM_ROLES = {
  'super_admin': { level: 100, inherits: ['admin'] },
  'admin': { level: 90, inherits: ['manager'] },
  'manager': { level: 50, inherits: ['staff'] },
  'staff': { level: 10, inherits: ['viewer'] },
  'viewer': { level: 1, inherits: [] }
};
```

## Support

For issues:
1. Check Clerk documentation: [clerk.com/docs](https://clerk.com/docs)
2. Review browser console for errors
3. Check network requests in DevTools
4. Verify environment variables

## Migration from Existing Systems

If migrating from another auth system:

1. Export existing user data
2. Create Clerk users via API
3. Set up organizations and memberships
4. Update frontend components
5. Test thoroughly before switching over
