-- schema-invoice-assignments.sql
-- Add user assignment functionality to invoices

-- First, add assigned_user_id column to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS assigned_user_id text REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS assignment_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS assignment_notes text,
ADD COLUMN IF NOT EXISTS collection_status text DEFAULT 'not_started' CHECK (collection_status IN ('not_started', 'in_progress', 'collected', 'failed'));

-- Create an index on the assigned_user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_invoices_assigned_user_id ON public.invoices(assigned_user_id);

-- Create a view for assigned invoices to make queries easier
CREATE OR REPLACE VIEW public.assigned_invoices AS
SELECT 
  i.*,
  c.name as customer_name,
  c.phone as customer_phone,
  c.email as customer_email,
  u.full_name as assigned_to_name,
  u.email as assigned_to_email
FROM 
  public.invoices i
LEFT JOIN 
  public.customers c ON i.customer_id = c.id
LEFT JOIN 
  public.users u ON i.assigned_user_id = u.id
WHERE 
  i.assigned_user_id IS NOT NULL;

-- Create a function to assign invoices to users
CREATE OR REPLACE FUNCTION public.assign_invoice(
  p_invoice_id uuid,
  p_user_id text,
  p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.invoices
  SET 
    assigned_user_id = p_user_id,
    assignment_date = NOW(),
    assignment_notes = p_notes,
    collection_status = 'not_started',
    updated_at = NOW()
  WHERE id = p_invoice_id;
  
  RETURN FOUND;
END;
$$;

-- Create a function to update invoice collection status
CREATE OR REPLACE FUNCTION public.update_collection_status(
  p_invoice_id uuid,
  p_status text,
  p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate the status
  IF p_status NOT IN ('not_started', 'in_progress', 'collected', 'failed') THEN
    RAISE EXCEPTION 'Invalid collection status: %', p_status;
  END IF;

  UPDATE public.invoices
  SET 
    collection_status = p_status,
    assignment_notes = CASE 
      WHEN p_notes IS NOT NULL THEN 
        COALESCE(assignment_notes, '') || E'\n' || NOW()::text || ': ' || p_notes
      ELSE 
        assignment_notes
      END,
    updated_at = NOW()
  WHERE id = p_invoice_id;
  
  RETURN FOUND;
END;
$$;

-- Add is_admin column to users table if it doesn't exist
DO $$
BEGIN
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'is_admin'
  ) THEN
    -- Add the column
    ALTER TABLE public.users
    ADD COLUMN is_admin boolean DEFAULT false;
    
    -- Set initial admin users (optional - customize as needed)
    -- Example: UPDATE public.users SET is_admin = true WHERE email LIKE '%@yourcompany.com';
  END IF;
END $$;

-- Create RLS policies for assigned invoices
-- First, make sure the policy doesn't already exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can view invoices assigned to them' 
    AND polrelid = 'public.invoices'::regclass
  ) THEN
    DROP POLICY "Users can view invoices assigned to them" ON public.invoices;
  END IF;
END $$;

-- Safely create policy that checks if is_admin column exists
DO $$
BEGIN
  -- Check if is_admin column exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'is_admin'
  ) THEN
    -- Create policy with is_admin check
    EXECUTE format('
      CREATE POLICY "Users can view invoices assigned to them" ON public.invoices
        FOR SELECT
        USING (
          auth.uid()::text = assigned_user_id OR
          auth.uid()::text IN (SELECT id FROM public.users WHERE is_admin = true)
        )
    ');
  ELSE
    -- Create a simpler policy if is_admin doesn't exist
    EXECUTE format('
      CREATE POLICY "Users can view invoices assigned to them" ON public.invoices
        FOR SELECT
        USING (
          auth.uid()::text = assigned_user_id
        )
    ');
  END IF;
END $$;
