-- Fix Super Admin Role Issue
-- This ensures vishugkp222@gmail.com has 'superadmin' role in user_roles table

-- Step 1: Get the user_id for vishugkp222@gmail.com
-- Step 2: Insert or update the role in user_roles table

-- Note: Run this manually in Supabase SQL Editor after replacing <USER_ID>
-- Get USER_ID first by running: SELECT id FROM auth.users WHERE email = 'vishugkp222@gmail.com';

-- Then run this with the actual USER_ID:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('<USER_ID>', 'superadmin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- Or if you want to ensure role exists, delete old and insert new:
-- DELETE FROM public.user_roles WHERE user_id = '<USER_ID>';
-- INSERT INTO public.user_roles (user_id, role) VALUES ('<USER_ID>', 'superadmin');


-- Alternative: Create a function to set user role
CREATE OR REPLACE FUNCTION public.set_user_role(
  user_email TEXT,
  user_role public.app_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user_id from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Delete existing roles for this user
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  -- Insert new role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, user_role);

  RETURN TRUE;
END;
$$;

-- Now you can run: SELECT public.set_user_role('vishugkp222@gmail.com', 'superadmin');
