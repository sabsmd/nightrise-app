-- Fix security linter: set stable SECURITY DEFINER functions with explicit search_path

-- 1) get_current_user_role with fixed search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- 2) update_updated_at_column with fixed search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3) handle_new_user with fixed search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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