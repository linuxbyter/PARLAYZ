'use client'

import Header from '@/src/components/Header'
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import { useAccount } from 'wagmi'
import { Clock, ChevronRight, Zap } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'

interface Market {
  id: string
  label: string
  category: string
  poolSize: string
  yesPrice: number
  noPrice: number
}

const MARKETS: Market[] = [
  { id: 'BTC', label: 'Bitcoin', category: 'Crypto_Majors', poolSize: '12,400', yesPrice: 67, noPrice: 33 },
  { id: 'ETH', label: 'Ethereum', category: 'Crypto_Majors', poolSize: '8,900', yesPrice: 54, noPrice: 46 },
  { id: 'SOL', label: 'Solana', category: 'Crypto_Majors', poolSize: '5,200', yesPrice: 72, noPrice: 28 },
  { id: 'LTC', label: 'Litecoin', category: 'Crypto_Majors', poolSize: '3,100', yesPrice: 45, noPrice: 55 },
  { id: 'LINK', label: 'Chainlink', category: 'Crypto_Majors', poolSize: '2,800', yesPrice: 61, noPrice: 39 },
  { id: 'DOGE', label: 'Dogecoin', category: 'Crypto_Majors', poolSize: '4,500', yesPrice: 38, noPrice: 62 },
  { id: 'SHIB', label: 'Shiba Inu', category: 'Crypto_Meme', poolSize: '1,200', yesPrice: 55, noPrice: 45 },
  { id: 'PEPE', label: 'Pepe', category: 'Crypto_Meme', poolSize: '980', yesPrice: 42, noPrice: 58 },
  { id: 'NAS100', label: 'Nasdaq 100', category: 'Finance_Futures', poolSize: '15,600', yesPrice: 70, noPrice: 30 },
  { id: 'GOLD', label: 'Gold (XAU)', category: 'Finance_Futures', poolSize: '22,300', yesPrice: 63, noPrice: 37 },
  { id: 'OIL', label: 'Brent Crude', category: 'Finance_Futures', poolSize: '7,400', yesPrice: 48, noPrice: 52 },
]

export default function Home() {
  const { isConnected } = useAccount()
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'Crypto_Majors' | 'Crypto_Meme' | 'Finance_Futures'>('all')

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
        const data = await res.json()
        setBtcPrice(parseFloat(data.price))
      } catch (e) {}
    }
    fetchPrice()
    const interval = setInterval(fetchPrice, 5000)
    return () => clearInterval(interval)
  }, [])

  const filteredMarkets = filter === 'all' ? MARKETS : MARKETS.filter(m => m.category === filter)

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* BTC Price Banner */}
        <div className="bg-[#111] border border-[#1F1F1F] rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
              <span className="text-lg font-black text-[#D4AF37]">₿</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">BTC/USDT Live</p>
              <p className="text-xl font-black font-mono text-white">
                {btcPrice ? '$' + btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) : 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="text-xs text-[#D4AF37] font-bold">LIVE</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All Markets' },
            { id: 'Crypto_Majors', label: 'Majors' },
            { id: 'Crypto_Meme', label: 'Meme' },
            { id: 'Finance_Futures', label: 'Futures' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition whitespace-nowrap ${
                filter === f.id
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-[#111] border border-[#1F1F1F] text-gray-400 hover:text-white hover:border-[#D4AF37]/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Markets Grid - EVERY card is a Link to /market/[id] */}
        <SignedIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredMarkets.map(market => (
              <Link
                key={market.id}
                href={`/market/${market.id}`}
                className="group bg-[#111] border border-[#1F1F1F] hover:border-[#D4AF37]/50 rounded-xl p-4 transition-all duration-200 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] block"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="text-xs font-bold text-gray-400 uppercase">{market.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                    <span className="text-[9px] text-[#D4AF37] font-bold uppercase">Live</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white mb-3 leading-snug group-hover:text-[#D4AF37] transition-colors">
                  Will {market.label} go UP or DOWN in 5 min?
                </h3>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>5 min cycle</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[#D4AF37] font-mono font-bold">{market.poolSize}</span>
                    <span>USDT</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#1F1F1F]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[10px] text-green-400 font-bold">YES {market.yesPrice}¢</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[10px] text-red-400 font-bold">NO {market.noPrice}¢</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#D4AF37] transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </SignedIn>

        <SignedOut>
          <div className="text-center py-20">
            <h2 className="text-3xl font-black text-white mb-4">Sign in to trade markets</h2>
            <p className="text-gray-400 mb-8">Connect your wallet and Clerk account to start betting.</p>
            <SignInButton mode="modal">
              <button className="bg-gradient-to-r from-[#D4AF37] to-[#F0D060] text-black font-bold px-8 py-3 rounded-xl text-sm hover:opacity-90 transition">
                Get Started
              </button>
            </SignInButton>
          </div>
        </SignedOut>
      </main>
    </div>
  )
}
