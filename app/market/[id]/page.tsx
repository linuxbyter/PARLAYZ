'use client'

import Header from '@/src/components/Header'
import ParimutuelGraph from '@/src/components/ParimutuelGraph'
import LivePriceChart from '@/src/components/LivePriceChart'
import PoolAnimation from '@/src/components/PoolAnimation'
import { useAccount } from 'wagmi'
import { ArrowUpRight, TrendingUp, TrendingDown, Lock, Clock, ChevronLeft, Users, TrainFront } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

const MOCK_MARKETS: Record<string, { title: string; category: string; outcomes: string[]; poolSize: number; isCrypto: boolean }> = {
  '0': { title: 'Will BTC be above $104,000 at :35?', category: 'Crypto', outcomes: ['UP', 'DOWN'], poolSize: 1240, isCrypto: true },
  '1': { title: 'Will ETH break $2,100 by :50?', category: 'Crypto', outcomes: ['YES', 'NO'], poolSize: 890, isCrypto: true },
  '2': { title: 'Arsenal vs Chelsea - Who wins?', category: 'Sports', outcomes: ['Arsenal', 'Draw', 'Chelsea'], poolSize: 4520, isCrypto: false },
}

interface PoolBet {
  outcomeIndex: number
  amount: number
}

interface PoolEvent {
  amount: number
  timestamp: number
}

