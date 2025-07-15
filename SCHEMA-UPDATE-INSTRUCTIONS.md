# Schema Update Instructions

## Problem
The error "Could not find the 'payment_date' column of 'invoices' in the schema cache" occurs because the invoices table is missing the `payment_date` and `amount_paid` columns that are needed for partial payment functionality.

## Solution
Run the schema update script to add the missing columns to your Supabase database.

## Steps to Fix

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the content from `schema-partial-payments-update.sql`
4. Click "Run" to execute the script

### Option 2: Using psql or another PostgreSQL client
1. Connect to your Supabase database
2. Run the SQL script: `psql -h your-host -U your-user -d your-database -f schema-partial-payments-update.sql`

### Option 3: Using Supabase CLI
1. Ensure you have Supabase CLI installed and configured
2. Run: `supabase db reset` (this will apply all migrations)
3. Or apply the specific migration file

## What the Script Does
- Adds `payment_date` column to track when payments were made
- Adds `amount_paid` column to track partial payment amounts
- Updates existing invoices to set proper amount_paid values
- Adds database indexes for better performance
- Adds comments to explain the new columns

## After Running the Script
1. The partial payment functionality should work without errors
2. The financial overview cards will properly calculate pending amounts
3. All existing invoices will be updated with correct amount_paid values

## Verification
After running the script, you can verify it worked by:
1. Creating a new invoice with partial payment status
2. Checking that the pending amount card shows the correct balance
3. Ensuring no database errors occur when processing payments

## Files Modified
- `schema-partial-payments-update.sql` - The database schema update script
- `src/utils/billingAccountsIntegration.js` - Removed invalid payment_date updates

The application code has been updated to work with the new schema structure.
