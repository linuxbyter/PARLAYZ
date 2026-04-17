'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  TrendingUp, TrendingDown, Wallet, History, Trophy,
  BarChart3, ChevronRight, Clock, RefreshCw, ArrowUpRight,
  ArrowDownRight, Target, Flame, Medal, Calendar,
} from 'lucide-react'

interface Bet {
  id: string
  instrumentId: string
  coin: string
  side: 'UP' | 'DOWN'
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
    totalBalance: 1247.83,
    activeBets: 3,
    totalStaked: 156.50,
    totalPnL: 89.32,
    winRate: 67.2,
    streak: 4,
  }

  const recentBets: Bet[] = [
    { id: '1', instrumentId: 'BTC', coin: 'BTC', side: 'UP', amount: 25, odds: 1.45, timestamp: Date.now() - 1800000, status: 'active' },
    { id: '2', instrumentId: 'ETH', coin: 'ETH', side: 'DOWN', amount: 10, odds: 2.10, timestamp: Date.now() - 3600000, status: 'active' },
    { id: '3', instrumentId: 'SOL', coin: 'SOL', side: 'UP', amount: 50, odds: 1.82, timestamp: Date.now() - 7200000, status: 'won', payout: 91.0 },
    { id: '4', instrumentId: 'DOGE', coin: 'DOGE', side: 'UP', amount: 15, odds: 1.33, timestamp: Date.now() - 10800000, status: 'lost' },
    { id: '5', instrumentId: 'LINK', coin: 'LINK', side: 'DOWN', amount: 30, odds: 1.95, timestamp: Date.now() - 14400000, status: 'won', payout: 58.5 },
  ]

  const activeBets = useMemo(() => recentBets.filter(b => b.status === 'active'), [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'history', label: 'History', icon: History },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ] as const

  return (
    <div className={`bg-[#111] border border-[#1F1F1F] rounded-2xl overflow-hidden ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-[#1F1F1F]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center">
            <Wallet className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Betting Dashboard</h2>
            <p className="text-[10px] text-gray-500">Track your positions & performance</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg bg-[#0a0a0a] border border-[#1F1F1F] text-gray-400 hover:text-white hover:border-[#D4AF37]/50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex bg-[#0a0a0a] p-1 gap-1 m-4 rounded-xl">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                activeTab === tab.id
                  ? 'bg-[#D9C5A0] text-black'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="p-4 pt-0 space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                      <Wallet className="w-3 h-3 text-[#D4AF37]" />
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Balance</span>
                  </div>
                  <p className="text-xl font-black font-mono text-white">${stats.totalBalance.toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3 text-green-400" />
                    <span className="text-[10px] text-green-400 font-medium">+$12.45 today</span>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Target className="w-3 h-3 text-green-400" />
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
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
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
              ))}
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {[
                { rank: 1, name: '0x7a3...f2e1', pnl: 2847.50, winRate: 72.3, avatar: '🥇' },
                { rank: 2, name: '0x4b8...9c3d', pnl: 1923.80, winRate: 68.9, avatar: '🥈' },
                { rank: 3, name: '0x2d5...7a1f', pnl: 1456.20, winRate: 71.2, avatar: '🥉' },
                { rank: 4, name: '0x9e1...3b7c', pnl: 892.40, winRate: 64.5, avatar: '4' },
                { rank: 5, name: 'You', pnl: stats.totalPnL, winRate: stats.winRate, avatar: '5', isYou: true },
              ].map((entry, i) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between bg-[#0a0a0a] border rounded-xl p-4 ${
                    entry.isYou ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5' : 'border-[#1F1F1F]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                      entry.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                      entry.rank === 3 ? 'bg-orange-600/20 text-orange-400' :
                      'bg-[#1F1F1F] text-gray-400'
                    }`}>
                      {entry.avatar}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${entry.isYou ? 'text-[#D4AF37]' : 'text-white'}`}>
                        {entry.name}
                      </p>
                      <p className="text-[10px] text-gray-500">{entry.winRate}% win rate</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold font-mono ${entry.isYou ? 'text-[#D4AF37]' : 'text-green-400'}`}>
                      +${entry.pnl.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      <Medal className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] text-gray-500">Rank #{entry.rank}</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 pt-0">
        <button className="w-full py-3 rounded-xl bg-[#D9C5A0] text-black text-sm font-bold uppercase tracking-wider hover:bg-[#c4b18f] transition flex items-center justify-center gap-2">
          View All Markets
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
