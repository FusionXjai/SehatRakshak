-- Enable real-time for patients table
-- This allows the doctor dashboard to update automatically when new patients are assigned

-- Enable replica identity for real-time updates
ALTER TABLE public.patients REPLICA IDENTITY FULL;

-- Add patients table to the supabase_realtime publication (if not already added)
-- Note: This is the SQL equivalent of enabling replication in the Supabase Dashboard
DO $$
BEGIN
  -- Check if the table is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'patients' 
    AND schemaname = 'public'
  ) THEN
    -- Add the table to the realtime publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;
  END IF;
END $$;

COMMENT ON TABLE public.patients IS 'Patients table with real-time enabled for doctor dashboard updates';
