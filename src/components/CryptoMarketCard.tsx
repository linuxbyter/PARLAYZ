'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown, Lock, CheckCircle, XCircle } from 'lucide-react'

const SLOT_MS = 5 * 60 * 1000

function getSlotEndTime(slot: number): number {
  return (slot + 1) * SLOT_MS
}

function getTimeRemainingInSlot(slot: number): number {
  return Math.max(0, getSlotEndTime(slot) - Date.now())
}

interface MarketSlotState {
  slot: number
  phase: 'OPEN' | 'LOCKED' | 'RESOLVED'
  strikePrice: number | null
  currentPrice: number
  priceHistory: { time: number; price: number }[]
  upPool: number
  downPool: number
  userSide: 'UP' | 'DOWN' | null
  userStake: number
  floatingBets: { id: string; amount: number }[]
  resolution: 'UP' | 'DOWN' | null
}

interface CryptoMarketCardProps {
  slot: number
  phase: 'OPEN' | 'LOCKED'
  coin: string
  initialPrice: number
  livePrice: number
  priceHistory: { time: number; price: number }[]
  onResolve?: (resolution: 'UP' | 'DOWN', slot: number) => void
}

export const CryptoMarketCard: React.FC<CryptoMarketCardProps> = ({
  slot,
  phase,
  coin,
  initialPrice,
  livePrice,
  priceHistory,
  onResolve,
}) => {
  const [state, setState] = useState<MarketSlotState>({
    slot,
    phase,
    strikePrice: null,
    currentPrice: initialPrice,
    priceHistory: [],
    upPool: 0,
    downPool: 0,
    userSide: null,
    userStake: 0,
    floatingBets: [],
    resolution: null,
  })

  const [timeRemaining, setTimeRemaining] = useState(getTimeRemainingInSlot(slot))
  const [showResolved, setShowResolved] = useState(false)
  const strikeCaptured = useRef(false)
  const resolvedRef = useRef(false)

  useEffect(() => {
    if (phase === 'LOCKED' && !strikeCaptured.current && state.strikePrice === null) {
      strikeCaptured.current = true
      setState(prev => ({ ...prev, strikePrice: initialPrice }))
    }
  }, [])

  useEffect(() => {
    const tick = setInterval(() => {
      const remaining = getTimeRemainingInSlot(slot)
      setTimeRemaining(remaining)

      setState(prev => ({ ...prev, currentPrice: livePrice }))

      if (phase === 'LOCKED' && remaining <= 0 && !resolvedRef.current) {
        resolvedRef.current = true
        const finalPrice = livePrice
        const strike = state.strikePrice ?? initialPrice
        const resolution: 'UP' | 'DOWN' = finalPrice > strike ? 'UP' : 'DOWN'

        setState(p => ({ ...p, phase: 'RESOLVED', resolution }))
        if (onResolve) onResolve(resolution, slot)

        setTimeout(() => {
          setShowResolved(true)
        }, 5000)
      }
    }, 1000)

    return () => clearInterval(tick)
  }, [slot, phase, livePrice, initialPrice, onResolve, state.strikePrice])

  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 1000 / 60).toString().padStart(2, '0')
    const s = Math.floor((seconds / 1000) % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleBet = (direction: 'UP' | 'DOWN', amount: number) => {
    if (state.phase !== 'OPEN') return

    setState(prev => ({
      ...prev,
      upPool: direction === 'UP' ? prev.upPool + amount : prev.upPool,
      downPool: direction === 'DOWN' ? prev.downPool + amount : prev.downPool,
      userSide: prev.userSide ?? direction,
      userStake: prev.userStake + amount,
    }))

    const animId = crypto.randomUUID()
    setState(prev => ({
      ...prev,
      floatingBets: [...prev.floatingBets, { id: animId, amount }],
    }))

    setTimeout(() => {
      setState(prev => ({
        ...prev,
        floatingBets: prev.floatingBets.filter(a => a.id !== animId),
      }))
    }, 1600)
  }

  const totalPool = state.upPool + state.downPool

  const resolutionTime = format(new Date(getSlotEndTime(slot)), 'h:mm a')

  const cardTitle = useMemo(() => {
    if (state.phase === 'RESOLVED' && state.resolution) {
      return state.resolution === 'UP'
        ? `${coin} closed UP ✅ — above $${state.strikePrice?.toLocaleString()}`
        : `${coin} closed DOWN ❌ — below $${state.strikePrice?.toLocaleString()}`
    }
    if (state.phase === 'LOCKED' && state.strikePrice !== null) {
      return `Will ${coin} close above or below $${state.strikePrice.toLocaleString()} at ${resolutionTime}?`
    }
    return `Will ${coin} go UP or DOWN by ${resolutionTime}?`
  }, [state.phase, state.resolution, state.strikePrice, coin, resolutionTime])

  const borderClass = state.phase === 'LOCKED'
    ? 'border-2 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.3)] bg-[#1a0a0a]'
    : 'border border-white/10 bg-[#111111]'

  if (showResolved) return null

  return (
    <div className={`rounded-2xl p-6 transition-all duration-500 ${borderClass}`}>
      {/* Badge */}
      <div className="flex items-center justify-between mb-4">
        {state.phase === 'OPEN' ? (
          <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
            ● Live — Betting Open
          </span>
        ) : state.phase === 'LOCKED' ? (
          <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest animate-pulse">
            🔒 Locked — Sweating
          </span>
        ) : (
          <span className="bg-gray-500/20 text-gray-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
            Resolved
          </span>
        )}
        <p className="text-xs text-gray-400">
          {state.phase === 'OPEN' ? 'Closes in' : 'Resolves in'}: {formatCountdown(timeRemaining)}
        </p>
      </div>

      {/* Title */}
      <h2 className="text-lg font-bold text-white mb-4 leading-snug">{cardTitle}</h2>

      {/* Live Price */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Live Price</p>
          <p className="text-2xl font-black font-mono text-white">
            ${state.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        {state.phase === 'LOCKED' && state.strikePrice !== null && (
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Strike</p>
            <p className="text-2xl font-black font-mono text-red-400">
              ${state.strikePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </div>

      {/* Recharts Line Chart (LOCKED phase only) */}
      {state.phase === 'LOCKED' && state.strikePrice !== null && priceHistory.length > 0 && (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={priceHistory}>
              <XAxis dataKey="time" hide />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => `$${v.toLocaleString()}`}
                width={70}
              />
              <Tooltip
                formatter={(value: unknown) => [`$${Number(value || 0).toLocaleString()}`, 'Price']}
                labelFormatter={() => ''}
              />
              <ReferenceLine
                y={state.strikePrice}
                stroke="#EF4444"
                strokeDasharray="4 4"
                label={{ value: `Strike $${state.strikePrice.toLocaleString()}`, fill: '#EF4444', fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3B82F6"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pool Distribution (OPEN phase only) */}
      {state.phase === 'OPEN' && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>UP: {state.upPool.toFixed(1)} USDT</span>
            <span>DOWN: {state.downPool.toFixed(1)} USDT</span>
          </div>
          <div className="w-full h-3 bg-[#1a1a1a] rounded-full overflow-hidden flex">
            <div
              className="bg-green-500 transition-all duration-500"
              style={{ width: `${totalPool > 0 ? (state.upPool / totalPool) * 100 : 50}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${totalPool > 0 ? (state.downPool / totalPool) * 100 : 50}%` }}
            />
          </div>
        </div>
      )}

      {/* Floating Pool Animation */}
      {state.phase === 'OPEN' && (
        <div className="mb-6">
          <div style={{ position: 'relative', height: '28px' }}>
            <AnimatePresence mode="sync">
              {state.floatingBets.map(anim => (
                <motion.span
                  key={anim.id}
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -20 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: '#22C55E',
                    fontWeight: 600,
                    fontSize: '14px',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  +{anim.amount} USDT
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <p className="text-center text-sm text-gray-500">Total Pool</p>
          <p className="text-center text-xl font-semibold">
            {totalPool.toLocaleString()} USDT
          </p>
        </div>
      )}

      {/* Bet Buttons (OPEN phase only) */}
      {state.phase === 'OPEN' && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            disabled={state.phase !== 'OPEN'}
            onClick={() => handleBet('UP', 1)}
            className={`py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
              state.phase !== 'OPEN'
                ? 'opacity-40 cursor-not-allowed border-[#1F1F1F] bg-[#1a1a1a] text-gray-600'
                : 'border-[#1F1F1F] bg-[#1a1a1a] text-green-400 hover:border-green-500/50 hover:bg-green-500/10'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            UP ▲
          </button>
          <button
            disabled={state.phase !== 'OPEN'}
            onClick={() => handleBet('DOWN', 1)}
            className={`py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
              state.phase !== 'OPEN'
                ? 'opacity-40 cursor-not-allowed border-[#1F1F1F] bg-[#1a1a1a] text-gray-600'
                : 'border-[#1F1F1F] bg-[#1a1a1a] text-red-400 hover:border-red-500/50 hover:bg-red-500/10'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            DOWN ▼
          </button>
        </div>
      )}

      {/* Locked Phase UI */}
      {state.phase === 'LOCKED' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-center">
          <Lock className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-400">MARKET LOCKED</p>
          <p className="text-xs text-gray-400 mt-1">Resolves in {formatCountdown(timeRemaining)}</p>
        </div>
      )}

      {/* Resolved Phase UI */}
      {state.phase === 'RESOLVED' && state.resolution && (
        <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4 mb-4 text-center">
          {state.resolution === 'UP' ? (
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
          ) : (
            <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          )}
          <p className="text-sm font-bold text-gray-300">
            {state.resolution === 'UP' ? 'UP Won ✅' : 'DOWN Won ❌'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Settling payouts...</p>
        </div>
      )}

      {/* Mock Wallet Buttons */}
      <div className="flex gap-2 mt-4">
        <button disabled className="opacity-50 cursor-not-allowed px-4 py-2 rounded border text-sm border-[#1F1F1F] bg-[#1a1a1a] text-gray-400">
          Deposit
        </button>
        <button disabled className="opacity-50 cursor-not-allowed px-4 py-2 rounded border text-sm border-[#1F1F1F] bg-[#1a1a1a] text-gray-400">
          Withdraw
        </button>
      </div>
    </div>
  )
}
