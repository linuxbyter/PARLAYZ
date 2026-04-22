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
  DollarSign, Target, Flame, Activity, ExternalLink
} from 'lucide-react'
import { useWallet, useCurrency } from '@/src/hooks/useWallet'

// --- TYPES ---
interface FloatingBet { id: string; amount: number; x: number; y: number; side: 'YES' | 'NO' }
interface OrderBookEntry { price: number; shares: number; type: 'bid' | 'ask'; depth: number }
interface Trade { id: string; side: 'YES' | 'NO'; price: number; shares: number; time: number }
interface Comment { id: string; user: string; avatar: React.ReactNode; message: string; time: number; likes: number; isPremium: boolean }
interface UserBet { id: string; side: 'YES' | 'NO'; amount: number; estPayout: number; time: number }

type Timeframe = '1m' | '5m' | '15m' | '1h' | 'all'

// --- MOCKS (Replace with your backend/supabase data later) ---
const MOCK_ORDERS: OrderBookEntry[] = [
  { price: 72, shares: 150, type: 'ask', depth: 0.8 },
  { price: 70, shares: 320, type: 'ask', depth: 0.6 },
  { price: 68, shares: 500, type: 'ask', depth: 0.4 },
  { price: 65, shares: 800, type: 'bid', depth: 0.9 },
  { price: 63, shares: 450, type: 'bid', depth: 0.5 },
  { price: 60, shares: 200, type: 'bid', depth: 0.2 },
]

const MOCK_TRADES: Trade[] = [
  { id: 't1', side: 'YES', price: 67, shares: 520, time: Date.now() - 120000 },
  { id: 't2', side: 'NO', price: 33, shares: 125, time: Date.now() - 60000 },
  { id: 't3', side: 'YES', price: 68, shares: 1050, time: Date.now() - 30000 },
]

const MOCK_COMMENTS: Comment[] = [
  { id: 'c1', user: 'WhaleSniper', avatar: '🐋', message: 'Liquidity wall at 70c, no way this breaks target in 5m.', time: Date.now() - 45000, likes: 12, isPremium: true },
  { id: 'c2', user: 'NQ_Trader', avatar: '📈', message: 'Just loaded the boat on YES. Volume is spiking on Binance.', time: Date.now() - 120000, likes: 4, isPremium: false },
  { id: 'c3', user: 'PaperboyBTC', avatar: '⚡', message: 'Easy money.', time: Date.now() - 300000, likes: 24, isPremium: true },
]

