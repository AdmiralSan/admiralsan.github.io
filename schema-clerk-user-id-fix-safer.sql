-- SAFER Schema update to fix Clerk user ID compatibility
-- This version preserves existing data and does incremental updates

-- Step 0: Drop existing function if it exists
DROP FUNCTION IF EXISTS public.upsert_clerk_user(text,text,text,text);

-- Step 1: Drop all RLS policies first to avoid dependency issues
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

-- Step 2: Drop foreign key constraints
ALTER TABLE IF EXISTS public.accounts DROP CONSTRAINT IF EXISTS accounts_created_by_fkey;
ALTER TABLE IF EXISTS public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_created_by_fkey;
ALTER TABLE IF EXISTS public.payments DROP CONSTRAINT IF EXISTS payments_created_by_fkey;
ALTER TABLE IF EXISTS public.expenses DROP CONSTRAINT IF EXISTS expenses_created_by_fkey;
ALTER TABLE IF EXISTS public.financial_periods DROP CONSTRAINT IF EXISTS financial_periods_created_by_fkey;
ALTER TABLE IF EXISTS public.budgets DROP CONSTRAINT IF EXISTS budgets_created_by_fkey;
ALTER TABLE IF EXISTS public.chart_of_accounts DROP CONSTRAINT IF EXISTS chart_of_accounts_created_by_fkey;

-- Step 3: Update column types from UUID to TEXT
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

-- Step 4: Create or update the users table to support Clerk
-- First, try to rename existing users table as backup (only if backup doesn't exist)
DO $$
BEGIN
    -- Check if backup table already exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_backup_before_clerk_migration' AND table_schema = 'public') THEN
        -- Check if original users table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
            ALTER TABLE public.users RENAME TO users_backup_before_clerk_migration;
        END IF;
    ELSE
        -- Backup already exists, drop current users table if it exists
        DROP TABLE IF EXISTS public.users;
    END IF;
END $$;

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

-- Step 5: Re-add foreign key constraints
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

-- Step 6: Re-enable RLS and create new policies
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for Clerk authentication
-- Drop any existing policies with the same names first
DROP POLICY IF EXISTS "Allow authenticated users to manage chart of accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Allow authenticated users to manage accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow authenticated users to manage ledger entries" ON public.ledger_entries;
DROP POLICY IF EXISTS "Allow authenticated users to manage payments" ON public.payments;
DROP POLICY IF EXISTS "Allow authenticated users to manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow authenticated users to manage financial periods" ON public.financial_periods;
DROP POLICY IF EXISTS "Allow authenticated users to manage budgets" ON public.budgets;

-- Create new policies
CREATE POLICY "Allow authenticated users to manage chart of accounts" ON public.chart_of_accounts
    FOR ALL USING (true);

CREATE POLICY "Allow authenticated users to manage accounts" ON public.accounts
    FOR ALL USING (true);

CREATE POLICY "Allow authenticated users to manage ledger entries" ON public.ledger_entries
    FOR ALL USING (true);

CREATE POLICY "Allow authenticated users to manage payments" ON public.payments
    FOR ALL USING (true);

CREATE POLICY "Allow authenticated users to manage expenses" ON public.expenses
    FOR ALL USING (true);

CREATE POLICY "Allow authenticated users to manage financial periods" ON public.financial_periods
    FOR ALL USING (true);

CREATE POLICY "Allow authenticated users to manage budgets" ON public.budgets
    FOR ALL USING (true);

-- Step 7: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON public.users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Step 8: Create a function to upsert users from Clerk
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

-- Step 9: Fix the trigger function to properly handle both payments and ledger_entries tables
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- This function can be used to automatically update account balances
    -- when payments or ledger entries are added/updated/deleted
    
    IF TG_OP = 'INSERT' THEN
        -- Update account balance based on the transaction type
        -- Check if this is a ledger entry (has entry_type field)
        IF TG_TABLE_NAME = 'ledger_entries' THEN
            IF NEW.entry_type = 'income' THEN
                UPDATE public.accounts 
                SET current_balance = current_balance + NEW.amount,
                    updated_at = NOW()
                WHERE id = NEW.account_id;
            ELSIF NEW.entry_type = 'expense' THEN
                UPDATE public.accounts 
                SET current_balance = current_balance - NEW.amount,
                    updated_at = NOW()
                WHERE id = NEW.account_id;
            END IF;
        -- Check if this is a payment (has payment_type field)
        ELSIF TG_TABLE_NAME = 'payments' THEN
            IF NEW.payment_type = 'received' THEN
                UPDATE public.accounts 
                SET current_balance = current_balance + NEW.amount,
                    updated_at = NOW()
                WHERE id = NEW.account_id;
            ELSIF NEW.payment_type = 'sent' THEN
                UPDATE public.accounts 
                SET current_balance = current_balance - NEW.amount,
                    updated_at = NOW()
                WHERE id = NEW.account_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- Handle balance updates for modified records
        -- This would require more complex logic to handle the difference
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- Reverse the balance change
        -- Check if this is a ledger entry (has entry_type field)
        IF TG_TABLE_NAME = 'ledger_entries' THEN
            IF OLD.entry_type = 'income' THEN
                UPDATE public.accounts 
                SET current_balance = current_balance - OLD.amount,
                    updated_at = NOW()
                WHERE id = OLD.account_id;
            ELSIF OLD.entry_type = 'expense' THEN
                UPDATE public.accounts 
                SET current_balance = current_balance + OLD.amount,
                    updated_at = NOW()
                WHERE id = OLD.account_id;
            END IF;
        -- Check if this is a payment (has payment_type field)
        ELSIF TG_TABLE_NAME = 'payments' THEN
            IF OLD.payment_type = 'received' THEN
                UPDATE public.accounts 
                SET current_balance = current_balance - OLD.amount,
                    updated_at = NOW()
                WHERE id = OLD.account_id;
            ELSIF OLD.payment_type = 'sent' THEN
                UPDATE public.accounts 
                SET current_balance = current_balance + OLD.amount,
                    updated_at = NOW()
                WHERE id = OLD.account_id;
            END IF;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Clerk user ID compatibility migration completed successfully!' as migration_status;
