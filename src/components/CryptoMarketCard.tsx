'use client'

import { useState, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  TrendingUp, TrendingDown, Lock, CheckCircle, XCircle,
  AlertTriangle, ArrowLeft, Shield, Zap, ChevronRight,
  Info, Swords, Copy, Users, Clock,
} from 'lucide-react'
import { useMarketLogic, type MarketPhase } from '@/src/hooks/useMarketLogic'
import { SentimentChart } from '@/src/components/SentimentChart'
import { formatPrice } from '@/src/lib/instruments'

interface FloatingBet {
  id: string
  amount: number
  x: number
  y: number
}

interface CryptoMarketCardProps {
  instrumentId: string
  coin: string
  initialPrice: number
  livePrice: number
  priceHistory: { time: number; price: number }[]
  onResolve?: (resolution: 'UP' | 'DOWN') => void
  onClick?: () => void
}

export const CryptoMarketCard: React.FC<CryptoMarketCardProps> = ({
  instrumentId,
  coin,
  initialPrice,
  livePrice,
  priceHistory,
  onResolve,
  onClick,
}) => {
  const [showDetail, setShowDetail] = useState(false)
  const [detailTab, setDetailTab] = useState<'pool' | 'duels'>('pool')
  const [floatingBets, setFloatingBets] = useState<FloatingBet[]>([])
  const [stakeAmount, setStakeAmount] = useState('1')
  const cardRef = useRef<HTMLDivElement>(null)

  const market = useMarketLogic(instrumentId, initialPrice, livePrice, onResolve)

  const handleBet = useCallback((side: 'UP' | 'DOWN', amount: number, e: React.MouseEvent) => {
    if (!market.canBet) return
    market.placeBet(side, amount)
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const id = crypto.randomUUID()
    setFloatingBets(prev => [...prev, { id, amount, x: rect.left + rect.width / 2, y: rect.top }])
    setTimeout(() => setFloatingBets(prev => prev.filter(b => b.id !== id)), 1500)
  }, [market])

  const handleWithdraw = useCallback((side: 'UP' | 'DOWN') => {
    market.withdrawStake(side)
  }, [market])

  const totalPool = market.upPool + market.downPool
  const upPct = totalPool > 0 ? ((market.upPool / totalPool) * 100).toFixed(0) : '50'
  const downPct = totalPool > 0 ? ((market.downPool / totalPool) * 100).toFixed(0) : '50'
  const startTime = format(new Date(market.openStartMs), 'h:mm a')
  const lockTime = format(new Date(market.lockAtMs), 'h:mm a')
  const resolveTime = format(new Date(market.resolveAtMs), 'h:mm a')
  const remainingMins = Math.floor(market.timeRemaining / 60000)
  const remainingSecs = Math.floor((market.timeRemaining % 60000) / 1000)
  const timeStr = remainingMins + ':' + String(remainingSecs).padStart(2, '0')

  const phaseConfig: Record<MarketPhase, { badge: string; color: string; dot: string; border: string }> = {
    OPEN: { badge: 'BETTING OPEN', color: 'green', dot: 'bg-green-400 animate-pulse', border: '' },
    LOCKED: { badge: 'LOCKED', color: 'red', dot: 'bg-red-400', border: 'border-2 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.3)]' },
    GRACE: { badge: 'CHICKEN OUT', color: 'yellow', dot: 'bg-yellow-400 animate-pulse', border: 'border-2 border-yellow-500/80 shadow-[0_0_20px_rgba(234,179,8,0.3)]' },
    RESOLVED: { badge: 'RESOLVED', color: 'gray', dot: 'bg-gray-400', border: 'border border-gray-500/30' },
  }

  const pc = phaseConfig[market.phase]
  const duelLink = typeof window !== 'undefined' ? window.location.origin + '/duel/' + instrumentId + '-' + market.openStartMs : ''

  if (showDetail) {
    return (
      <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#1F1F1F]">
          <button onClick={() => setShowDetail(false)} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-bold">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className={'w-2 h-2 rounded-full ' + pc.dot} />
            <span className={'text-xs font-bold uppercase tracking-widest text-' + pc.color + '-400'}>{pc.badge}</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between bg-[#0a0a0a] rounded-xl p-3">
            <div>
              <p className="text-[9px] text-gray-600 uppercase font-bold">Live {coin}</p>
              <p className="text-xl font-black font-mono text-white">${formatPrice(market.livePrice, instrumentId)}</p>
            </div>
            {market.strikePrice && (
              <div className="text-right">
                <p className="text-[9px] text-gray-600 uppercase font-bold">Strike</p>
                <p className="text-xl font-black font-mono text-red-400">${formatPrice(market.strikePrice, instrumentId)}</p>
              </div>
            )}
            <div className="text-right">
              <p className="text-[9px] text-gray-600 uppercase font-bold">Time</p>
              <p className="text-xl font-black font-mono text-[#D9C5A0]">{timeStr}</p>
            </div>
          </div>

          <div className="flex bg-[#0a0a0a] rounded-xl p-1 gap-1">
            <button onClick={() => setDetailTab('pool')} className={'flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ' + (detailTab === 'pool' ? 'bg-[#D9C5A0] text-black' : 'text-gray-500 hover:text-white')}>Pool</button>
            <button onClick={() => setDetailTab('duels')} className={'flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ' + (detailTab === 'duels' ? 'bg-[#D9C5A0] text-black' : 'text-gray-500 hover:text-white')}>Duels</button>
          </div>

          {detailTab === 'pool' && (
            <>
              <SentimentChart data={market.poolHistory} height={180} />

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
                  <p className="text-[9px] text-gray-600 uppercase font-bold">Total Pool</p>
                  <p className="text-lg font-black text-white font-mono">{totalPool.toFixed(1)}</p>
                  <p className="text-[9px] text-gray-500">USDT</p>
                </div>
                <div className="bg-green-500/10 rounded-xl p-3 text-center">
                  <p className="text-[9px] text-green-600 uppercase font-bold">UP Pool</p>
                  <p className="text-lg font-black text-green-400 font-mono">{market.upPool.toFixed(1)}</p>
                  <p className="text-[9px] text-green-600">{upPct}%</p>
                </div>
                <div className="bg-red-500/10 rounded-xl p-3 text-center">
                  <p className="text-[9px] text-red-600 uppercase font-bold">DOWN Pool</p>
                  <p className="text-lg font-black text-red-400 font-mono">{market.downPool.toFixed(1)}</p>
                  <p className="text-[9px] text-red-600">{downPct}%</p>
                </div>
              </div>

              <div className="bg-[#0a0a0a] rounded-xl p-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> 10-Minute Cycle
                </h4>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="text-center">
                    <p className="text-[9px] text-gray-600 uppercase font-bold">Start</p>
                    <p className="text-xs font-mono font-bold text-white">{startTime}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-gray-600 uppercase font-bold">Strike Lock</p>
                    <p className="text-xs font-mono font-bold text-red-400">{lockTime}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-gray-600 uppercase font-bold">Resolve</p>
                    <p className="text-xs font-mono font-bold text-green-400">{resolveTime}</p>
                  </div>
                </div>
                <ul className="text-[10px] text-gray-400 space-y-1">
                  <li>UP wins if price &gt; strike, DOWN wins if price &le; strike</li>
                  <li>Source: Binance API</li>
                  {market.phase === 'OPEN' && <li className="text-green-400">Withdraw anytime: 100% refund</li>}
                  {market.phase === 'GRACE' && <li className="text-yellow-400">Chicken Out: 80% refund, {remainingSecs}s left</li>}
                  {market.phase === 'LOCKED' && <li className="text-red-400">Locked in &mdash; no withdrawals</li>}
                </ul>
              </div>

              {(market.userUpStake > 0 || market.userDownStake > 0) && (
                <div className="bg-[#0a0a0a] rounded-xl p-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                    <Shield className="w-3 h-3" /> Your Positions
                  </h4>
                  <div className="space-y-2">
                    {market.userUpStake > 0 && (
                      <div className="flex items-center justify-between bg-green-500/10 rounded-lg p-2.5">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-xs font-bold text-green-400">UP</span>
                          <span className="text-xs text-gray-400 font-mono">{market.userUpStake.toFixed(2)} USDT</span>
                        </div>
                        {market.canChickenOut && (
                          <button onClick={() => handleWithdraw('UP')} className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-[9px] font-bold uppercase hover:bg-yellow-500/30 transition">
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
                          <span className="text-xs text-gray-400 font-mono">{market.userDownStake.toFixed(2)} USDT</span>
                        </div>
                        {market.canChickenOut && (
                          <button onClick={() => handleWithdraw('DOWN')} className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-[9px] font-bold uppercase hover:bg-yellow-500/30 transition">
                            <AlertTriangle className="w-3 h-3" />
                            Withdraw ({(market.userDownStake * (market.phase === 'OPEN' ? 1 : 0.8)).toFixed(2)})
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {market.canBet && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Stake</span>
                    <input type="number" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} className="w-24 bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:border-[#D9C5A0]" />
                    {[1, 5, 10].map(amt => (
                      <button key={amt} onClick={() => setStakeAmount(String(amt))} className={'px-2 py-1 rounded text-[10px] font-bold transition ' + (stakeAmount === String(amt) ? 'bg-[#D9C5A0] text-black' : 'bg-[#1a1a1a] text-gray-400')}>{amt}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={(e) => handleBet('UP', parseFloat(stakeAmount) || 1, e)} className="py-3 rounded-xl text-sm font-black uppercase tracking-widest border border-[#1F1F1F] bg-[#1a1a1a] text-green-400 hover:border-green-500/50 hover:bg-green-500/10 transition flex items-center justify-center gap-2">
                      <TrendingUp className="w-4 h-4" /> UP
                    </button>
                    <button onClick={(e) => handleBet('DOWN', parseFloat(stakeAmount) || 1, e)} className="py-3 rounded-xl text-sm font-black uppercase tracking-widest border border-[#1F1F1F] bg-[#1a1a1a] text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition flex items-center justify-center gap-2">
                      <TrendingDown className="w-4 h-4" /> DOWN
                    </button>
                  </div>
                </div>
              )}

              {market.phase === 'RESOLVED' && market.resolution && (
                <div className="bg-gray-500/10 rounded-xl p-4 text-center">
                  {market.resolution === 'UP' ? <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" /> : <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />}
                  <p className="text-sm font-bold text-gray-300">{market.resolution} Won</p>
                </div>
              )}
            </>
          )}

          {detailTab === 'duels' && (
            <div className="space-y-4">
              <div className="bg-[#0a0a0a] rounded-xl p-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                  <Swords className="w-3 h-3" /> Create Challenge
                </h4>
                <div className="flex items-center gap-2">
                  <input readOnly value={duelLink} className="flex-1 bg-[#111] border border-[#1F1F1F] text-gray-400 rounded-lg px-3 py-2 text-xs font-mono truncate" />
                  <button onClick={() => { navigator.clipboard.writeText(duelLink) }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#D9C5A0] text-black text-xs font-bold hover:bg-[#c4b18f] transition">
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
                <p className="text-[9px] text-gray-600 mt-2">Share this link. If unmatched by lock time, House matches at 0.75 odds.</p>
              </div>

              <div className="bg-[#0a0a0a] rounded-xl p-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Open Challenges
                </h4>
                <div className="space-y-2">
                  {['0x1a2b...3c4d', '0x5e6f...7a8b'].map((addr, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#111] border border-[#1F1F1F] rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className={'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ' + (i === 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                          {i === 0 ? 'UP' : 'DN'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{addr}</p>
                          <p className="text-[9px] text-gray-500">{(i + 1) * 5} USDT</p>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 rounded-lg bg-[#D9C5A0] text-black text-[10px] font-bold hover:bg-[#c4b18f] transition">Accept</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                <p className="text-[10px] text-yellow-400 font-bold flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> House Match Rule
                </p>
                <p className="text-[9px] text-gray-400 mt-1">Unmatched duels are auto-matched by House at 0.75 odds at lock time.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick || (() => setShowDetail(true))}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={'bg-[#111] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-[#D9C5A0]/40 relative ' + pc.border}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a0a] border-b border-[#1F1F1F]">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[10px] font-bold text-gray-500 uppercase">{coin}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-white">${formatPrice(market.livePrice, instrumentId)}</span>
          <span className="text-[10px] font-mono text-[#D9C5A0]">{timeStr}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className={'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ' + (
            pc.color === 'green' ? 'bg-green-500/20 text-green-400' :
            pc.color === 'red' ? 'bg-red-500/20 text-red-400' :
            pc.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-gray-500/20 text-gray-400'
          )}>
            {pc.badge}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span className="text-green-400 font-bold">UP {upPct}%</span>
            <span className="text-red-400 font-bold">DOWN {downPct}%</span>
          </div>
          <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden flex">
            <div className="bg-green-500 transition-all duration-500" style={{ width: upPct + '%' }} />
            <div className="bg-red-500 transition-all duration-500" style={{ width: downPct + '%' }} />
          </div>
          <p className="text-[10px] text-gray-600 mt-1 text-center">Pool: {totalPool.toFixed(1)} USDT</p>
        </div>

        {market.strikePrice && (
          <div className="flex items-center justify-center gap-2 py-2 bg-red-500/5 rounded-lg border border-red-500/20">
            <Lock className="w-3 h-3 text-red-400" />
            <span className="text-xs font-mono font-bold text-red-400">Strike: ${formatPrice(market.strikePrice, instrumentId)}</span>
          </div>
        )}

        {(market.userUpStake > 0 || market.userDownStake > 0) && (
          <div className="mt-2 flex items-center gap-2">
            {market.userUpStake > 0 && (
              <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">UP {market.userUpStake.toFixed(1)}</span>
            )}
            {market.userDownStake > 0 && (
              <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">DOWN {market.userDownStake.toFixed(1)}</span>
            )}
          </div>
        )}

        {market.canChickenOut && (
          <button onClick={(e) => { e.stopPropagation(); handleWithdraw('UP'); if (market.userDownStake > 0) handleWithdraw('DOWN') }} className="w-full mt-2 py-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 text-[10px] font-bold uppercase hover:bg-yellow-500/20 transition flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Chicken Out &mdash; {market.chickenOutRefund.toFixed(2)} USDT
          </button>
        )}

        <button onClick={(e) => { e.stopPropagation(); setShowDetail(true) }} className="w-full mt-2 py-2 rounded-lg border border-[#1F1F1F] bg-[#0a0a0a] text-gray-400 text-[10px] font-bold uppercase hover:text-white hover:border-[#D9C5A0]/50 transition flex items-center justify-center gap-1.5">
          <Swords className="w-3 h-3" />
          View Details &amp; Duels
        </button>
      </div>

      <AnimatePresence>
        {floatingBets.map(bet => (
          <motion.div key={bet.id} initial={{ opacity: 1, y: bet.y }} animate={{ opacity: 0, y: bet.y - 40 }} exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }} className="fixed pointer-events-none z-50" style={{ left: bet.x - 30 }}>
            <span className="text-sm font-bold text-green-400 font-mono">+{bet.amount} USDT</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
