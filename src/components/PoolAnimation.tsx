'use client'

import { useState, useEffect } from 'react'

interface PoolEvent {
  id: number
  amount: number
  timestamp: number
}

interface PoolAnimationProps {
  totalPool: number
  currency?: string
  newBets?: { amount: number; timestamp: number }[]
}

export default function PoolAnimation({ totalPool, currency = 'USDT', newBets = [] }: PoolAnimationProps) {
  const [floatingEvents, setFloatingEvents] = useState<PoolEvent[]>([])

  useEffect(() => {
    newBets.forEach(bet => {
      const id = Date.now() + Math.random()
      setFloatingEvents(prev => [...prev, { id, amount: bet.amount, timestamp: bet.timestamp }])
      setTimeout(() => {
        setFloatingEvents(prev => prev.filter(e => e.id !== id))
      }, 2000)
    })
  }, [newBets])

  return (
    <div className="relative inline-block">
      <span className="text-white font-mono font-bold">
        {totalPool.toFixed(2)} {currency}
      </span>

      {floatingEvents.map(event => (
        <span
          key={event.id}
          className="absolute left-1/2 -translate-x-1/2 -top-6 text-xs font-bold text-green-400 font-mono pointer-events-none"
          style={{
            animation: 'floatUp 2s ease-out forwards',
          }}
        >
          +{event.amount.toFixed(2)} {currency}
        </span>
      ))}

      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-30px);
          }
        }
      `}</style>
    </div>
  )
}
