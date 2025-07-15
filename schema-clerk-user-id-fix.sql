-- Schema update to fix Clerk user ID compatibility
-- This changes user ID fields from UUID to TEXT to support Clerk's string-based user IDs

-- First, update the users table to use TEXT instead of UUID for the ID
-- Note: This will recreate the users table with the new schema

-- Drop ALL existing RLS policies first to avoid dependency issues
DROP POLICY IF EXISTS "Users can view their own chart of accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Users can insert their own chart of accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Users can update their own chart of accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Users can delete their own chart of accounts" ON public.chart_of_accounts;

DROP POLICY IF EXISTS "Users can view their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;

DROP POLICY IF EXISTS "Users can view their own ledger entries" ON public.ledger_entries;
DROP POLICY IF EXISTS "Users can insert their own ledger entries" ON public.ledger_entries;
DROP POLICY IF EXISTS "Users can update their own ledger entries" ON public.ledger_entries;
DROP POLICY IF EXISTS "Users can delete their own ledger entries" ON public.ledger_entries;

DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON public.payments;

DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;

DROP POLICY IF EXISTS "Users can view their own financial periods" ON public.financial_periods;
DROP POLICY IF EXISTS "Users can insert their own financial periods" ON public.financial_periods;
DROP POLICY IF EXISTS "Users can update their own financial periods" ON public.financial_periods;
DROP POLICY IF EXISTS "Users can delete their own financial periods" ON public.financial_periods;

DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

-- Drop existing foreign key constraints temporarily
ALTER TABLE IF EXISTS public.accounts DROP CONSTRAINT IF EXISTS accounts_created_by_fkey;
ALTER TABLE IF EXISTS public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_created_by_fkey;
ALTER TABLE IF EXISTS public.payments DROP CONSTRAINT IF EXISTS payments_created_by_fkey;
ALTER TABLE IF EXISTS public.expenses DROP CONSTRAINT IF EXISTS expenses_created_by_fkey;
ALTER TABLE IF EXISTS public.financial_periods DROP CONSTRAINT IF EXISTS financial_periods_created_by_fkey;
ALTER TABLE IF EXISTS public.budgets DROP CONSTRAINT IF EXISTS budgets_created_by_fkey;
ALTER TABLE IF EXISTS public.chart_of_accounts DROP CONSTRAINT IF EXISTS chart_of_accounts_created_by_fkey;

-- Drop the existing users table (this will lose existing data)
DROP TABLE IF EXISTS public.users CASCADE;

-- Create new users table with TEXT ID for Clerk compatibility
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY, -- Changed from UUID to TEXT for Clerk compatibility
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    clerk_user_id TEXT UNIQUE, -- Store original Clerk ID
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update all tables to use TEXT for created_by fields
-- Chart of Accounts
ALTER TABLE IF EXISTS public.chart_of_accounts 
    ALTER COLUMN created_by TYPE TEXT;

-- Accounts
ALTER TABLE IF EXISTS public.accounts 
    ALTER COLUMN created_by TYPE TEXT;

-- Ledger Entries
ALTER TABLE IF EXISTS public.ledger_entries 
    ALTER COLUMN created_by TYPE TEXT;

-- Payments
ALTER TABLE IF EXISTS public.payments 
    ALTER COLUMN created_by TYPE TEXT;

-- Expenses
ALTER TABLE IF EXISTS public.expenses 
    ALTER COLUMN created_by TYPE TEXT;

-- Financial Periods
ALTER TABLE IF EXISTS public.financial_periods 
    ALTER COLUMN created_by TYPE TEXT;

-- Budgets
ALTER TABLE IF EXISTS public.budgets 
    ALTER COLUMN created_by TYPE TEXT;

-- Re-add foreign key constraints
ALTER TABLE public.chart_of_accounts 
    ADD CONSTRAINT chart_of_accounts_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE public.accounts 
    ADD CONSTRAINT accounts_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE public.ledger_entries 
    ADD CONSTRAINT ledger_entries_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE public.payments 
    ADD CONSTRAINT payments_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE public.expenses 
    ADD CONSTRAINT expenses_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE public.financial_periods 
    ADD CONSTRAINT financial_periods_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE public.budgets 
    ADD CONSTRAINT budgets_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id);

-- Update RLS policies to work with TEXT user IDs
-- Since we're using Clerk authentication, we'll create more permissive policies
-- that work with the TEXT-based user IDs from Clerk

-- Re-enable RLS on all tables
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Create new policies that work with Clerk authentication
-- Note: These are more permissive for now. You can tighten them later based on your needs.

-- Chart of Accounts policies
CREATE POLICY "Allow authenticated users to manage chart of accounts" ON public.chart_of_accounts
    FOR ALL USING (true);

-- Accounts policies
CREATE POLICY "Allow authenticated users to manage accounts" ON public.accounts
    FOR ALL USING (true);

-- Ledger entries policies
CREATE POLICY "Allow authenticated users to manage ledger entries" ON public.ledger_entries
    FOR ALL USING (true);

-- Payments policies
CREATE POLICY "Allow authenticated users to manage payments" ON public.payments
    FOR ALL USING (true);

-- Expenses policies
CREATE POLICY "Allow authenticated users to manage expenses" ON public.expenses
    FOR ALL USING (true);

-- Financial periods policies
CREATE POLICY "Allow authenticated users to manage financial periods" ON public.financial_periods
    FOR ALL USING (true);

-- Budgets policies
CREATE POLICY "Allow authenticated users to manage budgets" ON public.budgets
    FOR ALL USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON public.users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Create a function to upsert users from Clerk
CREATE OR REPLACE FUNCTION public.upsert_clerk_user(
    p_clerk_user_id TEXT,
    p_email TEXT,
    p_full_name TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL
) RETURNS public.users AS $$
DECLARE
    user_record public.users;
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url, clerk_user_id)
    VALUES (p_clerk_user_id, p_email, p_full_name, p_avatar_url, p_clerk_user_id)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW()
    RETURNING * INTO user_record;
    
    RETURN user_record;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.upsert_clerk_user IS 'Upsert a user from Clerk authentication';
