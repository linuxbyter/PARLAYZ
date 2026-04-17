'use client'

import { useMemo } from 'react'

interface PoolBet {
  outcomeIndex: number
  amount: number
}

interface ParimutuelGraphProps {
  bets: PoolBet[]
  outcomes: string[]
  height?: number
  animated?: boolean
}

export default function ParimutuelGraph({ bets, outcomes, height = 280, animated = true }: ParimutuelGraphProps) {
  const { probabilities, totalPool, outcomeVolumes, impliedOdds } = useMemo(() => {
    const totalPool = bets.reduce((sum, b) => sum + b.amount, 0)
    const outcomeVolumes = outcomes.map((_, idx) =>
      bets.filter(b => b.outcomeIndex === idx).reduce((sum, b) => sum + b.amount, 0)
    )
    const probabilities = outcomeVolumes.map(vol =>
      totalPool === 0 ? 100 / outcomes.length : (vol / totalPool) * 100
    )
    const impliedOdds = outcomeVolumes.map(vol =>
      vol === 0 ? 0 : totalPool / vol
    )
    return { probabilities, totalPool, outcomeVolumes, impliedOdds }
  }, [bets, outcomes])

  const maxProb = Math.max(...probabilities, 1)
  const svgHeight = height
  const svgWidth = 600
  const padding = { top: 30, right: 20, bottom: 50, left: 50 }
  const chartW = svgWidth - padding.left - padding.right
  const chartH = svgHeight - padding.top - padding.bottom

  const barWidth = Math.min(80, (chartW / outcomes.length) * 0.6)
  const barGap = (chartW - barWidth * outcomes.length) / (outcomes.length + 1)

  const gridLines = [0, 25, 50, 75, 100]

  const colors = ['#D9C5A0', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full"
        style={{ maxHeight: height }}
      >
        {/* Grid lines */}
        {gridLines.map(pct => {
          const y = padding.top + chartH - (pct / 100) * chartH
          return (
            <g key={pct}>
              <line
                x1={padding.left}
                y1={y}
                x2={svgWidth - padding.right}
                y2={y}
                stroke="#1F1F1F"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fill="#666"
                fontSize="10"
                fontFamily="monospace"
              >
                {pct}%
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {probabilities.map((prob, idx) => {
          const barH = (prob / 100) * chartH
          const x = padding.left + barGap + idx * (barWidth + barGap)
          const y = padding.top + chartH - barH
          const color = colors[idx % colors.length]

          return (
            <g key={idx}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, 2)}
                fill={color}
                opacity="0.85"
                rx="4"
                className={animated ? 'transition-all duration-700 ease-out' : ''}
              />

              {/* Probability label on top of bar */}
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {prob.toFixed(1)}%
              </text>

              {/* Implied odds */}
              <text
                x={x + barWidth / 2}
                y={y - 22}
                textAnchor="middle"
                fill="#888"
                fontSize="9"
                fontFamily="monospace"
              >
                {impliedOdds[idx].toFixed(2)}x
              </text>

              {/* Outcome label */}
              <text
                x={x + barWidth / 2}
                y={padding.top + chartH + 20}
                textAnchor="middle"
                fill="#ccc"
                fontSize="11"
                fontWeight="bold"
              >
                {outcomes[idx]}
              </text>

              {/* Volume label */}
              <text
                x={x + barWidth / 2}
                y={padding.top + chartH + 36}
                textAnchor="middle"
                fill="#666"
                fontSize="9"
                fontFamily="monospace"
              >
                {outcomeVolumes[idx].toFixed(2)} USDT / {(outcomeVolumes[idx] * 129.5).toFixed(0)} KSH
              </text>
            </g>
          )
        })}

        {/* Y-axis label */}
        <text
          x={12}
          y={padding.top + chartH / 2}
          textAnchor="middle"
          fill="#555"
          fontSize="9"
          fontWeight="bold"
          transform={`rotate(-90, 12, ${padding.top + chartH / 2})`}
        >
          POOL SHARE %
        </text>
      </svg>

      {/* Pool summary */}
      <div className="flex items-center justify-between px-2 py-2 text-xs text-gray-500 border-t border-[#1F1F1F]">
        <span>Total Pool: <span className="text-white font-mono font-bold">{totalPool.toFixed(2)} USDT / {(totalPool * 129.5).toFixed(0)} KSH</span></span>
        <span>Outcomes: <span className="text-white font-bold">{outcomes.length}</span></span>
      </div>
    </div>
  )
}
