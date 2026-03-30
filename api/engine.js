// api/engine.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Generate 15 markets with UTC timestamps (10-min windows)
    const markets = Array(15).fill().map(() => ({
      id: crypto.randomUUID(),
      title: `BTC ${Math.random() > 0.5 ? '↑' : '↓'} @ ${Math.random().toFixed(2)}`,
      strike_price: Math.random() * 10000 + 50000,
      locks_at: new Date(Date.now() + 600000).toISOString(), // 10 mins UTC
      resolved: false
    }));

    // 2. Seed house liquidity (50k sats per side)
    const houseBets = markets.flatMap(market => [
      {
        id: crypto.randomUUID(),
        user_id: 'HOUSE_UUID', // Use your actual UUID
        event_id: market.id,
        outcome_index: 0,
        amount: 50000
      },
      {
        id: crypto.randomUUID(),
        user_id: 'HOUSE_UUID',
        event_id: market.id,
        outcome_index: 1,
        amount: 50000
      }
    ]);

    // 3. BULK UPSERT (fixes timeouts)
    const { error: marketsError } = await supabase
      .from('events')
      .upsert(markets, { onConflict: 'id' });

    if (marketsError) throw marketsError;

    const { error: betsError } = await supabase
      .from('bets')
      .upsert(houseBets, { onConflict: 'id' });

    if (betsError) throw betsError;

    res.status(200).json({ markets: markets.length });
  } catch (error) {
    console.error('ENGINE FAILURE:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
