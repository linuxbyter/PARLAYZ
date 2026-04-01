'use client'

import Header from '@/src/components/Header'
import { CryptoMarketSection } from '@/src/components/CryptoMarketSection'
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import { useAccount } from 'wagmi'
import { ArrowUpRight, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'

interface Market {
  id: string
  title: string
  category: string
  outcomes: string[]
  closesAt: string
  resolved: boolean
  poolSize: string
  type: 'crypto' | 'sports' | 'culture'
}

const MOCK_MARKETS: Market[] = [
  {
    id: '2',
    title: 'Arsenal vs Chelsea - Who wins?',
    category: 'Sports',
    outcomes: ['Arsenal', 'Draw', 'Chelsea'],
    closesAt: '2026-04-01T15:00:00Z',
    resolved: false,
    poolSize: '4,520',
    type: 'sports',
  },
]

export default function Home() {
  const { isConnected } = useAccount()
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'crypto' | 'sports'>('all')

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

  const filteredMarkets = filter === 'all' ? MOCK_MARKETS : MOCK_MARKETS.filter(m => m.type === filter)
  const otherMarkets = filteredMarkets.filter(m => m.type !== 'crypto')

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <Header />

      <main className="max-w-[1400px] mx-auto px-4 py-8">
        {/* BTC Price Banner */}
        <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <span className="text-lg font-black text-orange-400">₿</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">BTC/USDT Live</p>
              <p className="text-xl font-black font-mono text-white">
                {btcPrice ? `$${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-bold">LIVE</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {(['all', 'crypto', 'sports'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition ${
                filter === f
                  ? 'bg-[#D9C5A0] text-black'
                  : 'bg-[#111] border border-[#1F1F1F] text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Live Crypto Market Section */}
        {filter !== 'sports' && (
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live Crypto & Futures Markets
            </h2>
            <CryptoMarketSection />
          </div>
        )}

        {/* Other Markets Grid */}
        {filter !== 'crypto' && (
          <SignedIn>
            {otherMarkets.length > 0 && (
              <>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Other Markets</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {otherMarkets.map(market => (
                    <Link
                      key={market.id}
                      href={`/market/${market.id}`}
                      className="bg-[#111] border border-[#1F1F1F] hover:border-[#D9C5A0]/40 rounded-2xl p-5 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-black text-[#D9C5A0] bg-[#D9C5A0]/10 px-2 py-1 rounded uppercase tracking-widest">
                          {market.category}
                        </span>
                        {market.resolved ? (
                          <span className="text-[10px] text-gray-500 font-bold uppercase">Settled</span>
                        ) : (
                          <div className="flex items-center gap-1.5 text-green-400">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase">Open</span>
                          </div>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white mb-4 leading-tight group-hover:text-[#D9C5A0] transition-colors">
                        {market.title}
                      </h3>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Pool: {market.poolSize} USDT</span>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#D9C5A0] transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </SignedIn>
        )}

        <SignedOut>
          <div className="text-center py-20">
            <h2 className="text-3xl font-black text-white mb-4">Sign in to trade markets</h2>
            <p className="text-gray-400 mb-8">Connect your wallet and Clerk account to start betting on Base L2.</p>
            <SignInButton mode="modal">
              <button className="bg-[#D9C5A0] text-black font-bold px-8 py-3 rounded-xl text-sm hover:bg-[#c4b18f] transition">
                Get Started
              </button>
            </SignInButton>
          </div>
        </SignedOut>
      </main>
    </div>
  )
}
