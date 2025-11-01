-- Fix RLS policies for patients table to allow doctors to insert patients
-- This migration fixes the issue where doctors cannot add patients from their dashboard

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

COMMENT ON TABLE public.patients IS 'Patients table with RLS policies allowing doctors, receptionists, and admins to insert/update';

