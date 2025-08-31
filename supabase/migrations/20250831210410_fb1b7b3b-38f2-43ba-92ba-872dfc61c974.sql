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

-- Supprimer les policies existantes si elles existent et les recréer
DROP POLICY IF EXISTS "Admins can view all client reservations for events" ON client_reservations;
CREATE POLICY "Admins can view all client reservations for events" 
ON client_reservations 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
CREATE POLICY "Admins can view all reservations" 
ON reservations 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

DROP POLICY IF EXISTS "Admins can view all min spend codes for events" ON min_spend_codes;
CREATE POLICY "Admins can view all min spend codes for events" 
ON min_spend_codes 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

-- =========================================================
-- 3) Index uniques pour éviter les doubles réservations (si pas déjà existants)
-- =========================================================

-- Index pour client_reservations si pas déjà existant
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_client_reservations_unique_active') THEN
        CREATE UNIQUE INDEX idx_client_reservations_unique_active 
        ON client_reservations (event_id, floor_element_id) 
        WHERE statut = 'active';
    END IF;
END $$;

-- =========================================================
-- 4) Activer le temps réel sur reservations
-- =========================================================
ALTER TABLE reservations REPLICA IDENTITY FULL;

-- Ajouter à la publication realtime seulement si pas déjà ajouté
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'reservations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
    END IF;
END $$;

-- =========================================================
-- 5) Clés étrangères pour jointures PostgREST (si pas déjà existantes)
-- =========================================================

-- Contrainte pour client_reservations
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_client_reservations_profiles'
    ) THEN
        ALTER TABLE client_reservations
        ADD CONSTRAINT fk_client_reservations_profiles
        FOREIGN KEY (user_id) REFERENCES profiles(user_id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Contrainte pour reservations
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_reservations_profiles'
    ) THEN
        ALTER TABLE reservations
        ADD CONSTRAINT fk_reservations_profiles
        FOREIGN KEY (user_id) REFERENCES profiles(user_id)
        ON DELETE SET NULL;
    END IF;
END $$;