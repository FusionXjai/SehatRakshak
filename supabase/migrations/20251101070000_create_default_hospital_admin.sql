-- Create default Hospital Admin account
-- This script should be run manually in Supabase SQL Editor

-- Note: Since we can't create auth users directly in SQL, 
-- you need to create this account through the Super Admin dashboard or manually

-- Step 1: Create a sample hospital first (if not exists)
INSERT INTO public.hospitals (name, address, phone, email, admin_id, created_at)
VALUES (
  'Default Hospital',
  '123 Medical Street, Healthcare City',
  '+91-9876543210',
  'hospital@example.com',
  NULL, -- Will be updated after creating the admin
  NOW()
)
ON CONFLICT DO NOTHING;

-- Step 2: After creating the auth user manually with email: admin@hospital.com and password: Hospital@123
-- Update the hospital with the admin_id
-- UPDATE public.hospitals SET admin_id = '<USER_ID_FROM_AUTH>' WHERE email = 'hospital@example.com';

-- Step 3: Insert profile for the hospital admin (run this after creating auth user)
-- INSERT INTO public.profiles (id, full_name, email, role, mobile, created_at, updated_at)
-- VALUES (
--   '<USER_ID_FROM_AUTH>',
--   'Hospital Admin',
--   'admin@hospital.com',
--   'hospitaladmin',
--   '+91-9876543210',
--   NOW(),
--   NOW()
-- );
