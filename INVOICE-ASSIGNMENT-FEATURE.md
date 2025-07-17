# Invoice Assignment Feature

This feature allows admins to assign pending invoices to specific employees for collection and provides employees with a view of only their assigned invoices.

## Implementation Overview

1. **Database Schema Update**: Run the `schema-invoice-assignments.sql` file to add necessary columns to the invoices table and create required functions.

2. **New Pages and Components**:
   - Added a new route `/accounts/assigned-pending` in App.jsx
   - Created AssignedPendingPayments.jsx component for the assigned invoices page
   - Added AssignmentModal.jsx for assigning invoices to employees

3. **Features**:
   - Admins can assign pending invoices to employees
   - Employees can only see their assigned invoices
   - Collection status tracking (not started, in progress, collected, failed)
   - Detailed notes and history for each assignment
   - Admins can reassign or unassign invoices

## How to Use

### For Admins:
1. Navigate to `/accounts/pending` to see all pending invoices
2. Click the "Assign" button on any invoice to assign it to an employee
3. Navigate to `/accounts/assigned-pending` to monitor assigned invoices
4. Reassign invoices as needed

### For Employees:
1. Navigate to `/accounts/assigned-pending` to see only your assigned invoices
2. Update status as you work on collection (In Progress, Collected, Failed)
3. View detailed invoice information to assist with collection

## Technical Details

The implementation relies on the following database enhancements:
- `assigned_user_id` column in the invoices table
- `collection_status` field to track progress
- `assignment_date` and `assignment_notes` for record-keeping
- Row-level security policies to ensure employees only see their assigned invoices

## Schema Update File Content

```sql
-- schema-invoice-assignments.sql
-- Add user assignment functionality to invoices

-- First, add assigned_user_id column to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES public.users(id),
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
  p_user_id uuid,
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

-- Create RLS policies for assigned invoices
CREATE POLICY "Users can view invoices assigned to them" ON public.invoices
  FOR SELECT
  USING (
    auth.uid() = assigned_user_id OR
    auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
  );
```
