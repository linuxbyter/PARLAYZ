'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface AutoMarket {
  id: string
  name: string
  symbol: string
  currentPrice: number
  openPrice: number
  direction: 'up' | 'down' | 'neutral'
  probability: number
  poolSize: number
  phase: 'open' | 'locked' | 'resolved'
  timeRemaining: number
}

interface FiveMinMarketProps {
  onBet: (marketId: string, side: 'up' | 'down') => void
}

const MARKETS = [
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTCUSDT' },
  { id: 'ETH', name: 'Ethereum', symbol: 'ETHUSDT' },
  { id: 'SOL', name: 'Solana', symbol: 'SOLUSDT' },
]

function getWindowId(): string {
  const now = new Date()
  const minutes = Math.floor(now.getMinutes() / 5) * 5
  return `${now.getHours()}${minutes}`
}

export function FiveMinMarkets({ onBet }: FiveMinMarketProps) {
  const [markets, setMarkets] = useState<AutoMarket[]>([])
  const wsRefs = useRef<Record<string, WebSocket>>({})

  useEffect(() => {
    const now = new Date()
    const windowMinutes = Math.floor(now.getMinutes() / 5) * 5
    const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), windowMinutes + 5)
    const timeRemaining = Math.max(0, Math.floor((windowEnd.getTime() - now.getTime()) / 1000))
    
    const initialMarkets: AutoMarket[] = MARKETS.map(m => ({
      id: m.id,
      name: m.name,
      symbol: m.symbol,
      currentPrice: 0,
      openPrice: 0,
      direction: 'neutral' as const,
      probability: 50,
      poolSize: Math.random() * 10000 + 1000,
      phase: timeRemaining > 120 ? 'open' : 'locked',
      timeRemaining,
    }))

    setMarkets(initialMarkets)

    MARKETS.forEach(m => {
      if (wsRefs.current[m.id]) return
      
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${m.symbol.toLowerCase()}@trade`)
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        const price = parseFloat(data.p)
        
        setMarkets(prev => prev.map(market => {
          if (market.id !== m.id) return market
          
          const openPrice = market.openPrice || price
          const direction = price > openPrice ? 'up' : price < openPrice ? 'down' : 'neutral'
          const change = openPrice ? ((price - openPrice) / openPrice) * 100 : 0
          const probability = Math.max(5, Math.min(95, 50 + change * 10))
          
          return {
            ...market,
            currentPrice: price,
            openPrice,
            direction,
            probability: Math.round(probability),
          }
        }))
      }
      
      wsRefs.current[m.id] = ws
    })

    const timer = setInterval(() => {
      setMarkets(prev => prev.map(m => ({
        ...m,
        timeRemaining: Math.max(0, m.timeRemaining - 1),
        phase: m.timeRemaining <= 120 ? 'locked' : 'open',
      })))
    }, 1000)

    return () => {
      clearInterval(timer)
      Object.values(wsRefs.current).forEach(ws => ws.close())
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-2">
      {markets.map(market => (
        <motion.div
          key={market.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141414] border border-[#222222] rounded-lg p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">{market.name}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                market.phase === 'open' 
                  ? 'bg-[#4CAF7D]/20 text-[#4CAF7D] animate-pulse' 
                  : 'bg-[#C9A84C]/20 text-[#C9A84C]'
              }`}>
                {market.phase === 'open' ? 'OPEN' : 'LOCKED'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-white font-mono">
                {formatTime(market.timeRemaining)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[9px] text-[#8B8B8B]">Probability</span>
              <div className="text-xl font-black text-[#C9A84C]">
                {market.probability}% 
                {market.direction === 'up' && <span className="text-green-500 ml-1">▲</span>}
                {market.direction === 'down' && <span className="text-red-500 ml-1">▼</span>}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-[#8B8B8B]">Pool</span>
              <div className="text-xs font-semibold text-[#C9A84C]">
                KSh {market.poolSize.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onBet(market.id, 'up')}
              disabled={market.phase !== 'open'}
              className={`py-2 px-3 rounded-lg font-semibold transition flex flex-col items-center text-xs ${
                market.phase === 'open'
                  ? 'bg-[#4CAF7D]/20 border border-[#4CAF7D] text-[#4CAF7D] hover:bg-[#4CAF7D]/30'
                  : 'bg-[#222222] border border-[#333] text-[#555555] cursor-not-allowed'
              }`}
            >
              <span>UP</span>
              <span className="text-xs opacity-70">{market.probability}%</span>
            </button>
            <button
              onClick={() => onBet(market.id, 'down')}
              disabled={market.phase !== 'open'}
              className={`py-3 px-4 rounded-xl font-semibold transition flex flex-col items-center ${
                market.phase === 'open'
                  ? 'bg-[#E05252]/20 border border-[#E05252] text-[#E05252] hover:bg-[#E05252]/30'
                  : 'bg-[#222222] border border-[#333] text-[#555555] cursor-not-allowed'
              }`}
            >
              <span>DOWN</span>
              <span className="text-xs opacity-70">{100 - market.probability}%</span>
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}