-- Schema update to add missing columns for partial payments
-- This script adds the payment_date and amount_paid columns to the invoices table

-- Add payment_date column to track when payment was made
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_date timestamp with time zone;

-- Add amount_paid column to track partial payments
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS amount_paid decimal(12,2) default 0;

-- Add comment to explain the columns
COMMENT ON COLUMN public.invoices.payment_date IS 'Date when payment was made (for paid/partial invoices)';
COMMENT ON COLUMN public.invoices.amount_paid IS 'Amount paid so far (for partial payments tracking)';

-- Update existing invoices to set amount_paid based on payment_status
UPDATE public.invoices 
SET amount_paid = CASE 
    WHEN payment_status = 'paid' THEN total_amount
    WHEN payment_status = 'partial' THEN 0  -- Will be updated when actual partial payments are recorded
    ELSE 0
END
WHERE amount_paid IS NULL OR amount_paid = 0;

-- Add index for better performance on payment queries
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON public.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_date ON public.invoices(payment_date);
CREATE INDEX IF NOT EXISTS idx_invoices_amount_paid ON public.invoices(amount_paid);
