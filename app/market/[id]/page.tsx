'use client'

import Header from '@/src/components/Header'
import ParimutuelGraph from '@/src/components/ParimutuelGraph'
import { useAccount, useReadContract } from 'wagmi'
import { PARLAYZ_MARKET_ABI } from '@/src/abi/ParlayzMarket'
import { usePlaceBet } from '@/src/hooks/useMarket'
import { ArrowUpRight, TrendingUp, TrendingDown, Lock, Clock, ChevronLeft, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { parseUnits } from 'viem'
import { useParams } from 'next/navigation'

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_MARKET_CONTRACT_ADDRESS || '') as `0x${string}`
const USDT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`

const MOCK_MARKETS: Record<string, { title: string; category: string; outcomes: string[]; closesAt: string; resolved: boolean; poolSize: number }> = {
  '0': { title: 'Will BTC be above $104,000 at :35?', category: 'Crypto', outcomes: ['UP', 'DOWN'], closesAt: '2026-03-31T11:35:00Z', resolved: false, poolSize: 1240 },
  '1': { title: 'Will ETH break $2,100 by :50?', category: 'Crypto', outcomes: ['YES', 'NO'], closesAt: '2026-03-31T11:50:00Z', resolved: false, poolSize: 890 },
  '2': { title: 'Arsenal vs Chelsea - Who wins?', category: 'Sports', outcomes: ['Arsenal', 'Draw', 'Chelsea'], closesAt: '2026-04-01T15:00:00Z', resolved: false, poolSize: 4520 },
}

interface PoolBet {
  outcomeIndex: number
  amount: number
}

const USDT_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export default function MarketDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const marketId = id ? BigInt(id) : BigInt(0)
  const isContractDeployed = CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000'

  const { address, isConnected } = useAccount()
  const { placeBet } = usePlaceBet()
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null)
  const [stakeAmount, setStakeAmount] = useState('0.5')
  const [isBetting, setIsBetting] = useState(false)
  const [poolBets, setPoolBets] = useState<PoolBet[]>([])
  const [showGraph, setShowGraph] = useState(true)

  const mockMarket = MOCK_MARKETS[id]
  const isMock = !isContractDeployed && mockMarket

  const { data: marketData, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PARLAYZ_MARKET_ABI,
    functionName: 'getMarket',
    args: [marketId],
    query: { enabled: isContractDeployed && marketId > BigInt(0) },
  })

  const { data: allowance } = useReadContract({
    address: USDT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, CONTRACT_ADDRESS],
    query: { enabled: isContractDeployed && !!address },
  })

  useEffect(() => {
    if (isMock) {
      const total = mockMarket.poolSize
      const outcomes = mockMarket.outcomes
      setPoolBets(outcomes.map((_, idx) => ({
        outcomeIndex: idx,
        amount: total * (idx === 0 ? 0.6 : 0.4) / (outcomes.length - 1 || 1),
      })))
      return
    }
    if (!marketData) return
    const md = marketData as unknown as [string, string, string[], bigint, boolean, number, bigint, boolean, bigint]
    const [, , outcomes, , , , totalPool] = md
    const total = Number(totalPool) / 1e6
    if (total > 0 && outcomes && outcomes.length >= 2) {
      setPoolBets(outcomes.map((_, idx) => ({
        outcomeIndex: idx,
        amount: total * (idx === 0 ? 0.6 : 0.4) / (outcomes.length - 1 || 1),
      })))
    }
  }, [marketData, isMock, mockMarket])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <Lock className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">Connect your wallet</h2>
          <p className="text-gray-400">You need a connected Base wallet to view and trade markets.</p>
        </main>
      </div>
    )
  }

  let title = '', category = '', outcomes: string[] = [], closesAt = BigInt(0), resolved = false, winningOutcome = 0, totalPool = BigInt(0)

  if (isMock && mockMarket) {
    title = mockMarket.title
    category = mockMarket.category
    outcomes = mockMarket.outcomes
    closesAt = BigInt(new Date(mockMarket.closesAt).getTime() / 1000)
    resolved = mockMarket.resolved
    totalPool = BigInt(Math.round(mockMarket.poolSize * 1e6))
  } else if (marketData) {
    const md = marketData as unknown as [string, string, string[], bigint, boolean, number, bigint, boolean, bigint]
    ;[title, category, outcomes, closesAt, resolved, winningOutcome, totalPool] = md
  } else if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-12 h-12 border-2 border-[#D9C5A0]/20 border-t-[#D9C5A0] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading market...</p>
        </main>
      </div>
    )
  } else {
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

  const isClosed = BigInt(Math.floor(Date.now() / 1000)) >= closesAt
  const poolFormatted = Number(totalPool) / 1e6

  const handleBet = async () => {
    if (selectedOutcome === null) return
    const amount = parseFloat(stakeAmount)
    if (amount <= 0) return

    setIsBetting(true)
    try {
      if (isContractDeployed) {
        await placeBet(marketId, selectedOutcome, amount)
      }
      setPoolBets(prev => [...prev, { outcomeIndex: selectedOutcome, amount }])
      setStakeAmount('0.5')
      setSelectedOutcome(null)
    } catch (e) {
      console.error('Bet failed:', e)
    } finally {
      setIsBetting(false)
    }
  }

  const totalVol = poolBets.reduce((s, b) => s + b.amount, 0)
  const outcomeVol: number[] = outcomes.map((_, idx) =>
    poolBets.filter(b => b.outcomeIndex === idx).reduce((s, b) => s + b.amount, 0)
  )
  const estPayout = selectedOutcome !== null && outcomeVol[selectedOutcome] > 0
    ? (parseFloat(stakeAmount) / (outcomeVol[selectedOutcome] + parseFloat(stakeAmount))) * (totalVol + parseFloat(stakeAmount))
    : parseFloat(stakeAmount) * 1.8

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition">
          <ChevronLeft className="w-4 h-4" />
          Back to Markets
        </Link>

        {isMock && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4 text-center">
            <p className="text-xs text-yellow-400 font-bold">Preview Mode — Smart Contract not deployed yet</p>
          </div>
        )}

        {/* Market Header */}
        <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black text-[#D9C5A0] bg-[#D9C5A0]/10 px-2 py-1 rounded uppercase tracking-widest">
              {category}
            </span>
            {resolved ? (
              <span className="text-xs text-gray-500 font-bold uppercase">Settled</span>
            ) : isClosed ? (
              <div className="flex items-center gap-1.5 text-yellow-400">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-bold uppercase">Closed</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-bold uppercase">Open</span>
              </div>
            )}
          </div>
          <h1 className="text-xl font-black text-white leading-tight">{title}</h1>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Pool: {poolFormatted.toFixed(2)} USDT</span>
            <button
              onClick={() => setShowGraph(!showGraph)}
              className="flex items-center gap-1 text-[#D9C5A0] hover:text-white transition"
            >
              <BarChart3 className="w-3 h-3" />
              {showGraph ? 'Hide' : 'Show'} Graph
            </button>
          </div>
        </div>

        {/* Parimutuel Pool Graph */}
        {showGraph && !resolved && (
          <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-4 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Parimutuel Pool Distribution
            </h3>
            <ParimutuelGraph
              bets={poolBets}
              outcomes={outcomes}
              height={260}
            />
          </div>
        )}

        {/* Payout Calculator */}
        {selectedOutcome !== null && !resolved && !isClosed && (
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
            <div className="mt-3 pt-3 border-t border-[#1F1F1F] flex justify-between text-[10px] text-gray-600">
              <span>Pool share: {totalVol > 0 ? ((parseFloat(stakeAmount) / (totalVol + parseFloat(stakeAmount))) * 100).toFixed(1) : 0}%</span>
              <span>Platform fee: 3%</span>
            </div>
          </div>
        )}

        {/* Bet Interface */}
        {!resolved && !isClosed && (
          <div className="bg-[#151515] border border-[#1F1F1F] rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Place Your Bet</h3>

            {/* Outcomes */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {outcomes.map((outcome, idx) => {
                const vol = outcomeVol[idx] || 0
                const pct = totalVol > 0 ? ((vol / totalVol) * 100).toFixed(0) : '50'
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedOutcome(idx)}
                    className={`py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all border flex flex-col items-center gap-1 ${
                      selectedOutcome === idx
                        ? idx === 0
                          ? 'bg-green-500/20 border-green-500 text-green-400'
                          : 'bg-red-500/20 border-red-500 text-red-400'
                        : 'border-[#1F1F1F] bg-[#1a1a1a] text-gray-400 hover:border-[#D9C5A0]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {idx === 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {outcome}
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{pct}% · {vol.toFixed(2)} USDT</span>
                  </button>
                )
              })}
            </div>

            {/* Stake */}
            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                Stake (USDT)
              </label>
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

            {/* Submit */}
            <button
              onClick={handleBet}
              disabled={selectedOutcome === null || isBetting}
              className="w-full bg-[#26a17b] hover:bg-[#1e8c6b] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              {isBetting ? (
                <>Placing Bet...</>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  {isMock ? 'Place Bet (Preview)' : 'Place Bet'}
                </>
              )}
            </button>
          </div>
        )}

        {resolved && (
          <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-400 mb-2">Market resolved</p>
            <p className="text-lg font-black text-white">
              Winner: <span className="text-[#D9C5A0]">{outcomes[winningOutcome]}</span>
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
