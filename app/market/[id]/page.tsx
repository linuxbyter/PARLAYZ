'use client'

import Header from '@/src/components/Header'
import { useParams, useRouter } from 'next/navigation'
import { useMarketLogic, type MarketPhase } from '@/src/hooks/useMarketLogic'
import { SentimentChart } from '@/src/components/SentimentChart'
import { INSTRUMENTS, formatPrice } from '@/src/lib/instruments'
import { format } from 'date-fns'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, ArrowLeft, Zap, Info, Clock,
  MessageSquare, Star, Crown, Send, Wallet,
  ArrowUpRight, ArrowDownLeft, BarChart3, Users, Shield,
  AlertTriangle, CheckCircle, XCircle, Copy, Swords, ChevronDown,
  DollarSign, Target, Flame,
} from 'lucide-react'
import { useWallet, useCurrency } from '@/src/hooks/useWallet'

interface FloatingBet { id: string; amount: number; x: number; y: number; side: 'YES' | 'NO' }
interface OrderBookEntry { price: number; shares: number; type: 'bid' | 'ask' }
interface Trade { id: string; side: 'YES' | 'NO'; price: number; shares: number; time: number }
interface Comment { id: string; user: string; avatar: string; message: string; time: number; likes: number; isPremium: boolean }
interface UserBet { id: string; side: 'YES' | 'NO'; amount: number; estPayout: number; time: number }

const MOCK_ORDERS: OrderBookEntry[] = [
  { price: 72, shares: 150, type: 'ask' },
  { price: 70, shares: 320, type: 'ask' },
  { price: 68, shares: 500, type: 'ask' },
  { price: 65, shares: 800, type: 'bid' },
  { price: 63, shares: 450, type: 'bid' },
  { price: 60, shares: 200, type: 'bid' },
]

const MOCK_TRADES: Trade[] = [
  { id: 't1', side: 'YES', price: 67, shares: 50, time: Date.now() - 120000 },
  { id: 't2', side: 'NO', price: 33, shares: 25, time: Date.now() - 60000 },
  { id: 't3', side: 'YES', price: 68, shares: 100, time: Date.now() - 30000 },
]

const MOCK_COMMENTS: Comment[] = [
  { id: 'c1', user: 'Maxtheillest', avatar: 'M', message: 'BTC is absolutely ripping right now. YES is free money here.', time: Date.now() - 300000, likes: 12, isPremium: true },
  { id: 'c2', user: 'V2_Toxic', avatar: 'V', message: 'Nah we due for a pullback. NO all day.', time: Date.now() - 180000, likes: 5, isPremium: false },
  { id: 'c3', user: 'AmadGotHoes', avatar: 'A', message: 'Just loaded 500 USDT. Going heavy on YES', time: Date.now() - 60000, likes: 23, isPremium: true },
]

type Timeframe = '1m' | '5m' | '15m' | '1h' | 'all'

