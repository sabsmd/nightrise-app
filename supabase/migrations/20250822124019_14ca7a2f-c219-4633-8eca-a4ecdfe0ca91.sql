-- 1. Ajouter les colonnes nécessaires si elles n'existent pas déjà
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telephone text,
ADD COLUMN IF NOT EXISTS etablissement text,
ADD COLUMN IF NOT EXISTS siret text UNIQUE;

-- 2. Supprimer la contrainte si elle existe déjà pour éviter les doublons
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS check_siret_for_admin;

-- 3. Ajouter une contrainte pour forcer SIRET uniquement aux admins
ALTER TABLE public.profiles
ADD CONSTRAINT check_siret_for_admin
CHECK (
  (role = 'client' AND siret IS NULL)
  OR
  (role = 'admin' AND siret IS NOT NULL)
);

-- 4. Recréer la fonction handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (NEW.raw_user_meta_data ->> 'role')::user_role = 'admin' THEN
    -- Vérifie que le SIRET est fourni
    IF NEW.raw_user_meta_data ->> 'siret' IS NULL THEN
      RAISE EXCEPTION 'Un numéro de SIRET est obligatoire pour les comptes professionnels (admin)';
    END IF;

    INSERT INTO public.profiles (user_id, nom, email, role, telephone, etablissement, siret)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'nom', 'Professionnel'),
      NEW.email,
      'admin',
      NEW.raw_user_meta_data ->> 'telephone',
      NEW.raw_user_meta_data ->> 'etablissement',
      NEW.raw_user_meta_data ->> 'siret'
    );
  ELSE
    -- Cas client (pas de SIRET ni établissement obligatoire)
    INSERT INTO public.profiles (user_id, nom, email, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'nom', 'Utilisateur'),
      NEW.email,
      'client'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 5. (Optionnel mais recommandé) Supprimer l'ancien trigger et recréer le trigger lié
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();