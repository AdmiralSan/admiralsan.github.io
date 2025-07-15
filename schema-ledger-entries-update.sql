-- Schema update to add missing columns for better invoice tracking
-- This will help track relationships between invoices, ledger entries, and payments

-- Add invoice_id column to ledger_entries for better tracking
ALTER TABLE public.ledger_entries 
ADD COLUMN IF NOT EXISTS invoice_id UUID;

-- Add customer_id column to payments for better customer tracking
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS customer_id UUID;

-- Add comments to explain the columns
COMMENT ON COLUMN public.ledger_entries.invoice_id IS 'Reference to the invoice that generated this ledger entry';
COMMENT ON COLUMN public.payments.customer_id IS 'Reference to the customer who made this payment';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ledger_entries_invoice_id ON public.ledger_entries(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);

-- Add foreign key constraints (optional - depends on whether you want strict referential integrity)
-- Uncomment the lines below if you want to enforce referential integrity
-- ALTER TABLE public.ledger_entries ADD CONSTRAINT fk_ledger_entries_invoice_id FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);
-- ALTER TABLE public.payments ADD CONSTRAINT fk_payments_invoice_id FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);
-- ALTER TABLE public.payments ADD CONSTRAINT fk_payments_customer_id FOREIGN KEY (customer_id) REFERENCES public.customers(id);

-- Update the schema constraint to allow more entry types
ALTER TABLE public.ledger_entries 
DROP CONSTRAINT IF EXISTS ledger_entries_entry_type_check;

ALTER TABLE public.ledger_entries 
ADD CONSTRAINT ledger_entries_entry_type_check 
CHECK (entry_type IN ('income', 'expense', 'pending_income', 'adjustment'));

-- Create a view for invoice-related ledger entries
CREATE OR REPLACE VIEW public.invoice_ledger_entries AS
SELECT 
    le.*,
    i.invoice_number,
    i.customer_id,
    c.name as customer_name
FROM public.ledger_entries le
LEFT JOIN public.invoices i ON le.invoice_id = i.id
LEFT JOIN public.customers c ON i.customer_id = c.id
WHERE le.invoice_id IS NOT NULL;

-- Create a view for customer payments with invoice information
CREATE OR REPLACE VIEW public.customer_payments AS
SELECT 
    p.*,
    i.invoice_number,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email
FROM public.payments p
LEFT JOIN public.invoices i ON p.invoice_id = i.id
LEFT JOIN public.customers c ON p.customer_id = c.id;

-- Grant permissions for the views
GRANT SELECT ON public.invoice_ledger_entries TO authenticated;
GRANT SELECT ON public.customer_payments TO authenticated;
