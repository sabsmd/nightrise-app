-- Add 'actif' column to products table to allow enabling/disabling products
ALTER TABLE public.products 
ADD COLUMN actif BOOLEAN NOT NULL DEFAULT true;