export default function MarketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const inst = INSTRUMENTS.find(i => i.id === id)
  const wallet = useWallet()
  const { currency, displaySymbol } = useCurrency()

  const [livePrice, setLivePrice] = useState(inst?.initialPrice ?? 0)
  const [priceHistory, setPriceHistory] = useState<{ time: number; price: number }[]>([])
  const [floatingBets, setFloatingBets] = useState<FloatingBet[]>([])
  const [stakeAmount, setStakeAmount] = useState('10')
  const [activeTab, setActiveTab] = useState<'chart' | 'orders' | 'comments'>('chart')
  const [timeframe, setTimeframe] = useState<Timeframe>('5m')
  const [commentInput, setCommentInput] = useState('')
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS)
  const [orders] = useState<OrderBookEntry[]>(MOCK_ORDERS)
  const [trades] = useState<Trade[]>(MOCK_TRADES)
  const [yesPrice, setYesPrice] = useState(67)
  const [noPrice, setNoPrice] = useState(33)
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [sellAmount, setSellAmount] = useState<string>('')
  const [userBets, setUserBets] = useState<UserBet[]>([])

  useEffect(() => {
    if (!inst) return
    if (!inst.hasBinance) {
      const volMap: Record<string, number> = { BTC: 0.0008, ETH: 0.001, SOL: 0.0015, LTC: 0.001, LINK: 0.0015, DOGE: 0.002, SHIB: 0.003, PEPE: 0.004, NAS100: 0.0005, GOLD: 0.0003, OIL: 0.0008 }
      const interval = setInterval(() => {
        setLivePrice(prev => {
          const pct = (Math.random() - 0.495) * (volMap[inst.id] ?? 0.001)
          const dec = (inst.id as string) === 'SHIB' || (inst.id as string) === 'PEPE' ? 8 : 2
          const next = parseFloat((prev * (1 + pct)).toFixed(dec))
          setPriceHistory(h => [...h.slice(-119), { time: Date.now(), price: next }])
          return next
        })
      }, 3000)
      return () => clearInterval(interval)
    }
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/' + inst.symbol.toLowerCase() + '@trade')
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      const price = parseFloat(data.p)
      setLivePrice(price)
      setPriceHistory(h => [...h.slice(-119), { time: Date.now(), price }])
    }
    return () => ws.close()
  }, [inst])

  const market = useMarketLogic(inst?.id ?? 'BTC', inst?.initialPrice ?? 0, livePrice)

  const handleBet = useCallback((side: 'YES' | 'NO', amount: number, e: React.MouseEvent) => {
    if (!market.canBet) return
    const poolSide = side === 'YES' ? 'UP' as const : 'DOWN' as const
    market.placeBet(poolSide, amount)
    wallet.subtractBalance(amount)
    wallet.incrementActiveBets()

    const price = side === 'YES' ? yesPrice : noPrice
    const estPayout = amount * (100 / price)
    setUserBets(prev => [...prev, {
      id: crypto.randomUUID(),
      side,
      amount,
      estPayout,
      time: Date.now(),
    }])

    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const bid = crypto.randomUUID()
    setFloatingBets(prev => [...prev, { id: bid, amount, x: rect.left + rect.width / 2, y: rect.top, side }])
    setTimeout(() => setFloatingBets(prev => prev.filter(b => b.id !== bid)), 1500)
  }, [market, wallet, yesPrice, noPrice])

  const handleSell = useCallback((side: 'UP' | 'DOWN', amount: number) => {
    const currentStake = side === 'UP' ? market.userUpStake : market.userDownStake
    if (amount <= 0 || amount > currentStake) return

    const refundRate = market.phase === 'OPEN' ? 1.0 : 0.8
    const refund = amount * refundRate

    if (side === 'UP') {
      market.placeBet('DOWN', amount - refund)
    } else {
      market.placeBet('UP', amount - refund)
    }

    wallet.addBalance(refund)
    wallet.decrementActiveBets()
    setSellAmount('')
  }, [market, wallet])

  const sendComment = useCallback(() => {
    if (!commentInput.trim()) return
    setComments(prev => [...prev, {
      id: crypto.randomUUID(),
      user: 'You',
      avatar: 'Y',
      message: commentInput.trim(),
      time: Date.now(),
      likes: 0,
      isPremium: false,
    }])
    setCommentInput('')
  }, [commentInput])

  const filteredHistory = useMemo(() => {
    if (timeframe === 'all') return market.poolHistory
    const now = Date.now()
    const limits: Record<Timeframe, number> = { '1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000, 'all': Infinity }
    const cutoff = now - (limits[timeframe] || Infinity)
    return market.poolHistory.filter(p => p.time >= cutoff)
  }, [market.poolHistory, timeframe])

  const totalActiveStake = userBets.reduce((s, b) => s + b.amount, 0)
  const totalEstPayout = userBets.reduce((s, b) => s + b.estPayout, 0)
  const totalEstProfit = totalEstPayout - totalActiveStake

  if (!inst) {
    return (
      <div className="min-h-screen bg-[#000000] text-white">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-black text-white mb-2">Market not found</h2>
          <button onClick={() => router.push('/')} className="text-[#C5A059] hover:underline mt-4 inline-block">Back to Markets</button>
        </main>
      </div>
    )
  }

  const totalPool = market.upPool + market.downPool
  const startTime = format(new Date(market.openStartMs), 'h:mm a')
  const lockTime = format(new Date(market.lockAtMs), 'h:mm a')
  const resolveTime = format(new Date(market.resolveAtMs), 'h:mm a')
  const remainingMins = Math.floor(market.timeRemaining / 60000)
  const remainingSecs = Math.floor((market.timeRemaining % 60000) / 1000)
  const timeStr = remainingMins + ':' + String(remainingSecs).padStart(2, '0')

  const openStart = new Date(market.openStartMs)
  const openEnd = new Date(market.lockAtMs)
  const startMin = openStart.getMinutes()
  const endMin = openEnd.getMinutes()
  const timeRange = `${String(startMin).padStart(2, '0')} to ${String(endMin).padStart(2, '0')}`

  const phaseConfig: Record<MarketPhase, { badge: string; color: string; dot: string; border: string }> = {
    OPEN: { badge: 'OPEN', color: 'gold', dot: 'bg-[#C5A059] animate-pulse', border: 'border border-[#C5A059]/20' },
    LOCKED: { badge: 'LOCKED', color: 'gold', dot: 'bg-[#B8860B] animate-pulse', border: 'border-2 border-[#B8860B]/60' },
    GRACE: { badge: 'GRACE', color: 'gold', dot: 'bg-[#B8860B] animate-pulse', border: 'border-2 border-[#B8860B]/80' },
    RESOLVED: { badge: 'RESOLVED', color: 'brass', dot: 'bg-[#B8860B]', border: 'border border-[#B8860B]/30' },
  }
  const pc = phaseConfig[market.phase]

  const canSell = market.phase === 'OPEN' || market.phase === 'GRACE'
  const sellRefundRate = market.phase === 'OPEN' ? 1.0 : 0.8

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Back + Market Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{inst.label}</span>
                <div className={'flex items-center gap-1.5 px-2 py-0.5 rounded-full ' + (pc.color === 'gold' ? 'bg-[#C5A059]/10 border border-[#C5A059]/30' : 'bg-[#B8860B]/10 border border-[#B8860B]/30')}>
                  <div className={'w-1.5 h-1.5 rounded-full ' + pc.dot} />
                  <span className={'text-[10px] font-bold uppercase ' + (pc.color === 'gold' ? 'text-[#C5A059]' : 'text-[#B8860B]')}>{pc.badge}</span>
                </div>
              </div>
              <h1 className="text-lg font-black text-white leading-tight">
                Will {inst.label} go UP or DOWN in the next 5 minutes?
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Market {timeRange} • Locks at {lockTime} • Resolves at {resolveTime}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[9px] text-gray-600 uppercase font-bold">Resolves</p>
              <p className="text-xs font-mono font-bold text-white">{resolveTime}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-gray-600 uppercase font-bold">Time Left</p>
              <p className="text-xs font-mono font-bold text-[#C5A059]">{timeStr}</p>
            </div>
          </div>
        </div>

        {/* My Bets - Dopamine Section */}
        {userBets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-500/10 via-[#C5A059]/10 to-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-green-400 flex items-center gap-2">
                <Flame className="w-4 h-4 text-green-400" />
                My Bets
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[9px] text-gray-500 uppercase font-bold">Active Stake</p>
                  <p className="text-lg font-black font-mono text-white">{totalActiveStake.toFixed(2)} USDT</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-green-500 uppercase font-bold">Est. Payout</p>
                  <p className="text-lg font-black font-mono text-green-400">{totalEstPayout.toFixed(2)} USDT</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-green-500 uppercase font-bold">Est. Profit</p>
                  <p className="text-lg font-black font-mono text-green-400">+{totalEstProfit.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {userBets.map(bet => (
                <div key={bet.id} className="bg-[#0a0a0a] border border-[#1F1F1F] rounded-lg px-3 py-2 min-w-[140px] shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={'text-[10px] font-bold ' + (bet.side === 'YES' ? 'text-green-400' : 'text-red-400')}>{bet.side}</span>
                    <span className="text-[9px] text-gray-500">{Math.floor((Date.now() - bet.time) / 1000)}s ago</span>
                  </div>
                  <p className="text-xs font-mono font-bold text-white">{bet.amount.toFixed(2)} USDT</p>
                  <p className="text-[10px] font-mono text-green-400">→ {bet.estPayout.toFixed(2)} USDT</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT: Chart + Order Book + Comments */}
          <div className="lg:col-span-2 space-y-4">
            {/* YES/NO Price Bar */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={(e) => handleBet('YES', parseFloat(stakeAmount) || 10, e)}
                disabled={!market.canBet}
                className="bg-[#0a2a1a] border border-green-500/30 rounded-xl p-4 text-left hover:border-green-500/60 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-green-400 uppercase tracking-widest">YES</span>
                  <span className="text-2xl font-black font-mono text-green-400">{yesPrice}¢</span>
                </div>
                <p className="text-[10px] text-gray-500">Potential return: {(parseFloat(stakeAmount) * (100 / yesPrice)).toFixed(2)} USDT</p>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={(e) => handleBet('NO', parseFloat(stakeAmount) || 10, e)}
                disabled={!market.canBet}
                className="bg-[#2a0a0a] border border-red-500/30 rounded-xl p-4 text-left hover:border-red-500/60 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-widest">NO</span>
                  <span className="text-2xl font-black font-mono text-red-400">{noPrice}¢</span>
                </div>
                <p className="text-[10px] text-gray-500">Potential return: {(parseFloat(stakeAmount) * (100 / noPrice)).toFixed(2)} USDT</p>
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex bg-[#111] border border-[#1F1F1F] rounded-xl p-1 gap-1">
              {[
                { id: 'chart' as const, label: 'Chart', icon: BarChart3 },
                { id: 'orders' as const, label: 'Order Book', icon: Users },
                { id: 'comments' as const, label: 'Comments', icon: MessageSquare },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={'flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 ' + (activeTab === tab.id ? 'bg-[#C5A059] text-black' : 'text-gray-500 hover:text-white')}>
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'chart' && (
              <div className="bg-[#111] border border-[#1F1F1F] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Probability Chart</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex bg-[#0a0a0a] rounded-lg p-0.5 gap-0.5">
                      {(['1m', '5m', '15m', '1h', 'all'] as Timeframe[]).map(tf => (
                        <button key={tf} onClick={() => setTimeframe(tf)} className={'px-2 py-1 rounded text-[10px] font-bold transition ' + (timeframe === tf ? 'bg-[#C5A059] text-black' : 'text-gray-500 hover:text-white')}>
                          {tf}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-[10px] text-gray-500">YES {yesPrice}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-[10px] text-gray-500">NO {noPrice}%</span>
                    </div>
                  </div>
                </div>
                <SentimentChart data={filteredHistory} height={280} frozen={market.phase !== 'OPEN'} />
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-[#111] border border-[#1F1F1F] rounded-xl overflow-hidden">
                <div className="grid grid-cols-2">
                  <div className="p-4 border-r border-[#1F1F1F]">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Order Book</h4>
                    <div className="space-y-1">
                      <div className="grid grid-cols-3 text-[9px] text-gray-600 font-bold uppercase mb-1">
                        <span>Price</span>
                        <span className="text-right">Shares</span>
                        <span className="text-right">Total</span>
                      </div>
                      {orders.filter(o => o.type === 'ask').reverse().map((o, i) => (
                        <div key={i} className="grid grid-cols-3 text-xs font-mono relative">
                          <div className="absolute inset-0 bg-red-500/10" style={{ width: (o.shares / 800) * 100 + '%', right: 0, left: 'auto' }} />
                          <span className="text-red-400 relative z-10">{o.price}¢</span>
                          <span className="text-right text-gray-400 relative z-10">{o.shares}</span>
                          <span className="text-right text-gray-500 relative z-10">{(o.price * o.shares / 100).toFixed(0)}</span>
                        </div>
                      ))}
                      <div className="py-1.5 text-center text-sm font-black text-[#C5A059] font-mono border-y border-[#1F1F1F] my-1">
                        {yesPrice}¢
                      </div>
                      {orders.filter(o => o.type === 'bid').map((o, i) => (
                        <div key={i} className="grid grid-cols-3 text-xs font-mono relative">
                          <div className="absolute inset-0 bg-green-500/10" style={{ width: (o.shares / 800) * 100 + '%', right: 0, left: 'auto' }} />
                          <span className="text-green-400 relative z-10">{o.price}¢</span>
                          <span className="text-right text-gray-400 relative z-10">{o.shares}</span>
                          <span className="text-right text-gray-500 relative z-10">{(o.price * o.shares / 100).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Trades</h4>
                    <div className="space-y-1.5">
                      {trades.map(t => (
                        <div key={t.id} className="flex items-center justify-between text-xs">
                          <span className={'font-bold ' + (t.side === 'YES' ? 'text-green-400' : 'text-red-400')}>{t.side}</span>
                          <span className="font-mono text-white">{t.price}¢</span>
                          <span className="text-gray-400">{t.shares}</span>
                          <span className="text-gray-600 text-[10px]">{Math.floor((Date.now() - t.time) / 1000)}s ago</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="bg-[#111] border border-[#1F1F1F] rounded-xl overflow-hidden">
                <div className="h-80 overflow-y-auto p-4 space-y-3">
                  <AnimatePresence>
                    {comments.map(c => (
                      <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
                        <div className={'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ' + (c.isPremium ? 'bg-gradient-to-br from-[#C5A059] to-[#B8860B] text-black' : 'bg-[#1a1a1a] text-gray-400')}>
                          {c.isPremium ? <Crown className="w-3.5 h-3.5" /> : c.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={'text-xs font-bold ' + (c.isPremium ? 'text-[#C5A059]' : 'text-white')}>{c.user}</span>
                            {c.isPremium && <Star className="w-3 h-3 text-[#C5A059] fill-[#C5A059]" />}
                            <span className="text-[9px] text-gray-600">{Math.floor((Date.now() - c.time) / 1000)}s ago</span>
                          </div>
                          <p className="text-sm text-gray-300">{c.message}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <button className="text-[10px] text-gray-500 hover:text-[#C5A059] transition flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3" /> {c.likes}
                            </button>
                            <button className="text-[10px] text-gray-500 hover:text-[#C5A059] transition">Reply</button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <div className="p-3 border-t border-[#1F1F1F]">
                  <div className="flex items-center gap-2">
                    <input value={commentInput} onChange={e => setCommentInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendComment()} placeholder="Share your analysis..." className="flex-1 bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C5A059] placeholder:text-gray-600" />
                    <button onClick={sendComment} className="p-2 rounded-lg bg-[#C5A059] text-black hover:bg-[#B8860B] transition">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Market Rules */}
            <div className="bg-[#111] border border-[#1F1F1F] rounded-xl p-5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Resolution Criteria
              </h4>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <p className="text-[9px] text-gray-600 uppercase font-bold">Opens</p>
                  <p className="text-sm font-mono font-bold text-white">{startTime}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-gray-600 uppercase font-bold">Locks</p>
                  <p className="text-sm font-mono font-bold text-[#C5A059]">{lockTime}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-gray-600 uppercase font-bold">Resolves</p>
                  <p className="text-sm font-mono font-bold text-green-400">{resolveTime}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                This market resolves to YES if the {inst.label} price at resolution time is strictly above the strike price.
                Otherwise it resolves to NO. Price data sourced from Binance API.
              </p>
            </div>
          </div>

          {/* RIGHT: Bet Panel */}
          <div className="lg:col-span-1">
            <div className="bg-[#111] border border-[#1F1F1F] rounded-xl p-5 sticky top-16 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Stake Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">$</span>
                  <input type="number" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-lg pl-7 pr-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#C5A059]" />
                </div>
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[5, 10, 25, 50].map(amt => (
                    <button key={amt} onClick={() => setStakeAmount(String(amt))} className={'py-1.5 rounded text-[10px] font-bold transition border ' + (stakeAmount === String(amt) ? 'bg-[#C5A059] border-[#C5A059] text-black' : 'border-[#1F1F1F] bg-[#1a1a1a] text-gray-400 hover:border-[#C5A059]/50')}>{amt}</button>
                  ))}
                </div>
              </div>

              {/* Position Management */}
              {(market.userUpStake > 0 || market.userDownStake > 0) && (
                <div className="bg-[#0a0a0a] rounded-lg p-3 space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Your Positions
                  </h4>
                  {market.userUpStake > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-xs font-bold text-green-400">YES</span>
                          <span className="text-xs text-gray-400 font-mono">{market.userUpStake.toFixed(2)} USDT</span>
                        </div>
                      </div>
                      {canSell && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Sell amount"
                            value={sellAmount}
                            onChange={e => setSellAmount(e.target.value)}
                            className="flex-1 bg-[#111] border border-[#1F1F1F] text-white rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-[#C5A059]"
                          />
                          <button
                            onClick={() => handleSell('UP', parseFloat(sellAmount) || market.userUpStake)}
                            className="px-3 py-1 rounded bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] text-[10px] font-bold uppercase hover:bg-[#C5A059]/30 transition whitespace-nowrap"
                          >
                            Sell ({sellRefundRate * 100}%)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {market.userDownStake > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-xs font-bold text-red-400">NO</span>
                          <span className="text-xs text-gray-400 font-mono">{market.userDownStake.toFixed(2)} USDT</span>
                        </div>
                      </div>
                      {canSell && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Sell amount"
                            value={sellAmount}
                            onChange={e => setSellAmount(e.target.value)}
                            className="flex-1 bg-[#111] border border-[#1F1F1F] text-white rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-[#C5A059]"
                          />
                          <button
                            onClick={() => handleSell('DOWN', parseFloat(sellAmount) || market.userDownStake)}
                            className="px-3 py-1 rounded bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] text-[10px] font-bold uppercase hover:bg-[#C5A059]/30 transition whitespace-nowrap"
                          >
                            Sell ({sellRefundRate * 100}%)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {!canSell && market.phase !== 'RESOLVED' && (
                    <p className="text-[10px] text-gray-500 text-center">Position locked — cannot sell</p>
                  )}
                </div>
              )}

              <button onClick={() => setShowDeposit(true)} className="w-full py-2.5 rounded-lg border border-[#C5A059]/40 bg-[#C5A059]/10 text-[#C5A059] text-xs font-bold uppercase hover:bg-[#C5A059]/20 transition flex items-center justify-center gap-2">
                <Wallet className="w-4 h-4" />
                Deposit
              </button>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1F1F1F]">
                <div>
                  <p className="text-[9px] text-gray-600 uppercase font-bold">Volume</p>
                  <p className="text-sm font-mono font-bold text-white">{totalPool.toFixed(1)} USDT</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-600 uppercase font-bold">Open Interest</p>
                  <p className="text-sm font-mono font-bold text-white">{totalPool.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowDeposit(false)}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-[#1F1F1F] rounded-2xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDeposit(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
            <h3 className="text-lg font-black text-white mb-1">Deposit USDT</h3>
            <p className="text-sm text-gray-400 mb-4">Powered by Kotani Pay</p>
            <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="Amount (USDT)" className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 mb-4 font-mono focus:outline-none focus:border-[#C5A059]" />
            <button onClick={() => { wallet.addBalance(parseFloat(depositAmount) || 0); setShowDeposit(false); setDepositAmount('') }} className="w-full bg-gradient-to-r from-[#C5A059] to-[#B8860B] text-black font-bold py-3 rounded-xl text-sm uppercase hover:opacity-90 transition">
              Deposit
            </button>
          </motion.div>
        </div>
      )}

      {/* Floating Bet Animations */}
      <AnimatePresence>
        {floatingBets.map(bet => (
          <motion.div key={bet.id} initial={{ opacity: 1, y: bet.y }} animate={{ opacity: 0, y: bet.y - 40 }} exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }} className="fixed pointer-events-none z-50" style={{ left: bet.x - 30 }}>
            <span className="text-sm font-bold text-[#C5A059] font-mono">+{bet.amount} USDT</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
