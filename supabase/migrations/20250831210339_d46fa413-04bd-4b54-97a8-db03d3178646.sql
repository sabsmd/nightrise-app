-- =========================================================
-- 1) Fonction utilitaire pour récupérer le rôle courant
-- =========================================================
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
  SELECT role::user_role
  FROM profiles
  WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE;

-- =========================================================
-- 2) RLS Policies pour accès PRO/Admin
-- =========================================================

-- Autoriser les admins à voir toutes les réservations clients
CREATE POLICY "Admins can view all client reservations for events" 
ON client_reservations 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

-- Autoriser les admins à voir toutes les réservations
CREATE POLICY "Admins can view all reservations" 
ON reservations 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

-- Autoriser les admins à voir tous les codes min spend
CREATE POLICY "Admins can view all min spend codes for events" 
ON min_spend_codes 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

-- =========================================================
-- 3) Index uniques pour éviter les doubles réservations
-- =========================================================

-- Sur reservations (sans CONCURRENTLY dans une transaction)
CREATE UNIQUE INDEX idx_reservations_unique_active 
ON reservations (event_id, floor_element_id) 
WHERE statut = 'active';

-- Sur client_reservations
CREATE UNIQUE INDEX idx_client_reservations_unique_active 
ON client_reservations (event_id, floor_element_id) 
WHERE statut = 'active';

-- =========================================================
-- 4) Activer le temps réel sur reservations
-- =========================================================
ALTER TABLE reservations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;

-- =========================================================
-- 5) Clés étrangères pour jointures PostgREST
-- =========================================================
ALTER TABLE client_reservations
ADD CONSTRAINT fk_client_reservations_profiles
FOREIGN KEY (user_id) REFERENCES profiles(user_id)
ON DELETE SET NULL;

ALTER TABLE reservations
ADD CONSTRAINT fk_reservations_profiles
FOREIGN KEY (user_id) REFERENCES profiles(user_id)
ON DELETE SET NULL;