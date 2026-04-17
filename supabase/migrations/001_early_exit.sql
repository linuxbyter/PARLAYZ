-- Early bet exit system for crypto markets
-- Adds columns to bets table and creates RPC function for early exit

ALTER TABLE bets ADD COLUMN IF NOT EXISTS exited_early BOOLEAN DEFAULT FALSE;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS exit_refund NUMERIC DEFAULT 0;

CREATE OR REPLACE FUNCTION exit_bet_early(p_bet_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_bet bets%ROWTYPE;
  v_event events%ROWTYPE;
  v_penalty NUMERIC;
  v_refund NUMERIC;
  v_remaining_ms NUMERIC;
BEGIN
  SELECT * INTO v_bet FROM bets WHERE id = p_bet_id AND user_id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bet not found'; END IF;
  IF v_bet.status != 'open' THEN RAISE EXCEPTION 'Bet is not active'; END IF;

  SELECT * INTO v_event FROM events WHERE id = v_bet.event_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;

  -- Only allow exit on auto-resolvable markets (crypto/futures)
  IF NOT (v_event.category LIKE 'Crypto_%' OR v_event.category LIKE 'Finance_Futures%') THEN
    RAISE EXCEPTION 'Early exit only available for crypto/futures markets';
  END IF;

  -- Check 30-second window
  v_remaining_ms := EXTRACT(EPOCH FROM (v_event.closes_at - NOW())) * 1000;
  IF v_remaining_ms < 30000 THEN
    RAISE EXCEPTION 'Exit window closed — less than 30 seconds to resolution';
  END IF;

  -- Calculate refund (80%) and penalty (20%)
  v_penalty := v_bet.stake * 0.20;
  v_refund := v_bet.stake * 0.80;

  -- Refund 80% to user wallet
  UPDATE profiles SET wallet_balance = wallet_balance + v_refund
  WHERE id = p_user_id;

  -- Mark bet as exited
  UPDATE bets SET
    status = 'exited',
    exited_early = TRUE,
    exit_refund = v_refund
  WHERE id = p_bet_id;

  -- Notify user
  INSERT INTO notifications (user_id, message, type, is_read)
  VALUES (
    p_user_id,
    'Early exit: ' || v_refund || ' KSh refunded (80% of ' || v_bet.stake || ' KSh stake). 20% penalty retained in pool.',
    'refund',
    FALSE
  );

  RETURN json_build_object('refund', v_refund, 'penalty', v_penalty);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
