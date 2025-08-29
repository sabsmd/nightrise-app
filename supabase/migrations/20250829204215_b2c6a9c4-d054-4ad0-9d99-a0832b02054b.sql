-- Ajouter les contraintes de clé étrangère manquantes pour client_reservations
-- (PostgreSQL ne supporte pas IF NOT EXISTS avec ADD CONSTRAINT, donc on ignore les erreurs si elles existent déjà)

-- Client reservations foreign keys
DO $$ 
BEGIN
    -- FK vers events
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_client_reservations_event' 
                   AND table_name = 'client_reservations') THEN
        ALTER TABLE public.client_reservations
        ADD CONSTRAINT fk_client_reservations_event
        FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- FK vers floor_elements
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_client_reservations_floor_element' 
                   AND table_name = 'client_reservations') THEN
        ALTER TABLE public.client_reservations
        ADD CONSTRAINT fk_client_reservations_floor_element
        FOREIGN KEY (floor_element_id) REFERENCES public.floor_elements(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- FK vers min_spend_codes
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_client_reservations_min_spend_code' 
                   AND table_name = 'client_reservations') THEN
        ALTER TABLE public.client_reservations
        ADD CONSTRAINT fk_client_reservations_min_spend_code
        FOREIGN KEY (min_spend_code_id) REFERENCES public.min_spend_codes(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- FK pour min_spend_codes vers events
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_min_spend_codes_event' 
                   AND table_name = 'min_spend_codes') THEN
        ALTER TABLE public.min_spend_codes
        ADD CONSTRAINT fk_min_spend_codes_event
        FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- FK pour min_spend_codes vers floor_elements
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_min_spend_codes_floor_element' 
                   AND table_name = 'min_spend_codes') THEN
        ALTER TABLE public.min_spend_codes
        ADD CONSTRAINT fk_min_spend_codes_floor_element
        FOREIGN KEY (floor_element_id) REFERENCES public.floor_elements(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- FK pour floor_elements vers events
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_floor_elements_event' 
                   AND table_name = 'floor_elements') THEN
        ALTER TABLE public.floor_elements
        ADD CONSTRAINT fk_floor_elements_event
        FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

END $$;