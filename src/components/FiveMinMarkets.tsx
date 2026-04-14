'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { supabase, isSupabaseReady } from '@/src/lib/supabase'
import { useUser } from '@clerk/nextjs'

interface PoolWindow {
  id: string
  asset: string
  window_id: string
  opens_at: string
  locks_at: string
  resolves_at: string
  open_price: number | null
  close_price: number | null
  outcome: string | null
  total_up_stake: number
  total_down_stake: number
  total_pool: number
  status: 'open' | 'locked' | 'resolved'
}

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
  windowId: string
}

interface FiveMinMarketProps {
  onBet: (marketId: string, side: 'up' | 'down') => void
}

const MARKETS = [
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTCUSDT' },
  { id: 'ETH', name: 'Ethereum', symbol: 'ETHUSDT' },
  { id: 'SOL', name: 'Solana', symbol: 'SOLUSDT' },
]

function getWindowId(asset: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = Math.floor(now.getMinutes() / 5) * 5
  return `${asset}_${year}${month}${day}${hours}${String(minutes).padStart(2, '0')}`
}

async function ensureWindowExists(asset: string, symbol: string): Promise<PoolWindow | null> {
  if (!isSupabaseReady || !supabase) return null
  
  const windowId = getWindowId(asset)
  
  // Check if window exists
  const { data: existing } = await supabase
    .from('pool_windows')
    .select('*')
    .eq('window_id', windowId)
    .single()
  
  if (existing) return existing
  
  // Create new window
  const now = new Date()
  const opensAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), Math.floor(now.getMinutes() / 5) * 5)
  const locksAt = new Date(opensAt.getTime() + 5 * 60 * 1000)
  const resolvesAt = new Date(opensAt.getTime() + 10 * 60 * 1000)
  
  // Get open price from Binance
  let openPrice = 0
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`)
    const data = await res.json()
    openPrice = parseFloat(data.price)
  } catch (e) {
    console.error('Failed to fetch open price:', e)
  }
  
  const { data: newWindow, error } = await supabase
    .from('pool_windows')
    .insert({
      asset,
      window_id: windowId,
      opens_at: opensAt.toISOString(),
      locks_at: locksAt.toISOString(),
      resolves_at: resolvesAt.toISOString(),
      open_price: openPrice,
      status: 'open',
    })
    .select()
    .single()
  
  if (error) {
    console.error('Failed to create window:', error)
    return null
  }
  
  return newWindow
}

export function FiveMinMarkets({ onBet }: FiveMinMarketProps) {
  const { user, isLoaded } = useUser()
  const [markets, setMarkets] = useState<AutoMarket[]>([])
  const [loading, setLoading] = useState(true)
  const wsRefs = useRef<Record<string, WebSocket>>({})

  useEffect(() => {
    const init = async () => {
      const marketData: AutoMarket[] = []
      
      for (const m of MARKETS) {
        const windowId = getWindowId(m.id)
        
        // Try to get/fetch window from Supabase
        let poolData: PoolWindow | null = null
        if (isSupabaseReady && supabase) {
          poolData = await ensureWindowExists(m.id, m.symbol)
        }
        
        // Calculate time remaining
        const now = new Date()
        const windowMinutes = Math.floor(now.getMinutes() / 5) * 5
        const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), windowMinutes + 5)
        const timeRemaining = Math.max(0, Math.floor((windowEnd.getTime() - now.getTime()) / 1000))
        
        marketData.push({
          id: m.id,
          name: m.name,
          symbol: m.symbol,
          currentPrice: 0,
          openPrice: poolData?.open_price || 0,
          direction: 'neutral' as const,
          probability: 50,
          poolSize: poolData?.total_pool || Math.random() * 10000 + 1000,
          phase: timeRemaining > 120 ? 'open' : 'locked',
          timeRemaining,
          windowId,
        })
      }
      
      setMarkets(marketData)
      
      // Minimum loading time to show animation
      setTimeout(() => setLoading(false), 1500)
      
      // Connect WebSocket for live prices
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
    }
    
    init()
    
    // Update timer every second
    const timer = setInterval(() => {
      setMarkets(prev => prev.map(m => {
        const newTime = Math.max(0, m.timeRemaining - 1)
        return {
          ...m,
          timeRemaining: newTime,
          phase: newTime > 120 ? 'open' : newTime > 0 ? 'locked' : 'resolved',
        }
      }))
    }, 1000)
    
    return () => {
      clearInterval(timer)
      Object.values(wsRefs.current).forEach(ws => ws.close())
    }
  }, [])

  const handleBet = useCallback(async (asset: string, side: 'up' | 'down') => {
    if (!isLoaded || !user) {
      onBet(asset, side)
      return
    }
    
    const market = markets.find(m => m.id === asset)
    if (!market || market.phase !== 'open') return
    
    // TODO: Get stake from UI
    const stake = 100 // This should come from the stake input
    
    if (isSupabaseReady && supabase) {
      const { error } = await supabase
        .from('pool_bets')
        .insert({
          user_id: user.id,
          window_id: market.windowId,
          asset: asset,
          side: side,
          stake: stake,
          status: 'pending',
        })
      
      if (error) {
        console.error('Failed to place bet:', error)
      }
    }
    
    onBet(asset, side)
  }, [user, markets, onBet])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {MARKETS.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#141414] border border-[#222222] rounded-lg p-3"
          >
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-6 h-6 rounded-full bg-[#C9A84C]/20 flex items-center justify-center"
                >
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-3 h-3 rounded-full border border-[#C9A84C] border-t-transparent"
                  />
                </motion.div>
                <div className="h-3 bg-[#222222] rounded w-16"></div>
              </div>
              <div className="h-4 bg-[#222222] rounded w-12"></div>
            </div>
            
            {/* Probability skeleton */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="h-2 bg-[#222222] rounded w-16 mb-1"></div>
                <motion.div 
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-6 bg-gradient-to-r from-[#222222] via-[#C9A84C]/30 to-[#222222] rounded w-20"
                />
              </div>
              <div className="text-right">
                <div className="h-2 bg-[#222222] rounded w-10 mb-1"></div>
                <div className="h-4 bg-[#222222] rounded w-16"></div>
              </div>
            </div>
            
            {/* Buttons skeleton */}
            <div className="grid grid-cols-2 gap-2">
              <motion.div 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                className="h-8 bg-[#222222] rounded-lg"
              />
              <motion.div 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                className="h-8 bg-[#222222] rounded-lg"
              />
            </div>
          </motion.div>
        ))}
      </div>
    )
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
              onClick={() => handleBet(market.id, 'up')}
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
              onClick={() => handleBet(market.id, 'down')}
              disabled={market.phase !== 'open'}
              className={`py-2 px-3 rounded-lg font-semibold transition flex flex-col items-center text-xs ${
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