export default function MarketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const inst = INSTRUMENTS.find(i => i.id === id)
  const wallet = useWallet()
  const { currency, displaySymbol } = useCurrency()

  // --- STATE ---
  const [livePrice, setLivePrice] = useState(inst?.initialPrice ?? 0)
  const [targetPrice, setTargetPrice] = useState(inst?.initialPrice ?? 0)
  const [priceHistory, setPriceHistory] = useState<{ time: number; price: number }[]>([])
  const [floatingBets, setFloatingBets] = useState<FloatingBet[]>([])
  const [stakeAmount, setStakeAmount] = useState('100')
  const [activeTab, setActiveTab] = useState<'chart' | 'orders' | 'comments'>('chart')
  const [timeframe, setTimeframe] = useState<Timeframe>('5m')
  const [commentInput, setCommentInput] = useState('')
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS)
  
  // Market derived values
  const [yesPrice, setYesPrice] = useState(67)
  const [noPrice, setNoPrice] = useState(33)
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [sellAmount, setSellAmount] = useState<string>('')
  const [userBets, setUserBets] = useState<UserBet[]>([])
  const [isNewMarketAvailable, setIsNewMarketAvailable] = useState(false)

  // --- BINANCE WS ENGINE ---
  useEffect(() => {
    if (!inst) return
    setTargetPrice(inst.initialPrice)
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/' + inst.symbol.toLowerCase() + '@trade')
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      const price = parseFloat(data.p)
      setLivePrice(price)
      setPriceHistory(h => [...h.slice(-150), { time: Date.now(), price }])
    }
    return () => ws.close()
  }, [inst])

  const market = useMarketLogic(inst?.id ?? 'BTC', targetPrice, livePrice)

  // --- MARKET REVOLVER LOGIC ---
  useEffect(() => {
    if (market.timeRemaining <= 0 && market.phase !== 'OPEN') {
      setIsNewMarketAvailable(true)
    }
  }, [market.timeRemaining, market.phase])

  // --- HANDLERS ---
  const handleBet = useCallback((side: 'YES' | 'NO', amount: number, e: React.MouseEvent) => {
    if (!market.canBet) return
    const poolSide = side === 'YES' ? 'UP' as const : 'DOWN' as const
    market.placeBet(poolSide, amount)
    wallet.subtractBalance(amount)
    wallet.incrementActiveBets()

    const price = side === 'YES' ? yesPrice : noPrice
    const estPayout = amount * (100 / price)
    setUserBets(prev => [...prev, { id: crypto.randomUUID(), side, amount, estPayout, time: Date.now() }])

    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const bid = crypto.randomUUID()
    setFloatingBets(prev => [...prev, { id: bid, amount, x: rect.left + rect.width / 2, y: rect.top, side }])
    setTimeout(() => setFloatingBets(prev => prev.filter(b => b.id !== bid)), 1500)
  }, [market, wallet, yesPrice, noPrice])

  const handleSell = useCallback((side: 'UP' | 'DOWN', amount: number) => {
    const currentStake = side === 'UP' ? market.userUpStake : market.userDownStake
    if (amount <= 0 || amount > currentStake) return
    const refund = amount * (market.phase === 'OPEN' ? 1.0 : 0.8) // sellRefundRate logic
    market.placeBet(side === 'UP' ? 'DOWN' : 'UP', amount - refund)
    wallet.addBalance(refund)
    wallet.decrementActiveBets()
    setSellAmount('')
  }, [market, wallet])

  const sendComment = useCallback(() => {
    if (!commentInput.trim()) return
    const newComment: Comment = {
      id: crypto.randomUUID(),
      user: 'You',
      avatar: '👤',
      message: commentInput,
      time: Date.now(),
      likes: 0,
      isPremium: true
    }
    setComments(prev => [newComment, ...prev])
    setCommentInput('')
  }, [commentInput])

  // --- RENDER VARS ---
  const timeStr = `${Math.floor(market.timeRemaining / 60000)}:${String(Math.floor((market.timeRemaining % 60000) / 1000)).padStart(2, '0')}`
  const isAbove = livePrice >= targetPrice
  const canSell = market.phase === 'OPEN'
  const sellRefundRate = market.phase === 'OPEN' ? 1.0 : 0.8
  const totalPool = market.upPool + market.downPool
  const filteredHistory = market.poolHistory // Fallback for your charting
  const startTime = format(Date.now() - 300000, 'HH:mm:ss') // Mocked for UI
  const lockTime = format(Date.now() + market.timeRemaining, 'HH:mm:ss')
  const resolveTime = format(Date.now() + market.timeRemaining + 60000, 'HH:mm:ss')

  if (!inst) return null

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#00D27D]/30 pb-20">
      <Header />

      {/* REVOLVER TOAST */}
      <AnimatePresence>
        {isNewMarketAvailable && (
          <motion.div 
            initial={{ y: -100 }} animate={{ y: 20 }} exit={{ y: -100 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-[#00D27D] text-black px-6 py-3 rounded-2xl font-black flex items-center gap-3 shadow-[0_0_40px_rgba(0,210,125,0.3)] cursor-pointer"
            onClick={() => window.location.reload()}
          >
            <Activity className="w-5 h-5 animate-pulse" />
            MARKET EXPIRED - GO TO LIVE MARKET
            <ExternalLink className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="bg-[#1F1F1F] p-2 rounded-xl">
                 <img src={`/icons/${inst.id.toLowerCase()}.png`} className="w-6 h-6" alt="" />
               </div>
               <h1 className="text-3xl font-black tracking-tight uppercase">
                {inst.label} <span className="text-[#888888] font-medium">5M Target</span>
               </h1>
            </div>
            <div className="text-[#888888] flex items-center gap-2 text-sm font-medium">
              Resolution: <span className="text-white font-mono font-bold">${targetPrice.toFixed(2)}</span>
              <div className="w-1 h-1 rounded-full bg-[#444]" />
              Status: <span className={isAbove ? 'text-[#00D27D]' : 'text-[#FF4949]'}>{isAbove ? 'Above Target' : 'Below Target'}</span>
            </div>
          </div>

          <div className="flex items-center gap-10 bg-[#0B0B0B] border border-[#1F1F1F] p-5 rounded-3xl shadow-xl">
             <div className="text-center">
                <p className="text-[10px] text-[#888888] uppercase font-black mb-1">Live Feed</p>
                <p className={`text-3xl font-mono font-black ${isAbove ? 'text-[#00D27D]' : 'text-[#FF4949]'}`}>
                  ${livePrice.toFixed(2)}
                </p>
             </div>
             <div className="w-[1px] h-12 bg-[#1F1F1F]" />
             <div className="text-center">
                <p className="text-[10px] text-[#888888] uppercase font-black mb-1">Locking In</p>
                <p className="text-3xl font-mono font-black text-white">{timeStr}</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Trading Terminal */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* LARGE ORDER BUTTONS */}
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={(e) => handleBet('YES', parseFloat(stakeAmount), e)}
                disabled={!market.canBet}
                className="relative overflow-hidden bg-[#00D27D]/5 border-2 border-[#00D27D]/20 hover:border-[#00D27D] group p-8 rounded-[32px] transition-all disabled:opacity-30"
              >
                <div className="flex justify-between items-start">
                   <div className="text-left">
                      <span className="text-[#00D27D] font-black text-xs uppercase tracking-widest">Buy YES</span>
                      <p className="text-5xl font-black mt-2 text-[#00D27D]">{yesPrice}¢</p>
                   </div>
                   <TrendingUp className="w-10 h-10 text-[#00D27D]/20 group-hover:text-[#00D27D] transition-colors" />
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={(e) => handleBet('NO', parseFloat(stakeAmount), e)}
                disabled={!market.canBet}
                className="relative overflow-hidden bg-[#FF4949]/5 border-2 border-[#FF4949]/20 hover:border-[#FF4949] group p-8 rounded-[32px] transition-all disabled:opacity-30"
              >
                <div className="flex justify-between items-start">
                   <div className="text-left">
                      <span className="text-[#FF4949] font-black text-xs uppercase tracking-widest">Buy NO</span>
                      <p className="text-5xl font-black mt-2 text-[#FF4949]">{noPrice}¢</p>
                   </div>
                   <TrendingDown className="w-10 h-10 text-[#FF4949]/20 group-hover:text-[#FF4949] transition-colors" />
                </div>
              </motion.button>
            </div>

            {/* TABS HEADER */}
            <div className="flex bg-[#0B0B0B] border border-[#1F1F1F] rounded-[24px] p-1 gap-1">
              {[
                { id: 'chart' as const, label: 'Chart', icon: BarChart3 },
                { id: 'orders' as const, label: 'Order Book', icon: Users },
                { id: 'comments' as const, label: 'Comments', icon: MessageSquare },
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`flex-1 py-3 rounded-[20px] text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 ${activeTab === tab.id ? 'bg-[#1F1F1F] text-white' : 'text-[#888888] hover:text-white'}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'chart' && (
              <div className="bg-[#0B0B0B] border border-[#1F1F1F] rounded-[32px] p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black text-[#888888] uppercase tracking-widest">Probability Chart</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex bg-black rounded-xl p-1 border border-[#1F1F1F]">
                      {(['1m', '5m', '15m', '1h', 'all'] as Timeframe[]).map(tf => (
                        <button 
                          key={tf} 
                          onClick={() => setTimeframe(tf)} 
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition ${timeframe === tf ? 'bg-[#1F1F1F] text-white' : 'text-[#888888] hover:text-white'}`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#00D27D]" />
                      <span className="text-[10px] font-bold text-[#888888]">YES {yesPrice}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#FF4949]" />
                      <span className="text-[10px] font-bold text-[#888888]">NO {noPrice}%</span>
                    </div>
                  </div>
                </div>
                <SentimentChart data={filteredHistory} height={350} frozen={market.phase !== 'OPEN'} />
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-[#0B0B0B] border border-[#1F1F1F] rounded-[32px] overflow-hidden">
                <div className="grid grid-cols-2">
                  <div className="p-8 border-r border-[#1F1F1F]">
                    <h4 className="text-[10px] font-black text-[#888888] uppercase tracking-widest mb-6">Order Book</h4>
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 text-[10px] text-[#444] font-black uppercase mb-2 px-3">
                        <span>Price</span>
                        <span className="text-right">Shares</span>
                        <span className="text-right">Total</span>
                      </div>
                      {MOCK_ORDERS.filter(o => o.type === 'ask').reverse().map((o, i) => (
                        <div key={i} className="grid grid-cols-3 text-xs font-mono relative h-8 items-center px-3 group">
                          <div className="absolute inset-0 bg-[#FF4949]/10 origin-right transition-all" style={{ width: (o.shares / 800) * 100 + '%', right: 0 }} />
                          <span className="text-[#FF4949] font-bold relative z-10">{o.price}¢</span>
                          <span className="text-right text-[#888888] relative z-10">{o.shares}</span>
                          <span className="text-right text-[#444] relative z-10">{(o.price * o.shares / 100).toFixed(0)}</span>
                        </div>
                      ))}
                      <div className="py-4 text-center text-xl font-black text-white font-mono border-y border-[#1F1F1F] my-2">
                        {yesPrice}¢
                      </div>
                      {MOCK_ORDERS.filter(o => o.type === 'bid').map((o, i) => (
                        <div key={i} className="grid grid-cols-3 text-xs font-mono relative h-8 items-center px-3 group">
                          <div className="absolute inset-0 bg-[#00D27D]/10 origin-right transition-all" style={{ width: (o.shares / 800) * 100 + '%', right: 0 }} />
                          <span className="text-[#00D27D] font-bold relative z-10">{o.price}¢</span>
                          <span className="text-right text-[#888888] relative z-10">{o.shares}</span>
                          <span className="text-right text-[#444] relative z-10">{(o.price * o.shares / 100).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-8">
                    <h4 className="text-[10px] font-black text-[#888888] uppercase tracking-widest mb-6">Recent Trades</h4>
                    <div className="space-y-4">
                      {MOCK_TRADES.map(t => (
                        <div key={t.id} className="flex items-center justify-between text-xs border-b border-[#1F1F1F] pb-3">
                          <span className={`font-black px-2 py-0.5 rounded ${t.side === 'YES' ? 'bg-[#00D27D]/10 text-[#00D27D]' : 'bg-[#FF4949]/10 text-[#FF4949]'}`}>{t.side}</span>
                          <span className="font-mono text-white font-bold">{t.price}¢</span>
                          <span className="text-[#888888]">{t.shares}</span>
                          <span className="text-[#444] text-[10px]">{Math.floor((Date.now() - t.time) / 1000)}s ago</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="bg-[#0B0B0B] border border-[#1F1F1F] rounded-[32px] overflow-hidden">
                <div className="h-96 overflow-y-auto p-8 space-y-6">
                  <AnimatePresence>
                    {comments.map(c => (
                      <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${c.isPremium ? 'bg-[#1F1F1F]' : 'bg-black border border-[#1F1F1F]'}`}>
                          {c.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-black ${c.isPremium ? 'text-[#00D27D]' : 'text-white'}`}>{c.user}</span>
                            {c.isPremium && <Crown className="w-3.5 h-3.5 text-[#00D27D]" />}
                            <span className="text-[10px] font-bold text-[#444] ml-2">{Math.floor((Date.now() - c.time) / 1000)}s ago</span>
                          </div>
                          <p className="text-sm text-[#888888] leading-relaxed">{c.message}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <button className="text-[10px] font-bold text-[#444] hover:text-white transition flex items-center gap-1.5">
                              <ArrowUpRight className="w-3.5 h-3.5" /> {c.likes}
                            </button>
                            <button className="text-[10px] font-bold text-[#444] hover:text-white transition">Reply</button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <div className="p-4 border-t border-[#1F1F1F] bg-black/50">
                  <div className="flex items-center gap-3">
                    <input 
                      value={commentInput} 
                      onChange={e => setCommentInput(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && sendComment()} 
                      placeholder="Share your analysis..." 
                      className="flex-1 bg-black border border-[#1F1F1F] text-white rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#00D27D] placeholder:text-[#444]" 
                    />
                    <button 
                      onClick={sendComment} 
                      className="p-4 rounded-2xl bg-[#00D27D] text-black hover:scale-105 transition-transform"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Market Rules / Resolution Criteria */}
            <div className="bg-[#0B0B0B] border border-[#1F1F1F] rounded-[32px] p-8">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#888888] mb-6 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#00D27D]" /> Resolution Criteria
              </h4>
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="bg-black border border-[#1F1F1F] p-4 rounded-2xl text-center">
                  <p className="text-[10px] text-[#444] uppercase font-black mb-1">Opens</p>
                  <p className="text-sm font-mono font-bold text-[#888888]">{startTime}</p>
                </div>
                <div className="bg-black border border-[#1F1F1F] p-4 rounded-2xl text-center">
                  <p className="text-[10px] text-[#444] uppercase font-black mb-1">Locks</p>
                  <p className="text-sm font-mono font-bold text-white">{lockTime}</p>
                </div>
                <div className="bg-[#00D27D]/5 border border-[#00D27D]/20 p-4 rounded-2xl text-center">
                  <p className="text-[10px] text-[#00D27D] uppercase font-black mb-1">Resolves</p>
                  <p className="text-sm font-mono font-bold text-[#00D27D]">{resolveTime}</p>
                </div>
              </div>
              <p className="text-sm text-[#888888] leading-relaxed font-medium">
                This market resolves to YES if the <span className="text-white font-bold">{inst.label}</span> price at resolution time is strictly above the strike price of <span className="text-white font-mono">${targetPrice.toFixed(2)}</span>.
                Otherwise it resolves to NO. Price data is sourced directly from the Binance API WebSocket stream.
              </p>
            </div>
          </div>

          {/* RIGHT: Bet Control Panel */}
          <div className="lg:col-span-4">
            <div className="bg-[#0B0B0B] border border-[#1F1F1F] rounded-[32px] p-8 sticky top-24 space-y-8 shadow-2xl">
               
               {/* STAKE INPUT */}
               <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-black text-[#888888] uppercase tracking-widest">Stake Amount</label>
                    <span className="text-[10px] font-bold text-[#444]">Bal: {wallet.balance.toFixed(2)} USDT</span>
                  </div>
                  <div className="relative mb-4">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#888888] font-mono">$</span>
                    <input 
                      type="number" 
                      value={stakeAmount} 
                      onChange={e => setStakeAmount(e.target.value)} 
                      className="w-full bg-black border border-[#1F1F1F] text-white rounded-2xl pl-10 pr-5 py-4 text-xl font-mono focus:outline-none focus:border-[#00D27D] transition-all" 
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 50, 100, 500].map(amt => (
                      <button 
                        key={amt} 
                        onClick={() => setStakeAmount(String(amt))} 
                        className={`py-2.5 rounded-xl text-[10px] font-black transition border ${stakeAmount === String(amt) ? 'bg-[#00D27D] border-[#00D27D] text-black' : 'border-[#1F1F1F] bg-black text-[#888888] hover:text-white'}`}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
               </div>

               {/* POSITION MANAGEMENT */}
               {(market.userUpStake > 0 || market.userDownStake > 0) && (
                 <div className="bg-black border border-[#1F1F1F] rounded-[24px] p-6 space-y-5">
                    <h4 className="text-[10px] font-black text-[#888888] uppercase tracking-widest flex items-center gap-2">
                       <Shield className="w-4 h-4 text-white" /> Your Positions
                    </h4>
                    
                    {market.userUpStake > 0 && (
                      <div className="space-y-3">
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-[#00D27D]" />
                              <span className="text-xs font-black text-[#00D27D]">YES</span>
                              <span className="text-xs font-mono text-white">{market.userUpStake.toFixed(2)} USDT</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#888888]">To Win: ${(market.userUpStake * (100/yesPrice)).toFixed(2)}</span>
                         </div>
                         {canSell && (
                           <div className="flex gap-2">
                              <input 
                                type="number" 
                                placeholder="Sell amount" 
                                value={sellAmount}
                                onChange={e => setSellAmount(e.target.value)}
                                className="flex-1 bg-[#1F1F1F] border-none rounded-xl px-4 py-2.5 text-xs font-mono focus:ring-1 ring-[#00D27D] text-white placeholder:text-[#444]" 
                              />
                              <button 
                                onClick={() => handleSell('UP', parseFloat(sellAmount) || market.userUpStake)} 
                                className="px-5 py-2.5 bg-[#00D27D]/10 text-[#00D27D] text-[10px] font-black rounded-xl uppercase hover:bg-[#00D27D]/20 transition whitespace-nowrap"
                              >
                                Sell ({sellRefundRate * 100}%)
                              </button>
                           </div>
                         )}
                      </div>
                    )}

                    {market.userDownStake > 0 && (
                      <div className="space-y-3">
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-[#FF4949]" />
                              <span className="text-xs font-black text-[#FF4949]">NO</span>
                              <span className="text-xs font-mono text-white">{market.userDownStake.toFixed(2)} USDT</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#888888]">To Win: ${(market.userDownStake * (100/noPrice)).toFixed(2)}</span>
                         </div>
                         {canSell && (
                           <div className="flex gap-2">
                              <input 
                                type="number" 
                                placeholder="Sell amount" 
                                value={sellAmount}
                                onChange={e => setSellAmount(e.target.value)}
                                className="flex-1 bg-[#1F1F1F] border-none rounded-xl px-4 py-2.5 text-xs font-mono focus:ring-1 ring-[#FF4949] text-white placeholder:text-[#444]" 
                              />
                              <button 
                                onClick={() => handleSell('DOWN', parseFloat(sellAmount) || market.userDownStake)} 
                                className="px-5 py-2.5 bg-[#FF4949]/10 text-[#FF4949] text-[10px] font-black rounded-xl uppercase hover:bg-[#FF4949]/20 transition whitespace-nowrap"
                              >
                                Sell ({sellRefundRate * 100}%)
                              </button>
                           </div>
                         )}
                      </div>
                    )}
                    
                    {!canSell && market.phase !== 'RESOLVED' && (
                      <div className="bg-[#1F1F1F] rounded-xl p-3 text-center">
                        <p className="text-[10px] font-black text-[#888888] uppercase">Market Locked — Selling Disabled</p>
                      </div>
                    )}
                 </div>
               )}

               <button 
                 onClick={() => setShowDeposit(true)} 
                 className="w-full py-4 rounded-2xl border border-[#1F1F1F] bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-[#00D27D] hover:border-[#00D27D] transition-all flex items-center justify-center gap-3"
               >
                  <Wallet className="w-4 h-4" /> Deposit Funds
               </button>

               <div className="pt-6 border-t border-[#1F1F1F] grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] text-[#444] uppercase font-black mb-1">Open Interest</p>
                    <p className="text-lg font-mono font-bold text-white">${totalPool.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#444] uppercase font-black mb-1">24h Vol</p>
                    <p className="text-lg font-mono font-bold text-white">$1.24M</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* DEPOSIT MODAL */}
      <AnimatePresence>
        {showDeposit && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-6" onClick={() => setShowDeposit(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0B0B0B] border border-[#1F1F1F] rounded-[40px] w-full max-w-md p-10 relative shadow-[0_0_100px_rgba(0,0,0,1)]" 
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Add Liquidity</h3>
              <p className="text-sm text-[#888888] mb-8 font-medium">Instant USDT deposits via Kotani Pay</p>
              <input 
                type="number" 
                value={depositAmount} 
                onChange={e => setDepositAmount(e.target.value)} 
                placeholder="0.00" 
                className="w-full bg-black border border-[#1F1F1F] text-white rounded-2xl p-5 mb-6 text-2xl font-mono focus:outline-none focus:border-[#00D27D]" 
              />
              <button 
                onClick={() => { wallet.addBalance(parseFloat(depositAmount) || 0); setShowDeposit(false); setDepositAmount(''); }}
                className="w-full bg-[#00D27D] text-black font-black py-5 rounded-2xl text-sm uppercase tracking-widest hover:scale-[1.02] transition-transform"
              >
                Confirm Deposit
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING BETS */}
      <AnimatePresence>
        {floatingBets.map(bet => (
          <motion.div 
            key={bet.id} 
            initial={{ opacity: 1, y: bet.y }} 
            animate={{ opacity: 0, y: bet.y - 120 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 1.2, ease: "easeOut" }} 
            className={`fixed pointer-events-none z-[150] text-xl font-black font-mono ${bet.side === 'YES' ? 'text-[#00D27D]' : 'text-[#FF4949]'}`} 
            style={{ left: bet.x - 30 }}
          >
            +${bet.amount}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
