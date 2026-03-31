import React, { useState, useEffect } from 'react'

export function getCycleInfo(now = new Date()) {
  const mins = now.getMinutes()
  const secs = now.getSeconds()
  const cycleStartMin = Math.floor(mins / 10) * 10
  const cycleEndMin = cycleStartMin + 10
  const betWindowEnd = cycleStartMin + 5

  let nextCycleMin = cycleEndMin
  let nextCycleHour = now.getHours()
  if (nextCycleMin >= 60) {
    nextCycleMin = 0
    nextCycleHour = (nextCycleHour + 1) % 24
  }

  const openMarketLabel = `${String(now.getHours()).padStart(2, '0')}:${String(cycleStartMin).padStart(2, '0')}`
  const sweatMarketLabel = `${String(now.getHours()).padStart(2, '0')}:${String(betWindowEnd).padStart(2, '0')}`

  const cycleEnd = new Date(now)
  cycleEnd.setHours(nextCycleHour, nextCycleMin, 0, 0)
  const msToEnd = cycleEnd.getTime() - now.getTime()
  const minsLeft = Math.floor(msToEnd / 60000)
  const secsLeft = Math.floor((msToEnd % 60000) / 1000)

  const betWindowClose = new Date(now)
  betWindowClose.setHours(now.getHours(), betWindowEnd, 0, 0)
  const msToBetClose = betWindowClose.getTime() - now.getTime()
  const betMinsLeft = Math.max(0, Math.floor(msToBetClose / 60000))
  const betSecsLeft = Math.max(0, Math.floor((msToBetClose % 60000) / 1000))

  const isBetWindowOpen = mins < betWindowEnd
  const isBetWindowClosed = mins >= betWindowEnd
  const progressPercent = isBetWindowOpen
    ? ((mins - cycleStartMin) * 60 + secs) / 300 * 100
    : 100

  return {
    openMarketLabel,
    sweatMarketLabel,
    minsLeft,
    secsLeft,
    betMinsLeft,
    betSecsLeft,
    isBetWindowOpen,
    isBetWindowClosed,
    progressPercent,
    cycleStartMin,
    betWindowEnd,
    cycleEndMin,
    nextCycleHour,
    nextCycleMin,
  }
}

export default function MarketTimer({ compact = false }) {
  const [cycle, setCycle] = useState(getCycleInfo())

  useEffect(() => {
    const interval = setInterval(() => setCycle(getCycleInfo()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
        cycle.isBetWindowOpen
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-red-500/20 text-red-400 border border-red-500/30'
      }`}>
        <div className={`w-2 h-2 rounded-full ${cycle.isBetWindowOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
        {cycle.isBetWindowOpen
          ? `${cycle.betMinsLeft}:${String(cycle.betSecsLeft).padStart(2, '0')} to lock`
          : `LOCKED ${cycle.minsLeft}:${String(Math.abs(cycle.secsLeft)).padStart(2, '0')}`
        }
      </div>
    )
  }

  return (
    <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Market Cycle</span>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
          cycle.isBetWindowOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${cycle.isBetWindowOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          {cycle.isBetWindowOpen ? 'BETS OPEN' : 'BETS CLOSED'}
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[9px] text-gray-600 uppercase font-bold">Open Market</p>
          <p className="text-lg font-black text-green-400 font-mono">{cycle.openMarketLabel}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-gray-600 uppercase font-bold">Cycle Ends</p>
          <p className="text-lg font-black text-white font-mono">
            {String(cycle.nextCycleHour).padStart(2, '0')}:{String(cycle.nextCycleMin).padStart(2, '0')}
          </p>
        </div>
        <div>
          <p className="text-[9px] text-gray-600 uppercase font-bold">Sweating</p>
          <p className="text-lg font-black text-yellow-400 font-mono">{cycle.sweatMarketLabel}</p>
        </div>
      </div>

      <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            cycle.isBetWindowOpen ? 'bg-green-500' : 'bg-red-500'
          }`}
          style={{ width: `${cycle.progressPercent}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-gray-500 font-bold">
        <span>Open :{String(cycle.cycleStartMin).padStart(2, '0')}</span>
        <span>Locks :{String(cycle.betWindowEnd).padStart(2, '0')}</span>
        <span>Resolves :{String(cycle.cycleEndMin).padStart(2, '0')}</span>
      </div>
    </div>
  )
}
