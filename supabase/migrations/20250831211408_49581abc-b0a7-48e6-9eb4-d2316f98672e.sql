
-- 1) Clés étrangères manquantes pour permettre les relations imbriquées
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_client_reservations_min_spend_codes'
      AND table_name = 'client_reservations'
  ) THEN
    ALTER TABLE public.client_reservations
      ADD CONSTRAINT fk_client_reservations_min_spend_codes
      FOREIGN KEY (min_spend_code_id) REFERENCES public.min_spend_codes(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_client_reservations_floor_elements'
      AND table_name = 'client_reservations'
  ) THEN
    ALTER TABLE public.client_reservations
      ADD CONSTRAINT fk_client_reservations_floor_elements
      FOREIGN KEY (floor_element_id) REFERENCES public.floor_elements(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_reservations_min_spend_codes'
      AND table_name = 'reservations'
  ) THEN
    ALTER TABLE public.reservations
      ADD CONSTRAINT fk_reservations_min_spend_codes
      FOREIGN KEY (min_spend_code_id) REFERENCES public.min_spend_codes(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_reservations_floor_elements'
      AND table_name = 'reservations'
  ) THEN
    ALTER TABLE public.reservations
      ADD CONSTRAINT fk_reservations_floor_elements
      FOREIGN KEY (floor_element_id) REFERENCES public.floor_elements(id);
  END IF;
END $$;

-- 2) Fonction + trigger pour synchroniser reservations à partir de client_reservations
CREATE OR REPLACE FUNCTION public.sync_reservations_from_client_reservations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- S'assurer qu'une ligne existe dans reservations
    IF NOT EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.event_id = NEW.event_id
        AND r.floor_element_id = NEW.floor_element_id
        AND r.min_spend_code_id = NEW.min_spend_code_id
        AND r.user_id = NEW.user_id
        AND r.statut = NEW.statut
    ) THEN
      INSERT INTO public.reservations(event_id, floor_element_id, min_spend_code_id, user_id, statut)
      VALUES (NEW.event_id, NEW.floor_element_id, NEW.min_spend_code_id, NEW.user_id, NEW.statut);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Répercuter le changement de statut
    IF NEW.statut IS DISTINCT FROM OLD.statut THEN
      UPDATE public.reservations r
      SET statut = NEW.statut, updated_at = now()
      WHERE r.event_id = NEW.event_id
        AND r.floor_element_id = NEW.floor_element_id
        AND r.min_spend_code_id = NEW.min_spend_code_id
        AND r.user_id = NEW.user_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Mettre la réservation publique à annulée s'il y en a une active
    UPDATE public.reservations r
    SET statut = 'cancelled', updated_at = now()
    WHERE r.event_id = OLD.event_id
      AND r.floor_element_id = OLD.floor_element_id
      AND r.min_spend_code_id = OLD.min_spend_code_id
      AND r.user_id = OLD.user_id
      AND r.statut = 'active';
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_reservations_iud ON public.client_reservations;

CREATE TRIGGER trg_sync_reservations_iud
AFTER INSERT OR UPDATE OR DELETE ON public.client_reservations
FOR EACH ROW EXECUTE FUNCTION public.sync_reservations_from_client_reservations();

-- 3) Nettoyage des données pour corriger l’état actuel (ex: "Table 1" encore marquée réservée)
-- 3a) Si le client a annulé, annuler la réservation publique correspondante
UPDATE public.reservations r
SET statut = 'cancelled', updated_at = now()
FROM public.client_reservations c
WHERE r.event_id = c.event_id
  AND r.floor_element_id = c.floor_element_id
  AND r.min_spend_code_id = c.min_spend_code_id
  AND r.user_id = c.user_id
  AND c.statut = 'cancelled'
  AND r.statut = 'active';

-- 3b) Annuler les réservations publiques orphelines: actives mais sans équivalent actif côté client
UPDATE public.reservations r
SET statut = 'cancelled', updated_at = now()
WHERE r.statut = 'active'
  AND NOT EXISTS (
    SELECT 1
    FROM public.client_reservations c
    WHERE c.event_id = r.event_id
      AND c.floor_element_id = r.floor_element_id
      AND c.min_spend_code_id = r.min_spend_code_id
      AND c.user_id = r.user_id
      AND c.statut = 'active'
  );

-- 4) (Optionnel mais recommandé) Activer le realtime complet sur client_reservations
ALTER TABLE public.client_reservations REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'client_reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.client_reservations;
  END IF;
END $$;
