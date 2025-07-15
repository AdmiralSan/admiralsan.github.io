-- CLEANUP script for Clerk user ID fix
-- Run this if you need to reset and try the migration again

-- Drop all the new policies we created
DROP POLICY IF EXISTS "Allow authenticated users to manage chart of accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Allow authenticated users to manage accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow authenticated users to manage ledger entries" ON public.ledger_entries;
DROP POLICY IF EXISTS "Allow authenticated users to manage payments" ON public.payments;
DROP POLICY IF EXISTS "Allow authenticated users to manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow authenticated users to manage financial periods" ON public.financial_periods;
DROP POLICY IF EXISTS "Allow authenticated users to manage budgets" ON public.budgets;

-- Drop foreign key constraints
ALTER TABLE IF EXISTS public.accounts DROP CONSTRAINT IF EXISTS accounts_created_by_fkey;
ALTER TABLE IF EXISTS public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_created_by_fkey;
ALTER TABLE IF EXISTS public.payments DROP CONSTRAINT IF EXISTS payments_created_by_fkey;
ALTER TABLE IF EXISTS public.expenses DROP CONSTRAINT IF EXISTS expenses_created_by_fkey;
ALTER TABLE IF EXISTS public.financial_periods DROP CONSTRAINT IF EXISTS financial_periods_created_by_fkey;
ALTER TABLE IF EXISTS public.budgets DROP CONSTRAINT IF EXISTS budgets_created_by_fkey;
ALTER TABLE IF EXISTS public.chart_of_accounts DROP CONSTRAINT IF EXISTS chart_of_accounts_created_by_fkey;

-- Drop the new users table
DROP TABLE IF EXISTS public.users;

-- Restore the backup users table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_backup_before_clerk_migration' AND table_schema = 'public') THEN
        ALTER TABLE public.users_backup_before_clerk_migration RENAME TO users;
    END IF;
END $$;

-- Restore original column types (back to UUID)
-- Note: This assumes your original schema used UUID
ALTER TABLE IF EXISTS public.chart_of_accounts 
    ALTER COLUMN created_by TYPE UUID USING created_by::UUID;

ALTER TABLE IF EXISTS public.accounts 
    ALTER COLUMN created_by TYPE UUID USING created_by::UUID;

ALTER TABLE IF EXISTS public.ledger_entries 
    ALTER COLUMN created_by TYPE UUID USING created_by::UUID;

ALTER TABLE IF EXISTS public.payments 
    ALTER COLUMN created_by TYPE UUID USING created_by::UUID;

ALTER TABLE IF EXISTS public.expenses 
    ALTER COLUMN created_by TYPE UUID USING created_by::UUID;

ALTER TABLE IF EXISTS public.financial_periods 
    ALTER COLUMN created_by TYPE UUID USING created_by::UUID;

ALTER TABLE IF EXISTS public.budgets 
    ALTER COLUMN created_by TYPE UUID USING created_by::UUID;

-- Restore foreign key constraints
ALTER TABLE IF EXISTS public.chart_of_accounts 
    ADD CONSTRAINT chart_of_accounts_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE IF EXISTS public.accounts 
    ADD CONSTRAINT accounts_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE IF EXISTS public.ledger_entries 
    ADD CONSTRAINT ledger_entries_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE IF EXISTS public.payments 
    ADD CONSTRAINT payments_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE IF EXISTS public.expenses 
    ADD CONSTRAINT expenses_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE IF EXISTS public.financial_periods 
    ADD CONSTRAINT financial_periods_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE IF EXISTS public.budgets 
    ADD CONSTRAINT budgets_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id);

-- Restore original RLS policies
-- Note: You may need to adjust these based on your original schema
CREATE POLICY "Users can view their own chart of accounts" ON public.chart_of_accounts
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own chart of accounts" ON public.chart_of_accounts
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own chart of accounts" ON public.chart_of_accounts
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own chart of accounts" ON public.chart_of_accounts
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view their own accounts" ON public.accounts
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own accounts" ON public.accounts
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own accounts" ON public.accounts
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own accounts" ON public.accounts
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view their own ledger entries" ON public.ledger_entries
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own ledger entries" ON public.ledger_entries
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own ledger entries" ON public.ledger_entries
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own ledger entries" ON public.ledger_entries
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own payments" ON public.payments
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own payments" ON public.payments
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view their own expenses" ON public.expenses
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own expenses" ON public.expenses
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own expenses" ON public.expenses
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own expenses" ON public.expenses
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view their own financial periods" ON public.financial_periods
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own financial periods" ON public.financial_periods
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own financial periods" ON public.financial_periods
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own financial periods" ON public.financial_periods
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view their own budgets" ON public.budgets
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own budgets" ON public.budgets
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own budgets" ON public.budgets
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own budgets" ON public.budgets
    FOR DELETE USING (auth.uid() = created_by);

-- Drop the clerk upsert function
DROP FUNCTION IF EXISTS public.upsert_clerk_user(TEXT, TEXT, TEXT, TEXT);

SELECT 'Cleanup completed. Schema restored to original state.' as cleanup_status;
