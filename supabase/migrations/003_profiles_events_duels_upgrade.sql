-- Profiles, Events, and Duels Schema Upgrades
-- Run this in Supabase SQL Editor

-- 1. Upgrade Profiles for AI Tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_bot boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bot_strategy text;

-- 2. Upgrade Events for Delta Hedging
ALTER TABLE events ADD COLUMN IF NOT EXISTS final_hedge_done boolean DEFAULT false;

-- 3. Upgrade Duels for House Matching
ALTER TABLE duel_challenges ADD COLUMN IF NOT EXISTS house_matched boolean DEFAULT false;
ALTER TABLE duel_challenges ADD COLUMN IF NOT EXISTS house_hedge_bet_id uuid;
ALTER TABLE duel_challenges ADD COLUMN IF NOT EXISTS status text DEFAULT 'open';

-- 4. Arm the Bots & Inject Capital
UPDATE profiles 
SET 
  is_bot = true, 
  bot_strategy = CASE 
    WHEN id = 'b0700000-0000-0000-0000-000000000005' THEN 'house_duel_matcher'
    ELSE 'delta_neutral_hedger'
  END,
  username = CASE id 
    WHEN 'b0700000-0000-0000-0000-000000000001' THEN 'Maxtheillest'
    WHEN 'b0700000-0000-0000-0000-000000000002' THEN 'V2_Toxic'
    WHEN 'b0700000-0000-0000-0000-000000000003' THEN 'AmadGotHoes'
    WHEN 'b0700000-0000-0000-0000-000000000004' THEN 'Uncle_Byron'
    WHEN 'b0700000-0000-0000-0000-000000000005' THEN 'Parlayz_House'
  END,
  usdt_balance = floor(random() * (80000 - 20000 + 1) + 20000)
WHERE id IN (
  'b0700000-0000-0000-0000-000000000001',
  'b0700000-0000-0000-0000-000000000002',
  'b0700000-0000-0000-0000-000000000003',
  'b0700000-0000-0000-0000-000000000004',
  'b0700000-0000-0000-0000-000000000005'
);
