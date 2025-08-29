-- 1️⃣ Mise à jour des anciens min_spend_codes sans floor_element_id
UPDATE min_spend_codes 
SET floor_element_id = (
  SELECT fe.id 
  FROM floor_elements fe 
  WHERE fe.event_id = min_spend_codes.event_id 
    AND fe.type IN ('table', 'bed', 'sofa')
  LIMIT 1
)
WHERE floor_element_id IS NULL;

-- 2️⃣ Rendre floor_element_id obligatoire
ALTER TABLE min_spend_codes 
ALTER COLUMN floor_element_id SET NOT NULL;

-- 3️⃣ Création de la table client_reservations
CREATE TABLE public.client_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL,
  floor_element_id UUID NOT NULL,
  min_spend_code_id UUID NOT NULL REFERENCES min_spend_codes(id) ON DELETE CASCADE,
  statut TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4️⃣ Activer Row Level Security
ALTER TABLE public.client_reservations ENABLE ROW LEVEL SECURITY;

-- 5️⃣ Politiques RLS
CREATE POLICY "Users can view their own reservations" 
ON public.client_reservations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reservations" 
ON public.client_reservations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations" 
ON public.client_reservations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all client reservations" 
ON public.client_reservations 
FOR ALL 
USING (get_current_user_role() = 'admin'::user_role);

-- 6️⃣ Trigger pour mise à jour automatique des timestamps
CREATE TRIGGER update_client_reservations_updated_at
BEFORE UPDATE ON public.client_reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7️⃣ Empêcher les doublons : un code actif par élément
ALTER TABLE public.client_reservations 
ADD CONSTRAINT unique_code_per_reservation UNIQUE (min_spend_code_id, statut) 
DEFERRABLE INITIALLY IMMEDIATE;

-- 8️⃣ Index pour performances
CREATE INDEX idx_client_reservations_user_id ON public.client_reservations(user_id);
CREATE INDEX idx_client_reservations_event_id ON public.client_reservations(event_id);
CREATE INDEX idx_client_reservations_floor_element_id ON public.client_reservations(floor_element_id);

-- 9️⃣ Contrainte statut
ALTER TABLE public.client_reservations
ADD CONSTRAINT client_reservations_statut_check
CHECK (statut IN ('active', 'cancelled'));

-- 1️⃣0️⃣ Trigger pour vérifier cohérence floor_element_id / min_spend_code_id
CREATE OR REPLACE FUNCTION public.validate_reservation_element()
RETURNS trigger AS $$
BEGIN
  IF (SELECT floor_element_id FROM min_spend_codes WHERE id = NEW.min_spend_code_id) <> NEW.floor_element_id THEN
    RAISE EXCEPTION 'Erreur : ce code minimum spend est valide uniquement pour l'élément associé.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_reservation_element
BEFORE INSERT OR UPDATE ON public.client_reservations
FOR EACH ROW
EXECUTE FUNCTION public.validate_reservation_element();