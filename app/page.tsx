"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import TopNav from "@/src/components/TopNav"
import BottomNav from "@/src/components/BottomNav"
import MarketCard from "@/src/components/MarketCard"
import BetSlip from "@/src/components/BetSlip"
import { cn } from "@/src/lib/utils"
import { MOCK_MARKETS, type MarketData } from "@/src/lib/mockMarkets"

const CATEGORIES = ["ALL", ...new Set(MOCK_MARKETS.map(m => m.sport))] as string[]

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("ALL")
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const filteredMarkets = activeCategory === "ALL"
    ? MOCK_MARKETS
    : MOCK_MARKETS.filter(m => m.sport === activeCategory)

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
            <h1 className="text-xl font-black tracking-tight">World Cup Markets</h1>
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
                "flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border text-[11px] font-bold whitespace-nowrap transition-all shrink-0",
                activeCategory === cat
                  ? "border-[#00D27D] text-[#00D27D] bg-[#00D27D]/10"
                  : "border-[var(--black-border)] text-[var(--black-dim)] hover:border-[var(--black-muted)] hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
          {[
            { label: "Total Staked", value: "KSh 12.4M", sub: "+23.4% today" },
            { label: "Active Markets", value: filteredMarkets.length.toString(), sub: "Live now" },
            { label: "Avg Payout", value: "KSh 4,500", sub: "Per winning bet" },
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
            <p className="text-sm text-[var(--black-dim)] font-medium">No markets available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
