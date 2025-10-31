-- Fix RLS policies for patients table to allow doctors and receptionists to insert patients

-- Drop existing policies
DROP POLICY IF EXISTS "Receptionists can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can insert patients" ON public.patients;

-- Allow receptionists to insert patients
CREATE POLICY "Receptionists can insert patients"
ON public.patients FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'receptionist') OR
  public.has_role(auth.uid(), 'hospitaladmin') OR
  public.has_role(auth.uid(), 'superadmin')
);

-- Allow doctors to insert patients (for their own patients)
CREATE POLICY "Doctors can insert patients"
ON public.patients FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'doctor')
);

-- Allow receptionists to update patients
DROP POLICY IF EXISTS "Receptionists can update patients" ON public.patients;
CREATE POLICY "Receptionists can update patients"
ON public.patients FOR UPDATE
USING (
  public.has_role(auth.uid(), 'receptionist') OR
  public.has_role(auth.uid(), 'hospitaladmin') OR
  public.has_role(auth.uid(), 'superadmin')
);

-- Allow doctors to view their assigned patients
DROP POLICY IF EXISTS "Doctors can view assigned patients" ON public.patients;
CREATE POLICY "Doctors can view assigned patients"
ON public.patients FOR SELECT
USING (
  public.has_role(auth.uid(), 'doctor') AND
  (assigned_doctor_id IN (
    SELECT id FROM public.doctors WHERE user_id = auth.uid()
  ))
  OR
  public.has_role(auth.uid(), 'receptionist') OR
  public.has_role(auth.uid(), 'hospitaladmin') OR
  public.has_role(auth.uid(), 'superadmin')
);
