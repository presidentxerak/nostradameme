-- 0019_place_bet_function.sql
-- Atomic bet placement: serializes concurrent bets per user via advisory
-- lock, validates market state + balance, and inserts position + ledger
-- in a single transaction.

CREATE OR REPLACE FUNCTION place_bet(
  p_user_id uuid,
  p_market_id uuid,
  p_side market_side_enum,
  p_amount numeric
) RETURNS TABLE(position_id uuid, new_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
  v_market_status market_status_enum;
  v_betting_end timestamptz;
  v_end_at timestamptz;
  v_position_id uuid;
  v_new_balance numeric;
BEGIN
  -- Serialize concurrent bets for the same user.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  -- Validate amount.
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'bad_amount: amount must be positive' USING ERRCODE = 'P0001';
  END IF;

  -- Compute current balance from the ledger view.
  SELECT COALESCE(balance, 0) INTO v_balance
  FROM user_balance
  WHERE user_id = p_user_id;
  IF v_balance IS NULL THEN v_balance := 0; END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_balance: % < %', v_balance, p_amount
      USING ERRCODE = 'P0002';
  END IF;

  -- Load market state.
  SELECT status, betting_end_at, end_at
    INTO v_market_status, v_betting_end, v_end_at
  FROM markets WHERE id = p_market_id;

  IF v_market_status IS NULL THEN
    RAISE EXCEPTION 'market_not_found' USING ERRCODE = 'P0003';
  END IF;
  IF v_market_status <> 'open' THEN
    RAISE EXCEPTION 'market_not_open: status=%', v_market_status
      USING ERRCODE = 'P0004';
  END IF;
  IF COALESCE(v_betting_end, v_end_at) <= now() + interval '3 seconds' THEN
    RAISE EXCEPTION 'market_locked' USING ERRCODE = 'P0005';
  END IF;

  -- Reject duplicate bet for same user/market (also enforced by UNIQUE).
  IF EXISTS (
    SELECT 1 FROM positions
    WHERE user_id = p_user_id AND market_id = p_market_id
  ) THEN
    RAISE EXCEPTION 'already_bet' USING ERRCODE = 'P0006';
  END IF;

  -- Insert position.
  INSERT INTO positions (user_id, market_id, side, amount, funded, funded_at)
  VALUES (p_user_id, p_market_id, p_side, p_amount, true, now())
  RETURNING id INTO v_position_id;

  v_new_balance := v_balance - p_amount;

  -- Insert matching ledger debit.
  INSERT INTO internal_wallet_ledger (
    user_id, entry_type, amount, reference_type, reference_id, balance_after
  )
  VALUES (
    p_user_id, 'bet', -p_amount, 'position', v_position_id, v_new_balance
  );

  position_id := v_position_id;
  new_balance := v_new_balance;
  RETURN NEXT;
END;
$$;
