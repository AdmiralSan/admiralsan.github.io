-- Add amount_paid column to invoices table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'amount_paid'
    ) THEN
        ALTER TABLE invoices ADD COLUMN amount_paid DECIMAL(10, 2) DEFAULT 0.00;
    END IF;
END $$;

-- Update existing invoices - set amount_paid equal to total_amount for paid invoices
UPDATE invoices
SET amount_paid = total_amount
WHERE payment_status = 'paid' AND (amount_paid IS NULL OR amount_paid = 0);

-- Ensure partial status has proper amount_paid values
UPDATE invoices
SET amount_paid = COALESCE(amount_paid, 0)
WHERE payment_status = 'partial';

-- Add index on payment_status for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);

-- Add index on customer_id for better performance on lookups
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
