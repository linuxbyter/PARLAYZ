'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'

interface PoolWeightData {
  time: number
  upPct: number
  downPct: number
}

interface SentimentChartProps {
  data: PoolWeightData[]
  height?: number
}

export const SentimentChart: React.FC<SentimentChartProps> = ({ data, height = 200 }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-[#0a0a0a] rounded-xl" style={{ height }}>
        <p className="text-xs text-gray-600">No pool data yet</p>
      </div>
    )
  }

  const chartData = data.map(d => ({
    time: d.time,
    'UP %': d.upPct,
    'DOWN %': d.downPct,
    label: format(new Date(d.time), 'HH:mm'),
  }))

  return (
    <div className="bg-[#0a0a0a] rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Pool Sentiment</h4>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] text-gray-400 font-bold">UP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] text-gray-400 font-bold">DOWN</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="upGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="downGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fill: '#555', fontSize: 9 }}
            axisLine={{ stroke: '#1F1F1F' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#555', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              background: '#111',
              border: '1px solid #1F1F1F',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            labelStyle={{ color: '#888' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: unknown) => [`${Number(value || 0).toFixed(1)}%`]}
          />
          <ReferenceLine y={50} stroke="#333" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="UP %"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#upGradient)"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="DOWN %"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#downGradient)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
