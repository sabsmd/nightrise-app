-- Clean up any orphaned data first
DELETE FROM floor_elements WHERE event_id NOT IN (SELECT id FROM events);
DELETE FROM min_spend_codes WHERE event_id NOT IN (SELECT id FROM events);
DELETE FROM min_spend_codes WHERE floor_element_id NOT IN (SELECT id FROM floor_elements);
DELETE FROM client_reservations WHERE event_id NOT IN (SELECT id FROM events);
DELETE FROM client_reservations WHERE floor_element_id NOT IN (SELECT id FROM floor_elements);
DELETE FROM client_reservations WHERE min_spend_code_id NOT IN (SELECT id FROM min_spend_codes);

-- Add foreign key constraints
ALTER TABLE floor_elements 
ADD CONSTRAINT fk_floor_elements_event_id 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE min_spend_codes 
ADD CONSTRAINT fk_min_spend_codes_event_id 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE min_spend_codes 
ADD CONSTRAINT fk_min_spend_codes_floor_element_id 
FOREIGN KEY (floor_element_id) REFERENCES floor_elements(id) ON DELETE CASCADE;

ALTER TABLE client_reservations 
ADD CONSTRAINT fk_client_reservations_event_id 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE client_reservations 
ADD CONSTRAINT fk_client_reservations_floor_element_id 
FOREIGN KEY (floor_element_id) REFERENCES floor_elements(id) ON DELETE CASCADE;

ALTER TABLE client_reservations 
ADD CONSTRAINT fk_client_reservations_min_spend_code_id 
FOREIGN KEY (min_spend_code_id) REFERENCES min_spend_codes(id) ON DELETE CASCADE;