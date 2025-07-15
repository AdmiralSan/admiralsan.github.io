-- IMMEDIATE FIX for infinite recursion in users table policies
-- Run this to stop the recursion error immediately

-- Drop ALL problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can view their own user data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own user data" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Admin and managers can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Temporarily disable RLS for admin access (re-enable after fixing)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- If you need admin access to all users, use a database function instead of policy
CREATE OR REPLACE FUNCTION admin_get_all_users()
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    avatar_url text,
    role text,
    created_at timestamptz,
    updated_at timestamptz,
    last_login timestamptz
) 
SECURITY DEFINER
AS $$
BEGIN
    -- This function bypasses RLS and can be called by the application
    -- Add your own admin authentication logic here
    RETURN QUERY
    SELECT u.id, u.email, u.full_name, u.avatar_url, u.role, 
           u.created_at, u.updated_at, u.last_login
    FROM public.users u;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users (the app should handle admin checks)
GRANT EXECUTE ON FUNCTION admin_get_all_users() TO authenticated;
