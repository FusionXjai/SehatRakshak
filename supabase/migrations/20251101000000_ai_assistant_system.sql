-- AI Assistant & Patient Support System Migration
-- Creates table for storing AI interaction logs

-- Create ai_interactions table
CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  is_red_flag BOOLEAN DEFAULT false NOT NULL,
  language TEXT DEFAULT 'english' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Patients can view their own AI interactions"
ON public.ai_interactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = ai_interactions.patient_id
    AND patients.created_by = auth.uid()
  )
);

CREATE POLICY "System can insert AI interactions"
ON public.ai_interactions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Care managers can view all interactions"
ON public.ai_interactions FOR SELECT
USING (
  public.has_role(auth.uid(), 'caremanager') OR
  public.has_role(auth.uid(), 'doctor') OR
  public.has_role(auth.uid(), 'superadmin')
);

-- Create indexes
CREATE INDEX idx_ai_interactions_patient ON public.ai_interactions(patient_id);
CREATE INDEX idx_ai_interactions_red_flag ON public.ai_interactions(is_red_flag);
CREATE INDEX idx_ai_interactions_created_at ON public.ai_interactions(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_ai_interactions_updated_at
BEFORE UPDATE ON public.ai_interactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.ai_interactions IS 'Stores AI assistant chat logs with patients for monitoring and escalation';
COMMENT ON COLUMN public.ai_interactions.is_red_flag IS 'True if the query contained critical symptoms requiring immediate medical attention';
COMMENT ON COLUMN public.ai_interactions.language IS 'Language of the interaction: english or hindi';
