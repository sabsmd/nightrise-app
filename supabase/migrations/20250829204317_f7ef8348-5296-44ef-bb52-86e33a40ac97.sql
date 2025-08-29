-- Nettoyer les données orphelines avant d'ajouter les contraintes FK

-- Supprimer les floor_elements qui référencent des events inexistants
DELETE FROM public.floor_elements 
WHERE event_id NOT IN (SELECT id FROM public.events);

-- Supprimer les min_spend_codes qui référencent des events ou floor_elements inexistants
DELETE FROM public.min_spend_codes 
WHERE event_id NOT IN (SELECT id FROM public.events);

DELETE FROM public.min_spend_codes 
WHERE floor_element_id NOT IN (SELECT id FROM public.floor_elements);

-- Supprimer les client_reservations qui référencent des données inexistantes
DELETE FROM public.client_reservations 
WHERE event_id NOT IN (SELECT id FROM public.events);

DELETE FROM public.client_reservations 
WHERE floor_element_id NOT IN (SELECT id FROM public.floor_elements);

DELETE FROM public.client_reservations 
WHERE min_spend_code_id NOT IN (SELECT id FROM public.min_spend_codes);

-- Maintenant ajouter les contraintes FK
DO $$ 
BEGIN
    -- FK pour floor_elements vers events
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_floor_elements_event' 
                   AND table_name = 'floor_elements') THEN
        ALTER TABLE public.floor_elements
        ADD CONSTRAINT fk_floor_elements_event
        FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE ON UPDATE CASCADE;
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

END $$;