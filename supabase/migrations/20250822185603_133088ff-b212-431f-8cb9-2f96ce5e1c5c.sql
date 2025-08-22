-- Créer la table pour les codes de réservation
CREATE TABLE IF NOT EXISTS public.reservation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  floor_element_id UUID REFERENCES public.floor_elements(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  nom_client TEXT NOT NULL,
  prenom_client TEXT NOT NULL,
  telephone_client TEXT NOT NULL,
  expiration_date TIMESTAMP WITH TIME ZONE,
  statut TEXT NOT NULL DEFAULT 'non_utilise' CHECK (statut IN ('non_utilise', 'utilise', 'expire')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.reservation_codes ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins
CREATE POLICY "Admins can manage their reservation codes"
ON public.reservation_codes
FOR ALL
USING (get_current_user_role() = 'admin'::user_role);

-- Politique pour la consultation (nécessaire pour la validation côté client)
CREATE POLICY "Everyone can view reservation codes (for validation)"
ON public.reservation_codes
FOR SELECT
USING (true);

-- Index pour améliorer les performances
CREATE INDEX idx_reservation_codes_event_id ON public.reservation_codes(event_id);
CREATE INDEX idx_reservation_codes_code ON public.reservation_codes(code);