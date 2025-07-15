-- Accounts Management Database Schema
-- This schema supports comprehensive financial management including:
-- - Chart of Accounts
-- - Daily Ledger Entries
-- - Payments Tracking
-- - Expenses Management
-- - Financial Reporting

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
    parent_account_id UUID REFERENCES public.chart_of_accounts(id),
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Accounts (Bank accounts, cash accounts, etc.)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('cash', 'bank', 'credit', 'investment')),
    account_number VARCHAR(50),
    bank_name VARCHAR(100),
    current_balance DECIMAL(12, 2) DEFAULT 0.00,
    opening_balance DECIMAL(12, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Daily Ledger Entries
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL,
    entry_time TIME DEFAULT NOW(),
    description TEXT NOT NULL,
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('income', 'expense')),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    account_id UUID REFERENCES public.accounts(id),
    category VARCHAR(50) NOT NULL,
    reference_number VARCHAR(50),
    notes TEXT,
    payment_method VARCHAR(50),
    vendor_customer VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Payments Tracking
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_date DATE NOT NULL,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('received', 'sent')),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    customer_vendor_name VARCHAR(100) NOT NULL,
    reference_number VARCHAR(50),
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled')),
    account_id UUID REFERENCES public.accounts(id),
    invoice_id UUID, -- Could reference invoices table
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Expenses Management
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(50) NOT NULL,
    vendor_name VARCHAR(100),
    reference_number VARCHAR(50),
    payment_method VARCHAR(50),
    account_id UUID REFERENCES public.accounts(id),
    receipt_url TEXT,
    is_tax_deductible BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Financial Periods (for reporting)
CREATE TABLE IF NOT EXISTS public.financial_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Budget Management
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    budgeted_amount DECIMAL(12, 2) NOT NULL,
    actual_amount DECIMAL(12, 2) DEFAULT 0.00,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ledger_entries_date ON public.ledger_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_type ON public.ledger_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_category ON public.ledger_entries(category);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_type ON public.payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON public.accounts(account_type);

-- Row Level Security Policies
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can view their own chart of accounts" ON public.chart_of_accounts
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own chart of accounts" ON public.chart_of_accounts
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own chart of accounts" ON public.chart_of_accounts
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own chart of accounts" ON public.chart_of_accounts
    FOR DELETE USING (auth.uid() = created_by);

-- Similar policies for other tables
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

-- Functions for automatic calculations
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- This function can be used to automatically update account balances
    -- when payments or ledger entries are added/updated/deleted
    
    IF TG_OP = 'INSERT' THEN
        -- Update account balance based on the transaction type
        IF NEW.entry_type = 'income' OR NEW.payment_type = 'received' THEN
            UPDATE public.accounts 
            SET current_balance = current_balance + NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.account_id;
        ELSIF NEW.entry_type = 'expense' OR NEW.payment_type = 'sent' THEN
            UPDATE public.accounts 
            SET current_balance = current_balance - NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.account_id;
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
        IF OLD.entry_type = 'income' OR OLD.payment_type = 'received' THEN
            UPDATE public.accounts 
            SET current_balance = current_balance - OLD.amount,
                updated_at = NOW()
            WHERE id = OLD.account_id;
        ELSIF OLD.entry_type = 'expense' OR OLD.payment_type = 'sent' THEN
            UPDATE public.accounts 
            SET current_balance = current_balance + OLD.amount,
                updated_at = NOW()
            WHERE id = OLD.account_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update account balances
CREATE TRIGGER trigger_update_account_balance_ledger
    AFTER INSERT OR UPDATE OR DELETE ON public.ledger_entries
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

CREATE TRIGGER trigger_update_account_balance_payments
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Note: No default data inserted - users will create their own accounts and chart of accounts

-- Create a view for account balances summary
CREATE OR REPLACE VIEW account_balances_summary AS
SELECT 
    a.id,
    a.account_name,
    a.account_type,
    a.current_balance,
    a.currency,
    COALESCE(income_total.total, 0) as total_income,
    COALESCE(expense_total.total, 0) as total_expenses,
    COALESCE(payments_received.total, 0) as total_received,
    COALESCE(payments_sent.total, 0) as total_sent,
    a.updated_at
FROM public.accounts a
LEFT JOIN (
    SELECT account_id, SUM(amount) as total 
    FROM public.ledger_entries 
    WHERE entry_type = 'income' 
    GROUP BY account_id
) income_total ON a.id = income_total.account_id
LEFT JOIN (
    SELECT account_id, SUM(amount) as total 
    FROM public.ledger_entries 
    WHERE entry_type = 'expense' 
    GROUP BY account_id
) expense_total ON a.id = expense_total.account_id
LEFT JOIN (
    SELECT account_id, SUM(amount) as total 
    FROM public.payments 
    WHERE payment_type = 'received' AND payment_status = 'completed' 
    GROUP BY account_id
) payments_received ON a.id = payments_received.account_id
LEFT JOIN (
    SELECT account_id, SUM(amount) as total 
    FROM public.payments 
    WHERE payment_type = 'sent' AND payment_status = 'completed' 
    GROUP BY account_id
) payments_sent ON a.id = payments_sent.account_id
WHERE a.is_active = true;

-- Create a view for daily ledger summary
CREATE OR REPLACE VIEW daily_ledger_summary AS
SELECT 
    entry_date,
    SUM(CASE WHEN entry_type = 'income' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN entry_type = 'expense' THEN amount ELSE 0 END) as total_expenses,
    SUM(CASE WHEN entry_type = 'income' THEN amount ELSE -amount END) as net_amount,
    COUNT(*) as transaction_count,
    COUNT(DISTINCT category) as unique_categories
FROM public.ledger_entries
GROUP BY entry_date
ORDER BY entry_date DESC;

-- Create a view for expense analysis
CREATE OR REPLACE VIEW expense_analysis AS
SELECT 
    category,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount,
    MIN(amount) as min_amount,
    MAX(amount) as max_amount,
    DATE_TRUNC('month', expense_date) as month
FROM public.expenses
GROUP BY category, DATE_TRUNC('month', expense_date)
ORDER BY month DESC, total_amount DESC;
