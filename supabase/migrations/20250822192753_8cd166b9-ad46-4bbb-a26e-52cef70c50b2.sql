-- Ajouter les colonnes manquantes à la table min_spend_codes
ALTER TABLE public.min_spend_codes 
ADD COLUMN IF NOT EXISTS nom_client TEXT,
ADD COLUMN IF NOT EXISTS prenom_client TEXT,
ADD COLUMN IF NOT EXISTS telephone_client TEXT;

-- Mettre à jour les contraintes pour rendre ces champs obligatoires
ALTER TABLE public.min_spend_codes 
ALTER COLUMN nom_client SET NOT NULL,
ALTER COLUMN prenom_client SET NOT NULL,
ALTER COLUMN telephone_client SET NOT NULL;