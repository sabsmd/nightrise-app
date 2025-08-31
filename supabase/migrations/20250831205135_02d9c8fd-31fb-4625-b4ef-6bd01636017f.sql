-- Add unique partial indexes to prevent double bookings
-- For reservations table
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_unique_active 
ON reservations (event_id, floor_element_id) 
WHERE statut = 'active';

-- For client_reservations table  
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_reservations_unique_active 
ON client_reservations (event_id, floor_element_id) 
WHERE statut = 'active';

-- Enable realtime for reservations table
ALTER TABLE reservations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;