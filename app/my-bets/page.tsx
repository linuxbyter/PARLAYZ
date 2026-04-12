'use client'

import Header from '@/src/components/Header'
import BottomNav from '@/src/components/BottomNav'
import { Ticket, TrendingUp, TrendingDown, Clock, CircleCheck, CircleX } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface Bet {
  id: string
  question: string
  category: string
  side: 'YES' | 'NO'
  stake: number
  odds: number
  payout: number
  status: 'ACTIVE' | 'LOCKED' | 'SETTLED'
  result?: 'WON' | 'LOST'
}

const MOCK_BETS: Bet[] = [
  { id: '1', question: 'Will BTC reach $50K by Friday?', category: 'CRYPTO', side: 'YES', stake: 1000, odds: 1.68, payout: 1680, status: 'ACTIVE' },
  { id: '2', question: 'Will Kenya win AFCON 2025?', category: 'SPORTS', side: 'NO', stake: 500, odds: 2.20, payout: 1100, status: 'LOCKED' },
  { id: '3', question: 'Will ETH hit $3K this month?', category: 'CRYPTO', side: 'YES', stake: 2000, odds: 1.45, payout: 2900, status: 'SETTLED', result: 'WON' },
  { id: '4', question: 'Will Safaricom launch 5G in 10 more counties?', category: 'TECH', side: 'NO', stake: 800, odds: 1.80, payout: 1440, status: 'SETTLED', result: 'LOST' },
]

export default function MyBetsPage() {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'LOCKED' | 'SETTLED'>('ALL')
  
  const activeBets = MOCK_BETS.filter(b => b.status === 'ACTIVE')
  const lockedBets = MOCK_BETS.filter(b => b.status === 'LOCKED')
  const settledBets = MOCK_BETS.filter(b => b.status === 'SETTLED')
  
  const totalActiveRisk = activeBets.reduce((sum, b) => sum + b.stake, 0)
  const maxEstReturn = Math.max(...MOCK_BETS.map(b => b.payout))
  const totalWinnings = settledBets.filter(b => b.result === 'WON').reduce((sum, b) => sum + b.payout, 0)

  const filteredBets = filter === 'ALL' ? MOCK_BETS : MOCK_BETS.filter(b => b.status === filter)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      <Header />
      
      <main className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-6">
          <Ticket className="w-5 h-5 text-[#C9A84C]" />
          <h1 className="text-xl font-bold">My Wagers</h1>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#141414] border border-[#222222] rounded-xl p-3 text-center">
            <div className="text-[10px] text-[#8B8B8B] mb-1">ACTIVE RISK</div>
            <div className="text-lg font-bold text-white">KSh {totalActiveRisk.toLocaleString()}</div>
          </div>
          <div className="bg-[#141414] border border-[#222222] rounded-xl p-3 text-center">
            <div className="text-[10px] text-[#8B8B8B] mb-1">MAX RETURN</div>
            <div className="text-lg font-bold text-[#C9A84C]">KSh {maxEstReturn.toLocaleString()}</div>
          </div>
          <div className="bg-[#141414] border border-[#222222] rounded-xl p-3 text-center">
            <div className="text-[10px] text-[#8B8B8B] mb-1">WINNINGS</div>
            <div className="text-lg font-bold text-[#4CAF7D]">KSh {totalWinnings.toLocaleString()}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {['ALL', 'ACTIVE', 'LOCKED', 'SETTLED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                filter === f 
                  ? 'bg-[#1E1A0F] text-[#C9A84C] border border-[#C9A84C]/30' 
                  : 'bg-[#141414] border border-[#222222] text-[#8B8B8B] hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Active Bets */}
        {filter === 'ALL' && activeBets.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold text-[#8B8B8B] uppercase tracking-wider mb-3">OPEN WAGERS</h2>
            <div className="space-y-3">
              {activeBets.map(bet => (
                <BetCard key={bet.id} bet={bet} />
              ))}
            </div>
          </div>
        )}

        {/* Locked Bets */}
        {filter === 'ALL' && lockedBets.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold text-[#8B8B8B] uppercase tracking-wider mb-3">LOCKED ACTIVE WAGERS</h2>
            <div className="space-y-3">
              {lockedBets.map(bet => (
                <BetCard key={bet.id} bet={bet} />
              ))}
            </div>
          </div>
        )}

        {/* Settled Bets */}
        {filter === 'ALL' && settledBets.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold text-[#8B8B8B] uppercase tracking-wider mb-3">SETTLED</h2>
            <div className="space-y-3">
              {settledBets.map(bet => (
                <BetCard key={bet.id} bet={bet} />
              ))}
            </div>
          </div>
        )}

        {/* Filtered View */}
        {filter !== 'ALL' && (
          <div className="space-y-3">
            {filteredBets.map(bet => (
              <BetCard key={bet.id} bet={bet} />
            ))}
          </div>
        )}

        {MOCK_BETS.length === 0 && (
          <div className="text-center py-12">
            <Ticket className="w-12 h-12 text-[#8B8B8B] mx-auto mb-4" />
            <p className="text-[#8B8B8B] mb-4">No wagers yet</p>
            <Link href="/" className="inline-block bg-[#C9A84C] text-black font-bold px-4 py-2 rounded-lg text-sm">
              Browse Markets
            </Link>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

function BetCard({ bet }: { bet: Bet }) {
  const profit = bet.payout - bet.stake
  
  return (
    <div className="bg-[#141414] border border-[#222222] rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="bg-[#1E1A0F] text-[#C9A84C] text-[10px] font-bold px-2 py-0.5 rounded border border-[#C9A84C]/30">
            {bet.category}
          </span>
          {bet.status === 'ACTIVE' && (
            <span className="flex items-center gap-1 text-[10px] text-[#4CAF7D]">
              <span className="w-1.5 h-1.5 bg-[#4CAF7D] rounded-full" />
              OPEN
            </span>
          )}
          {bet.status === 'LOCKED' && (
            <span className="text-[10px] text-[#C9A84C] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              LOCKED
            </span>
          )}
        </div>
        {bet.result && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
            bet.result === 'WON' ? 'bg-[#1E3D2F] text-[#4CAF7D]' : 'bg-[#3D1E1E] text-[#E05252]'
          }`}>
            {bet.result === 'WON' ? <CircleCheck className="w-3 h-3" /> : <CircleX className="w-3 h-3" />}
            {bet.result}
          </span>
        )}
      </div>

      <p className="text-white font-medium mb-3">{bet.question}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] text-[#8B8B8B]">YOUR PREDICTION</div>
            <div className={`text-sm font-bold ${bet.side === 'YES' ? 'text-[#4CAF7D]' : 'text-[#E05252]'}`}>
              {bet.side}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#8B8B8B]">STAKE</div>
            <div className="text-sm font-bold text-white">KSh {bet.stake.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#8B8B8B]">ODDS</div>
            <div className="text-sm font-bold text-white">{bet.odds.toFixed(2)}x</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-[#8B8B8B]">
            {bet.result ? 'PAID OUT' : bet.status === 'LOCKED' ? 'EST. PAYOUT' : 'EST. PAYOUT'}
          </div>
          <div className={`text-lg font-bold ${bet.result && bet.result === 'LOST' ? 'text-[#E05252]' : 'text-[#4CAF7D]'}`}>
            KSh {bet.payout.toLocaleString()}
          </div>
          {bet.status !== 'SETTLED' && (
            <div className={`text-xs flex items-center gap-1 ${profit >= 0 ? 'text-[#4CAF7D]' : 'text-[#E05252]'}`}>
              {profit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {profit >= 0 ? '+' : ''}KSh {profit.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}