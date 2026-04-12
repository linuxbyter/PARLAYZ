'use client'

import Header from '@/src/components/Header'
import BottomNav from '@/src/components/BottomNav'
import { Search as SearchIcon, TrendingUp, TrendingDown, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface SearchResult {
  id: string
  question: string
  category: string
  yesPrice: number
  noPrice: number
  volume: number
  trend: number
  status: 'OPEN' | 'LOCKED' | 'RESOLVED'
}

const MOCK_RESULTS: SearchResult[] = [
  { id: 'btc-50k', question: 'Will BTC reach $50K by Friday?', category: 'CRYPTO', yesPrice: 68, noPrice: 32, volume: 45200, trend: 5.2, status: 'OPEN' },
  { id: 'eth-upgrade', question: 'Will ETH complete network upgrade?', category: 'CRYPTO', yesPrice: 45, noPrice: 55, volume: 28400, trend: -2.1, status: 'OPEN' },
  { id: 'kcse-release', question: 'Will KCSE results release this month?', category: 'KENYA', yesPrice: 72, noPrice: 28, volume: 18900, trend: 8.4, status: 'OPEN' },
  { id: 'safcom-q4', question: 'Safaricom Q4 revenue above KSh 30B?', category: 'TECH', yesPrice: 55, noPrice: 45, volume: 15600, trend: 1.2, status: 'OPEN' },
]

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = (q: string) => {
    setQuery(q)
    if (q.length > 1) {
      setResults(MOCK_RESULTS.filter(r => r.question.toLowerCase().includes(q.toLowerCase())))
      setHasSearched(true)
    } else {
      setResults([])
      setHasSearched(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      <Header />
      
      <main className="max-w-2xl mx-auto px-4 py-4">
        <div className="relative mb-6">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B8B8B]" />
          <input
            type="text"
            placeholder="Search markets..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-[#141414] border border-[#222222] rounded-xl py-3 pl-12 pr-10 text-white placeholder-[#8B8B8B] focus:border-[#C9A84C] focus:outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => handleSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-[#8B8B8B]" />
            </button>
          )}
        </div>

        {!hasSearched ? (
          <div className="text-center py-12">
            <SearchIcon className="w-12 h-12 text-[#8B8B8B] mx-auto mb-4" />
            <p className="text-[#8B8B8B]">Search for markets by name or category</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#8B8B8B]">No markets found for &ldquo;{query}&rdquo;</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map(result => (
              <Link key={result.id} href={`/market/${result.id}`}>
                <div className="bg-[#141414] border border-[#222222] rounded-xl p-4 hover:border-[#C9A84C]/50 transition">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-[#1E1A0F] text-[#C9A84C] text-[10px] font-bold px-2 py-0.5 rounded border border-[#C9A84C]/30">
                      {result.category}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      result.status === 'OPEN' ? 'bg-[#1E3D2F] text-[#4CAF7D]' :
                      result.status === 'LOCKED' ? 'bg-[#1E1A0F] text-[#C9A84C]' :
                      'bg-[#3D1E1E] text-[#E05252]'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  
                  <p className="text-white font-semibold mb-3">{result.question}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <div>
                        <div className="text-[10px] text-[#8B8B8B]">YES</div>
                        <div className="text-sm font-bold text-[#4CAF7D]">{result.yesPrice}¢</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8B8B8B]">NO</div>
                        <div className="text-sm font-bold text-[#E05252]">{result.noPrice}¢</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 text-xs font-bold ${result.trend > 0 ? 'text-[#4CAF7D]' : 'text-[#E05252]'}`}>
                        {result.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {result.trend > 0 ? '+' : ''}{result.trend}%
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}