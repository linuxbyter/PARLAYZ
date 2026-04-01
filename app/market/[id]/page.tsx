'use client'

import Header from '@/src/components/Header'
import { useParams, useRouter } from 'next/navigation'
import { useMarketLogic, type MarketPhase } from '@/src/hooks/useMarketLogic'
import { SentimentChart } from '@/src/components/SentimentChart'
import { INSTRUMENTS, formatPrice } from '@/src/lib/instruments'
import { format } from 'date-fns'
import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, CheckCircle, XCircle,
  AlertTriangle, ArrowLeft, Shield, Zap, Info, Swords,
  Copy, Users, Clock, ArrowUpRight,
} from 'lucide-react'

interface FloatingBet { id: string; amount: number; x: number; y: number }

const MOCK_CHALLENGES = [
  { id: 'c1', user: '0x1a2b...3c4d', side: 'UP' as const, stake: 5, accepted: false },
  { id: 'c2', user: '0x5e6f...7a8b', side: 'DOWN' as const, stake: 10, accepted: false },
  { id: 'c3', user: '0x9c0d...1e2f', side: 'UP' as const, stake: 2, accepted: false },
]

export default function MarketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const inst = INSTRUMENTS.find(i => i.id === id)

  const [livePrice, setLivePrice] = useState(inst?.initialPrice ?? 0)
  const [priceHistory, setPriceHistory] = useState<{ time: number; price: number }[]>([])
  const [floatingBets, setFloatingBets] = useState<FloatingBet[]>([])
  const [stakeAmount, setStakeAmount] = useState('1')
  const [detailTab, setDetailTab] = useState<'pool' | 'duels'>('pool')
  const [challenges, setChallenges] = useState(MOCK_CHALLENGES)

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

  const handleBet = useCallback((side: 'UP' | 'DOWN', amount: number, e: React.MouseEvent) => {
    if (!market.canBet) return
    market.placeBet(side, amount)
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const bid = crypto.randomUUID()
    setFloatingBets(prev => [...prev, { id: bid, amount, x: rect.left + rect.width / 2, y: rect.top }])
    setTimeout(() => setFloatingBets(prev => prev.filter(b => b.id !== bid)), 1500)
  }, [market])

  const handleWithdraw = useCallback((side: 'UP' | 'DOWN') => {
    market.withdrawStake(side)
  }, [market])

  const handleAcceptDuel = useCallback((duelId: string) => {
    setChallenges(prev => prev.map(c => c.id === duelId ? { ...c, accepted: true } : c))
  }, [])

  if (!inst) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <Header activeBetsCount={3} balance={2138.00} />
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-black text-white mb-2">Market not found</h2>
          <button onClick={() => router.push('/')} className="text-[#D9C5A0] hover:underline mt-4 inline-block">Back to Markets</button>
        </main>
      </div>
    )
  }

  const totalPool = market.upPool + market.downPool
  const upPct = totalPool > 0 ? ((market.upPool / totalPool) * 100).toFixed(0) : '50'
  const downPct = totalPool > 0 ? ((market.downPool / totalPool) * 100).toFixed(0) : '50'
  const startTime = format(new Date(market.openStartMs), 'h:mm a')
  const lockTime = format(new Date(market.lockAtMs), 'h:mm a')
  const resolveTime = format(new Date(market.resolveAtMs), 'h:mm a')
  const remainingMins = Math.floor(market.timeRemaining / 60000)
  const remainingSecs = Math.floor((market.timeRemaining % 60000) / 1000)
  const timeStr = remainingMins + ':' + String(remainingSecs).padStart(2, '0')
  const duelLink = typeof window !== 'undefined' ? window.location.origin + '/duel/' + inst.id + '-' + market.openStartMs : ''

  const phaseConfig: Record<MarketPhase, { badge: string; color: string; dot: string; border: string }> = {
    OPEN: { badge: 'BETTING OPEN', color: 'amber', dot: 'bg-amber-400 animate-pulse', border: 'border border-amber-500/20' },
    LOCKED: { badge: 'SWEATING', color: 'amber', dot: 'bg-amber-400 animate-pulse', border: 'border-2 border-amber-500/60 shadow-[0_0_30px_rgba(251,191,36,0.3)]' },
    GRACE: { badge: 'CHICKEN OUT', color: 'amber', dot: 'bg-amber-400 animate-pulse', border: 'border-2 border-amber-400/80 shadow-[0_0_30px_rgba(251,191,36,0.4)]' },
    RESOLVED: { badge: 'RESOLVED', color: 'yellow', dot: 'bg-yellow-600', border: 'border border-yellow-700/30' },
  }
  const pc = phaseConfig[market.phase]

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <Header activeBetsCount={3} balance={2138.00} />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-bold">All Markets</span>
          </button>
          <div className={'flex items-center gap-2 px-3 py-1.5 rounded-full ' + (pc.color === 'amber' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-yellow-500/10 border border-yellow-500/30')}>
            <div className={'w-2 h-2 rounded-full ' + pc.dot} />
            <span className={'text-xs font-bold uppercase tracking-widest ' + (pc.color === 'amber' ? 'text-amber-400' : 'text-yellow-600')}>{pc.badge}</span>
            <span className="text-xs font-mono text-gray-400 ml-1">{timeStr}</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{inst.label}</span>
          </div>
          <h1 className="text-2xl font-black text-white leading-tight">
            {market.phase === 'OPEN' && <>Will {inst.label} go <span className="text-green-400">UP</span> or <span className="text-red-400">DOWN</span> in 5 minutes?</>}
            {market.phase !== 'OPEN' && market.phase !== 'RESOLVED' && market.strikePrice && <>Will {inst.label} close above or below <span className="text-amber-400 font-mono">${formatPrice(market.strikePrice, inst.id)}</span> at {resolveTime}?</>}
            {market.phase === 'RESOLVED' && market.resolution && <>{inst.label} closed <span className={market.resolution === 'UP' ? 'text-green-400' : 'text-red-400'}>{market.resolution}</span>{market.resolution === 'UP' ? ' ✅' : ' ❌'}</>}
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-4">
            <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest mb-1">Live Price</p>
            <p className="text-3xl font-black font-mono text-white">${formatPrice(market.livePrice, inst.id)}</p>
          </div>
          <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-4">
            <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest mb-1">Strike Price</p>
            <p className="text-3xl font-black font-mono text-amber-400">{market.strikePrice ? '$' + formatPrice(market.strikePrice, inst.id) : '—'}</p>
          </div>
          <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-4">
            <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest mb-1">Pool</p>
            <p className="text-3xl font-black font-mono text-white">{totalPool.toFixed(1)}</p>
            <p className="text-xs text-gray-500">USDT</p>
          </div>
        </div>

        <div className="flex bg-[#111] border border-[#1F1F1F] rounded-xl p-1 gap-1 mb-6">
          <button onClick={() => setDetailTab('pool')} className={'flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ' + (detailTab === 'pool' ? 'bg-[#D9C5A0] text-black' : 'text-gray-500 hover:text-white')}>Pool</button>
          <button onClick={() => setDetailTab('duels')} className={'flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ' + (detailTab === 'duels' ? 'bg-[#D9C5A0] text-black' : 'text-gray-500 hover:text-white')}>Duels</button>
        </div>

        {detailTab === 'pool' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SentimentChart data={market.poolHistory} height={240} />
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-bold text-green-400 uppercase tracking-widest">UP</span>
                  </div>
                  <p className="text-2xl font-black font-mono text-green-400">{market.upPool.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">{upPct}% of pool</p>
                  <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-green-500 transition-all duration-500" style={{ width: upPct + '%' }} />
                  </div>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest">DOWN</span>
                  </div>
                  <p className="text-2xl font-black font-mono text-red-400">{market.downPool.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">{downPct}% of pool</p>
                  <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-red-500 transition-all duration-500" style={{ width: downPct + '%' }} />
                  </div>
                </div>
              </div>
              <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> 10-Minute Cycle
                </h4>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-[9px] text-gray-600 uppercase font-bold">Start</p>
                    <p className="text-sm font-mono font-bold text-white">{startTime}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-gray-600 uppercase font-bold">Strike Lock</p>
                    <p className="text-sm font-mono font-bold text-amber-400">{lockTime}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-gray-600 uppercase font-bold">Resolve</p>
                    <p className="text-sm font-mono font-bold text-green-400">{resolveTime}</p>
                  </div>
                </div>
                <ul className="text-[10px] text-gray-400 space-y-1">
                  <li>UP wins if price &gt; strike, DOWN wins if price &le; strike</li>
                  <li>Source: Binance API</li>
                  {market.phase === 'OPEN' && <li className="text-green-400">Withdraw anytime: 100% refund</li>}
                  {market.phase === 'GRACE' && <li className="text-amber-400">Chicken Out: 80% refund, {remainingSecs}s left</li>}
                  {market.phase === 'LOCKED' && <li className="text-gray-500">Locked in &mdash; no withdrawals</li>}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-5 sticky top-20">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Place Your Bet</h3>
                {market.canBet && (
                  <>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Stake (USDT)</span>
                        <input type="number" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} className="w-20 bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:border-amber-500" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 5, 10].map(amt => (
                          <button key={amt} onClick={() => setStakeAmount(String(amt))} className={'py-2 rounded-lg text-xs font-bold transition border ' + (stakeAmount === String(amt) ? 'bg-[#D9C5A0] border-[#D9C5A0] text-black' : 'border-[#1F1F1F] bg-[#1a1a1a] text-gray-400 hover:border-amber-500/50')}>{amt}</button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button onClick={(e) => handleBet('UP', parseFloat(stakeAmount) || 1, e)} className="py-3.5 rounded-xl text-xs font-black uppercase tracking-widest border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition flex items-center justify-center gap-2">
                        <TrendingUp className="w-4 h-4" /> UP
                      </button>
                      <button onClick={(e) => handleBet('DOWN', parseFloat(stakeAmount) || 1, e)} className="py-3.5 rounded-xl text-xs font-black uppercase tracking-widest border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition flex items-center justify-center gap-2">
                        <TrendingDown className="w-4 h-4" /> DOWN
                      </button>
                    </div>
                  </>
                )}
                {(market.userUpStake > 0 || market.userDownStake > 0) && (
                  <div className="bg-[#0a0a0a] rounded-xl p-3 mb-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Your Positions
                    </h4>
                    <div className="space-y-2">
                      {market.userUpStake > 0 && (
                        <div className="flex items-center justify-between bg-green-500/10 rounded-lg p-2.5">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-xs font-bold text-green-400">UP</span>
                            <span className="text-xs text-gray-400 font-mono">{market.userUpStake.toFixed(2)}</span>
                          </div>
                          {market.canChickenOut && (
                            <button onClick={() => handleWithdraw('UP')} className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-bold uppercase hover:bg-amber-500/30 transition">
                              <AlertTriangle className="w-3 h-3" />
                              Withdraw ({(market.userUpStake * (market.phase === 'OPEN' ? 1 : 0.8)).toFixed(2)})
                            </button>
                          )}
                        </div>
                      )}
                      {market.userDownStake > 0 && (
                        <div className="flex items-center justify-between bg-red-500/10 rounded-lg p-2.5">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                            <span className="text-xs font-bold text-red-400">DOWN</span>
                            <span className="text-xs text-gray-400 font-mono">{market.userDownStake.toFixed(2)}</span>
                          </div>
                          {market.canChickenOut && (
                            <button onClick={() => handleWithdraw('DOWN')} className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-bold uppercase hover:bg-amber-500/30 transition">
                              <AlertTriangle className="w-3 h-3" />
                              Withdraw ({(market.userDownStake * (market.phase === 'OPEN' ? 1 : 0.8)).toFixed(2)})
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {market.canChickenOut && (
                  <button onClick={() => { handleWithdraw('UP'); if (market.userDownStake > 0) handleWithdraw('DOWN') }} className="w-full py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider hover:bg-amber-500/20 transition flex items-center justify-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4" />
                    Chicken Out &mdash; {market.chickenOutRefund.toFixed(2)} USDT
                  </button>
                )}
                {market.phase === 'RESOLVED' && market.resolution && (
                  <div className="bg-gray-500/10 rounded-xl p-4 text-center mb-4">
                    {market.resolution === 'UP' ? <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" /> : <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />}
                    <p className="text-sm font-bold text-gray-300">{market.resolution} Won</p>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button disabled className="flex-1 opacity-50 cursor-not-allowed py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider border-[#1F1F1F] bg-[#1a1a1a] text-gray-400">Deposit</button>
                  <button disabled className="flex-1 opacity-50 cursor-not-allowed py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider border-[#1F1F1F] bg-[#1a1a1a] text-gray-400">Withdraw</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {detailTab === 'duels' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <Swords className="w-4 h-4" /> Create Challenge
              </h4>
              <div className="flex items-center gap-2 mb-3">
                <input readOnly value={duelLink} className="flex-1 bg-[#0a0a0a] border border-[#1F1F1F] text-gray-400 rounded-xl px-4 py-3 text-xs font-mono truncate" />
                <button onClick={() => { navigator.clipboard.writeText(duelLink) }} className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-[#D9C5A0] text-black text-xs font-bold hover:bg-[#c4b18f] transition shrink-0">
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>
              <p className="text-[10px] text-gray-600">Share this link. If unmatched by lock time, House matches at 0.75 odds.</p>
            </div>
            <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> Open Challenges
              </h4>
              <div className="space-y-3">
                {challenges.filter(c => !c.accepted).map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-[#0a0a0a] border border-[#1F1F1F] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className={'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ' + (c.side === 'UP' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                        {c.side === 'UP' ? '▲' : '▼'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{c.user}</p>
                        <p className="text-[10px] text-gray-500">{c.stake} USDT on {c.side}</p>
                      </div>
                    </div>
                    <button onClick={() => handleAcceptDuel(c.id)} className="px-4 py-2 rounded-xl bg-[#D9C5A0] text-black text-xs font-bold hover:bg-[#c4b18f] transition flex items-center gap-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Accept
                    </button>
                  </div>
                ))}
                {challenges.filter(c => !c.accepted).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">No open challenges</p>
                )}
              </div>
            </div>
            <div className="lg:col-span-2 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
              <p className="text-sm text-amber-400 font-bold flex items-center gap-2">
                <Clock className="w-4 h-4" /> House Match Rule
              </p>
              <p className="text-xs text-gray-400 mt-2">Unmatched duels are auto-matched by House at 0.75 odds at lock time.</p>
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {floatingBets.map(bet => (
          <motion.div key={bet.id} initial={{ opacity: 1, y: bet.y }} animate={{ opacity: 0, y: bet.y - 40 }} exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }} className="fixed pointer-events-none z-50" style={{ left: bet.x - 30 }}>
            <span className="text-sm font-bold text-green-400 font-mono">+{bet.amount} USDT</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
