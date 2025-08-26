-- Table principale des wallets minimum spend
CREATE TABLE public.min_spend_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- Code de réservation existant (lié à une table)
  currency TEXT NOT NULL DEFAULT 'EUR',
  initial_credit DECIMAL(12,2) NOT NULL CHECK (initial_credit >= 0),
  remaining_credit DECIMAL(12,2) NOT NULL CHECK (remaining_credit >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Contraintes supplémentaires
  CONSTRAINT remaining_credit_lte_initial CHECK (remaining_credit <= initial_credit)
);

-- Table des transactions liées aux wallets
CREATE TABLE public.min_spend_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.min_spend_wallets(id) ON DELETE CASCADE,
  code TEXT NOT NULL, -- copie du code pour audit / export rapide
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit', 'refund', 'adjustment')),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  order_id TEXT, -- optionnel, si relié à une commande
  source TEXT NOT NULL DEFAULT 'app' CHECK (source IN ('app','pos','staff','system')),
  idempotency_key TEXT, -- pour éviter les doublons sur un même paiement
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Contraintes & index
  CONSTRAINT unique_idempotency UNIQUE (idempotency_key)
);

-- Index utiles pour performance
CREATE INDEX idx_wallet_code ON public.min_spend_wallets(code);
CREATE INDEX idx_tx_wallet_id ON public.min_spend_transactions(wallet_id);
CREATE INDEX idx_tx_code ON public.min_spend_transactions(code);
CREATE INDEX idx_tx_created_at ON public.min_spend_transactions(created_at);

-- Enable RLS
ALTER TABLE public.min_spend_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.min_spend_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour min_spend_wallets
CREATE POLICY "Admins can manage all wallets" ON public.min_spend_wallets
FOR ALL USING (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Everyone can view wallets (for validation)" ON public.min_spend_wallets
FOR SELECT USING (true);

-- RLS Policies pour min_spend_transactions
CREATE POLICY "Admins can manage all transactions" ON public.min_spend_transactions
FOR ALL USING (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Everyone can view transactions (for validation)" ON public.min_spend_transactions
FOR SELECT USING (true);

-- Trigger pour updated_at sur min_spend_wallets
CREATE TRIGGER update_min_spend_wallets_updated_at
BEFORE UPDATE ON public.min_spend_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour débiter un wallet de manière atomique
CREATE OR REPLACE FUNCTION public.debit_wallet(
  p_code TEXT,
  p_amount DECIMAL(12,2),
  p_order_id TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'app',
  p_idempotency_key TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet min_spend_wallets%ROWTYPE;
  v_new_balance DECIMAL(12,2);
  v_transaction_id UUID;
BEGIN
  -- Vérifier si la transaction existe déjà (idempotence)
  IF p_idempotency_key IS NOT NULL THEN
    SELECT wallet_id INTO v_transaction_id
    FROM min_spend_transactions 
    WHERE idempotency_key = p_idempotency_key;
    
    IF FOUND THEN
      -- Transaction déjà traitée, retourner le wallet actuel
      SELECT * INTO v_wallet FROM min_spend_wallets WHERE code = p_code;
      RETURN json_build_object(
        'success', true,
        'message', 'Transaction already processed',
        'remaining_credit', v_wallet.remaining_credit,
        'wallet_id', v_wallet.id
      );
    END IF;
  END IF;

  -- Lock le wallet pour éviter les courses
  SELECT * INTO v_wallet 
  FROM min_spend_wallets 
  WHERE code = p_code 
  FOR UPDATE;

  -- Vérifications
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  IF v_wallet.status != 'active' THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not active');
  END IF;

  IF v_wallet.expires_at IS NOT NULL AND v_wallet.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Wallet expired');
  END IF;

  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  IF v_wallet.remaining_credit < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient credit');
  END IF;

  -- Calculer le nouveau solde
  v_new_balance := v_wallet.remaining_credit - p_amount;

  -- Créer la transaction
  INSERT INTO min_spend_transactions (
    wallet_id, code, type, amount, order_id, source, idempotency_key, notes
  ) VALUES (
    v_wallet.id, p_code, 'debit', p_amount, p_order_id, p_source, p_idempotency_key, p_notes
  ) RETURNING id INTO v_transaction_id;

  -- Mettre à jour le wallet
  UPDATE min_spend_wallets 
  SET remaining_credit = v_new_balance,
      updated_at = now(),
      updated_by = auth.uid()
  WHERE id = v_wallet.id;

  RETURN json_build_object(
    'success', true,
    'message', 'Debit successful',
    'remaining_credit', v_new_balance,
    'transaction_id', v_transaction_id,
    'wallet_id', v_wallet.id
  );
END;
$$;

-- Fonction pour créditer un wallet (refund/adjustment)
CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_code TEXT,
  p_amount DECIMAL(12,2),
  p_type TEXT DEFAULT 'credit',
  p_order_id TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'staff',
  p_idempotency_key TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet min_spend_wallets%ROWTYPE;
  v_new_balance DECIMAL(12,2);
  v_transaction_id UUID;
BEGIN
  -- Vérifier si la transaction existe déjà (idempotence)
  IF p_idempotency_key IS NOT NULL THEN
    SELECT wallet_id INTO v_transaction_id
    FROM min_spend_transactions 
    WHERE idempotency_key = p_idempotency_key;
    
    IF FOUND THEN
      -- Transaction déjà traitée, retourner le wallet actuel
      SELECT * INTO v_wallet FROM min_spend_wallets WHERE code = p_code;
      RETURN json_build_object(
        'success', true,
        'message', 'Transaction already processed',
        'remaining_credit', v_wallet.remaining_credit,
        'wallet_id', v_wallet.id
      );
    END IF;
  END IF;

  -- Lock le wallet
  SELECT * INTO v_wallet 
  FROM min_spend_wallets 
  WHERE code = p_code 
  FOR UPDATE;

  -- Vérifications
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Calculer le nouveau solde (ne pas dépasser l'initial_credit)
  v_new_balance := LEAST(v_wallet.remaining_credit + p_amount, v_wallet.initial_credit);

  -- Créer la transaction
  INSERT INTO min_spend_transactions (
    wallet_id, code, type, amount, order_id, source, idempotency_key, notes
  ) VALUES (
    v_wallet.id, p_code, p_type, p_amount, p_order_id, p_source, p_idempotency_key, p_notes
  ) RETURNING id INTO v_transaction_id;

  -- Mettre à jour le wallet
  UPDATE min_spend_wallets 
  SET remaining_credit = v_new_balance,
      updated_at = now(),
      updated_by = auth.uid()
  WHERE id = v_wallet.id;

  RETURN json_build_object(
    'success', true,
    'message', 'Credit successful',
    'remaining_credit', v_new_balance,
    'transaction_id', v_transaction_id,
    'wallet_id', v_wallet.id
  );
END;
$$;