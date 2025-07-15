  -- Schema update for OAuth providers and handling social logins

-- Update the handle_new_user function to handle users from OAuth providers
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  full_name TEXT;
  avatar_url TEXT;
BEGIN
  -- Extract user info from metadata
  full_name := new.raw_user_meta_data->>'full_name';
  
  -- If no full_name, try to construct from OAuth data
  IF full_name IS NULL THEN
    -- Try to get name from provider data
    IF new.raw_user_meta_data->>'name' IS NOT NULL THEN
      full_name := new.raw_user_meta_data->>'name';
    ELSIF new.raw_user_meta_data->>'user_name' IS NOT NULL THEN
      full_name := new.raw_user_meta_data->>'user_name';
    ELSIF (new.raw_user_meta_data->>'given_name' IS NOT NULL AND new.raw_user_meta_data->>'family_name' IS NOT NULL) THEN
      full_name := (new.raw_user_meta_data->>'given_name') || ' ' || (new.raw_user_meta_data->>'family_name');
    ELSE
      -- Default to email username as fallback
      full_name := split_part(new.email, '@', 1);
    END IF;
  END IF;
  
  -- Get avatar URL if available
  avatar_url := new.raw_user_meta_data->>'avatar_url';
  
  -- Insert the new user with default role
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    avatar_url,
    role,
    created_at,
    last_login
  )
  VALUES (
    new.id, 
    new.email, 
    full_name,
    avatar_url,
    'staff',  -- Default role
    now(),
    now()
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add avatar_url column to users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.users
    ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Add created_at column to users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.users
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL;
  END IF;
END $$;

-- Add full_name column to users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.users
    ADD COLUMN full_name TEXT;
  END IF;
END $$;

-- Function to set up initial role permissions for a new user
CREATE OR REPLACE FUNCTION public.setup_new_user_role_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- If user was created with a specific role in auth metadata, update it
  IF (new.raw_user_meta_data->>'role') IS NOT NULL THEN
    UPDATE public.users
    SET role = (new.raw_user_meta_data->>'role')::user_role
    WHERE id = new.id;
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for setting up role permissions
DROP TRIGGER IF EXISTS on_auth_user_created_setup_role ON auth.users;
CREATE TRIGGER on_auth_user_created_setup_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.setup_new_user_role_permissions();

-- Add a policy for avatars storage
-- This assumes you have set up a storage bucket called 'avatars'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy to allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy to allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy to allow users to view avatars (public)
CREATE POLICY "Avatars are publicly viewable"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'avatars'
  );