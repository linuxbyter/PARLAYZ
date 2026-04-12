'use client'

import Header from '@/src/components/Header'
import BottomNav from '@/src/components/BottomNav'
import { motion } from 'framer-motion'
import { Radio, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'

interface LiveMarket {
  id: string
  question: string
  category: string
  yesPrice: number
  noPrice: number
  volume: number
  timeLeft: string
  trend: 'up' | 'down'
}

const LIVE_MARKETS: LiveMarket[] = [
  { id: 'btc-50k', question: 'Will BTC reach $50K by Friday?', category: 'CRYPTO', yesPrice: 68, noPrice: 32, volume: 45200, timeLeft: '2h 15m', trend: 'up' },
  { id: 'eth-merge', question: 'Will ETH hashrate increase 10% this week?', category: 'CRYPTO', yesPrice: 45, noPrice: 55, volume: 28400, timeLeft: '4h 30m', trend: 'down' },
  { id: 'kcse-exam', question: 'Will KCSE results release before Feb 28?', category: 'KENYA', yesPrice: 72, noPrice: 28, volume: 18900, timeLeft: '1d 8h', trend: 'up' },
]

export default function LivePage() {
  const markets = LIVE_MARKETS

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      <Header />
      
      <main className="max-w-2xl mx-auto px-4 py-4">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-6"
        >
          <Radio className="w-5 h-5 text-[#E05252]" />
          <h1 className="text-xl font-bold">Live Markets</h1>
          <span className="bg-[#3D1E1E] text-[#E05252] text-xs font-bold px-2 py-0.5 rounded-full">
            {markets.length} active
          </span>
        </motion.div>

        <div className="space-y-3">
          {markets.map((market, i) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/market/${market.id}`}>
                <div className="bg-[#141414] border border-[#222222] rounded-xl p-4 hover:border-[#F0A500]/50 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#2A1F00] text-[#F0A500] text-[10px] font-bold px-2 py-0.5 rounded border border-[#F0A500]/30">
                        {market.category}
                      </span>
                      <span className="flex items-center gap-1 text-[#4CAF7D] text-xs">
                        <span className="w-1.5 h-1.5 bg-[#4CAF7D] rounded-full animate-pulse" />
                        LIVE
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${market.trend === 'up' ? 'text-[#4CAF7D]' : 'text-[#E05252]'}`}>
                      {market.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {market.trend === 'up' ? '+' : '-'}3.2%
                    </div>
                  </div>

                  <p className="text-white font-semibold mb-3">{market.question}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <div>
                        <div className="text-[10px] text-[#8B8B8B] mb-1">YES</div>
                        <div className="text-lg font-bold text-[#4CAF7D]">{market.yesPrice}¢</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8B8B8B] mb-1">NO</div>
                        <div className="text-lg font-bold text-[#E05252]">{market.noPrice}¢</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-[#8B8B8B] mb-1">Volume</div>
                      <div className="text-sm font-bold text-white">KSh {market.volume.toLocaleString()}</div>
                      <div className="flex items-center gap-1 text-[10px] text-[#8B8B8B]">
                        <Clock className="w-3 h-3" />
                        {market.timeLeft}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {markets.length === 0 && (
          <div className="text-center py-12">
            <Radio className="w-12 h-12 text-[#8B8B8B] mx-auto mb-4" />
            <p className="text-[#8B8B8B]">No live markets right now</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}