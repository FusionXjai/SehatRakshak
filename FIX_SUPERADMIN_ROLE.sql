-- ═══════════════════════════════════════════════════════════════════════════
-- FIX SUPER ADMIN ROLE - Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════
-- Problem: Super Admin logging in but redirecting to Hospital Admin dashboard
-- Solution: Ensure 'superadmin' role is set in user_roles table
-- ═══════════════════════════════════════════════════════════════════════════

-- Step 1: Check current role (for debugging)
SELECT 
    u.email,
    ur.role,
    p.full_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'vishugkp222@gmail.com';

-- Step 2: Delete any existing roles for this user
DELETE FROM public.user_roles 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'vishugkp222@gmail.com'
);

-- Step 3: Insert 'superadmin' role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::public.app_role
FROM auth.users
WHERE email = 'vishugkp222@gmail.com';

-- Step 4: Verify the role is set correctly
SELECT 
    u.email,
    ur.role as user_role,
    'SUCCESS - Super Admin role set!' as status
FROM auth.users u
INNER JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'vishugkp222@gmail.com';

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE! Now try logging in again with:
--   Email: vishugkp222@gmail.com
--   Password: 123456789
-- You should be redirected to: /admin (Super Admin Dashboard)
-- ═══════════════════════════════════════════════════════════════════════════
