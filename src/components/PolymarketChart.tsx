'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

interface PricePoint {
  time: number
  price: number
}

interface PolymarketChartProps {
  priceHistory: PricePoint[]
  currentPrice: number
  height?: number
}

const TIME_FILTERS = [
  { label: '1H', hours: 1 },
  { label: '6H', hours: 6 },
  { label: '1D', hours: 24 },
  { label: '1W', hours: 168 },
  { label: 'ALL', hours: null },
]

export default function PolymarketChart({ priceHistory, currentPrice, height = 250 }: PolymarketChartProps) {
  const [timeFilter, setTimeFilter] = useState<number | null>(null)

  const filteredData = useMemo(() => {
    if (!timeFilter) return priceHistory
    const cutoff = Date.now() - timeFilter * 60 * 60 * 1000
    return priceHistory.filter(p => p.time >= cutoff)
  }, [priceHistory, timeFilter])

  const chartWidth = 600
  const chartHeight = height - 60
  const padding = { top: 20, right: 20, bottom: 30, left: 50 }

  const minPrice = 0
  const maxPrice = 100

  const points = useMemo(() => {
    if (filteredData.length === 0) return ''
    const xScale = (chartWidth - padding.left - padding.right) / (filteredData.length - 1 || 1)
    const yScale = (chartHeight - padding.top - padding.bottom) / (maxPrice - minPrice)
    
    return filteredData.map((p, i) => {
      const x = padding.left + i * xScale
      const y = chartHeight - padding.bottom - (p.price - minPrice) * yScale
      return `${x},${y}`
    }).join(' ')
  }, [filteredData, chartHeight])

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="w-full">
      {/* Time Filters */}
      <div className="flex items-center gap-1 mb-4">
        {TIME_FILTERS.map(filter => (
          <button
            key={filter.label}
            onClick={() => setTimeFilter(filter.hours)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              timeFilter === filter.hours
                ? 'bg-[#C9A84C] text-black'
                : 'text-[#8B8B8B] hover:text-white hover:bg-[#141414]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Current Probability */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[#8B8B8B] text-sm">Current Probability</span>
          <div className="text-3xl font-black text-white">{currentPrice.toFixed(0)}%</div>
        </div>
        <div className="text-xs text-[#8B8B8B]">chance</div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height }}>
        <svg viewBox={`0 0 ${chartWidth} ${height}`} className="w-full h-full">
          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map(val => {
            const y = chartHeight - padding.bottom - (val / 100) * (chartHeight - padding.top - padding.bottom)
            return (
              <g key={val}>
                <text x={padding.left - 10} y={y + 4} className="text-xs fill-[#555555]" textAnchor="end">
                  {val}%
                </text>
                {val === 50 && (
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke="#333333"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                )}
              </g>
            )
          })}

          {/* Line */}
          {filteredData.length > 0 && (
            <motion.polyline
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
              points={points}
              fill="none"
              stroke="#C9A84C"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* End dot */}
          {filteredData.length > 0 && (() => {
            const lastPoint = filteredData[filteredData.length - 1]
            const xScale = (chartWidth - padding.left - padding.right) / (filteredData.length - 1 || 1)
            const yScale = (chartHeight - padding.top - padding.bottom) / (maxPrice - minPrice)
            const x = padding.left + (filteredData.length - 1) * xScale
            const y = chartHeight - padding.bottom - (lastPoint.price - minPrice) * yScale
            return (
              <g>
                <circle cx={x} cy={y} r="6" fill="#0a0a0a" stroke="#C9A84C" strokeWidth="2" />
                <circle cx={x} cy={y} r="3" fill="#C9A84C" />
              </g>
            )
          })()}
        </svg>
      </div>
    </div>
  )
}