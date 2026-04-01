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
import { TrendingUp, TrendingDown, Lock, CheckCircle, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react'

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
  instrumentId: string
  initialPrice: number
  livePrice: number
  priceHistory: { time: number; price: number }[]
  onResolve?: (resolution: 'UP' | 'DOWN', slot: number) => void
  showDetail?: boolean
  onBack?: () => void
}

export const CryptoMarketCard: React.FC<CryptoMarketCardProps> = ({
  slot,
  phase,
  coin,
  instrumentId,
  initialPrice,
  livePrice,
  priceHistory,
  onResolve,
  showDetail = false,
  onBack,
}) => {
  const [state, setState] = useState<MarketSlotState>({
    slot,
    phase,
    strikePrice: null,
    currentPrice: initialPrice,
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
        setTimeout(() => setShowResolved(true), 5000)
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [slot, phase, livePrice, initialPrice, onResolve, state.strikePrice])

  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 1000 / 60).toString().padStart(2, '0')
    const s = Math.floor((seconds / 1000) % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const formatPrice = (price: number): string => {
    if (instrumentId === 'SHIB' || instrumentId === 'PEPE') return price.toFixed(8)
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

  const handleEarlyExit = () => {
    if (state.phase !== 'LOCKED' || state.userStake <= 0) return
    const remainingSecs = timeRemaining / 1000
    if (remainingSecs < 30) return
    const refund = state.userStake * 0.8
    const penalty = state.userStake * 0.2
    setState(prev => ({
      ...prev,
      userStake: 0,
      userSide: null,
      upPool: prev.userSide === 'UP' ? Math.max(0, prev.upPool - penalty) : prev.upPool,
      downPool: prev.userSide === 'DOWN' ? Math.max(0, prev.downPool - penalty) : prev.downPool,
    }))
  }

  const totalPool = state.upPool + state.downPool
  const resolutionTime = format(new Date(getSlotEndTime(slot)), 'h:mm a')
  const remainingSecs = timeRemaining / 1000
  const canEarlyExit = state.phase === 'LOCKED' && state.userStake > 0 && remainingSecs >= 30

  const cardTitle = useMemo(() => {
    if (state.phase === 'RESOLVED' && state.resolution) {
      return state.resolution === 'UP'
        ? `${coin} closed UP ✅ — above $${formatPrice(state.strikePrice ?? 0)}`
        : `${coin} closed DOWN ❌ — below $${formatPrice(state.strikePrice ?? 0)}`
    }
    if (state.phase === 'LOCKED' && state.strikePrice !== null) {
      return `Will ${coin} close above or below $${formatPrice(state.strikePrice)} at ${resolutionTime}?`
    }
    return `Will ${coin} go UP or DOWN by ${resolutionTime}?`
  }, [state.phase, state.resolution, state.strikePrice, coin, resolutionTime, instrumentId])

  const borderClass = state.phase === 'LOCKED'
    ? 'border-2 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.3)] bg-[#1a0a0a]'
    : 'border border-white/10 bg-[#111111]'

  const chartHeight = showDetail ? 300 : 160

  if (showResolved) return null

  return (
    <div className={`rounded-2xl p-6 transition-all duration-500 ${borderClass}`}>
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
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
          {showDetail && onBack && (
            <button onClick={onBack} className="text-gray-500 hover:text-white transition">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400">
          {state.phase === 'OPEN' ? 'Closes in' : 'Resolves in'}: {formatCountdown(timeRemaining)}
        </p>
      </div>

      {/* Title */}
      <h2 className={`font-bold text-white mb-4 leading-snug ${showDetail ? 'text-xl' : 'text-lg'}`}>
        {cardTitle}
      </h2>

      {/* Live Price */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Live Price</p>
          <p className={`font-black font-mono text-white ${showDetail ? 'text-3xl' : 'text-2xl'}`}>
            ${formatPrice(state.currentPrice)}
          </p>
        </div>
        {state.phase === 'LOCKED' && state.strikePrice !== null && (
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Strike</p>
            <p className={`font-black font-mono text-red-400 ${showDetail ? 'text-3xl' : 'text-2xl'}`}>
              ${formatPrice(state.strikePrice)}
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      {priceHistory.length > 0 && (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={chartHeight}>
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
              {state.strikePrice !== null && (
                <ReferenceLine
                  y={state.strikePrice}
                  stroke="#EF4444"
                  strokeDasharray="4 4"
                  label={{ value: `Strike $${formatPrice(state.strikePrice)}`, fill: '#EF4444', fontSize: 11 }}
                />
              )}
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

      {/* Settlement Rules (detail view only) */}
      {showDetail && (
        <div className="bg-[#0a0a0a] border border-[#1F1F1F] rounded-xl p-4 mb-6">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Settlement Rules</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            This market auto-resolves at {resolutionTime}. The strike price is recorded at lock time.
            If {coin} closes strictly above the strike, UP wins. If at or below, DOWN wins.
            Source: Binance API.
          </p>
          {state.userStake > 0 && (
            <div className="mt-3 pt-3 border-t border-[#1F1F1F]">
              <p className="text-xs text-gray-400">
                Your bet: <span className="text-white font-bold">{state.userSide}</span> — {state.userStake} USDT
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pool Distribution (OPEN phase only) */}
      {state.phase === 'OPEN' && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>UP: {state.upPool.toFixed(1)} USDT ({totalPool > 0 ? ((state.upPool / totalPool) * 100).toFixed(0) : 50}%)</span>
            <span>DOWN: {state.downPool.toFixed(1)} USDT ({totalPool > 0 ? ((state.downPool / totalPool) * 100).toFixed(0) : 50}%)</span>
          </div>
          <div className="w-full h-3 bg-[#1a1a1a] rounded-full overflow-hidden flex">
            <div className="bg-green-500 transition-all duration-500" style={{ width: `${totalPool > 0 ? (state.upPool / totalPool) * 100 : 50}%` }} />
            <div className="bg-red-500 transition-all duration-500" style={{ width: `${totalPool > 0 ? (state.downPool / totalPool) * 100 : 50}%` }} />
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
                  style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', color: '#22C55E', fontWeight: 600, fontSize: '14px', pointerEvents: 'none', whiteSpace: 'nowrap' }}
                >
                  +{anim.amount} USDT
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <p className="text-center text-sm text-gray-500">Total Pool</p>
          <p className="text-center text-xl font-semibold">{totalPool.toLocaleString()} USDT</p>
        </div>
      )}

      {/* Bet Buttons (OPEN phase only) */}
      {state.phase === 'OPEN' && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button disabled onClick={() => handleBet('UP', 1)} className="py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 opacity-40 cursor-not-allowed border-[#1F1F1F] bg-[#1a1a1a] text-gray-600">
            <TrendingUp className="w-4 h-4" /> UP ▲
          </button>
          <button disabled onClick={() => handleBet('DOWN', 1)} className="py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 opacity-40 cursor-not-allowed border-[#1F1F1F] bg-[#1a1a1a] text-gray-600">
            <TrendingDown className="w-4 h-4" /> DOWN ▼
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

      {/* Early Exit Button */}
      {canEarlyExit && (
        <div className="mb-4">
          <button
            onClick={handleEarlyExit}
            className="w-full py-2.5 rounded-xl border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 text-xs font-bold uppercase tracking-wider hover:bg-yellow-500/20 transition flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Exit Early — Receive 80% ({(state.userStake * 0.8).toFixed(2)} USDT)
          </button>
          <p className="text-center text-gray-500 text-[10px] mt-1">
            20% penalty stays in the pool. Exit closes 30s before resolution.
          </p>
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
        <button disabled className="opacity-50 cursor-not-allowed px-4 py-2 rounded border text-sm border-[#1F1F1F] bg-[#1a1a1a] text-gray-400">Deposit</button>
        <button disabled className="opacity-50 cursor-not-allowed px-4 py-2 rounded border text-sm border-[#1F1F1F] bg-[#1a1a1a] text-gray-400">Withdraw</button>
      </div>
    </div>
  )
}
