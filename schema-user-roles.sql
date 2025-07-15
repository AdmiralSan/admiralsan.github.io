    -- Add role column to users table for permission management

    -- Add role column if it doesn't exist
    DO $$ 
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'role'
        ) THEN
            ALTER TABLE public.users 
            ADD COLUMN role text DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff', 'viewer'));
        END IF;
    END $$;

    -- Create an index on role for better query performance
    CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

    -- Update existing users to have default role if null
    UPDATE public.users SET role = 'staff' WHERE role IS NULL;

    -- Create a function to check if user has permission
    CREATE OR REPLACE FUNCTION user_has_permission(user_id uuid, required_permission text)
    RETURNS boolean AS $$
    DECLARE
        user_role text;
        role_permissions text[];
    BEGIN
        -- Get user role
        SELECT role INTO user_role FROM public.users WHERE id = user_id;
        
        -- Define permissions for each role
        CASE user_role
            WHEN 'admin' THEN
                role_permissions := ARRAY[
                    'dashboard:view', 'dashboard:analytics',
                    'products:view', 'products:create', 'products:edit', 'products:delete', 'products:export',
                    'inventory:view', 'inventory:edit', 'inventory:transfer', 'inventory:adjust', 'inventory:reports',
                    'warehouses:view', 'warehouses:create', 'warehouses:edit', 'warehouses:delete', 'warehouses:manage',
                    'suppliers:view', 'suppliers:create', 'suppliers:edit', 'suppliers:delete',
                    'users:view', 'users:create', 'users:edit', 'users:delete', 'users:roles',
                    'settings:view', 'settings:edit', 'settings:system',
                    'reports:view', 'reports:generate', 'reports:export',
                    'billing:view', 'billing:create', 'billing:edit', 'billing:process'
                ];
            WHEN 'manager' THEN
                role_permissions := ARRAY[
                    'dashboard:view', 'dashboard:analytics',
                    'products:view', 'products:create', 'products:edit', 'products:export',
                    'inventory:view', 'inventory:edit', 'inventory:transfer', 'inventory:adjust', 'inventory:reports',
                    'warehouses:view', 'warehouses:edit', 'warehouses:manage',
                    'suppliers:view', 'suppliers:create', 'suppliers:edit',
                    'users:view',
                    'settings:view',
                    'reports:view', 'reports:generate', 'reports:export',
                    'billing:view', 'billing:create', 'billing:edit'
                ];
            WHEN 'staff' THEN
                role_permissions := ARRAY[
                    'dashboard:view',
                    'products:view', 'products:create', 'products:edit',
                    'inventory:view', 'inventory:edit',
                    'warehouses:view',
                    'suppliers:view',
                    'settings:view',
                    'reports:view',
                    'billing:view'
                ];
            WHEN 'viewer' THEN
                role_permissions := ARRAY[
                    'dashboard:view',
                    'products:view',
                    'inventory:view',
                    'warehouses:view',
                    'suppliers:view',
                    'reports:view',
                    'billing:view'
                ];
            ELSE
                role_permissions := ARRAY[]::text[];
        END CASE;
        
        -- Check if required permission is in role permissions
        RETURN required_permission = ANY(role_permissions);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create RLS policies based on roles

    -- Users table policies
    DROP POLICY IF EXISTS "Users can view their own user data" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own user data" ON public.users;
    DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
    DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

    -- New policies with role-based access
    CREATE POLICY "Users can view their own data" ON public.users
        FOR SELECT USING (auth.uid() = id);

    CREATE POLICY "Users can update their own data" ON public.users
        FOR UPDATE USING (auth.uid() = id);

    CREATE POLICY "Admin and managers can view all users" ON public.users
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() 
                AND role IN ('admin', 'manager')
            )
        );

    CREATE POLICY "Admins can update user roles" ON public.users
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() 
                AND role = 'admin'
            )
        );

    CREATE POLICY "Admins can delete users" ON public.users
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() 
                AND role = 'admin'
            )
            AND id != auth.uid() -- Can't delete own account
        );

    -- Function to promote first user to admin (run once)
    CREATE OR REPLACE FUNCTION promote_first_user_to_admin()
    RETURNS void AS $$
    BEGIN
        -- Promote the first user (by creation date) to admin if no admin exists
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'admin') THEN
            UPDATE public.users 
            SET role = 'admin' 
            WHERE id = (
                SELECT id FROM public.users 
                ORDER BY created_at ASC 
                LIMIT 1
            );
        END IF;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
