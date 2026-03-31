// api/engine.js - 5-Minute Crypto Market Cycle Engine
// 10-min cycles: :00, :10, :20, :30, :40, :50
// :00-:05 = BET WINDOW (5 min) | :05-:10 = SWEATING/LOCKED | :10 = RESOLVE + NEW MARKET OPENS
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const now = new Date()
    const mins = now.getMinutes()
    const cycleStartMin = Math.floor(mins / 10) * 10
    const betWindowEnd = cycleStartMin + 5
    const cycleEndMin = cycleStartMin + 10

    // Fetch live BTC price
    let btcPrice = 100000
    try {
      const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
      const priceData = await priceRes.json()
      btcPrice = parseFloat(priceData.price)
    } catch (e) {
      console.error('Failed to fetch BTC price:', e)
    }

    // Market IDs
    const openMarketId = `cycle-${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${cycleStartMin}`
    const sweatMarketId = `cycle-${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${betWindowEnd}`

    // 1. Create OPEN market if it doesn't exist
    const { data: existingOpen } = await supabase.from('events').select('*').eq('id', openMarketId).single()
    if (!existingOpen) {
      const lockTime = new Date(now)
      lockTime.setMinutes(betWindowEnd, 0, 0)

      const strikeUp = (btcPrice * 1.001).toFixed(2)
      const strikeDown = (btcPrice * 0.999).toFixed(2)

      const { data: newMarket, error: marketError } = await supabase.from('events').insert({
        id: openMarketId,
        title: `Will BTC be above $${btcPrice.toFixed(0)} at :${String(betWindowEnd).padStart(2, '0')}?`,
        description: `BTC/USDT 5-min cycle market.\nOpen at :${String(cycleStartMin).padStart(2, '0')} | Bets lock at :${String(betWindowEnd).padStart(2, '0')} | Resolves at :${String(cycleEndMin >= 60 ? 0 : cycleEndMin).padStart(2, '0')}\n\nUP: BTC >= $${btcPrice.toFixed(0)}\nDOWN: BTC < $${btcPrice.toFixed(0)}\n\nCurrent: $${btcPrice.toFixed(2)}`,
        category: 'Crypto_Majors',
        outcomes: ['UP', 'DOWN'],
        closes_at: lockTime.toISOString(),
        locks_at: lockTime.toISOString(),
        resolved: false,
        settlement_source: 'binance',
        created_at: now.toISOString(),
      }).select().single()

      if (marketError) throw marketError
      console.log(`✅ Created open market: ${openMarketId}`)
    }

    // 2. Resolve SWEATING market if it's time
    const { data: sweatMarket } = await supabase.from('events').select('*').eq('id', sweatMarketId).single()
    if (sweatMarket && !sweatMarket.resolved && mins >= betWindowEnd) {
      const { data: sweatBets } = await supabase.from('bets').select('*').eq('event_id', sweatMarketId).eq('status', 'open')

      if (sweatBets && sweatBets.length > 0) {
        try {
          const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
          const priceData = await priceRes.json()
          const currentBtc = parseFloat(priceData.price)

          const strikeMatch = sweatMarket.description?.match(/above \$(\d+)/)
          const strike = strikeMatch ? parseFloat(strikeMatch[1]) : btcPrice
          const isUp = currentBtc >= strike
          const winningOutcome = isUp ? 0 : 1
          const losingOutcome = winningOutcome === 0 ? 1 : 0

          await supabase.from('events').update({ resolved: true }).eq('id', sweatMarketId)
          await supabase.from('bets').update({ status: 'lost' }).eq('event_id', sweatMarketId).eq('outcome_index', losingOutcome).eq('status', 'open')
          await supabase.from('bets').update({ status: 'won' }).eq('event_id', sweatMarketId).eq('outcome_index', winningOutcome).eq('status', 'open')

          const winners = sweatBets.filter(b => b.outcome_index === winningOutcome)
          const totalPool = sweatBets.reduce((sum, b) => sum + b.stake, 0)
          const winningPool = winners.reduce((sum, b) => sum + b.stake, 0)

          for (const winner of winners) {
            const share = winner.stake / winningPool
            const grossPayout = share * totalPool
            const profit = grossPayout - winner.stake
            const fee = profit > 0 ? profit * 0.03 : 0
            const netPayout = winner.stake + profit - fee
            const isUSDT = winner.stake_currency === 'USDT'

            const balanceField = isUSDT ? 'usdt_balance' : 'wallet_balance'
            const { data: prof } = await supabase.from('profiles').select(balanceField).eq('id', winner.user_id).single()
            const newBalance = (prof?.[balanceField] || 0) + netPayout
            await supabase.from('profiles').update({ [balanceField]: newBalance }).eq('id', winner.user_id)

            await supabase.from('notifications').insert({
              user_id: winner.user_id,
              message: `✅ Won ${netPayout.toFixed(2)} ${isUSDT ? 'USDT' : 'KSh'} on BTC ${isUp ? 'UP' : 'DOWN'}!`,
              type: 'bet_won',
              is_read: false,
            })
          }

          const losers = sweatBets.filter(b => b.outcome_index === losingOutcome)
          for (const loser of losers) {
            await supabase.from('notifications').insert({
              user_id: loser.user_id,
              message: `❌ BTC went ${isUp ? 'UP' : 'DOWN'}. Lost ${loser.stake} ${loser.stake_currency || 'KSh'}.`,
              type: 'bet_lost',
              is_read: false,
            })
          }

          console.log(`✅ Resolved ${sweatMarketId}: ${isUp ? 'UP' : 'DOWN'} @ $${currentBtc.toFixed(2)}`)
        } catch (resolveError) {
          console.error('Auto-resolution failed:', resolveError)
        }
      }
    }

    // 3. Seed house liquidity on new open market
    if (!existingOpen) {
      const houseBets = [
        { id: `${openMarketId}-house-0`, user_id: process.env.HOUSE_USER_ID || '00000000-0000-0000-0000-000000000000', event_id: openMarketId, outcome_index: 0, stake: 1, stake_currency: 'USDT', status: 'open' },
        { id: `${openMarketId}-house-1`, user_id: process.env.HOUSE_USER_ID || '00000000-0000-0000-0000-000000000000', event_id: openMarketId, outcome_index: 1, stake: 1, stake_currency: 'USDT', status: 'open' },
      ]
      const { error: betsError } = await supabase.from('bets').insert(houseBets)
      if (betsError) console.error('House liquidity error:', betsError)
    }

    res.status(200).json({
      success: true,
      btcPrice,
      openMarketId,
      sweatMarketId,
      cycleStartMin,
      betWindowEnd,
      cycleEndMin: cycleEndMin >= 60 ? 0 : cycleEndMin,
    })
  } catch (error) {
    console.error('ENGINE FAILURE:', error)
    res.status(500).json({ error: error.message })
  }
}
