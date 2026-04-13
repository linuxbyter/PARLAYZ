'use client'

import { useState } from 'react'
import { Trophy, Medal, Crown } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  username: string
  totalWon: number
  winRate: number
  marketsPlayed: number
  avatar?: string
}

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, username: 'CryptoKing254', totalWon: 2450000, winRate: 78, marketsPlayed: 156, avatar: '👑' },
  { rank: 2, username: 'BetMaster_Nairobi', totalWon: 1890000, winRate: 72, marketsPlayed: 203, avatar: '🥈' },
  { rank: 3, username: 'PredictionPro', totalWon: 1450000, winRate: 68, marketsPlayed: 189, avatar: '🥉' },
  { rank: 4, username: 'SportsGuru_Kenya', totalWon: 980000, winRate: 65, marketsPlayed: 145 },
  { rank: 5, username: 'CryptoWhale', totalWon: 750000, winRate: 62, marketsPlayed: 98 },
  { rank: 6, username: 'FootballExpert', totalWon: 620000, winRate: 59, marketsPlayed: 167 },
  { rank: 7, username: 'MemeLord', totalWon: 480000, winRate: 55, marketsPlayed: 234 },
  { rank: 8, username: 'TechAnalyst', totalWon: 350000, winRate: 52, marketsPlayed: 89 },
  { rank: 9, username: 'PoliticalPundit', totalWon: 280000, winRate: 48, marketsPlayed: 112 },
  { rank: 10, username: 'NoviceTrader', totalWon: 150000, winRate: 45, marketsPlayed: 67 },
]

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all')

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-[#C9A84C]" />
      case 2: return <Medal className="w-6 h-6 text-[#8B8B8B]" />
      case 3: return <Medal className="w-6 h-6 text-[#8B6914]" />
      default: return <span className="w-6 text-center text-[#8B8B8B] font-bold">{rank}</span>
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-8 h-8 text-[#C9A84C]" />
          <h1 className="text-2xl font-black">Leaderboard</h1>
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'week', 'month'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeFilter === filter 
                  ? 'bg-[#C9A84C] text-black' 
                  : 'bg-[#141414] text-[#8B8B8B] hover:text-white'
              }`}
            >
              {filter === 'all' ? 'All Time' : filter === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        <div className="bg-[#141414] border border-[#222222] rounded-xl overflow-hidden">
          <div className="grid grid-cols-5 gap-4 p-4 border-b border-[#222222] text-xs font-bold text-[#8B8B8B] uppercase tracking-wider">
            <div>Rank</div>
            <div>User</div>
            <div className="text-right">Total Won</div>
            <div className="text-right">Win Rate</div>
            <div className="text-right">Markets</div>
          </div>

          {mockLeaderboard.map(entry => (
            <div 
              key={entry.rank}
              className="grid grid-cols-5 gap-4 p-4 border-b border-[#222222] hover:bg-[#1a1a1a] transition"
            >
              <div className="flex items-center">
                {getRankIcon(entry.rank)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{entry.avatar || '👤'}</span>
                <span className="font-medium">{entry.username}</span>
              </div>
              <div className="text-right font-mono text-[#4CAF7D] font-bold">
                KSh {entry.totalWon.toLocaleString()}
              </div>
              <div className="text-right">
                <span className={`font-bold ${entry.winRate >= 60 ? 'text-[#4CAF7D]' : entry.winRate >= 50 ? 'text-[#C9A84C]' : 'text-[#E05252]'}`}>
                  {entry.winRate}%
                </span>
              </div>
              <div className="text-right text-[#8B8B8B]">{entry.marketsPlayed}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-[#141414] border border-[#222222] rounded-xl">
          <p className="text-[#8B8B8B] text-sm text-center">
            Your Rank: <span className="text-white font-bold">#--</span> | Want to climb the leaderboard? Place more bets!
          </p>
        </div>
      </div>
    </div>
  )
}