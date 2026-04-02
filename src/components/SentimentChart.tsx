'use client'

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format } from 'date-fns'

interface PoolWeightData {
  time: number
  upPct: number
}

interface SentimentChartProps {
  data: PoolWeightData[]
  height?: number
  frozen?: boolean
}

export const SentimentChart: React.FC<SentimentChartProps> = ({ data, height = 240, frozen = false }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-[#111] rounded-2xl border border-[#1F1F1F]" style={{ height }}>
        <p className="text-xs text-gray-600">No pool data yet</p>
      </div>
    )
  }

  const chartData = data.map(d => ({
    time: d.time,
    probability: d.upPct,
    label: format(new Date(d.time), 'HH:mm'),
  }))

  const currentProb = data[data.length - 1].upPct

  return (
    <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">UP Probability</h4>
          <p className="text-2xl font-black font-mono text-[#D4AF37]">
            {currentProb.toFixed(1)}%
          </p>
        </div>
        {frozen && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
            Locked
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fill: '#555', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#555', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            width={30}
            tickFormatter={(v: number) => v + '%'}
          />
          <ReferenceLine y={50} stroke="#333" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="probability"
            stroke="#D4AF37"
            strokeWidth={2}
            fill="url(#goldGradient)"
            isAnimationActive={false}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
