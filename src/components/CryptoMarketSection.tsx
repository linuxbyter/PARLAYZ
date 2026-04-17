'use client'

import { useState, useEffect, useRef } from 'react'
import { CryptoMarketCard } from './CryptoMarketCard'
import { INSTRUMENTS, INSTRUMENT_TABS, VOLATILITY, type InstrumentCategory } from '@/src/lib/instruments'

interface InstrumentFeed {
  livePrice: number
  priceHistory: { time: number; price: number }[]
}

interface CryptoMarketSectionProps {
  category?: InstrumentCategory | 'all'
}

export const CryptoMarketSection: React.FC<CryptoMarketSectionProps> = ({ category = 'all' }) => {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleInstruments.map(inst => {
          const feed = feeds[inst.id]
          if (!feed) return null

          return (
            <CryptoMarketCard
              key={inst.id}
              instrumentId={inst.id}
              coin={inst.label}
              initialPrice={inst.initialPrice}
              livePrice={feed.livePrice}
              priceHistory={feed.priceHistory}
            />
          )
        })}
      </div>
    </div>
  )
}
