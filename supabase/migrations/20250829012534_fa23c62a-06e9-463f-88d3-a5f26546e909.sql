-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.validate_reservation_element()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (SELECT floor_element_id FROM min_spend_codes WHERE id = NEW.min_spend_code_id) <> NEW.floor_element_id THEN
    RAISE EXCEPTION 'Erreur: ce code minimum spend est valide uniquement pour l element associe.';
  END IF;
  RETURN NEW;
END;
$$;