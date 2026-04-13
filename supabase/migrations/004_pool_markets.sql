-- ============================================
-- 5-MINUTE POOL MARKETS - SUPABASE TABLES
-- Tracks every window and bet for BTC/ETH/SOL
-- ============================================

-- Pool Windows: one row per 5-minute window per asset
CREATE TABLE IF NOT EXISTS pool_windows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset TEXT NOT NULL,               -- 'BTC', 'ETH', 'SOL'
  window_id TEXT UNIQUE NOT NULL,    -- e.g. 'BTC_20260413_1420'
  opens_at TIMESTAMPTZ NOT NULL,
  locks_at TIMESTAMPTZ NOT NULL,
  resolves_at TIMESTAMPTZ NOT NULL,
  open_price DECIMAL,                -- price at window open
  close_price DECIMAL,              -- price at resolution
  outcome TEXT,                      -- 'up', 'down', null
  total_up_stake DECIMAL DEFAULT 0,
  total_down_stake DECIMAL DEFAULT 0,
  total_pool DECIMAL DEFAULT 0,
  platform_fee DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'open',        -- 'open', 'locked', 'resolved'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pool Bets: one row per individual bet placed
CREATE TABLE IF NOT EXISTS pool_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  window_id TEXT REFERENCES pool_windows(window_id) NOT NULL,
  asset TEXT NOT NULL,
  side TEXT NOT NULL,                -- 'up' or 'down'
  stake DECIMAL NOT NULL,
  share_of_pool DECIMAL,            -- calculated at resolution
  payout DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'pending',    -- 'pending', 'won', 'lost'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pool_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_bets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Pool windows public read" ON pool_windows FOR SELECT USING (true);
CREATE POLICY "Users see own pool bets" ON pool_bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own pool bets" ON pool_bets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_pool_windows_asset ON pool_windows(asset);
CREATE INDEX idx_pool_windows_status ON pool_windows(status);
CREATE INDEX idx_pool_bets_user_id ON pool_bets(user_id);
CREATE INDEX idx_pool_bets_window_id ON pool_bets(window_id);

-- Function to create new window
CREATE OR REPLACE FUNCTION create_pool_window(
  p_asset TEXT,
  p_window_id TEXT
) RETURNS VOID AS $$
DECLARE
  v_now TIMESTAMPTZ;
  v_opens TIMESTAMPTZ;
  v_locks TIMESTAMPTZ;
  v_resolves TIMESTAMPTZ;
  v_open_price DECIMAL;
BEGIN
  v_now := NOW();
  
  -- Calculate window times (5-minute intervals)
  v_opens := date_trunc('minute', v_now);
  v_locks := v_opens + INTERVAL '5 minutes';
  v_resolves := v_opens + INTERVAL '10 minutes';
  
  -- Fetch open price from Binance (placeholder - replace with actual API call)
  -- For now, we'll set it when the window resolves
  v_open_price := NULL;
  
  INSERT INTO pool_windows (asset, window_id, opens_at, locks_at, resolves_at, open_price, status)
  VALUES (p_asset, p_window_id, v_opens, v_locks, v_resolves, v_open_price, 'open')
  ON CONFLICT (window_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to place a bet
CREATE OR REPLACE FUNCTION place_pool_bet(
  p_user_id UUID,
  p_window_id TEXT,
  p_asset TEXT,
  p_side TEXT,
  p_stake DECIMAL
) RETURNS VOID AS $$
DECLARE
  v_window_id TEXT;
BEGIN
  -- Insert the bet
  INSERT INTO pool_bets (user_id, window_id, asset, side, stake, status)
  VALUES (p_user_id, p_window_id, p_asset, p_side, p_stake, 'pending');
  
  -- Update pool totals
  IF p_side = 'up' THEN
    UPDATE pool_windows 
    SET total_up_stake = total_up_stake + p_stake,
        total_pool = total_pool + p_stake
    WHERE window_id = p_window_id;
  ELSE
    UPDATE pool_windows 
    SET total_down_stake = total_down_stake + p_stake,
        total_pool = total_pool + p_stake
    WHERE window_id = p_window_id;
  END IF;
END;
$$ LANGUAGE plpgsql;