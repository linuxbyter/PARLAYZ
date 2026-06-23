'use client'

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface BettingTrendData {
  time: number
  homePercentage: number
}

interface SportsChartProps {
  data: BettingTrendData[]
  height?: number
}

export const SportsChart: React.FC<SportsChartProps> = ({ data, height = 200 }) => {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-[#111] rounded-2xl border border-[#2D2D2D]" style={{ height }}>
        <div className="w-12 h-12">
          <span className="w-6 h-6">📊</span>
        </div>
        <p className="text-xs text-gray-500">No trend data available</p>
      </div>
    )
  }

  const chartData = data.map(d => ({
    time: d.time,
    homePercentage: d.homePercentage,
    label: format(new Date(d.time), 'HH:mm'),
  }))

  const currentHomePct = data[data.length - 1].homePercentage

  return (
    <div className="bg-[#111] border border-[#2D2D2D] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Home Team Support</h4>
          <p className="text-2xl font-black font-mono text-white">
            {currentHomePct.toFixed(1)}%
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <XAxis
            dataKey="label"
            tick={{ fill: '#777', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#777', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            width={30}
            tickFormatter={(v: number) => v + '%'}
          />
          <Area
            type="monotone"
            dataKey="homePercentage"
            stroke="#1E3A8A"
            strokeWidth={2}
            fill="#1E3A8A/10"
            isAnimationActive={false}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
