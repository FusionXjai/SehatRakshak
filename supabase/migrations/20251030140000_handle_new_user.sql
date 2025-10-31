-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the role from metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');

  -- Insert profile
  INSERT INTO public.profiles (id, full_name, email, mobile)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'mobile', '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert role (default to patient if not specified)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    user_role::public.app_role
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  -- If role is doctor, create doctor profile
  IF user_role = 'doctor' THEN
    INSERT INTO public.doctors (user_id, specialization, qualification, license_number)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'specialization', 'General Medicine'),
      COALESCE(NEW.raw_user_meta_data->>'qualification', 'MBBS'),
      'LIC-' || SUBSTRING(NEW.id::TEXT, 1, 8)
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to automatically create profile and role on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also handle existing users who might not have roles yet
-- This will add missing profiles and roles for existing users
DO $$
DECLARE
  user_record RECORD;
  user_role TEXT;
BEGIN
  FOR user_record IN SELECT id, email, raw_user_meta_data FROM auth.users LOOP
    -- Get user role
    user_role := COALESCE(user_record.raw_user_meta_data->>'role', 'receptionist');

    -- Insert profile if missing
    INSERT INTO public.profiles (id, full_name, email, mobile)
    VALUES (
      user_record.id,
      COALESCE(user_record.raw_user_meta_data->>'full_name', user_record.email),
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'mobile', '')
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert role if missing (default to receptionist for existing users)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      user_record.id,
      user_role::public.app_role
    )
    ON CONFLICT (user_id, role) DO NOTHING;

    -- If role is doctor, create doctor profile
    IF user_role = 'doctor' THEN
      INSERT INTO public.doctors (user_id, specialization, qualification, license_number)
      VALUES (
        user_record.id,
        COALESCE(user_record.raw_user_meta_data->>'specialization', 'General Medicine'),
        COALESCE(user_record.raw_user_meta_data->>'qualification', 'MBBS'),
        'LIC-' || SUBSTRING(user_record.id::TEXT, 1, 8)
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;
