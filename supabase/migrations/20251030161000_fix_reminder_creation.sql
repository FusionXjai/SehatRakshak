-- Fix reminder creation trigger to use frequency instead of timing
-- The timing field is about food timing (Before Food, After Food, etc.)
-- The frequency field determines when reminders should be sent (1-0-1, 1-1-1, etc.)

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_create_medication_reminders ON public.medications;
DROP FUNCTION IF EXISTS public.create_medication_reminders();

-- Recreate function with correct logic
CREATE OR REPLACE FUNCTION public.create_medication_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reminder_times TEXT[];
  reminder_time_text TEXT;
  current_date DATE := NEW.start_date;
BEGIN
  -- Parse frequency to get reminder times
  -- Frequency format: Morning-Afternoon-Evening
  -- Examples: 1-0-1 (Morning & Evening), 1-1-1 (Morning, Afternoon & Evening)
  reminder_times := CASE NEW.frequency
    WHEN '1-0-0' THEN ARRAY['08:00:00']  -- Once daily - Morning
    WHEN '0-1-0' THEN ARRAY['14:00:00']  -- Once daily - Afternoon
    WHEN '0-0-1' THEN ARRAY['20:00:00']  -- Once daily - Evening
    WHEN '1-0-1' THEN ARRAY['08:00:00', '20:00:00']  -- Twice daily
    WHEN '1-1-1' THEN ARRAY['08:00:00', '14:00:00', '20:00:00']  -- Thrice daily
    WHEN '1-1-1-1' THEN ARRAY['08:00:00', '14:00:00', '18:00:00', '22:00:00']  -- Four times daily
    ELSE ARRAY['08:00:00']  -- Default to morning
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

-- Recreate trigger
CREATE TRIGGER trigger_create_medication_reminders
AFTER INSERT ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.create_medication_reminders();
