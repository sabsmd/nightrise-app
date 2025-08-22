-- Créer une table pour les éléments du plan de salle
CREATE TABLE IF NOT EXISTS public.floor_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('table', 'entree', 'bar', 'piscine', 'bed', 'sofa', 'piste', 'dj_set', 'scene')),
  nom TEXT NOT NULL,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 80,
  height INTEGER NOT NULL DEFAULT 80,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.floor_elements ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Admins can manage floor elements" 
ON public.floor_elements 
FOR ALL 
USING (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Everyone can view floor elements" 
ON public.floor_elements 
FOR SELECT 
USING (true);

-- Trigger pour updated_at
CREATE TRIGGER update_floor_elements_updated_at
BEFORE UPDATE ON public.floor_elements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Ajouter des champs aux tables existantes pour la configuration
ALTER TABLE public.tables 
ADD COLUMN IF NOT EXISTS capacite INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS floor_element_id UUID;