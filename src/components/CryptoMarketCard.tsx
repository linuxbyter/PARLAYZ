'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
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
import { differenceInSeconds, addMinutes, format } from 'date-fns'
import { TrendingUp, TrendingDown, Lock, Clock } from 'lucide-react'

type MarketPhase = 'OPEN' | 'LOCKED' | 'RESOLVED'

const MOCK_INITIAL_PRICE = 104000
const MOCK_BET_AMOUNT = 1
const CYCLE_DURATION = 600
const OPEN_DURATION = 300

interface CryptoMarketCardProps {
  symbol?: string
}

export const CryptoMarketCard: React.FC<CryptoMarketCardProps> = ({ symbol = 'BTC/USDT' }) => {
  const [marketPhase, setMarketPhase] = useState<MarketPhase>('OPEN')
  const [strikePrice, setStrikePrice] = useState<number | null>(null)
  const [livePrice, setLivePrice] = useState<number>(MOCK_INITIAL_PRICE)
  const [priceHistory, setPriceHistory] = useState<{ t: number; price: number }[]>([])
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(300)
  const [poolAnimations, setPoolAnimations] = useState<{ id: string; amount: number }[]>([])
  const [upPool, setUpPool] = useState<number>(0)
  const [downPool, setDownPool] = useState<number>(0)

  const cycleStartTime = useRef<Date>(new Date())

  const simulatePriceMovement = (currentPrice: number): number => {
    const change = (Math.random() - 0.499) * 120
    return parseFloat((currentPrice + change).toFixed(2))
  }

  const resetCycle = () => {
    setMarketPhase('OPEN')
    setStrikePrice(null)
    setPriceHistory([])
    setUpPool(0)
    setDownPool(0)
    setLivePrice(MOCK_INITIAL_PRICE)
    setTimeRemainingSeconds(OPEN_DURATION)
    cycleStartTime.current = new Date()
  }

  useEffect(() => {
    let elapsed = 0

    const tick = setInterval(() => {
      elapsed += 1

      const newLivePrice = simulatePriceMovement(livePrice)
      setLivePrice(newLivePrice)
      setPriceHistory(prev => [...prev, { t: elapsed, price: newLivePrice }])

      if (elapsed < OPEN_DURATION) {
        setMarketPhase('OPEN')
        setTimeRemainingSeconds(OPEN_DURATION - elapsed)
      } else if (elapsed === OPEN_DURATION) {
        setMarketPhase('LOCKED')
        setStrikePrice(newLivePrice)
        setTimeRemainingSeconds(CYCLE_DURATION - OPEN_DURATION)
      } else if (elapsed < CYCLE_DURATION) {
        setMarketPhase('LOCKED')
        setTimeRemainingSeconds(CYCLE_DURATION - elapsed)
      } else {
        setMarketPhase('RESOLVED')
        clearInterval(tick)
        setTimeout(() => resetCycle(), 3000)
      }
    }, 1000)

    return () => clearInterval(tick)
  }, [])

  const cardTitle = useMemo(() => {
    if (marketPhase === 'OPEN') {
      return `Will ${symbol} go UP or DOWN in the next 5 minutes?`
    }
    if (marketPhase === 'LOCKED' && strikePrice !== null) {
      const formattedStrike = strikePrice.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      })
      const resolveTime = format(addMinutes(cycleStartTime.current, 10), 'h:mm a')
      return `Will ${symbol} close above or below ${formattedStrike} at ${resolveTime}?`
    }
    return `${symbol} market is settling...`
  }, [marketPhase, strikePrice, symbol])

  const borderClass = marketPhase === 'LOCKED'
    ? 'border-2 border-red-500'
    : 'border border-gray-200 dark:border-gray-700'

  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleBet = (direction: 'UP' | 'DOWN', amount: number) => {
    if (marketPhase !== 'OPEN') return

    if (direction === 'UP') setUpPool(prev => prev + amount)
    else setDownPool(prev => prev + amount)

    const animId = crypto.randomUUID()
    setPoolAnimations(prev => [...prev, { id: animId, amount }])

    setTimeout(() => {
      setPoolAnimations(prev => prev.filter(a => a.id !== animId))
    }, 1600)
  }

  const totalPool = upPool + downPool

  return (
    <div className={`bg-[#111] rounded-2xl p-6 transition-all duration-500 ${borderClass}`}>
      {/* Phase Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
          marketPhase === 'OPEN'
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : marketPhase === 'LOCKED'
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            marketPhase === 'OPEN' ? 'bg-green-400 animate-pulse' :
            marketPhase === 'LOCKED' ? 'bg-red-400' : 'bg-gray-400'
          }`} />
          {marketPhase}
        </div>
        <p className="text-xs text-gray-400">
          {marketPhase === 'OPEN' ? 'Closes in' : 'Resolves in'}: {formatCountdown(timeRemainingSeconds)}
        </p>
      </div>

      {/* Dynamic Title */}
      <h2 className="text-lg font-bold text-white mb-6 leading-snug">{cardTitle}</h2>

      {/* Live Price Display */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Live Price</p>
          <p className="text-2xl font-black font-mono text-white">
            ${livePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        {strikePrice !== null && marketPhase === 'LOCKED' && (
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Strike</p>
            <p className="text-2xl font-black font-mono text-red-400">
              ${strikePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </div>

      {/* Recharts Line Chart (LOCKED phase only) */}
      {marketPhase === 'LOCKED' && strikePrice !== null && (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={priceHistory}>
              <XAxis dataKey="t" hide />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
                width={70}
              />
              <Tooltip
                formatter={(value: unknown) => [`$${Number(value || 0).toLocaleString()}`, 'Price']}
                labelFormatter={() => ''}
              />
              <ReferenceLine
                y={strikePrice}
                stroke="#EF4444"
                strokeDasharray="4 4"
                label={{ value: `Strike $${strikePrice.toLocaleString()}`, fill: '#EF4444', fontSize: 11 }}
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
      {marketPhase === 'OPEN' && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>UP: {upPool.toFixed(1)} USDT</span>
            <span>DOWN: {downPool.toFixed(1)} USDT</span>
          </div>
          <div className="w-full h-3 bg-[#1a1a1a] rounded-full overflow-hidden flex">
            <div
              className="bg-green-500 transition-all duration-500"
              style={{ width: `${totalPool > 0 ? (upPool / totalPool) * 100 : 50}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${totalPool > 0 ? (downPool / totalPool) * 100 : 50}%` }}
            />
          </div>
        </div>
      )}

      {/* Floating Pool Animation + Total Pool */}
      <div className="mb-6">
        <div style={{ position: 'relative', height: '28px' }}>
          <AnimatePresence mode="sync">
            {poolAnimations.map(anim => (
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

      {/* Bet Buttons (OPEN phase only) */}
      {marketPhase === 'OPEN' && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            disabled={marketPhase !== 'OPEN'}
            onClick={() => handleBet('UP', MOCK_BET_AMOUNT)}
            className={`py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
              marketPhase !== 'OPEN'
                ? 'opacity-40 cursor-not-allowed border-[#1F1F1F] bg-[#1a1a1a] text-gray-600'
                : 'border-[#1F1F1F] bg-[#1a1a1a] text-green-400 hover:border-green-500/50 hover:bg-green-500/10'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            UP ▲
          </button>
          <button
            disabled={marketPhase !== 'OPEN'}
            onClick={() => handleBet('DOWN', MOCK_BET_AMOUNT)}
            className={`py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
              marketPhase !== 'OPEN'
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
      {marketPhase === 'LOCKED' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-center">
          <Lock className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-400">MARKET LOCKED</p>
          <p className="text-xs text-gray-400 mt-1">Resolves in {formatCountdown(timeRemainingSeconds)}</p>
        </div>
      )}

      {/* Resolved Phase UI */}
      {marketPhase === 'RESOLVED' && (
        <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4 mb-4 text-center">
          <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-400">SETTLING...</p>
          <p className="text-xs text-gray-500 mt-1">Next cycle starting soon</p>
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
