-- VsdvBillsoft Database Schema Update for Role Management

-- Create a roles enum type
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff');

-- Add role column to users table
ALTER TABLE public.users
ADD COLUMN role user_role NOT NULL DEFAULT 'staff';

-- Add last_login column to users table
ALTER TABLE public.users
ADD COLUMN last_login timestamp with time zone;

-- Create role-based policies for better access control

-- Create roles management table
CREATE TABLE public.role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL,
  resource TEXT NOT NULL,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE, 
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (role, resource)
);

-- Enable Row Level Security
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can view and modify role permissions
CREATE POLICY "Admins can view role permissions" ON public.role_permissions
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can modify role permissions" ON public.role_permissions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Populate default role permissions
INSERT INTO public.role_permissions (role, resource, can_view, can_create, can_edit, can_delete) VALUES
-- Admin permissions (full access to everything)
('admin', 'products', TRUE, TRUE, TRUE, TRUE),
('admin', 'suppliers', TRUE, TRUE, TRUE, TRUE),
('admin', 'warehouses', TRUE, TRUE, TRUE, TRUE),
('admin', 'inventory', TRUE, TRUE, TRUE, TRUE),
('admin', 'users', TRUE, TRUE, TRUE, TRUE),
('admin', 'reports', TRUE, TRUE, TRUE, TRUE),
('admin', 'settings', TRUE, TRUE, TRUE, TRUE),

-- Manager permissions
('manager', 'products', TRUE, TRUE, TRUE, FALSE),
('manager', 'suppliers', TRUE, TRUE, TRUE, FALSE),
('manager', 'warehouses', TRUE, TRUE, TRUE, FALSE),
('manager', 'inventory', TRUE, TRUE, TRUE, TRUE),
('manager', 'users', TRUE, FALSE, FALSE, FALSE),
('manager', 'reports', TRUE, TRUE, FALSE, FALSE),
('manager', 'settings', TRUE, FALSE, FALSE, FALSE),

-- Staff permissions
('staff', 'products', TRUE, FALSE, FALSE, FALSE),
('staff', 'suppliers', TRUE, FALSE, FALSE, FALSE),
('staff', 'warehouses', TRUE, FALSE, FALSE, FALSE),
('staff', 'inventory', TRUE, TRUE, FALSE, FALSE),
('staff', 'users', FALSE, FALSE, FALSE, FALSE),
('staff', 'reports', TRUE, FALSE, FALSE, FALSE),
('staff', 'settings', FALSE, FALSE, FALSE, FALSE);

-- Create auth trigger to automatically set user role in the JWT
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'staff');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to include role in JWT
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role::TEXT INTO user_role FROM public.users WHERE id = user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at trigger
CREATE TRIGGER update_role_permissions_timestamp
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();