# Clerk User ID Fix - Setup Guide

This guide explains how to fix the UUID compatibility issue when using Clerk authentication with Supabase.

## Problem
The error "invalid input syntax for type uuid: 'user_2zitdm8d3wZnmCTu7a5rPfFQEto'" occurs because:
- Clerk provides string-based user IDs (e.g., `user_2zitdm8d3wZnmCTu7a5rPfFQEto`)
- The database schema expects UUID format for `created_by` fields
- This mismatch causes insertion failures

## Solution
Convert the database schema to use TEXT instead of UUID for user IDs to support Clerk's string-based IDs.

## Setup Steps

### 1. Run the Database Schema Update
Execute the SQL script to update your database schema. Choose one of the two options:

#### Option A: Safer Migration (Recommended)
```bash
# Run this in your Supabase SQL editor or via psql
# This preserves existing users table as backup
psql -h your-db-host -U your-username -d your-database -f schema-clerk-user-id-fix-safer.sql
```

#### Option B: Clean Migration
```bash
# Run this in your Supabase SQL editor or via psql
# This recreates the users table completely
psql -h your-db-host -U your-username -d your-database -f schema-clerk-user-id-fix.sql
```

⚠️ **Warning**: Option B will recreate the `users` table and lose existing user data. Option A keeps a backup. Make sure to backup any important data first.

#### If You Encounter Errors
If you get policy already exists errors or need to re-run the migration:

1. **Clean up first** (optional):
   ```bash
   psql -h your-db-host -U your-username -d your-database -f schema-clerk-user-id-cleanup.sql
   ```

2. **Then re-run the safer migration**:
   ```bash
   psql -h your-db-host -U your-username -d your-database -f schema-clerk-user-id-fix-safer.sql
   ```

### 2. Update Your App Component
Wrap your app with the `ClerkUserSync` component to automatically sync users:

```jsx
// In your main App.jsx or similar
import ClerkUserSync from './components/ClerkUserSync';

function App() {
  return (
    <ClerkProvider publishableKey={process.env.REACT_APP_CLERK_PUBLISHABLE_KEY}>
      <ClerkUserSync>
        {/* Your existing app components */}
        <YourAppContent />
      </ClerkUserSync>
    </ClerkProvider>
  );
}
```

### 3. Verify the Fix
1. Log in with Clerk authentication
2. Try to create a ledger entry, payment, or expense
3. The operation should now work without UUID errors

## What Changed

### Database Schema
- Changed `users.id` from `UUID` to `TEXT`
- Updated all `created_by` fields from `UUID` to `TEXT`
- Added `clerk_user_id` field to store original Clerk ID
- Simplified RLS policies to allow authenticated users
- Added `upsert_clerk_user` function for user management

### Code Changes
- Updated `accountsAPI.js` to use new user utilities
- Updated `billingAccountsIntegration.js` to use new user utilities
- Created `clerkUserUtils.js` for user management
- Created `ClerkUserSync.jsx` for automatic user synchronization

## Files Modified
- `schema-clerk-user-id-fix.sql` - Clean database schema update
- `schema-clerk-user-id-fix-safer.sql` - Safer database schema update (with backup)
- `schema-clerk-user-id-cleanup.sql` - Cleanup script for resetting migration
- `src/utils/clerkUserUtils.js` - New utility functions
- `src/components/ClerkUserSync.jsx` - User sync component
- `src/utils/accountsAPI.js` - Updated user handling
- `src/utils/billingAccountsIntegration.js` - Updated user handling

## Testing
After applying the fix, test these operations:
1. Create a new ledger entry
2. Create a new payment
3. Create a new expense
4. Create a new account

All operations should work without UUID-related errors.

## Rollback
If you need to rollback:

### If you used the safer migration:
1. Drop the new users table: `DROP TABLE public.users;`
2. Restore the backup: `ALTER TABLE public.users_backup_before_clerk_migration RENAME TO users;`
3. Revert the code changes in the utility files
4. Remove the `ClerkUserSync` component usage

### If you used the clean migration:
1. Restore the original `schema-accounts.sql`
2. Revert the code changes in the utility files
3. Remove the `ClerkUserSync` component usage

## Additional Notes
- The fix maintains backward compatibility with existing data patterns
- New users will be automatically created in the database when they first log in
- User data is synchronized on each login to keep information up-to-date
- The RLS policies are currently permissive but can be tightened based on your security requirements
