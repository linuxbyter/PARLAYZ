'use client'

import Header from '@/src/components/Header'
import { useParams, useRouter } from 'next/navigation'
import { useState, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, TrendingUp, TrendingDown, Clock, Calendar, BarChart3,
  Users, MessageSquare, Send, Wallet, Shield, Info, Activity, Loader2,
} from 'lucide-react'
import { useWallet, useCurrency } from '@/src/hooks/useWallet'
import { MOCK_MARKETS, formatOdds, oddsToDecimal } from '@/src/lib/mockMarkets'
import { SportsChart } from '@/src/components/SentimentChart'

export default function MarketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = parseInt(params?.id as string)
  const market = MOCK_MARKETS.find(m => m.id === id)
  const wallet = useWallet()
  const { displaySymbol } = useCurrency()

  const [stakeAmount, setStakeAmount] = useState('100')
  const [activeTab, setActiveTab] = useState<'overview' | 'bets'>('overview')
  const [selectedSide, setSelectedSide] = useState<'home' | 'away' | null>(null)
  const [isPlacing, setIsPlacing] = useState(false)
  const [betError, setBetError] = useState('')

  const oddsDecimal = useMemo(() => {
    if (!market) return { home: 0, away: 0 }
    return {
      home: oddsToDecimal(market.homeOdds),
      away: oddsToDecimal(market.awayOdds),
    }
  }, [market])

  const potentialPayout = useMemo(() => {
    if (!selectedSide || !market) return 0
    const odds = selectedSide === 'home' ? oddsDecimal.home : oddsDecimal.away
    return parseFloat(stakeAmount || '0') * odds
  }, [selectedSide, stakeAmount, market, oddsDecimal])

  const handleBet = useCallback((side: 'home' | 'away') => {
    if (!market) return
    setSelectedSide(side)
  }, [market])

  const confirmBet = useCallback(async () => {
    if (!market || !selectedSide) return
    const amount = parseFloat(stakeAmount) || 0
    if (amount > wallet.displayBalance) {
      setBetError('Insufficient balance')
      return
    }
    setBetError('')
    setIsPlacing(true)
    try {
      await new Promise((r) => setTimeout(r, 1200))
      wallet.subtractBalance(amount)
      wallet.incrementActiveBets()
      setSelectedSide(null)
      setStakeAmount('100')
    } catch {
      setBetError('Failed to place bet. Please try again.')
    } finally {
      setIsPlacing(false)
    }
  }, [market, selectedSide, stakeAmount, wallet])

  if (!market) {
    return (
      <div className="min-h-screen bg-[#000000] text-white">
        <Header />
        <main className="max-w-[1400px] mx-auto px-4 py-12 text-center">
          <p className="text-[var(--black-dim)]">Market not found</p>
          <button onClick={() => router.push('/')} className="mt-4 text-[var(--gold)] text-sm font-bold">Back to Markets</button>
        </main>
      </div>
    )
  }

  const matchTime = new Date(market.startTime)
  const isLive = market.status === 'live'

  return (
    <div className="min-h-screen bg-[#000000] text-white pb-20">
      <Header />

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-[var(--black-dim)] hover:text-white transition mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-bold">Back to Markets</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--gold)]">{market.sport}</span>
                {isLive && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-[var(--status-won)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-won)] animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-6 mt-4 items-center">
                <div className="text-center">
                  <p className="text-lg font-black text-white">{market.homeTeam}</p>
                  <p className="text-sm font-mono font-bold text-[var(--status-won)] mt-1">{formatOdds(market.homeOdds)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--black-dim)]">vs</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-[var(--black-dim)]" />
                    <span className="text-[10px] font-mono text-[var(--black-dim)]">
                      {matchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[9px] text-[var(--black-subtle)] mt-1">{market.league}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-white">{market.awayTeam}</p>
                  <p className="text-sm font-mono font-bold text-[var(--status-lost)] mt-1">{formatOdds(market.awayOdds)}</p>
                </div>
              </div>
            </div>

            <div className="flex bg-[var(--black-card)] border border-[var(--black-border)] rounded-xl p-1 gap-1">
              {[
                { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
                { id: 'bets' as const, label: 'Betting Activity', icon: Activity },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-[var(--black-soft)] text-white'
                      : 'text-[var(--black-dim)] hover:text-white'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-2xl p-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--black-dim)] mb-4">Match Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--black-soft)] rounded-xl p-4">
                      <p className="text-[9px] text-[var(--black-dim)] uppercase font-bold mb-1">Date</p>
                      <p className="text-sm font-mono font-bold text-white">
                        {matchTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="bg-[var(--black-soft)] rounded-xl p-4">
                      <p className="text-[9px] text-[var(--black-dim)] uppercase font-bold mb-1">Time</p>
                      <p className="text-sm font-mono font-bold text-white">
                        {matchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-2xl p-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--black-dim)] mb-4">Betting Distribution</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-[var(--status-won)] font-bold">{market.homeTeam}</span>
                        <span className="text-[var(--status-won)] font-mono font-bold">62%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--black-border)] overflow-hidden">
                        <div className="bg-[var(--status-won)] h-full rounded-full" style={{ width: '62%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-[var(--status-lost)] font-bold">{market.awayTeam}</span>
                        <span className="text-[var(--status-lost)] font-mono font-bold">38%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--black-border)] overflow-hidden">
                        <div className="bg-[var(--status-lost)] h-full rounded-full" style={{ width: '38%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bets' && (
              <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-[var(--gold)]" />
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--black-dim)]">Recent Bets</h4>
                </div>
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--black-border)] last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[var(--gold-muted)] flex items-center justify-center">
                        <Users className="w-3 h-3 text-[var(--gold)]" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white">0x{i}abc...def{i}</p>
                        <p className="text-[9px] text-[var(--black-dim)]">KSh {i * 2500}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-white">{formatOdds(i % 2 === 0 ? market.homeOdds : market.awayOdds)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-2xl p-6 sticky top-24 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--black-dim)]">Stake Amount</label>
                  <span className="text-[10px] font-bold text-[var(--black-dim)]">
                    Bal: {displaySymbol}{wallet.displayBalance.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => handleBet('home')}
                    className={`py-4 rounded-xl border-2 text-center transition-all ${
                      selectedSide === 'home'
                        ? 'border-[var(--status-won)] bg-[var(--status-won-bg)]'
                        : 'border-[var(--black-border)] hover:border-[var(--status-won)]'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5 text-[var(--status-won)] mx-auto mb-1" />
                    <p className="text-[9px] font-bold text-[var(--status-won)] uppercase">{market.homeTeam.split(' ').pop()}</p>
                    <p className="text-sm font-mono font-bold text-white">{formatOdds(market.homeOdds)}</p>
                  </button>
                  <button
                    onClick={() => handleBet('away')}
                    className={`py-4 rounded-xl border-2 text-center transition-all ${
                      selectedSide === 'away'
                        ? 'border-[var(--status-lost)] bg-[var(--status-lost-bg)]'
                        : 'border-[var(--black-border)] hover:border-[var(--status-lost)]'
                    }`}
                  >
                    <TrendingDown className="w-5 h-5 text-[var(--status-lost)] mx-auto mb-1" />
                    <p className="text-[9px] font-bold text-[var(--status-lost)] uppercase">{market.awayTeam.split(' ').pop()}</p>
                    <p className="text-sm font-mono font-bold text-white">{formatOdds(market.awayOdds)}</p>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {[100, 500, 1000, 5000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setStakeAmount(String(amt))}
                      className={`py-2.5 sm:py-2 rounded-lg text-[10px] font-bold transition-all border ${
                        stakeAmount === String(amt)
                          ? 'border-[var(--gold)] text-[var(--gold)] bg-[var(--gold-muted)]'
                          : 'border-[var(--black-border)] text-[var(--black-dim)] hover:text-white'
                      }`}
                    >
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  value={stakeAmount}
                  onChange={e => setStakeAmount(e.target.value)}
                  className="w-full bg-[var(--black-soft)] border border-[var(--black-border)] text-white rounded-xl px-4 py-3 text-lg font-mono focus:outline-none focus:border-[var(--gold)]"
                />
              </div>

              {selectedSide && (
                <div className="bg-[var(--black-soft)] rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[var(--black-dim)]">Selection</span>
                    <span className="text-white font-bold">
                      {selectedSide === 'home' ? market.homeTeam : market.awayTeam}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[var(--black-dim)]">Odds</span>
                    <span className="font-mono text-white font-bold">
                      {formatOdds(selectedSide === 'home' ? market.homeOdds : market.awayOdds)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[var(--black-dim)]">Stake</span>
                    <span className="font-mono text-white font-bold">KSh {parseFloat(stakeAmount || '0').toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold pt-2 border-t border-[var(--black-border)]">
                    <span className="text-[var(--gold)]">Potential Payout</span>
                    <span className="font-mono text-[var(--gold)]">KSh {potentialPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}

              {betError && (
                <p className="text-[10px] text-[var(--status-lost)] font-bold text-center">{betError}</p>
              )}

              <button
                onClick={confirmBet}
                disabled={!selectedSide || isPlacing}
                className="w-full py-4 rounded-xl bg-[var(--gold)] text-black font-bold text-xs uppercase tracking-widest hover:bg-[var(--gold-light)] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPlacing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                {isPlacing ? 'Placing Bet...' : 'Place Bet'}
              </button>

              <div className="pt-4 border-t border-[var(--black-border)] grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] text-[var(--black-dim)] uppercase font-bold mb-1">Total Bets</p>
                  <p className="text-lg font-mono font-bold text-white">1,247</p>
                </div>
                <div>
                  <p className="text-[9px] text-[var(--black-dim)] uppercase font-bold mb-1">Total Staked</p>
                  <p className="text-lg font-mono font-bold text-white">KSh 3.2M</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
