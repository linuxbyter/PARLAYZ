'use client'

import { useState, useEffect, useRef } from 'react'
import { CryptoMarketCard } from './CryptoMarketCard'
import { INSTRUMENTS, INSTRUMENT_TABS, VOLATILITY, type InstrumentCategory } from '@/src/lib/instruments'

const SLOT_MS = 5 * 60 * 1000

function getCurrentSlot(): number {
  return Math.floor(Date.now() / SLOT_MS)
}

interface InstrumentFeed {
  livePrice: number
  priceHistory: { time: number; price: number }[]
}

interface CryptoMarketSectionProps {
  category?: InstrumentCategory | 'all'
}

export const CryptoMarketSection: React.FC<CryptoMarketSectionProps> = ({ category = 'all' }) => {
  const [currentSlot, setCurrentSlot] = useState(getCurrentSlot())
  const [feeds, setFeeds] = useState<Record<string, InstrumentFeed>>({})
  const [activeTab, setActiveTab] = useState<string>(category === 'all' ? 'all' : category)
  const wsRefs = useRef<Record<string, WebSocket>>({})

  const visibleInstruments = INSTRUMENTS.filter(inst =>
    activeTab === 'all' || inst.category === activeTab
  )

  useEffect(() => {
    const initial: Record<string, InstrumentFeed> = {}
    INSTRUMENTS.forEach(inst => {
      initial[inst.id] = { livePrice: inst.initialPrice, priceHistory: [] }
    })
    setFeeds(initial)
  }, [])

  useEffect(() => {
    INSTRUMENTS.forEach(inst => {
      if (!inst.hasBinance) return
      if (wsRefs.current[inst.id]?.readyState === WebSocket.OPEN) return

      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${inst.symbol.toLowerCase()}@trade`)
      wsRefs.current[inst.id] = ws

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const price = parseFloat(data.p)
          setFeeds(prev => {
            const feed = prev[inst.id]
            if (!feed) return prev
            return {
              ...prev,
              [inst.id]: {
                livePrice: price,
                priceHistory: [...feed.priceHistory.slice(-99), { time: Date.now(), price }],
              },
            }
          })
        } catch (e) {}
      }

      ws.onerror = () => {}
      ws.onclose = () => {
        setTimeout(() => {
          try {
            const newWs = new WebSocket(`wss://stream.binance.com:9443/ws/${inst.symbol.toLowerCase()}@trade`)
            newWs.onmessage = ws.onmessage
            newWs.onerror = ws.onerror
            newWs.onclose = ws.onclose
            wsRefs.current[inst.id] = newWs
          } catch (e) {}
        }, 5000)
      }
    })

    return () => {
      Object.values(wsRefs.current).forEach(ws => ws.close())
      wsRefs.current = {}
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setFeeds(prev => {
        const next = { ...prev }
        INSTRUMENTS.forEach(inst => {
          if (inst.hasBinance) return
          const feed = next[inst.id]
          if (!feed) return
          const vol = VOLATILITY[inst.id] ?? 0.001
          const pct = (Math.random() - 0.495) * vol
          const isMeme = (inst.id as string) === 'SHIB' || (inst.id as string) === 'PEPE'
          const decimals = isMeme ? 8 : 2
          const newPrice = parseFloat((feed.livePrice * (1 + pct)).toFixed(decimals))
          next[inst.id] = {
            ...feed,
            livePrice: newPrice,
            priceHistory: [...feed.priceHistory.slice(-99), { time: Date.now(), price: newPrice }],
          }
        })
        return next
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const tick = setInterval(() => {
      const slot = getCurrentSlot()
      setCurrentSlot(prev => (slot !== prev ? slot : prev))
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  const lockedSlot = currentSlot - 1

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {INSTRUMENT_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#D9C5A0] text-black'
                : 'bg-[#111] border border-[#1F1F1F] text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {visibleInstruments.map(inst => {
        const feed = feeds[inst.id]
        if (!feed) return null

        return (
          <div key={inst.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{inst.label}</h3>
              <span className="text-xs font-mono text-gray-500">
                ${feed.livePrice.toLocaleString('en-US', {
                  minimumFractionDigits: inst.id === 'SHIB' || inst.id === 'PEPE' ? 8 : 2,
                  maximumFractionDigits: inst.id === 'SHIB' || inst.id === 'PEPE' ? 8 : 2,
                })}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <CryptoMarketCard
                key={`locked-${inst.id}-${lockedSlot}`}
                slot={lockedSlot}
                phase="LOCKED"
                coin={inst.label}
                instrumentId={inst.id}
                initialPrice={inst.initialPrice}
                livePrice={feed.livePrice}
                priceHistory={feed.priceHistory}
              />
              <CryptoMarketCard
                key={`open-${inst.id}-${currentSlot}`}
                slot={currentSlot}
                phase="OPEN"
                coin={inst.label}
                instrumentId={inst.id}
                initialPrice={inst.initialPrice}
                livePrice={feed.livePrice}
                priceHistory={feed.priceHistory}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
