-- Run this entire file in Supabase SQL Editor
-- Creates duel system, challenged_bets, and profile balance sync

-- 1. Update profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS usdt_balance NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ksh_balance NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_bets_count INTEGER DEFAULT 0;

-- 2. Duel challenges table
CREATE TABLE IF NOT EXISTS duel_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('UP', 'DOWN')),
  stake NUMERIC NOT NULL CHECK (stake > 0),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'expired')),
  matched_by UUID REFERENCES auth.users(id),
  matched_at TIMESTAMPTZ,
  house_matched BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 3. Challenged bets (accepted duels)
CREATE TABLE IF NOT EXISTS challenged_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  duel_id UUID REFERENCES duel_challenges(id) ON DELETE CASCADE,
  challenger_id UUID REFERENCES auth.users(id),
  acceptor_id UUID REFERENCES auth.users(id),
  market_id TEXT NOT NULL,
  side TEXT NOT NULL,
  stake NUMERIC NOT NULL,
  house_odds NUMERIC DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_duel_challenges_market ON duel_challenges(market_id, status);
CREATE INDEX IF NOT EXISTS idx_duel_challenges_expires ON duel_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_challenged_bets_duel ON challenged_bets(duel_id);
CREATE INDEX IF NOT EXISTS idx_challenged_bets_user ON challenged_bets(acceptor_id, status);

-- 5. RLS Policies
ALTER TABLE duel_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenged_bets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view open duels" ON duel_challenges;
CREATE POLICY "Anyone can view open duels" ON duel_challenges
  FOR SELECT USING (status = 'open');

DROP POLICY IF EXISTS "Users can view their own duels" ON duel_challenges;
CREATE POLICY "Users can view their own duels" ON duel_challenges
  FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = matched_by);

DROP POLICY IF EXISTS "Users can create duels" ON duel_challenges;
CREATE POLICY "Users can create duels" ON duel_challenges
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can view their challenged bets" ON challenged_bets;
CREATE POLICY "Users can view their challenged bets" ON challenged_bets
  FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = acceptor_id);

DROP POLICY IF EXISTS "Users can accept duels" ON challenged_bets;
CREATE POLICY "Users can accept duels" ON challenged_bets
  FOR INSERT WITH CHECK (auth.uid() = acceptor_id);

-- 6. Function: Accept a duel
CREATE OR REPLACE FUNCTION accept_duel(p_duel_id UUID, p_stake NUMERIC)
RETURNS JSON AS $$
DECLARE
  v_duel duel_challenges%ROWTYPE;
  v_acceptor_balance NUMERIC;
BEGIN
  SELECT * INTO v_duel FROM duel_challenges WHERE id = p_duel_id AND status = 'open';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Duel not found or already matched';
  END IF;

  IF p_stake != v_duel.stake THEN
    RAISE EXCEPTION 'Stake must match challenge amount';
  END IF;

  SELECT usdt_balance INTO v_acceptor_balance FROM profiles WHERE id = auth.uid();
  IF v_acceptor_balance < p_stake THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE profiles SET usdt_balance = usdt_balance - p_stake WHERE id = auth.uid();

  UPDATE duel_challenges SET
    status = 'matched',
    matched_by = auth.uid(),
    matched_at = NOW()
  WHERE id = p_duel_id;

  INSERT INTO challenged_bets (duel_id, challenger_id, acceptor_id, market_id, side, stake)
  VALUES (p_duel_id, v_duel.creator_id, auth.uid(), v_duel.market_id, v_duel.side, p_stake);

  RETURN json_build_object('success', true, 'duel_id', p_duel_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function: Create a duel challenge
CREATE OR REPLACE FUNCTION create_duel_challenge(
  p_market_id TEXT,
  p_side TEXT,
  p_stake NUMERIC,
  p_duration_minutes INTEGER DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
  v_duel_id UUID;
  v_balance NUMERIC;
BEGIN
  SELECT usdt_balance INTO v_balance FROM profiles WHERE id = auth.uid();
  IF v_balance < p_stake THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE profiles SET usdt_balance = usdt_balance - p_stake WHERE id = auth.uid();

  INSERT INTO duel_challenges (creator_id, market_id, side, stake, expires_at)
  VALUES (auth.uid(), p_market_id, p_side, p_stake, NOW() + (p_duration_minutes || ' minutes')::INTERVAL)
  RETURNING id INTO v_duel_id;

  RETURN json_build_object('success', true, 'duel_id', v_duel_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function: House match unmatched duels at lock time
CREATE OR REPLACE FUNCTION house_match_duels(p_market_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_duel RECORD;
  v_matched_count INTEGER := 0;
BEGIN
  FOR v_duel IN
    SELECT * FROM duel_challenges
    WHERE market_id = p_market_id
    AND status = 'open'
    AND expires_at <= NOW()
  LOOP
    UPDATE duel_challenges SET
      status = 'matched',
      matched_by = '00000000-0000-0000-0000-000000000000'::UUID,
      matched_at = NOW(),
      house_matched = TRUE
    WHERE id = v_duel.id;

    INSERT INTO challenged_bets (duel_id, challenger_id, acceptor_id, market_id, side, stake, house_odds)
    VALUES (v_duel.id, v_duel.creator_id, '00000000-0000-0000-0000-000000000000'::UUID, v_duel.market_id, v_duel.side, v_duel.stake * 0.75, 0.75);

    v_matched_count := v_matched_count + 1;
  END LOOP;

  RETURN v_matched_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
