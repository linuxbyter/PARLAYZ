import React, { useState, useEffect } from 'react'
import { getCycleInfo } from './MarketTimer'

export default function MarketStatus({ marketId, onStatusChange }) {
  const [status, setStatus] = useState('open')
  const [countdown, setCountdown] = useState('')
  const [price, setPrice] = useState(null)
  const [priceChange, setPriceChange] = useState(0)
  const [prevPrice, setPrevPrice] = useState(null)

  useEffect(() => {
    const update = () => {
      const cycle = getCycleInfo()
      if (cycle.isBetWindowOpen) {
        setStatus('open')
        setCountdown(`${cycle.betMinsLeft}:${String(cycle.betSecsLeft).padStart(2, '0')} until lock`)
      } else {
        setStatus('locked')
        setCountdown(`${cycle.minsLeft}:${String(cycle.secsLeft).padStart(2, '0')} until resolve`)
      }
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
        const data = await res.json()
        const newPrice = parseFloat(data.price)
        setPrevPrice(price)
        setPrice(newPrice)
        if (prevPrice) {
          setPriceChange(((newPrice - prevPrice) / prevPrice) * 100)
        }
      } catch (e) {}
    }
    fetchPrice()
    const interval = setInterval(fetchPrice, 3000)
    return () => clearInterval(interval)
  }, [price, prevPrice])

  useEffect(() => {
    if (onStatusChange) onStatusChange(status)
  }, [status, onStatusChange])

  const statusConfig = {
    open: {
      label: 'OPEN',
      emoji: '🟢',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      dot: 'bg-green-400',
    },
    locked: {
      label: 'LOCKED',
      emoji: '⛔',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      dot: 'bg-red-400',
    },
    resolving: {
      label: 'RESOLVING',
      emoji: '⏳',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      dot: 'bg-yellow-400',
    },
  }

  const config = statusConfig[status]

  return (
    <div className={`${config.bg} ${config.border} border rounded-2xl p-4 mb-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.emoji}</span>
          <span className={`text-sm font-black uppercase tracking-widest ${config.text}`}>
            {config.label}
          </span>
          <div className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
        </div>
        <span className="text-xs font-mono text-gray-400">{countdown}</span>
      </div>

      {price && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <div>
            <p className="text-[9px] text-gray-600 uppercase font-bold">BTC/USDT</p>
            <p className="text-xl font-black text-white font-mono">
              ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className={`text-right ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <p className="text-[9px] text-gray-600 uppercase font-bold">Change</p>
            <p className="text-sm font-bold font-mono">
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(3)}%
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
