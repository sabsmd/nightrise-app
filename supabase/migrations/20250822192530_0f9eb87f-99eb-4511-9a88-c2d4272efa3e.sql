-- Création de la table pour les codes de minimum spend
CREATE TABLE IF NOT EXISTS public.min_spend_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  floor_element_id UUID REFERENCES public.floor_elements(id) ON DELETE SET NULL,
  min_spend NUMERIC(10,2) NOT NULL DEFAULT 0,
  solde_restant NUMERIC(10,2) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'utilise', 'expire')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.min_spend_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for min_spend_codes
CREATE POLICY "Admins can manage all min spend codes"
ON public.min_spend_codes
FOR ALL
USING (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Users can view their own min spend codes"
ON public.min_spend_codes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view codes for validation"
ON public.min_spend_codes
FOR SELECT
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_min_spend_codes_updated_at
BEFORE UPDATE ON public.min_spend_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_min_spend_codes_code ON public.min_spend_codes(code);
CREATE INDEX idx_min_spend_codes_event_id ON public.min_spend_codes(event_id);
CREATE INDEX idx_min_spend_codes_user_id ON public.min_spend_codes(user_id);