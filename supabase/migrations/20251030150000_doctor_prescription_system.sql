-- =====================================================
-- Doctor & Prescription System Migration
-- Run this complete SQL in Supabase Dashboard > SQL Editor
-- =====================================================

-- Create doctors table
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  specialization TEXT NOT NULL,
  qualification TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL NOT NULL,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  diagnosis TEXT NOT NULL,
  notes TEXT,
  prescription_date DATE DEFAULT CURRENT_DATE NOT NULL,
  follow_up_date DATE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create medications table
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  timing TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  start_date DATE DEFAULT CURRENT_DATE NOT NULL,
  end_date DATE NOT NULL,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_sent BOOLEAN DEFAULT false NOT NULL,
  is_acknowledged BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctors
CREATE POLICY "Doctors can view their own profile"
ON public.doctors FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Hospital admins can manage doctors"
ON public.doctors FOR ALL
USING (
  public.has_role(auth.uid(), 'superadmin') OR
  public.has_role(auth.uid(), 'hospitaladmin')
);

-- RLS Policies for prescriptions
CREATE POLICY "Doctors can view their own prescriptions"
ON public.prescriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.doctors
    WHERE doctors.id = prescriptions.doctor_id
    AND doctors.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can view their own prescriptions"
ON public.prescriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = prescriptions.patient_id
    AND patients.created_by = auth.uid()
  )
);

CREATE POLICY "Doctors can create prescriptions"
ON public.prescriptions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.doctors
    WHERE doctors.id = doctor_id
    AND doctors.user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can update their own prescriptions"
ON public.prescriptions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.doctors
    WHERE doctors.id = prescriptions.doctor_id
    AND doctors.user_id = auth.uid()
  )
);


-- RLS Policies for medications
CREATE POLICY "Anyone can view medications of visible prescriptions"
ON public.medications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.prescriptions
    WHERE prescriptions.id = medications.prescription_id
  )
);

CREATE POLICY "Doctors can manage medications for their prescriptions"
ON public.medications FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.prescriptions p
    JOIN public.doctors d ON p.doctor_id = d.id
    WHERE p.id = medications.prescription_id
    AND d.user_id = auth.uid()
  )
);

-- RLS Policies for reminders
CREATE POLICY "Patients can view their own reminders"
ON public.reminders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = reminders.patient_id
    AND patients.created_by = auth.uid()
  )
);

CREATE POLICY "System can manage reminders"
ON public.reminders FOR ALL
USING (true);

-- Create indexes
CREATE INDEX idx_doctors_user_id ON public.doctors(user_id);
CREATE INDEX idx_doctors_hospital ON public.doctors(hospital_id);
CREATE INDEX idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON public.prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_date ON public.prescriptions(prescription_date);
CREATE INDEX idx_medications_prescription ON public.medications(prescription_id);
CREATE INDEX idx_reminders_patient ON public.reminders(patient_id);
CREATE INDEX idx_reminders_medication ON public.reminders(medication_id);
CREATE INDEX idx_reminders_time ON public.reminders(reminder_time);

-- Trigger for updated_at
CREATE TRIGGER update_doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
BEFORE UPDATE ON public.prescriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medications_updated_at
BEFORE UPDATE ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at
BEFORE UPDATE ON public.reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create reminders after prescription save
CREATE OR REPLACE FUNCTION public.create_medication_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reminder_date DATE;
  reminder_times TEXT[];
  reminder_time_text TEXT;
  current_date DATE := NEW.start_date;
BEGIN
  -- Parse timing to get reminder times (e.g., "Morning,Evening" -> ["08:00", "20:00"])
  reminder_times := CASE NEW.timing
    WHEN 'Morning' THEN ARRAY['08:00:00']
    WHEN 'Afternoon' THEN ARRAY['14:00:00']
    WHEN 'Evening' THEN ARRAY['20:00:00']
    WHEN 'Night' THEN ARRAY['22:00:00']
    WHEN 'Morning,Evening' THEN ARRAY['08:00:00', '20:00:00']
    WHEN 'Morning,Afternoon,Evening' THEN ARRAY['08:00:00', '14:00:00', '20:00:00']
    ELSE ARRAY['08:00:00']
  END;

  -- Create reminders for each day of medication duration
  WHILE current_date <= NEW.end_date LOOP
    FOREACH reminder_time_text IN ARRAY reminder_times LOOP
      INSERT INTO public.reminders (patient_id, medication_id, reminder_time)
      SELECT 
        p.patient_id,
        NEW.id,
        (current_date || ' ' || reminder_time_text)::TIMESTAMP WITH TIME ZONE
      FROM public.prescriptions p
      WHERE p.id = NEW.prescription_id;
    END LOOP;
    current_date := current_date + INTERVAL '1 day';
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger to create reminders after medication insert
CREATE TRIGGER trigger_create_medication_reminders
AFTER INSERT ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.create_medication_reminders();
