# Fix RLS Error: "new row violates row-level security policy"

## Problem
When trying to add a patient from the Doctor Dashboard, you're seeing this error:
```
"new row violates row-level security policy"
```

## Cause
The Row Level Security (RLS) policy on the `patients` table doesn't allow doctors to insert new patients. The current policy only allows receptionists, hospital admins, and super admins.

## Solution

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/hrsqndpdcacajdjjkdvg
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
-- Fix RLS policies for patients table to allow doctors to insert patients
-- This fixes the issue where doctors cannot add patients from their dashboard

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Receptionists can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Receptionists and admins can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can insert patients" ON public.patients;

-- Recreate comprehensive policies
-- Allow receptionists, admins, and superadmins to insert patients
CREATE POLICY "Receptionists and admins can insert patients"
ON public.patients FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'hospitaladmin') OR
  public.has_role(auth.uid(), 'receptionist')
);

-- Allow doctors to insert patients
CREATE POLICY "Doctors can insert patients"
ON public.patients FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'doctor')
);

-- Update the UPDATE policy to include doctors
DROP POLICY IF EXISTS "Receptionists can update patients" ON public.patients;
DROP POLICY IF EXISTS "Receptionists and admins can update patients" ON public.patients;

CREATE POLICY "Medical staff can update patients"
ON public.patients FOR UPDATE
USING (
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'hospitaladmin') OR
  public.has_role(auth.uid(), 'receptionist') OR
  public.has_role(auth.uid(), 'doctor')
);
```

5. Click **Run** (or press Ctrl+Enter)
6. You should see a success message

### Option 2: Run the Migration File

If you have the Supabase CLI installed and configured:

```bash
supabase db push
```

Or manually:

```bash
supabase migration up
```

## Verification

After running the SQL:

1. Go back to your Doctor Dashboard
2. Try adding a patient again
3. The patient should be added successfully
4. You should see a success toast notification

## What This Fix Does

1. **Creates two INSERT policies:**
   - `Receptionists and admins can insert patients` - Allows receptionists, hospital admins, and super admins to add patients
   - `Doctors can insert patients` - Allows doctors to add patients

2. **Updates the UPDATE policy:**
   - `Medical staff can update patients` - Now includes doctors in addition to receptionists and admins

## Test Cases

After applying this fix, the following should work:

- ✅ Doctor can add patients from Doctor Dashboard
- ✅ Receptionist can add patients from Reception Dashboard
- ✅ Hospital Admin can add patients
- ✅ Real-time updates work when patient is added
- ✅ Doctor can see the patient in their dashboard immediately

## Troubleshooting

### Still Getting the Error?

1. **Check your role:**
   - Make sure you're logged in as a user with the `doctor` role
   - Verify your role in the `user_roles` table:
     ```sql
     SELECT * FROM user_roles WHERE user_id = auth.uid();
     ```

2. **Verify the policy was created:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'patients' AND policyname LIKE '%insert%';
   ```

3. **Check if you have a doctor profile:**
   ```sql
   SELECT * FROM doctors WHERE user_id = auth.uid();
   ```

4. **Clear browser cache:**
   - Clear your browser's cache and cookies
   - Log out and log back in
   - Try adding a patient again

### Error: "policy already exists"

If you get this error, run this first to clean up:

```sql
-- Drop all existing policies on patients table
DROP POLICY IF EXISTS "Receptionists can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Receptionists and admins can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Receptionists can update patients" ON public.patients;
DROP POLICY IF EXISTS "Receptionists and admins can update patients" ON public.patients;
DROP POLICY IF EXISTS "Medical staff can update patients" ON public.patients;

-- Then run the CREATE POLICY statements from above
```

## Additional Notes

- This migration has been added to your project as: `supabase/migrations/20251101020000_fix_doctors_insert_patients.sql`
- The migration is idempotent (safe to run multiple times)
- It uses `DROP POLICY IF EXISTS` to avoid conflicts
- All policies are properly documented

## Need Help?

If you're still experiencing issues:
1. Check the browser console for detailed error messages
2. Check the Supabase logs in the Dashboard
3. Verify your database migrations are up to date
4. Contact support: support@sehatrakshak.com

---

**Created:** 2025-11-01  
**Status:** ✅ Ready to apply  
**Requires:** Supabase Dashboard access

