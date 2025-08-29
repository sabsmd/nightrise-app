-- Add foreign key constraint from min_spend_codes to floor_elements
ALTER TABLE public.min_spend_codes 
ADD CONSTRAINT min_spend_codes_floor_element_id_fkey 
FOREIGN KEY (floor_element_id) REFERENCES public.floor_elements(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_min_spend_codes_floor_element_id ON public.min_spend_codes(floor_element_id);
CREATE INDEX IF NOT EXISTS idx_min_spend_codes_event_id ON public.min_spend_codes(event_id);
CREATE INDEX IF NOT EXISTS idx_min_spend_codes_code ON public.min_spend_codes(code);