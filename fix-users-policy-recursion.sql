-- Fix infinite recursion in users table policies
-- The issue is policies on users table trying to query users table for role checks

-- First, drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view their own user data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own user data" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Admin and managers can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Create a function to get user role from JWT or auth metadata
-- This avoids querying the users table from within users table policies
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text AS $$
DECLARE
    user_role text;
BEGIN
    -- First try to get role from JWT claims
    user_role := auth.jwt() ->> 'user_role';
    
    -- If not in JWT, get from user metadata
    IF user_role IS NULL THEN
        user_role := auth.jwt() -> 'user_metadata' ->> 'role';
    END IF;
    
    -- Default to 'staff' if no role found
    IF user_role IS NULL THEN
        user_role := 'staff';
    END IF;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simplified policies that don't cause recursion
-- Policy 1: Users can always view their own data
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own basic data (not role)
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (
        auth.uid() = id 
        AND (
            -- Allow update of non-role fields
            OLD.role IS NOT DISTINCT FROM NEW.role
        )
    );

-- Policy 3: Allow viewing all users for admin/manager (using JWT role)
CREATE POLICY "Admin managers view all users" ON public.users
    FOR SELECT USING (
        get_current_user_role() IN ('admin', 'manager')
    );

-- Policy 4: Only admins can update user roles
CREATE POLICY "Admin can update user roles" ON public.users
    FOR UPDATE USING (
        get_current_user_role() = 'admin'
    );

-- Policy 5: Only admins can delete users (except themselves)
CREATE POLICY "Admin can delete users" ON public.users
    FOR DELETE USING (
        get_current_user_role() = 'admin'
        AND id != auth.uid()
    );

-- Policy 6: Allow insert for new user registration
CREATE POLICY "Allow user registration" ON public.users
    FOR INSERT WITH CHECK (
        auth.uid() = id
    );

-- Create a function to update JWT with user role
CREATE OR REPLACE FUNCTION update_user_jwt_role()
RETURNS trigger AS $$
BEGIN
    -- This would typically be handled by a webhook or external process
    -- For now, we'll rely on the application to manage JWT claims
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update JWT when role changes
DROP TRIGGER IF EXISTS update_jwt_on_role_change ON public.users;
CREATE TRIGGER update_jwt_on_role_change
    AFTER UPDATE OF role ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_jwt_role();

-- Alternative approach: Create a view for user management that bypasses RLS
CREATE OR REPLACE VIEW user_management_view AS
SELECT 
    id,
    email,
    full_name,
    avatar_url,
    role,
    created_at,
    updated_at,
    last_login
FROM public.users;

-- Grant permissions on the view
GRANT SELECT ON user_management_view TO authenticated;

-- Create a function for secure user role updates
CREATE OR REPLACE FUNCTION update_user_role(target_user_id uuid, new_role text)
RETURNS void AS $$
DECLARE
    current_user_role text;
BEGIN
    -- Get current user's role
    SELECT role INTO current_user_role 
    FROM public.users 
    WHERE id = auth.uid();
    
    -- Only admins can update roles
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can update user roles';
    END IF;
    
    -- Prevent admins from demoting themselves
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot modify your own role';
    END IF;
    
    -- Validate the new role
    IF new_role NOT IN ('admin', 'manager', 'staff', 'viewer') THEN
        RAISE EXCEPTION 'Invalid role specified';
    END IF;
    
    -- Update the role
    UPDATE public.users 
    SET role = new_role::text, updated_at = now()
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
