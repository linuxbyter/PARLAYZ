import React, { useState, useEffect } from 'react'
import { getCycleInfo } from './MarketTimer'
import { Lock, ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react'

export default function BetInterface({
  market,
  profile,
  onSubmitBet,
  showToast,
  poolBets = [],
}) {
  const [selectedOutcome, setSelectedOutcome] = useState(null)
  const [stakeAmount, setStakeAmount] = useState(0.5)
  const [canBet, setCanBet] = useState(true)
  const [betLockedAt, setBetLockedAt] = useState('')

  const QUICK_STAKES = [0.5, 1, 5]

  useEffect(() => {
    const update = () => {
      const cycle = getCycleInfo()
      const canPlace = cycle.isBetWindowOpen
      setCanBet(canPlace)
      setBetLockedAt(
        canPlace
          ? `Locks in ${cycle.betMinsLeft}:${String(cycle.betSecsLeft).padStart(2, '0')}`
          : `Pool locked at :${String(cycle.betWindowEnd).padStart(2, '0')}`
      )
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleBet = () => {
    if (!canBet) {
      if (showToast) showToast('Betting window is closed! Wait for next cycle.', 'error')
      return
    }
    if (selectedOutcome === null) {
      if (showToast) showToast('Select an outcome first', 'error')
      return
    }
    if (!profile || (profile.usdt_balance || 0) < stakeAmount) {
      if (showToast) showToast('Insufficient USDT balance', 'error')
      return
    }
    if (stakeAmount < 0.1) {
      if (showToast) showToast('Minimum bet is 0.1 USDT', 'error')
      return
    }

    onSubmitBet({
      eventId: market?.id,
      outcomeIndex: selectedOutcome,
      stake: stakeAmount,
      currency: 'USDT',
    })

    setSelectedOutcome(null)
  }

  const totalPool = poolBets.reduce((sum, b) => sum + (b.stake || 0), 0)
  const outcome0Vol = poolBets.filter((b) => b.outcome_index === 0).reduce((sum, b) => sum + (b.stake || 0), 0)
  const pct0 = totalPool === 0 ? 50 : Math.round((outcome0Vol / totalPool) * 100)

  const estPayout = stakeAmount * 1.8
  const estProfit = estPayout - stakeAmount

  return (
    <div className="bg-[#151515] border border-[#1F1F1F] rounded-3xl overflow-hidden shadow-2xl">
      {/* Status Bar */}
      <div className={`px-4 py-2 flex items-center justify-between text-xs font-bold ${
        canBet ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
      }`}>
        <div className="flex items-center gap-2">
          {canBet ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              ACCEPTING BETS
            </>
          ) : (
            <>
              <Lock className="w-3 h-3" />
              POOL LOCKED
            </>
          )}
        </div>
        <span className="font-mono text-[10px]">{betLockedAt}</span>
      </div>

      {/* Market Info */}
      {market && (
        <div className="p-4 border-b border-[#1F1F1F]">
          <h3 className="text-sm font-bold text-white mb-1">{market.title}</h3>
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <span>Pool: {totalPool.toFixed(2)} USDT</span>
            <span>{pct0}% / {100 - pct0}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-[#D9C5A0] transition-all duration-500" style={{ width: `${pct0}%` }} />
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Outcome Selection */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => canBet && setSelectedOutcome(0)}
            disabled={!canBet}
            className={`rounded-xl py-3 text-sm font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
              selectedOutcome === 0
                ? 'bg-green-500 border-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                : canBet
                ? 'border-[#1F1F1F] bg-[#1a1a1a] text-gray-400 hover:border-green-500/50'
                : 'border-[#1F1F1F] bg-[#111] text-gray-600 cursor-not-allowed'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            {market?.outcomes?.[0] || 'UP'}
          </button>
          <button
            onClick={() => canBet && setSelectedOutcome(1)}
            disabled={!canBet}
            className={`rounded-xl py-3 text-sm font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
              selectedOutcome === 1
                ? 'bg-red-500 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                : canBet
                ? 'border-[#1F1F1F] bg-[#1a1a1a] text-gray-400 hover:border-red-500/50'
                : 'border-[#1F1F1F] bg-[#111] text-gray-600 cursor-not-allowed'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            {market?.outcomes?.[1] || 'DOWN'}
          </button>
        </div>

        {/* Quick Stakes */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
            Stake (USDT)
          </label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {QUICK_STAKES.map((amt) => (
              <button
                key={amt}
                onClick={() => canBet && setStakeAmount(amt)}
                disabled={!canBet}
                className={`rounded-xl py-3 text-sm font-black uppercase tracking-widest transition-all border ${
                  stakeAmount === amt
                    ? 'bg-[#26a17b] border-[#26a17b] text-white shadow-[0_0_15px_rgba(38,161,123,0.3)]'
                    : canBet
                    ? 'border-[#1F1F1F] bg-[#1a1a1a] text-gray-400 hover:border-[#26a17b]/50'
                    : 'border-[#1F1F1F] bg-[#111] text-gray-600 cursor-not-allowed'
                }`}
              >
                {amt} USDT
              </button>
            ))}
          </div>
          <input
            type="number"
            value={stakeAmount || ''}
            onChange={(e) => setStakeAmount(parseFloat(e.target.value) || 0)}
            placeholder="Custom amount"
            step="0.1"
            disabled={!canBet}
            className="w-full rounded-xl border border-[#1F1F1F] bg-[#0a0a0a] py-3 px-4 text-lg font-bold text-white focus:border-[#26a17b] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-mono"
          />
        </div>

        {/* Payout Estimate */}
        {selectedOutcome !== null && (
          <div className="bg-[#0a0a0a] border border-[#1F1F1F] rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 uppercase tracking-wider">Stake</span>
              <span className="text-white font-mono font-bold">{stakeAmount.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 uppercase tracking-wider">Est. Payout</span>
              <span className="text-green-400 font-mono font-bold">{estPayout.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between text-xs pt-1.5 border-t border-[#1F1F1F]">
              <span className="text-gray-500 uppercase tracking-wider">Profit</span>
              <span className="text-green-400 font-mono font-bold">+{estProfit.toFixed(2)} USDT</span>
            </div>
          </div>
        )}

        {/* Balance */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>USDT Balance</span>
          <span className="text-white font-mono font-bold">
            {(profile?.usdt_balance || 0).toFixed(2)} USDT
          </span>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleBet}
          disabled={!canBet || selectedOutcome === null || stakeAmount < 0.1}
          className={`w-full rounded-xl py-4 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            canBet
              ? 'bg-[#26a17b] hover:bg-[#1e8c6b] text-white'
              : 'bg-[#1F1F1F] text-gray-500'
          }`}
        >
          {canBet ? (
            <>
              <ArrowUpRight className="w-4 h-4" />
              Place Bet
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Pool Locked
            </>
          )}
        </button>
      </div>
    </div>
  )
}
