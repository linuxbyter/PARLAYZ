'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface PricePoint {
  time: number
  price: number
}

interface LivePriceChartProps {
  symbol?: string
  strikePrice?: number
  height?: number
  width?: string
  phase: 'boarding' | 'locked' | 'settled'
  onPriceUpdate?: (price: number) => void
}

export default function LivePriceChart({
  symbol = 'BTCUSDT',
  strikePrice,
  height = 200,
  width = '100%',
  phase,
  onPriceUpdate,
}: LivePriceChartProps) {
  const [prices, setPrices] = useState<PricePoint[]>([])
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [prevPrice, setPrevPrice] = useState<number | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const price = parseFloat(data.p)
      const time = Date.now()

      setPrevPrice(currentPrice)
      setCurrentPrice(price)
      setPrices(prev => {
        const next = [...prev, { time, price }]
        return next.slice(-120)
      })
      if (onPriceUpdate) onPriceUpdate(price)
    }

    ws.onerror = () => {}
    ws.onclose = () => {
      setTimeout(connect, 3000)
    }
  }, [symbol, currentPrice, onPriceUpdate])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
    }
  }, [connect])

  const priceChange = prevPrice && currentPrice ? currentPrice - prevPrice : 0
  const isUp = priceChange >= 0

  if (prices.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="w-6 h-6 border-2 border-[#D9C5A0]/30 border-t-[#D9C5A0] rounded-full animate-spin" />
      </div>
    )
  }

  const minPrice = Math.min(...prices.map(p => p.price))
  const maxPrice = Math.max(...prices.map(p => p.price))
  const priceRange = maxPrice - minPrice || 1
  const padding = priceRange * 0.1

  const chartMin = minPrice - padding
  const chartMax = maxPrice + padding
  const chartRange = chartMax - chartMin

  const svgW = 600
  const svgH = height
  const padL = 10
  const padR = 10
  const padT = 20
  const padB = 20
  const drawW = svgW - padL - padR
  const drawH = svgH - padT - padB

  const points = prices.map((p, i) => {
    const x = padL + (i / (prices.length - 1 || 1)) * drawW
    const y = padT + drawH - ((p.price - chartMin) / chartRange) * drawH
    return { x, y, price: p.price }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1]?.x || padL},${padT + drawH} L${points[0]?.x || padL},${padT + drawH} Z`

  const strikeY = strikePrice
    ? padT + drawH - ((strikePrice - chartMin) / chartRange) * drawH
    : null

  const currentY = points.length > 0 ? points[points.length - 1].y : padT + drawH / 2

  return (
    <div ref={containerRef} className="relative" style={{ width }}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = padT + drawH * (1 - frac)
          const price = chartMin + chartRange * frac
          return (
            <g key={frac}>
              <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#1F1F1F" strokeWidth="1" />
              <text x={svgW - padR + 2} y={y + 3} fill="#555" fontSize="8" fontFamily="monospace">
                {price.toFixed(0)}
              </text>
            </g>
          )
        })}

        {/* Strike price line */}
        {strikeY !== null && (
          <g>
            <line
              x1={padL}
              y1={strikeY}
              x2={svgW - padR}
              y2={strikeY}
              stroke="#D9C5A0"
              strokeWidth="1.5"
              strokeDasharray="6,4"
            />
            <rect x={padL} y={strikeY - 8} width="60" height="16" rx="3" fill="#D9C5A0" />
            <text x={padL + 30} y={strikeY + 3} textAnchor="middle" fill="#0D0D0D" fontSize="8" fontWeight="bold" fontFamily="monospace">
              STRIKE
            </text>
          </g>
        )}

        {/* Area fill */}
        <path d={areaPath} fill="url(#priceGradient)" />

        {/* Price line */}
        <path
          d={linePath}
          fill="none"
          stroke={isUp ? '#22c55e' : '#ef4444'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current price dot */}
        {points.length > 0 && (
          <g>
            <circle cx={points[points.length - 1].x} cy={currentY} r="4" fill={isUp ? '#22c55e' : '#ef4444'}>
              <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={points[points.length - 1].x} cy={currentY} r="8" fill={isUp ? '#22c55e' : '#ef4444'} opacity="0.2">
              <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* Phase indicator */}
        {phase === 'locked' && (
          <text x={svgW / 2} y={padT + 12} textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">
            ⛔ LOCKED
          </text>
        )}
        {phase === 'boarding' && (
          <text x={svgW / 2} y={padT + 12} textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">
            🟢 BOARDING
          </text>
        )}
        {phase === 'settled' && (
          <text x={svgW / 2} y={padT + 12} textAnchor="middle" fill="#888" fontSize="10" fontWeight="bold">
            ✅ SETTLED
          </text>
        )}
      </svg>

      {/* Current price badge */}
      {currentPrice && (
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold font-mono ${
          isUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          {priceChange !== 0 && (
            <span className="ml-1">{priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}</span>
          )}
        </div>
      )}
    </div>
  )
}