export default function MarketDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const { isConnected } = useAccount()
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null)
  const [stakeAmount, setStakeAmount] = useState('0.5')
  const [isBetting, setIsBetting] = useState(false)
  const [poolBets, setPoolBets] = useState<PoolBet[]>([])
  const [phase, setPhase] = useState<'boarding' | 'locked' | 'settled'>('boarding')
  const [phaseTimeLeft, setPhaseTimeLeft] = useState('')
  const [poolEvents, setPoolEvents] = useState<PoolEvent[]>([])
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [showChart, setShowChart] = useState(true)

  const mockMarket = MOCK_MARKETS[id]

  useEffect(() => {
    if (!mockMarket) return
    const total = mockMarket.poolSize
    const outcomes = mockMarket.outcomes
    setPoolBets(outcomes.map((_, idx) => ({
      outcomeIndex: idx,
      amount: total * (idx === 0 ? 0.6 : 0.4) / (outcomes.length - 1 || 1),
    })))

    const updatePhase = () => {
      const now = new Date()
      const mins = now.getMinutes()
      const secs = now.getSeconds()
      const cycleStart = Math.floor(mins / 5) * 5
      const boardingEnd = cycleStart + 3
      const settleAt = cycleStart + 5

      const totalSecsInCycle = mins * 60 + secs
      const boardingEndSecs = boardingEnd * 60
      const settleAtSecs = settleAt * 60

      if (totalSecsInCycle < boardingEndSecs) {
        setPhase('boarding')
        const remaining = boardingEndSecs - totalSecsInCycle
        setPhaseTimeLeft(`${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`)
      } else if (totalSecsInCycle < settleAtSecs) {
        setPhase('locked')
        const remaining = settleAtSecs - totalSecsInCycle
        setPhaseTimeLeft(`${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`)
      } else {
        setPhase('settled')
        setPhaseTimeLeft('Settled')
      }
    }

    updatePhase()
    const interval = setInterval(updatePhase, 1000)
    return () => clearInterval(interval)
  }, [mockMarket])

  if (!mockMarket) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-black text-white mb-2">Market not found</h2>
          <Link href="/" className="text-[#D9C5A0] hover:underline">← Back to Markets</Link>
        </main>
      </div>
    )
  }

  const title = mockMarket.title
  const category = mockMarket.category
  const outcomes = mockMarket.outcomes
  const isCrypto = mockMarket.isCrypto
  const poolFormatted = mockMarket.poolSize

  const totalVol = poolBets.reduce((s, b) => s + b.amount, 0)
  const outcomeVol: number[] = outcomes.map((_, idx) =>
    poolBets.filter(b => b.outcomeIndex === idx).reduce((s, b) => s + b.amount, 0)
  )
  const estPayout = selectedOutcome !== null && outcomeVol[selectedOutcome] > 0
    ? (parseFloat(stakeAmount) / (outcomeVol[selectedOutcome] + parseFloat(stakeAmount))) * (totalVol + parseFloat(stakeAmount))
    : parseFloat(stakeAmount) * 1.8

  const handleBet = () => {
    if (selectedOutcome === null || phase !== 'boarding') return
    const amount = parseFloat(stakeAmount)
    if (amount <= 0) return

    setIsBetting(true)
    setPoolBets(prev => [...prev, { outcomeIndex: selectedOutcome, amount }])
    setPoolEvents(prev => [...prev, { amount, timestamp: Date.now() }])
    setStakeAmount('0.5')
    setSelectedOutcome(null)
    setTimeout(() => setIsBetting(false), 500)
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition">
          <ChevronLeft className="w-4 h-4" />
          Back to Markets
        </Link>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4 text-center">
          <p className="text-xs text-yellow-400 font-bold">Preview Mode — Smart Contract not deployed yet</p>
        </div>

        {/* Market Header with Phase Badge */}
        <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-[#D9C5A0] bg-[#D9C5A0]/10 px-2 py-1 rounded uppercase tracking-widest">
                {category}
              </span>
              {isCrypto && (
                <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1">
                  <TrainFront className="w-3 h-3" />
                  TRAIN
                </span>
              )}
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
              phase === 'boarding'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : phase === 'locked'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                phase === 'boarding' ? 'bg-green-400 animate-pulse' :
                phase === 'locked' ? 'bg-red-400' : 'bg-gray-400'
              }`} />
              {phase === 'boarding' ? `BOARDING · ${phaseTimeLeft}` :
               phase === 'locked' ? `IN TRANSIT · ${phaseTimeLeft}` :
               'ARRIVED'}
            </div>
          </div>
          <h1 className="text-xl font-black text-white leading-tight">{title}</h1>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Pool: <PoolAnimation totalPool={poolFormatted} newBets={poolEvents} />
            </span>
          </div>
        </div>

        {/* Live Price Chart for Crypto Markets */}
        {isCrypto && showChart && phase !== 'settled' && (
          <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <TrainFront className="w-4 h-4" />
                Live Price — {phase === 'boarding' ? 'Boarding Open' : 'Locked — Watching'}
              </h3>
              <button onClick={() => setShowChart(false)} className="text-xs text-gray-500 hover:text-white">✕</button>
            </div>
            <LivePriceChart
              symbol={title.includes('BTC') ? 'BTCUSDT' : 'ETHUSDT'}
              strikePrice={104000}
              height={220}
              phase={phase}
              onPriceUpdate={setCurrentPrice}
            />
          </div>
        )}

        {/* Payout Calculator */}
        {selectedOutcome !== null && phase === 'boarding' && (
          <div className="bg-[#0a0a0a] border border-[#1F1F1F] rounded-xl p-4 mb-6">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">Payout Estimate</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[9px] text-gray-600 uppercase font-bold">Stake</p>
                <p className="text-sm font-mono font-bold text-white">{parseFloat(stakeAmount).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-600 uppercase font-bold">Est. Payout</p>
                <p className="text-sm font-mono font-bold text-green-400">{estPayout.toFixed(2)} USDT</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-600 uppercase font-bold">Profit</p>
                <p className="text-sm font-mono font-bold text-green-400">+{(estPayout - parseFloat(stakeAmount)).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bet Interface - BOARDING PHASE */}
        {phase === 'boarding' && (
          <div className="bg-[#151515] border border-[#1F1F1F] rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Place Your Bet</h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {outcomes.map((outcome, idx) => {
                const vol = outcomeVol[idx] || 0
                const pct = totalVol > 0 ? ((vol / totalVol) * 100).toFixed(0) : '50'
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedOutcome(idx)}
                    className={`py-4 rounded-xl transition-all border flex flex-col items-center gap-1 ${
                      selectedOutcome === idx
                        ? idx === 0
                          ? 'bg-green-500/20 border-green-500'
                          : 'bg-red-500/20 border-red-500'
                        : 'border-[#1F1F1F] bg-[#1a1a1a] hover:border-[#D9C5A0]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {idx === 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                      <span className={`text-sm font-black uppercase tracking-widest ${
                        selectedOutcome === idx
                          ? idx === 0 ? 'text-green-400' : 'text-red-400'
                          : 'text-white'
                      }`}>
                        {outcome}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{pct}% · {vol.toFixed(2)} USDT</span>
                  </button>
                )
              })}
            </div>

            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Stake (USDT)</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[0.5, 1, 5].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setStakeAmount(String(amt))}
                    className={`rounded-lg py-2 text-xs font-bold transition border ${
                      stakeAmount === String(amt)
                        ? 'bg-[#26a17b] border-[#26a17b] text-white'
                        : 'border-[#1F1F1F] bg-[#1a1a1a] text-gray-400'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={stakeAmount}
                onChange={e => setStakeAmount(e.target.value)}
                step="0.1"
                className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#26a17b] font-mono"
              />
            </div>

            <button
              onClick={handleBet}
              disabled={selectedOutcome === null || isBetting}
              className="w-full bg-[#26a17b] hover:bg-[#1e8c6b] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              {isBetting ? 'Placing...' : <><ArrowUpRight className="w-4 h-4" /> Place Bet (Preview)</>}
            </button>
          </div>
        )}

        {/* LOCKED PHASE */}
        {phase === 'locked' && (
          <div className="bg-[#1a0a0c] border border-red-500/30 rounded-2xl p-8 text-center">
            <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-black text-red-400 mb-2">IN TRANSIT</h3>
            <p className="text-gray-400 mb-4">Market locked. Watching price for settlement.</p>
            <div className="text-3xl font-black font-mono text-white">{phaseTimeLeft}</div>
            <p className="text-xs text-gray-600 mt-2">until arrival</p>
            {currentPrice && (
              <div className="mt-4 text-sm text-gray-400">
                Current: <span className="text-white font-mono font-bold">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
        )}

        {/* SETTLED PHASE */}
        {phase === 'settled' && (
          <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-8 text-center">
            <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-black text-gray-400 mb-2">ARRIVED</h3>
            <p className="text-gray-500">This market has settled. Next train departing soon.</p>
          </div>
        )}
      </main>
    </div>
  )
}
