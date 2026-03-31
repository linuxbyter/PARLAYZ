'use client'

import Header from '@/src/components/Header'
import { useAccount, useReadContract } from 'wagmi'
import { PARLAYZ_MARKET_ABI } from '@/src/abi/ParlayzMarket'
import { usePlaceBet } from '@/src/hooks/useMarket'
import { ArrowUpRight, TrendingUp, TrendingDown, Lock, Clock, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { parseUnits } from 'viem'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKET_CONTRACT_ADDRESS as `0x${string}`
const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS as `0x${string}`

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

export default async function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return <MarketDetail resolvedParams={resolvedParams} />
}

function MarketDetail({ resolvedParams }: { resolvedParams: { id: string } }) {
  const { address, isConnected } = useAccount()
  const { placeBet } = usePlaceBet()
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null)
  const [stakeAmount, setStakeAmount] = useState('0.5')
  const [isApproving, setIsApproving] = useState(false)
  const [isBetting, setIsBetting] = useState(false)

  const marketId = BigInt(resolvedParams.id)

  const { data: marketData, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PARLAYZ_MARKET_ABI,
    functionName: 'getMarket',
    args: [marketId],
  })

  const { data: allowance } = useReadContract({
    address: USDT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, CONTRACT_ADDRESS],
  })

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

  if (isLoading || !marketData) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-12 h-12 border-2 border-[#D9C5A0]/20 border-t-[#D9C5A0] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading market...</p>
        </main>
      </div>
    )
  }

  const [title, category, outcomes, closesAt, resolved, winningOutcome, totalPool, isCrypto, strikePrice] = marketData as [string, string, string[], bigint, boolean, number, bigint, boolean, bigint]

  const isClosed = BigInt(Math.floor(Date.now() / 1000)) >= closesAt
  const poolFormatted = Number(totalPool) / 1e6

  const handleBet = async () => {
    if (selectedOutcome === null) return
    const amount = parseFloat(stakeAmount)
    if (amount <= 0) return

    const stakeWei = parseUnits(stakeAmount, 6)
    const allowanceNum = BigInt(allowance || 0)

    if (allowanceNum < stakeWei) {
      setIsApproving(true)
    }
    setIsBetting(true)

    try {
      await placeBet(marketId, selectedOutcome, amount)
      setStakeAmount('0.5')
      setSelectedOutcome(null)
    } catch (e) {
      console.error('Bet failed:', e)
    } finally {
      setIsApproving(false)
      setIsBetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition">
          <ChevronLeft className="w-4 h-4" />
          Back to Markets
        </Link>

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
          <p className="text-sm text-gray-500 mt-2">Pool: {poolFormatted.toFixed(2)} USDT</p>
        </div>

        {/* Bet Interface */}
        {!resolved && !isClosed && (
          <div className="bg-[#151515] border border-[#1F1F1F] rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Place Your Bet</h3>

            {/* Outcomes */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {outcomes.map((outcome, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOutcome(idx)}
                  className={`py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                    selectedOutcome === idx
                      ? idx === 0
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-red-500 border-red-500 text-white'
                      : 'border-[#1F1F1F] bg-[#1a1a1a] text-gray-400 hover:border-[#D9C5A0]/50'
                  }`}
                >
                  {idx === 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {outcome}
                </button>
              ))}
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
              disabled={selectedOutcome === null || isApproving || isBetting}
              className="w-full bg-[#26a17b] hover:bg-[#1e8c6b] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              {isApproving ? (
                <>Approving USDT...</>
              ) : isBetting ? (
                <>Placing Bet...</>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  Place Bet
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
