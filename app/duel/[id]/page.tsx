'use client'

import Header from '@/src/components/Header'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Swords, CheckCircle, ArrowUpRight, Copy, Clock } from 'lucide-react'

export default function DuelPage() {
  const params = useParams()
  const router = useRouter()
  const duelId = params?.id as string
  const [accepted, setAccepted] = useState(false)
  const [stakeAmount, setStakeAmount] = useState('5')

  const parts = duelId?.split('-') || []
  const instrumentId = parts[0] || 'BTC'

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <Header activeBetsCount={3} balance={2138.00} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-bold">Back to Markets</span>
        </button>

        <div className="bg-[#111] border border-amber-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Swords className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Duel Challenge</h1>
          <p className="text-sm text-gray-400 mb-6">
            {instrumentId} &middot; ID: {duelId?.slice(0, 20)}...
          </p>

          {!accepted ? (
            <div className="space-y-4">
              <div className="bg-[#0a0a0a] rounded-xl p-4">
                <p className="text-[10px] text-gray-600 uppercase font-bold mb-2">Your Stake (USDT)</p>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={e => setStakeAmount(e.target.value)}
                  className="w-full bg-[#111] border border-[#1F1F1F] text-white rounded-xl p-3 text-center text-xl font-black font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                onClick={() => setAccepted(true)}
                className="w-full bg-[#D9C5A0] hover:bg-[#c4b18f] text-black font-bold py-4 rounded-xl text-sm uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                Accept Duel
              </button>
              <p className="text-[10px] text-gray-600">
                If unmatched by lock time, House matches at 0.75 odds.
              </p>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-lg font-bold text-green-400 mb-1">Duel Accepted!</p>
              <p className="text-sm text-gray-400">{stakeAmount} USDT locked. Winner takes all.</p>
            </div>
          )}
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 mt-6">
          <p className="text-sm text-amber-400 font-bold flex items-center gap-2">
            <Clock className="w-4 h-4" /> Duel Rules
          </p>
          <ul className="text-xs text-gray-400 mt-3 space-y-1.5">
            <li>Both players lock equal stakes</li>
            <li>Winner determined by market resolution</li>
            <li>Unmatched duels: House matches at 0.75 odds</li>
            <li>3% platform fee on winnings</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
