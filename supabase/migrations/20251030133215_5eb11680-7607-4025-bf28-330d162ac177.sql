-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('superadmin', 'hospitaladmin', 'doctor', 'receptionist', 'caremanager', 'patient');

-- Create user_roles table (security critical - separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  mobile TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create hospitals table
CREATE TABLE public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT,
  admin_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mrn TEXT UNIQUE NOT NULL, -- Medical Record Number (auto-generated)
  qr_code_id TEXT UNIQUE NOT NULL, -- For QR code scanning
  
  -- Personal Information
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  address TEXT,
  
  -- Medical Information
  allergies TEXT[],
  blood_group TEXT,
  emergency_contact_name TEXT,
  emergency_contact_mobile TEXT,
  
  -- Hospital Association
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  assigned_doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Documents
  photo_url TEXT,
  id_proof_url TEXT,
  
  -- Status Flags
  is_discharged BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  discharge_date TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Function to generate unique MRN (Medical Record Number)
CREATE OR REPLACE FUNCTION public.generate_mrn()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_mrn TEXT;
  mrn_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate MRN format: MRN-YYYYMMDD-XXXX (XXXX is random 4-digit number)
    new_mrn := 'MRN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if MRN already exists
    SELECT EXISTS(SELECT 1 FROM public.patients WHERE mrn = new_mrn) INTO mrn_exists;
    
    -- If MRN doesn't exist, exit loop
    IF NOT mrn_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_mrn;
END;
$$;

-- Trigger to auto-generate MRN and QR code ID before insert
CREATE OR REPLACE FUNCTION public.set_patient_identifiers()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate MRN if not provided
  IF NEW.mrn IS NULL OR NEW.mrn = '' THEN
    NEW.mrn := public.generate_mrn();
  END IF;
  
  -- Generate QR code ID if not provided (using UUID)
  IF NEW.qr_code_id IS NULL OR NEW.qr_code_id = '' THEN
    NEW.qr_code_id := 'QR-' || REPLACE(gen_random_uuid()::TEXT, '-', '');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_patient_identifiers
BEFORE INSERT ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.set_patient_identifiers();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at
BEFORE UPDATE ON public.hospitals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'));

-- RLS Policies for hospitals
CREATE POLICY "Anyone authenticated can view hospitals"
ON public.hospitals FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Superadmins and hospital admins can manage hospitals"
ON public.hospitals FOR ALL
USING (
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'hospitaladmin')
);

-- RLS Policies for patients
CREATE POLICY "Patients can view their own record"
ON public.patients FOR SELECT
USING (
  public.has_role(auth.uid(), 'patient') AND
  created_by = auth.uid()
);

CREATE POLICY "Medical staff can view patients"
ON public.patients FOR SELECT
USING (
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'hospitaladmin') OR
  public.has_role(auth.uid(), 'doctor') OR
  public.has_role(auth.uid(), 'receptionist') OR
  public.has_role(auth.uid(), 'caremanager')
);

CREATE POLICY "Receptionists and admins can insert patients"
ON public.patients FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'hospitaladmin') OR
  public.has_role(auth.uid(), 'receptionist')
);

CREATE POLICY "Receptionists and admins can update patients"
ON public.patients FOR UPDATE
USING (
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'hospitaladmin') OR
  public.has_role(auth.uid(), 'receptionist')
);

CREATE POLICY "Only superadmins can delete patients"
ON public.patients FOR DELETE
USING (public.has_role(auth.uid(), 'superadmin'));

-- Create storage bucket for patient documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-documents',
  'patient-documents',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
);

-- Storage RLS policies for patient documents
CREATE POLICY "Medical staff can view patient documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'patient-documents' AND
  (
    public.has_role(auth.uid(), 'superadmin') OR
    public.has_role(auth.uid(), 'hospitaladmin') OR
    public.has_role(auth.uid(), 'doctor') OR
    public.has_role(auth.uid(), 'receptionist') OR
    public.has_role(auth.uid(), 'caremanager')
  )
);

CREATE POLICY "Medical staff can upload patient documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'patient-documents' AND
  (
    public.has_role(auth.uid(), 'superadmin') OR
    public.has_role(auth.uid(), 'hospitaladmin') OR
    public.has_role(auth.uid(), 'receptionist')
  )
);

CREATE POLICY "Medical staff can update patient documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'patient-documents' AND
  (
    public.has_role(auth.uid(), 'superadmin') OR
    public.has_role(auth.uid(), 'hospitaladmin') OR
    public.has_role(auth.uid(), 'receptionist')
  )
);

-- Create indexes for better query performance
CREATE INDEX idx_patients_mrn ON public.patients(mrn);
CREATE INDEX idx_patients_qr_code ON public.patients(qr_code_id);
CREATE INDEX idx_patients_mobile ON public.patients(mobile);
CREATE INDEX idx_patients_hospital ON public.patients(hospital_id);
CREATE INDEX idx_patients_doctor ON public.patients(assigned_doctor_id);
CREATE INDEX idx_patients_active ON public.patients(is_active);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);