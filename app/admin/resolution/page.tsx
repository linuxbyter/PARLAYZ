'use client'

import { useAuth } from '@clerk/nextjs'
import { useAccount } from 'wagmi'
import { useSettleManualMarket, useMarketCount } from '@/src/hooks/useMarket'
import { PARLAYZ_MARKET_ABI } from '@/src/abi/ParlayzMarket'
import { useReadContract } from 'wagmi'
import { Shield, CheckCircle, Loader2, AlertCircle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKET_CONTRACT_ADDRESS as `0x${string}`

interface MarketInfo {
  id: bigint
  title: string
  category: string
  outcomes: string[]
  closesAt: bigint
  resolved: boolean
  winningOutcome: number
  totalPool: bigint
  isCrypto: boolean
}

export default function AdminResolutionPage() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth()
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const { settle } = useSettleManualMarket()
  const { data: marketCount } = useMarketCount()

  const [markets, setMarkets] = useState<MarketInfo[]>([])
  const [resolvingMarket, setResolvingMarket] = useState<bigint | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.push('/')
      return
    }
    checkAdmin()
  }, [isLoaded, isSignedIn])

  const checkAdmin = async () => {
    try {
      const token = await getToken({ template: 'default' })
      const resp = await fetch('/api/admin/check', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await resp.json()
      if (!data.isAdmin) {
        router.push('/')
        return
      }
      setIsAdmin(true)
    } catch (e) {
      router.push('/')
    }
  }

  useEffect(() => {
    if (!isAdmin || !marketCount) return
    loadMarkets()
  }, [isAdmin, marketCount])

  const loadMarkets = async () => {
    const count = Number(marketCount || 0)
    const loaded: MarketInfo[] = []

    for (let i = 0; i < count; i++) {
      try {
        const resp = await fetch(`/api/markets/${i}`)
        const data = await resp.json()
        if (data && !data.isCrypto && !data.resolved) {
          loaded.push({
            id: BigInt(i),
            title: data.title,
            category: data.category,
            outcomes: data.outcomes,
            closesAt: BigInt(data.closesAt),
            resolved: data.resolved,
            winningOutcome: data.winningOutcome,
            totalPool: BigInt(data.totalPool),
            isCrypto: data.isCrypto,
          })
        }
      } catch (e) {}
    }

    setMarkets(loaded)
  }

  const handleResolve = async (marketId: bigint, outcomeIndex: number, outcomes: string[]) => {
    if (!isConnected) {
      setError('Connect your admin wallet first')
      return
    }

    setResolvingMarket(marketId)
    setError('')
    setSuccess('')

    try {
      const timestamp = BigInt(Math.floor(Date.now() / 1000))

      // Build the EIP-712 typed data for signing
      const domain = {
        name: 'ParlayzMarket',
        version: '1',
        chainId: 8453,
        verifyingContract: CONTRACT_ADDRESS,
      }

      const types = {
        Settlement: [
          { name: 'marketId', type: 'uint256' },
          { name: 'outcomeIndex', type: 'uint8' },
          { name: 'price', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
        ],
      }

      const value = {
        marketId,
        outcomeIndex,
        price: BigInt(0),
        timestamp,
      }

      // Request signature from MetaMask
      const signature = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [address, JSON.stringify({ domain, types, primaryType: 'Settlement', message: value })],
      })

      // Execute settlement on-chain
      const txHash = await settle(marketId, outcomeIndex, timestamp, signature as `0x${string}`)

      setSuccess(`Market resolved: ${outcomes[outcomeIndex]} won! Tx: ${txHash.slice(0, 10)}...`)
      setResolvingMarket(null)
      loadMarkets()
    } catch (e: unknown) {
      console.error('Resolution failed:', e)
      setError((e as Error).message || 'Resolution failed. Check wallet.')
      setResolvingMarket(null)
    }
  }

  if (!isLoaded || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#D9C5A0]/20 border-t-[#D9C5A0] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <header className="border-b border-[#1F1F1F] bg-[#0a0a0a]/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-wide flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#D9C5A0]" />
            PARLAYZ Admin
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition">
          <ChevronLeft className="w-4 h-4" />
          Back to Markets
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white">Market Resolution</h1>
          <span className="text-xs text-gray-500 font-bold">
            {markets.length} pending
          </span>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        {markets.length === 0 ? (
          <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-12 text-center">
            <Shield className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">No markets pending resolution</p>
            <p className="text-sm text-gray-600 mt-1">All non-crypto markets are resolved or still open.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {markets.map((market) => (
              <div key={market.id.toString()} className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[9px] font-black text-[#D9C5A0] bg-[#D9C5A0]/10 px-2 py-1 rounded uppercase tracking-widest">
                      {market.category}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-2">{market.title}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-bold">Pool</p>
                    <p className="text-sm font-mono text-white">{(Number(market.totalPool) / 1e6).toFixed(2)} USDT</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {market.outcomes.map((outcome, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleResolve(market.id, idx, market.outcomes)}
                      disabled={resolvingMarket === market.id}
                      className={`py-3 px-4 rounded-xl text-sm font-bold transition border flex items-center justify-center gap-2 ${
                        resolvingMarket === market.id
                          ? 'bg-[#111] border-[#1F1F1F] text-gray-600 cursor-not-allowed'
                          : 'border-[#1F1F1F] bg-[#1a1a1a] text-white hover:border-[#D9C5A0]/50 hover:bg-[#D9C5A0]/10'
                      }`}
                    >
                      {resolvingMarket === market.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {outcome}
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-gray-600 mt-3">
                  Clicking an outcome will prompt your wallet to sign and execute settleManualMarket() on Base L2.
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
