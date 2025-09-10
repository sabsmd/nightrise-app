-- Suppression des tables inutilisées
DROP TABLE IF EXISTS secret_codes CASCADE;
DROP TABLE IF EXISTS reservation_codes CASCADE; 
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS tables CASCADE;

-- Suppression des fonctions liées aux wallets qui ne sont pas utilisées  
DROP FUNCTION IF EXISTS credit_wallet(text, numeric, text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS debit_wallet(text, numeric, text, text, text, text) CASCADE;

-- Suppression de la table min_spend_wallets et min_spend_transactions
DROP TABLE IF EXISTS min_spend_transactions CASCADE;
DROP TABLE IF EXISTS min_spend_wallets CASCADE;

-- Suppression des colonnes inutilisées dans events
ALTER TABLE events DROP COLUMN IF EXISTS image_file CASCADE;

-- Suppression des colonnes inutilisées dans min_spend_codes  
ALTER TABLE min_spend_codes DROP COLUMN IF EXISTS reservation_id CASCADE;