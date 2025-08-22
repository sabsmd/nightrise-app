-- Add color column to floor_elements table
ALTER TABLE public.floor_elements 
ADD COLUMN couleur TEXT DEFAULT '#3B82F6';