"use client"

import { useState } from "react"
import { RefreshCw, TrendingUp, Wifi } from "lucide-react"
import TopNav from "@/src/components/TopNav"
import BottomNav from "@/src/components/BottomNav"
import MarketCard from "@/src/components/MarketCard"
import BetSlip from "@/src/components/BetSlip"
import { cn } from "@/src/lib/utils"

const MOCK_MARKETS = [
  { id: "1", category: "Politics", question: "Will Ruto complete his term to 2027?", volume: "$1.4M", endDate: "Apr 2027", yesPrice: 74, noPrice: 26 },
  { id: "2", category: "Finance", question: "Will the Finance Bill 2026 pass in Kenya?", volume: "$920K", endDate: "Jun 21", yesPrice: 38, noPrice: 62 },
  { id: "3", category: "Crypto", question: "Will Bitcoin hit $100k before June?", volume: "$5.4M", endDate: "Jun 1", yesPrice: 65, noPrice: 35 },
  { id: "4", category: "Sports", question: "Will Arsenal finish top 4 in EPL 25/26?", volume: "$2.8M", endDate: "May 22", yesPrice: 72, noPrice: 28 },
  { id: "5", category: "Tech", question: "Will OpenAI release GPT-5 by end of 2026?", volume: "$3.2M", endDate: "Dec 2026", yesPrice: 45, noPrice: 55 },
  { id: "6", category: "Meme", question: "Will $SHIB hit $0.0001 by summer?", volume: "$890K", endDate: "Jul 2026", yesPrice: 28, noPrice: 72 },
]

type Category = "ALL" | "Politics" | "Finance" | "Crypto" | "Sports" | "Tech" | "Meme" | "Futures"

const CATEGORIES: Category[] = ["ALL", "Politics", "Finance", "Crypto", "Sports", "Tech", "Meme", "Futures"]

const CATEGORY_EMOJI: Record<string, string> = {
  ALL: "🏆", Politics: "🏛️", Finance: "💰", Crypto: "₿", 
  Sports: "⚽", Tech: "⚡", Meme: "🔥", Futures: "📈",
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<Category>("ALL")
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const filteredMarkets = activeCategory === "ALL" 
    ? MOCK_MARKETS 
    : MOCK_MARKETS.filter(m => m.category === activeCategory)

  async function handleRefresh() {
    setRefreshing(true)
    await new Promise((r) => setTimeout(r, 800))
    setLastUpdated(new Date())
    setRefreshing(false)
  }

  return (
    <div className="min-h-screen bg-[var(--black)] text-white">
      <TopNav />

      <main className="max-w-[1400px] mx-auto px-4 pb-24 md:pb-8 lg:pr-[360px]">
        <div className="py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">Markets</h1>
              <Wifi className="w-3 h-3 text-[#00D27D]" />
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[10px] font-medium text-[var(--black-dim)]">
                {filteredMarkets.length} markets
              </span>
              <span className="text-[10px] text-[var(--black-subtle)] font-mono">
                {lastUpdated.toLocaleTimeString([], {
                  hour: "2-digit", minute: "2-digit", second: "2-digit",
                })}
              </span>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg border border-[var(--black-border)] text-[var(--black-dim)] hover:text-white hover:border-[var(--black-muted)] transition-all"
          >
            <RefreshCw size={14} className={cn(refreshing && "animate-spin")} />
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide mb-5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold whitespace-nowrap transition-all shrink-0",
                activeCategory === cat
                  ? "border-[#00D27D] text-[#00D27D] bg-[#00D27D]/10"
                  : "border-[var(--black-border)] text-[var(--black-dim)] hover:border-[var(--black-muted)] hover:text-white"
              )}
            >
              <span>{CATEGORY_EMOJI[cat]}</span>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: "Total Volume", value: "$14.2M", sub: "+23.4% today" },
            { label: "Active Markets", value: filteredMarkets.length.toString(), sub: "Across all categories" },
            { label: "Avg Liquidity", value: "$45K", sub: "Per market" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-xl p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--black-dim)] mb-1">{stat.label}</p>
              <p className="text-base font-black font-mono text-white">{stat.value}</p>
              <p className="text-[9px] text-[var(--black-subtle)] font-medium mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {filteredMarkets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <TrendingUp size={32} className="text-[var(--black-muted)] mb-3" />
            <p className="text-sm text-[var(--black-dim)] font-medium">No markets available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMarkets.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        )}
      </main>

      <BetSlip />
      <BottomNav />
    </div>
  )
}