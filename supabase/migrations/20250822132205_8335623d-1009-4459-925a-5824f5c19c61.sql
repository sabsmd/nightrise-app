-- Ajouter les nouveaux champs à la table events
ALTER TABLE public.events 
ADD COLUMN type_evenement TEXT CHECK (type_evenement IN ('Pool Party', 'Boite de nuit', 'Rooftop')),
ADD COLUMN artiste_dj TEXT,
ADD COLUMN image_file TEXT;