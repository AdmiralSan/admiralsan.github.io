# Invoice Assignment Schema Fix

This document outlines the changes made to fix errors when implementing the invoice assignment feature.

## Error Description 1: Data Type Mismatch

The original schema attempted to create a foreign key constraint with incompatible data types:

```
ERROR: 42804: foreign key constraint "invoices_assigned_user_id_fkey" cannot be implemented
DETAIL:  Key columns "assigned_user_id" and "id" are of incompatible types: uuid and text.
```

## Error Description 2: Missing Column

When running the schema after fixing the data type issue, another error occurred:

```
ERROR: 42703: column "is_admin" does not exist
ERROR: 42703: column "is_admin" does not exist
```

## Error Description 3: Invalid Column in pg_policy

After fixing the is_admin issue, another error occurred:

```
ERROR: 42703: column "tablename" does not exist
QUERY:  EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can view invoices assigned to them' 
    AND tablename = 'invoices'
  )
CONTEXT:  PL/pgSQL function inline_code_block line 3 at IF
```

## Changes Made

### Data Type Fix:

1. **Modified data type in ALTER TABLE statement**:
   - Changed `assigned_user_id` from `uuid` to `text` to match the `users.id` column

2. **Updated function parameter type**:
   - Changed the `p_user_id` parameter in the `assign_invoice` function from `uuid` to `text`

3. **Fixed Row Level Security policy**:
   - Added type casting with `auth.uid()::text` to match the text data type of `assigned_user_id`

### Missing Column Fix:

4. **Reordered the schema statements**:
   - Moved the DO block that adds the `is_admin` column to execute before the RLS policy is created

5. **Added robust policy creation**:
   - Added a check to drop any existing policy with the same name before creating it
   - Used conditional logic to create the appropriate policy based on whether the `is_admin` column exists
   - Created fallback behavior for when `is_admin` doesn't exist

### pg_policy Column Fix:

6. **Fixed PostgreSQL catalog reference**:
   - Changed `tablename = 'invoices'` to `polrelid = 'public.invoices'::regclass` in the policy existence check
   - The PostgreSQL catalog view `pg_policy` uses `polrelid` (not `tablename`) to reference the table

## Testing Instructions

1. Run the updated `schema-invoice-assignments.sql` file
2. Verify that the schema changes have been applied correctly:
   ```sql
   \d invoices  -- Check the assigned_user_id column is now text type
   SELECT * FROM pg_proc WHERE proname = 'assign_invoice';  -- Check function signature
   SELECT * FROM pg_policies WHERE polname = 'Users can view invoices assigned to them';  -- Check policy
   \d users  -- Check that is_admin column exists
   ```

3. Test the assignment functionality in the UI:
   - Assign an invoice to a user
   - Verify that assigned users can see only their assigned invoices
   - Verify that admins can see all assigned invoices

## Notes

- If there are any existing records with UUID values in the assigned_user_id column, they would need to be converted to text or removed before applying this schema change.
- The schema automatically checks for and adds the `is_admin` column to the users table if needed.
