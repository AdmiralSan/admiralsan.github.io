-- Method 1: Promote the first user to admin (if no admin exists)
SELECT promote_first_user_to_admin();

-- Method 2: Promote a specific user by email to admin
UPDATE public.users 
SET role = 'admin', updated_at = NOW()
WHERE email = 'vsdvgrjr@gmail.com';

-- Method 3: Promote a specific user by ID to admin
UPDATE public.users 
SET role = 'admin', updated_at = NOW()
WHERE id = 'user_2zitdm8d3wZnmCTu7a5rPfFQEto';

-- Method 4: Check current users and their roles
SELECT id, email, full_name, role, created_at 
FROM public.users 
ORDER BY created_at ASC;

-- Method 5: Make the first user (by creation date) an admin
UPDATE public.users 
SET role = 'admin', updated_at = NOW()
WHERE id = (
    SELECT id FROM public.users 
    ORDER BY created_at ASC 
    LIMIT 1
);
