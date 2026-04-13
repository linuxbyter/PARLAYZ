'use client'

import { CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react'

interface AccuracyStats {
  totalMarkets: number
  resolvedCorrectly: number
  disputed: number
  pendingResolution: number
  accuracyRate: number
  sources: { name: string; accuracy: number }[]
}

const stats: AccuracyStats = {
  totalMarkets: 1247,
  resolvedCorrectly: 1189,
  disputed: 23,
  pendingResolution: 35,
  accuracyRate: 95.3,
  sources: [
    { name: 'Binance API (Crypto)', accuracy: 98.2 },
    { name: 'SportRadar (Sports)', accuracy: 96.8 },
    { name: 'Polymarket (Politics)', accuracy: 94.5 },
    { name: 'Wikipedia (General)', accuracy: 89.2 },
  ],
}

export default function AccuracyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="w-8 h-8 text-[#C9A84C]" />
          <h1 className="text-2xl font-black">Platform Accuracy</h1>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#141414] border border-[#222222] rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-[#C9A84C] mb-1">{stats.totalMarkets.toLocaleString()}</div>
            <div className="text-xs text-[#8B8B8B] uppercase tracking-wider">Total Markets</div>
          </div>
          <div className="bg-[#141414] border border-[#222222] rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-[#4CAF7D] mb-1">{stats.accuracyRate}%</div>
            <div className="text-xs text-[#8B8B8B] uppercase tracking-wider">Accuracy</div>
          </div>
          <div className="bg-[#141414] border border-[#222222] rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-[#4CAF7D] mb-1">{stats.resolvedCorrectly.toLocaleString()}</div>
            <div className="text-xs text-[#8B8B8B] uppercase tracking-wider">Resolved</div>
          </div>
          <div className="bg-[#141414] border border-[#222222] rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-[#E05252] mb-1">{stats.disputed}</div>
            <div className="text-xs text-[#8B8B8B] uppercase tracking-wider">Disputed</div>
          </div>
        </div>

        {/* Resolution Sources */}
        <div className="bg-[#141414] border border-[#222222] rounded-xl overflow-hidden mb-8">
          <div className="p-4 border-b border-[#222222]">
            <h2 className="font-bold text-white">Data Sources</h2>
            <p className="text-[#8B8B8B] text-sm mt-1">Markets are resolved using these trusted sources</p>
          </div>
          
          {stats.sources.map((source, i) => (
            <div key={source.name} className="p-4 border-b border-[#222222] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#4CAF7D]" />
                <span className="text-[#8B8B8B]">{source.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-[#222222] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#C9A84C]" 
                    style={{ width: `${source.accuracy}%` }}
                  />
                </div>
                <span className="font-bold text-[#C9A84C]">{source.accuracy}%</span>
              </div>
            </div>
          ))}

          <div className="p-4 flex items-center gap-3 text-[#8B8B8B]">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{stats.pendingResolution} markets pending resolution</span>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-[#141414] border border-[#222222] rounded-xl p-6">
          <h2 className="font-bold text-white mb-4">How Resolution Works</h2>
          <div className="space-y-4 text-[#8B8B8B] text-sm">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#C9A84C] text-black font-bold text-xs flex items-center justify-center shrink-0">1</div>
              <p>Market creator sets resolution source when creating the market</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#C9A84C] text-black font-bold text-xs flex items-center justify-center shrink-0">2</div>
              <p>At market close, our system automatically queries the specified API</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#C9A84C] text-black font-bold text-xs flex items-center justify-center shrink-0">3</div>
              <p>Result is verified and displayed to all participants</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#C9A84C] text-black font-bold text-xs flex items-center justify-center shrink-0">4</div>
              <p>Winnings are automatically distributed to winning positions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}