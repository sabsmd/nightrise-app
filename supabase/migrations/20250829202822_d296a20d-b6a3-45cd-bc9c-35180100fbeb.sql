-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_min_spend_codes_floor_element_id ON public.min_spend_codes(floor_element_id);
CREATE INDEX IF NOT EXISTS idx_client_reservations_floor_element_id ON public.client_reservations(floor_element_id);
CREATE INDEX IF NOT EXISTS idx_client_reservations_event_id ON public.client_reservations(event_id);
CREATE INDEX IF NOT EXISTS idx_client_reservations_statut ON public.client_reservations(statut);
CREATE INDEX IF NOT EXISTS idx_floor_elements_event_id ON public.floor_elements(event_id);

-- Index composé pour optimiser les requêtes de réservations actives par événement
CREATE INDEX IF NOT EXISTS idx_client_reservations_event_statut ON public.client_reservations(event_id, statut);

-- Index pour optimiser les requêtes sur les codes actifs
CREATE INDEX IF NOT EXISTS idx_min_spend_codes_statut ON public.min_spend_codes(statut);