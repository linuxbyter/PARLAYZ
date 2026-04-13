'use client'

import Header from '@/src/components/Header'
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import { Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Skeleton } from '@/src/components/Skeleton'
import { FiveMinMarkets } from '@/src/components/FiveMinMarkets'
import { PwaInstallBanner } from '@/src/components/PwaInstallBanner'
import { MarketCard } from '@/src/components/MarketCard'

export const dynamic = 'force-dynamic'

interface Market {
  id: string
  label: string
  category: string
  poolSize: string
  yesPrice: number
  noPrice: number
  type: 'binary' | 'versus' | 'crypto' | 'multi'
}

const MARKETS: Market[] = [
  { id: 'BTC', label: 'Bitcoin', category: 'Crypto_Majors', poolSize: '12,400', yesPrice: 67, noPrice: 33, type: 'crypto' },
  { id: 'ETH', label: 'Ethereum', category: 'Crypto_Majors', poolSize: '8,900', yesPrice: 54, noPrice: 46, type: 'crypto' },
  { id: 'SOL', label: 'Solana', category: 'Crypto_Majors', poolSize: '5,200', yesPrice: 72, noPrice: 28, type: 'crypto' },
  { id: 'LTC', label: 'Litecoin', category: 'Crypto_Majors', poolSize: '3,100', yesPrice: 45, noPrice: 55, type: 'crypto' },
  { id: 'LINK', label: 'Chainlink', category: 'Crypto_Majors', poolSize: '2,800', yesPrice: 61, noPrice: 39, type: 'crypto' },
  { id: 'DOGE', label: 'Dogecoin', category: 'Crypto_Majors', poolSize: '4,500', yesPrice: 38, noPrice: 62, type: 'crypto' },
  { id: 'SHIB', label: 'Shiba Inu', category: 'Crypto_Meme', poolSize: '1,200', yesPrice: 55, noPrice: 45, type: 'crypto' },
  { id: 'PEPE', label: 'Pepe', category: 'Crypto_Meme', poolSize: '980', yesPrice: 42, noPrice: 58, type: 'crypto' },
  { id: 'NAS100', label: 'Nasdaq 100', category: 'Finance_Futures', poolSize: '15,600', yesPrice: 70, noPrice: 30, type: 'binary' },
  { id: 'GOLD', label: 'Gold (XAU)', category: 'Finance_Futures', poolSize: '22,300', yesPrice: 63, noPrice: 37, type: 'binary' },
  { id: 'OIL', label: 'Brent Crude', category: 'Finance_Futures', poolSize: '7,400', yesPrice: 48, noPrice: 52, type: 'binary' },
]

export default function Home() {
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cat = params.get('cat') || 'trending'
  }, [])

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
        const data = await res.json()
        setBtcPrice(parseFloat(data.price))
        setIsLoading(false)
      } catch {
        setIsLoading(false)
      }
    }
    fetchPrice()
    const interval = setInterval(fetchPrice, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-3 py-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141414] border border-[#222222] rounded-xl p-3 mb-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F0A500]/20 flex items-center justify-center">
              <span className="text-sm font-black text-[#F0A500]">₿</span>
            </div>
            <div>
              <p className="text-[9px] text-[#555555] uppercase font-bold tracking-widest">BTC/USDT Live</p>
              {isLoading ? (
                <Skeleton className="w-24 h-6 mt-0.5" />
              ) : (
                <p className="text-lg font-black font-mono text-white">
                  ${btcPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '--'}
                </p>
              )}
            </div>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#F0A500]" />
            <span className="text-[9px] text-[#F0A500] font-bold">LIVE</span>
          </motion.div>
        </motion.div>

        {/* Five Minute Auto Markets */}
        <SignedIn>
          <div className="mb-4">
            <h2 className="text-xs font-bold text-[#C9A84C] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              5-Minute Auto Markets
            </h2>
            <FiveMinMarkets onBet={(marketId, side) => {
              window.location.href = `/market/${marketId}`
            }} />
          </div>
        </SignedIn>

        <SignedIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {MARKETS.map((market, i) => (
              <motion.div
                key={market.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <MarketCard market={market} live={true} />
              </motion.div>
            ))}
          </div>
        </SignedIn>

        <SignedOut>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <h2 className="text-3xl font-black text-white mb-4">Sign in to trade markets</h2>
            <p className="text-gray-400 mb-8">Connect your wallet and Clerk account to start betting.</p>
            <SignInButton mode="modal">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-[#F0A500] to-[#F0D060] text-black font-bold px-8 py-3 rounded-xl text-sm hover:opacity-90 transition"
              >
                Get Started
              </motion.button>
            </SignInButton>
          </motion.div>
        </SignedOut>
      </main>

      <PwaInstallBanner />
    </div>
  )
}
