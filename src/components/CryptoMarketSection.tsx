'use client'

import { useState, useEffect } from 'react'
import { CryptoMarketCard } from './CryptoMarketCard'

const SLOT_MS = 5 * 60 * 1000

function getCurrentSlot(): number {
  return Math.floor(Date.now() / SLOT_MS)
}

interface CryptoMarketSectionProps {
  coin: string
  initialPrice: number
}

export const CryptoMarketSection: React.FC<CryptoMarketSectionProps> = ({ coin, initialPrice }) => {
  const [currentSlot, setCurrentSlot] = useState(getCurrentSlot())
  const [livePrice, setLivePrice] = useState(initialPrice)
  const [priceHistory, setPriceHistory] = useState<{ time: number; price: number }[]>([])

  useEffect(() => {
    const tick = setInterval(() => {
      const slot = getCurrentSlot()
      setCurrentSlot(prev => (slot !== prev ? slot : prev))
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setLivePrice(prev => {
        const next = parseFloat((prev + (Math.random() - 0.495) * 150).toFixed(2))
        setPriceHistory(h => [...h.slice(-99), { time: Date.now(), price: next }])
        return next
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const lockedSlot = currentSlot - 1

  return (
    <div className="flex flex-col gap-4">
      <CryptoMarketCard
        key={`locked-${lockedSlot}`}
        slot={lockedSlot}
        phase="LOCKED"
        coin={coin}
        initialPrice={initialPrice}
        livePrice={livePrice}
        priceHistory={priceHistory}
      />
      <CryptoMarketCard
        key={`open-${currentSlot}`}
        slot={currentSlot}
        phase="OPEN"
        coin={coin}
        initialPrice={initialPrice}
        livePrice={livePrice}
        priceHistory={priceHistory}
      />
    </div>
  )
}
