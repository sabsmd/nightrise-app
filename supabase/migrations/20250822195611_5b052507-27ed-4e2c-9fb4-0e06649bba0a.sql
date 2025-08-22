-- Migration pour le système de réservation et commandes en temps réel

-- Table pour les réservations d'éléments
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  floor_element_id UUID NOT NULL,
  min_spend_code_id UUID NOT NULL,
  user_id UUID NOT NULL,
  statut TEXT NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_reservations_event_id ON public.reservations(event_id);
CREATE INDEX idx_reservations_floor_element_id ON public.reservations(floor_element_id);
CREATE INDEX idx_reservations_user_id ON public.reservations(user_id);

-- Contrainte unique pour éviter les doubles réservations
CREATE UNIQUE INDEX idx_reservations_unique_element ON public.reservations(floor_element_id, event_id) WHERE statut = 'active';

-- Activer RLS sur la table reservations
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les réservations
CREATE POLICY "Everyone can view reservations" 
ON public.reservations 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own reservations" 
ON public.reservations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations" 
ON public.reservations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reservations" 
ON public.reservations 
FOR ALL 
USING (get_current_user_role() = 'admin'::user_role);

-- Ajouter une colonne pour lier min_spend_codes aux réservations
ALTER TABLE public.min_spend_codes 
ADD COLUMN reservation_id UUID REFERENCES public.reservations(id);

-- Mise à jour du statut des min_spend_codes pour inclure 'reserved'
ALTER TABLE public.min_spend_codes 
DROP CONSTRAINT IF EXISTS min_spend_codes_statut_check;

ALTER TABLE public.min_spend_codes 
ADD CONSTRAINT min_spend_codes_statut_check 
CHECK (statut IN ('actif', 'utilise', 'expire', 'reserved'));

-- Trigger pour mise à jour automatique des timestamps
CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Activer la réplication en temps réel pour les réservations
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.reservations;

-- Activer la réplication pour les commandes existantes
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.orders;

-- Activer la réplication pour les min_spend_codes
ALTER TABLE public.min_spend_codes REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.min_spend_codes;