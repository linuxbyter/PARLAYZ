'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Clock, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import { LoginPromptModal } from './LoginPromptModal'

interface Market {
  id: string
  label: string
  category: string
  poolSize: string
  yesPrice: number
  noPrice: number
  type: 'binary' | 'versus' | 'crypto' | 'multi'
  outcomes?: { label: string; yesPrice: number; noPrice: number }[]
}

interface MarketCardProps {
  market: Market
  live?: boolean
}

export function MarketCard({ market, live = false }: MarketCardProps) {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null)
  const [betType, setBetType] = useState<'yes' | 'no' | null>(null)

  const handleBet = (outcomeIndex?: number, type?: 'yes' | 'no') => {
    setSelectedOutcome(outcomeIndex ?? null)
    setBetType(type ?? null)
    setShowLoginModal(true)
  }

  // Binary market (Will X happen?)
  if (market.type === 'binary') {
    return (
      <>
        <Link
          href={`/market/${market.id}`}
          className="group bg-[#111] border border-[#1F1F1F] hover:border-[#B8860B]/50 rounded-xl p-4 transition-all duration-200 hover:shadow-[0_0_20px_rgba(184,134,11,0.15)] block"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span className="text-xs font-bold text-gray-400 uppercase">{market.label}</span>
            </div>
            <div className="flex items-center gap-1">
              {live && <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />}
              <span className="text-[9px] text-[#C9A84C] font-bold uppercase">Live</span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-white mb-4 leading-snug group-hover:text-[#C9A84C] transition-colors">
            Will {market.label} happen?
          </h3>

          {/* Speedometer */}
          <div className="relative h-16 mb-4">
            <div className="absolute inset-x-0 bottom-0 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${market.yesPrice}%` }}
                className="h-full bg-gradient-to-r from-[#4CAF7D] to-[#C9A84C]"
              />
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
              <span className="text-2xl font-black text-white">{market.yesPrice}%</span>
            </div>
          </div>

          {/* Yes/No Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <SignedIn>
              <button 
                onClick={(e) => { e.preventDefault(); handleBet(0, 'yes') }}
                className="py-2 px-3 rounded-full text-sm font-bold text-white bg-[#4CAF7D]/20 border border-[#4CAF7D]/30 hover:bg-[#4CAF7D]/40 transition"
              >
                YES {market.yesPrice}¢
              </button>
            </SignedIn>
            <SignedIn>
              <button 
                onClick={(e) => { e.preventDefault(); handleBet(0, 'no') }}
                className="py-2 px-3 rounded-full text-sm font-bold text-white bg-[#E05252]/20 border border-[#E05252]/30 hover:bg-[#E05252]/40 transition"
              >
                NO {market.noPrice}¢
              </button>
            </SignedIn>
            <SignedOut>
              <button 
                onClick={(e) => { e.preventDefault(); setShowLoginModal(true) }}
                className="py-2 px-3 rounded-full text-sm font-bold text-white bg-[#4CAF7D]/20 border border-[#4CAF7D]/30 hover:bg-[#4CAF7D]/40 transition"
              >
                YES {market.yesPrice}¢
              </button>
            </SignedOut>
            <SignedOut>
              <button 
                onClick={(e) => { e.preventDefault(); setShowLoginModal(true) }}
                className="py-2 px-3 rounded-full text-sm font-bold text-white bg-[#E05252]/20 border border-[#E05252]/30 hover:bg-[#E05252]/40 transition"
              >
                NO {market.noPrice}¢
              </button>
            </SignedOut>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-[#1F1F1F]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>5 min cycle</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#C9A84C] font-mono font-bold">{market.poolSize}</span>
              <span>USDT</span>
            </div>
          </div>
        </Link>

        <LoginPromptModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)}
          marketName={market.label}
        />
      </>
    )
  }

  // Versus market (Team A vs Team B)
  if (market.type === 'versus' && market.outcomes) {
    return (
      <>
        <Link
          href={`/market/${market.id}`}
          className="group bg-[#111] border border-[#1F1F1F] hover:border-[#B8860B]/50 rounded-xl p-4 transition-all duration-200 hover:shadow-[0_0_20px_rgba(184,134,11,0.15)] block"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span className="text-xs font-bold text-gray-400 uppercase">{market.label}</span>
            </div>
            {live && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
                <span className="text-[9px] text-[#C9A84C] font-bold uppercase">Live</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {market.outcomes.map((outcome, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{outcome.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#C9A84C]">{outcome.yesPrice}%</span>
                  <button 
                    onClick={(e) => { e.preventDefault(); handleBet(idx, 'yes') }}
                    className="px-2 py-1 text-xs font-bold rounded-full bg-[#4CAF7D]/20 text-[#4CAF7D] border border-[#4CAF7D]/30"
                  >
                    YES
                  </button>
                  <button 
                    onClick={(e) => { e.preventDefault(); handleBet(idx, 'no') }}
                    className="px-2 py-1 text-xs font-bold rounded-full bg-[#E05252]/20 text-[#E05252] border border-[#E05252]/30"
                  >
                    NO
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-[#1F1F1F]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>Event starts soon</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#C9A84C] font-mono font-bold">{market.poolSize}</span>
              <span>USDT</span>
            </div>
          </div>
        </Link>

        <LoginPromptModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)}
          marketName={market.label}
        />
      </>
    )
  }

  // Crypto market (UP/DOWN)
  if (market.type === 'crypto') {
    return (
      <>
        <Link
          href={`/market/${market.id}`}
          className="group bg-[#111] border border-[#1F1F1F] hover:border-[#B8860B]/50 rounded-xl p-4 transition-all duration-200 hover:shadow-[0_0_20px_rgba(184,134,11,0.15)] block"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span className="text-xs font-bold text-gray-400 uppercase">{market.label}</span>
            </div>
            <div className="flex items-center gap-1">
              {live && <div className="w-2 h-2 rounded-full bg-[#4CAF7D] animate-pulse" />}
              <span className="text-[9px] text-[#4CAF7D] font-bold uppercase">LIVE</span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-white mb-4 leading-snug group-hover:text-[#C9A84C] transition-colors">
            Will {market.label} go UP or DOWN in 5 min?
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <SignedIn>
              <button 
                onClick={(e) => { e.preventDefault(); handleBet(0, 'yes') }}
                className="py-3 px-4 rounded-xl text-base font-bold text-white bg-[#4CAF7D] hover:bg-[#45a36d] transition flex flex-col items-center"
              >
                UP
                <span className="text-xs font-normal opacity-70">{market.yesPrice}%</span>
              </button>
            </SignedIn>
            <SignedIn>
              <button 
                onClick={(e) => { e.preventDefault(); handleBet(0, 'no') }}
                className="py-3 px-4 rounded-xl text-base font-bold text-white bg-[#E05252] hover:bg-[#d14848] transition flex flex-col items-center"
              >
                DOWN
                <span className="text-xs font-normal opacity-70">{market.noPrice}%</span>
              </button>
            </SignedIn>
            <SignedOut>
              <button 
                onClick={(e) => { e.preventDefault(); setShowLoginModal(true) }}
                className="py-3 px-4 rounded-xl text-base font-bold text-white bg-[#4CAF7D] hover:bg-[#45a36d] transition flex flex-col items-center"
              >
                UP
                <span className="text-xs font-normal opacity-70">{market.yesPrice}%</span>
              </button>
            </SignedOut>
            <SignedOut>
              <button 
                onClick={(e) => { e.preventDefault(); setShowLoginModal(true) }}
                className="py-3 px-4 rounded-xl text-base font-bold text-white bg-[#E05252] hover:bg-[#d14848] transition flex flex-col items-center"
              >
                DOWN
                <span className="text-xs font-normal opacity-70">{market.noPrice}%</span>
              </button>
            </SignedOut>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-[#1F1F1F]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>5 min cycle</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#C9A84C] font-mono font-bold">{market.poolSize}</span>
              <span>USDT</span>
            </div>
          </div>
        </Link>

        <LoginPromptModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)}
          marketName={market.label}
        />
      </>
    )
  }

  // Multi-outcome market
  if (market.type === 'multi' && market.outcomes) {
    return (
      <>
        <Link
          href={`/market/${market.id}`}
          className="group bg-[#111] border border-[#1F1F1F] hover:border-[#B8860B]/50 rounded-xl p-4 transition-all duration-200 hover:shadow-[0_0_20px_rgba(184,134,11,0.15)] block"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span className="text-xs font-bold text-gray-400 uppercase">{market.label}</span>
            </div>
            {live && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
                <span className="text-[9px] text-[#C9A84C] font-bold uppercase">Live</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {market.outcomes.map((outcome, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-[#0a0a0a] rounded-lg">
                <div>
                  <span className="text-sm font-medium text-white">{outcome.label}</span>
                  <span className="ml-2 text-xs font-bold text-[#C9A84C]">{outcome.yesPrice}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => { e.preventDefault(); handleBet(idx, 'yes') }}
                    className="px-2 py-1 text-xs font-bold rounded-full bg-[#4CAF7D]/20 text-[#4CAF7D] border border-[#4CAF7D]/30"
                  >
                    YES
                  </button>
                  <button 
                    onClick={(e) => { e.preventDefault(); handleBet(idx, 'no') }}
                    className="px-2 py-1 text-xs font-bold rounded-full bg-[#E05252]/20 text-[#E05252] border border-[#E05252]/30"
                  >
                    NO
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-[#1F1F1F]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>Multi-outcome</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#C9A84C] font-mono font-bold">{market.poolSize}</span>
              <span>USDT</span>
            </div>
          </div>
        </Link>

        <LoginPromptModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)}
          marketName={market.label}
        />
      </>
    )
  }

  // Default fallback
  return (
    <Link
      href={`/market/${market.id}`}
      className="group bg-[#111] border border-[#1F1F1F] hover:border-[#B8860B]/50 rounded-xl p-4 transition-all duration-200 block"
    >
      <div className="text-sm font-bold text-white">{market.label}</div>
    </Link>
  )
}