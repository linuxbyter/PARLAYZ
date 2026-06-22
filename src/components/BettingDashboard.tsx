'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'

interface Bet {
  id: string
  homeTeam: string
  awayTeam: string
  sport: string
  selection: string
  amount: number
  odds: number
  timestamp: number
  status: 'active' | 'won' | 'lost'
  payout?: number
}

interface DashboardStats {
  totalBalance: number
  activeBets: number
  totalStaked: number
  totalPnL: number
  winRate: number
  streak: number
}

interface BettingDashboardProps {
  className?: string
}

export const BettingDashboard: React.FC<BettingDashboardProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'leaderboard'>('overview')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const stats: DashboardStats = {
    totalBalance: 125000, // KSh 125,000
    activeBets: 3,
    totalStaked: 15650, // KSh 15,650
    totalPnL: 8932, // KSh 8,932
    winRate: 67.2,
    streak: 4,
  }

  const recentBets: Bet[] = [
    { 
      id: '1', 
      homeTeam: 'Manchester United', 
      awayTeam: 'Liverpool', 
      sport: 'Football', 
      selection: 'Manchester United', 
      amount: 2500, 
      odds: 1.45, 
      timestamp: Date.now() - 1800000, 
      status: 'active' 
    },
    { 
      id: '2', 
      homeTeam: 'Lakers', 
      awayTeam: 'Warriors', 
      sport: 'Basketball', 
      selection: 'Warriors', 
      amount: 1000, 
      odds: 2.10, 
      timestamp: Date.now() - 3600000, 
      status: 'active' 
    },
    { 
      id: '3', 
      homeTeam: 'Djokovic', 
      awayTeam: 'Alcaraz', 
      sport: 'Tennis', 
      selection: 'Djokovic', 
      amount: 5000, 
      odds: 1.82, 
      timestamp: Date.now() - 7200000, 
      status: 'won', 
      payout: 9100 
    },
    { 
      id: '4', 
      homeTeam: 'Fury', 
      awayTeam: 'Usyk', 
      sport: 'Boxing', 
      selection: 'Usyk', 
      amount: 1500, 
      odds: 1.33, 
      timestamp: Date.now() - 10800000, 
      status: 'lost' 
    },
    { 
      id: '5', 
      homeTeam: 'Verstappen', 
      awayTeam: 'Perez', 
      sport: 'Motorsport', 
      selection: 'Verstappen', 
      amount: 3000, 
      odds: 1.95, 
      timestamp: Date.now() - 14400000, 
      status: 'won', 
      payout: 5850 
    },
  ]

  const activeBets = useMemo(() => recentBets.filter(b => b.status === 'active'), [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'History' },
    { id: 'leaderboard', label: 'Leaderboard' },
  ] as const

  return (
    <div className={`bg-[#111] border border-[#2D2D2D] rounded-2xl overflow-hidden ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-[#2D2D2D]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
            <span className="text-2xl font-bold text-white">KSh</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Wallet Overview</h2>
            <p className="text-[10px] text-gray-500">Track your betting activity</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg bg-[#1a1a1a] border border-[#2D2D2D] text-gray-400 hover:text-white hover:border-[#1E3A8A]/50 transition"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.001 8.001 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
      </div>

      <div className="flex bg-[#1a1a1a] p-2 gap-2 m-4 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              activeTab === tab.id
                ? 'text-white bg-[#1E3A8A]/20'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 pt-0 space-y-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1a1a1a] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">KSh</span>
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Balance</span>
                </div>
                <p className="text-2xl font-black font-mono text-white">KSh {stats.totalBalance.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-bold text-green-400">▲</span>
                  <span className="text-[10px] text-green-400 font-medium">+KSh {stats.totalPnL.toLocaleString()} today</span>
                </div>
              </div>

              <div className="bg-[#1a1a1a] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">%</span>
                  </div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Win Rate</span>
                  </div>
                  <p className="text-xl font-black font-mono text-white">{stats.winRate}%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span className="text-[10px] text-orange-400 font-medium">{stats.streak} streak</span>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <BarChart3 className="w-3 h-3 text-blue-400" />
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Staked</span>
                  </div>
                  <p className="text-xl font-black font-mono text-white">${stats.totalStaked.toFixed(2)}</p>
                  <span className="text-[10px] text-gray-500">{stats.activeBets} active bets</span>
                </div>

                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${stats.totalPnL >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {stats.totalPnL >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Total P&L</span>
                  </div>
                  <p className={`text-xl font-black font-mono ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-gray-500">All time</span>
                </div>
              </div>

              {activeBets.length > 0 && (
                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Active Bets
                  </h3>
                  <div className="space-y-2">
                    {activeBets.map(bet => (
                      <div key={bet.id} className="flex items-center justify-between bg-[#111] border border-[#1F1F1F] rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bet.side === 'UP' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            {bet.side === 'UP' ? (
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{bet.coin}</p>
                            <p className="text-[10px] text-gray-500">{format(new Date(bet.timestamp), 'h:mm a')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-bold font-mono ${bet.side === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                            {bet.side} ${bet.amount.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-gray-500">@ {bet.odds}x</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
               )}
             </div>
          )}

           {activeTab === 'history' && (
             <div className="space-y-2">
              {recentBets.map(bet => (
                <div key={bet.id} className="flex items-center justify-between bg-[#0a0a0a] border border-[#1F1F1F] rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      bet.status === 'won' ? 'bg-green-500/10' :
                      bet.status === 'lost' ? 'bg-red-500/10' :
                      'bg-blue-500/10'
                    }`}>
                      {bet.status === 'won' ? (
                        <Trophy className="w-5 h-5 text-green-400" />
                      ) : bet.status === 'lost' ? (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{bet.coin}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          bet.side === 'UP' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {bet.side}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          bet.status === 'won' ? 'bg-green-500/20 text-green-400' :
                          bet.status === 'lost' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {bet.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(bet.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono text-white">${bet.amount.toFixed(2)}</p>
                    {bet.payout && (
                      <p className="text-[10px] text-green-400 font-mono">+${bet.payout.toFixed(2)}</p>
                    )}
                    <p className="text-[10px] text-gray-500">@ {bet.odds}x</p>
                  </div>
                </div>
               )}
             </div>
           )}

           {activeTab === 'leaderboard' && (
             <div className="space-y-3">
               {[
                 { rank: 1, name: 'SportsKing', pnl: 284750, winRate: 72.3 },
                 { rank: 2, name: 'BetMaster', pnl: 192380, winRate: 68.9 },
                 { rank: 3, name: 'OddsAnalyzer', pnl: 145620, winRate: 71.2 },
                 { rank: 4, name: 'GameTheorist', pnl: 89240, winRate: 64.5 },
                 { rank: 5, name: 'You', pnl: stats.totalPnL, winRate: stats.winRate, isYou: true },
               ].map((entry, i) => (
                 <div
                   key={entry.rank}
                   className={`flex items-center justify-between bg-[#1a1a1a] border rounded-xl p-4 ${
                     entry.isYou ? 'border-[#1E3A8A]/30 bg-[#1E3A8A]/10' : 'border-[#2D2D2D]'
                   }`}
                 >
                   <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                       entry.rank === 1 ? 'bg-yellow-400/20' :
                       entry.rank === 2 ? 'bg-gray-400/20' :
                       entry.rank === 3 ? 'bg-orange-400/20' :
                       'bg-[#2D2D2D]/20'
                     }`}>
                       <span className="text-2xl font-bold">{entry.rank}</span>
                     </div>
                     <div>
                       <p className={`text-sm font-bold ${entry.isYou ? 'text-[#1E3A8A]' : 'text-white'}`}>
                         {entry.name}
                       </p>
                       <p className="text-[10px] text-gray-500">{entry.winRate}% win rate</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className={`text-sm font-bold text-right ${entry.isYou ? 'text-[#1E3A8A]' : 'text-green-400'}`}>
                       {entry.pnl >= 0 ? '+' : ''}KSh {Math.abs(entry.pnl).toLocaleString()}
                     </p>
                     <div className="flex items-center gap-1 justify-end">
                       <span className="text-xs font-bold text-gray-500">#{entry.rank}</span>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}

      </div>

       <div className="p-4 pt-0">
         <button className="w-full py-3 px-6 text-sm font-semibold text-white bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-lg hover:opacity-90 transition flex items-center justify-center">
           View All Markets
         </button>
       </div>
    </div>
  )
}
