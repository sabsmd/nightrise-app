-- Ajouter les contraintes de clé étrangère manquantes pour client_reservations
ALTER TABLE public.client_reservations
ADD CONSTRAINT IF NOT EXISTS fk_client_reservations_event
FOREIGN KEY (event_id)
REFERENCES public.events(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE public.client_reservations
ADD CONSTRAINT IF NOT EXISTS fk_client_reservations_floor_element
FOREIGN KEY (floor_element_id)
REFERENCES public.floor_elements(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE public.client_reservations
ADD CONSTRAINT IF NOT EXISTS fk_client_reservations_min_spend_code
FOREIGN KEY (min_spend_code_id)
REFERENCES public.min_spend_codes(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Ajouter aussi les FK manquantes pour les autres tables
ALTER TABLE public.min_spend_codes
ADD CONSTRAINT IF NOT EXISTS fk_min_spend_codes_event
FOREIGN KEY (event_id)
REFERENCES public.events(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE public.min_spend_codes
ADD CONSTRAINT IF NOT EXISTS fk_min_spend_codes_floor_element
FOREIGN KEY (floor_element_id)
REFERENCES public.floor_elements(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE public.floor_elements
ADD CONSTRAINT IF NOT EXISTS fk_floor_elements_event
FOREIGN KEY (event_id)
REFERENCES public.events(id)
ON DELETE CASCADE
ON UPDATE CASCADE;