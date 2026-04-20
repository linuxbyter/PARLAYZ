"use client"

import { useState, useEffect, useRef } from "react"
import { RefreshCw, TrendingUp, Activity, Wifi, WifiOff } from "lucide-react"
import TopNav from "@/src/components/TopNav"
import BottomNav from "@/src/components/BottomNav"
import MarketCard from "@/src/components/MarketCard"
import BetSlip from "@/src/components/BetSlip"
import { MOCK_MARKETS, MarketData } from "@/src/lib/mockMarkets"
import { useBetSlip } from "@/src/contexts/BetSlipContext"
import { cn } from "@/src/lib/utils"
import { createClient } from '@supabase/supabase-js'

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Sport = "ALL" | "NFL" | "NBA" | "MLB" | "Soccer"
type BetType = "Moneyline" | "Spread" | "Over/Under"
type Category = "ALL" | "Sports" | "Crypto" | "Politics" | "Tech" | "Meme" | "Futures"

const SPORTS: Sport[] = ["ALL", "NFL", "NBA", "MLB", "Soccer"]
const BET_TYPES: BetType[] = ["Moneyline", "Spread", "Over/Under"]
const CATEGORIES: Category[] = ["ALL", "Sports", "Crypto", "Politics", "Tech", "Meme", "Futures"]

const SPORT_EMOJI: Record<string, string> = {
  ALL: "🏆", NFL: "🏈", NBA: "🏀", MLB: "⚾", Soccer: "⚽",
}

const CATEGORY_EMOJI: Record<string, string> = {
  ALL: "🏆", Sports: "⚽", Crypto: "₿", Politics: "🏛️",
  Tech: "⚡", Meme: "🔥", Futures: "📈",
}

// Shape Supabase market to match what MarketCard expects
// OR render them separately — we'll render separately below
interface SupabaseMarket {
  id: string
  title: string
  category: string
  status: string
  yes_probability: number
  no_probability: number
  total_volume: number
  locks_at: string
  resolves_at: string
  resolved_outcome: string | null
}

export default function Home() {
  const [activeSport, setActiveSport] = useState<Sport>("ALL")
  const [activeCategory, setActiveCategory] = useState<Category>("ALL")
  const [activeBetType, setActiveBetType] = useState<BetType>("Moneyline")
  const [markets, setMarkets] = useState<MarketData[]>(MOCK_MARKETS)
  const [supabaseMarkets, setSupabaseMarkets] = useState<SupabaseMarket[]>([])
  const [supabaseLoading, setSupabaseLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const [isLive, setIsLive] = useState(true)
  const { addBet } = useBetSlip()
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch Supabase markets
  const fetchSupabaseMarkets = async () => {
    setSupabaseLoading(true)
    try {
      let query = supabase
        .from('markets')
        .select('*')
        .in('status', ['open', 'locked'])
        .order('created_at', { ascending: false })

      if (activeCategory !== 'ALL') {
        query = query.eq('category', activeCategory)
      }

      const { data, error } = await query
      if (error) throw error
      setSupabaseMarkets(data || [])
    } catch (err) {
      console.error('Failed to fetch Supabase markets:', err)
    } finally {
      setSupabaseLoading(false)
    }
  }

  useEffect(() => {
    fetchSupabaseMarkets()
  }, [activeCategory])

  // Existing live odds ticker
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setMarkets((prev) =>
        prev.map((m) => {
          if (m.status !== "live") return m
          const delta = Math.floor(Math.random() * 5) - 2
          const newOdds = m.homeOddsML + delta
          return {
            ...m,
            homeOddsML: newOdds,
            awayOddsML: -newOdds - 10,
            oddsHistory: [...m.oddsHistory.slice(1), newOdds],
          }
        })
      )
      setLastUpdated(new Date())
    }, 4000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchSupabaseMarkets()
    await new Promise((r) => setTimeout(r, 800))
    setLastUpdated(new Date())
    setRefreshing(false)
  }

  const handleSelectBet = (market: MarketData, selection: string, odds: number) => {
    addBet({
      marketId: market.id,
      sport: market.sport,
      homeTeam: market.homeTeam,
      awayTeam: market.awayTeam,
      betType: activeBetType,
      selection,
      odds,
    })
  }

  const filteredMockMarkets =
    activeSport === "ALL" ? markets : markets.filter((m) => m.sport === activeSport)

  const liveCount = markets.filter((m) => m.status === "live").length
  const totalMarkets = filteredMockMarkets.length + supabaseMarkets.length

  return (
    <div className="min-h-screen bg-[var(--black)] text-white">
      <TopNav />

      <main className="max-w-[1400px] mx-auto px-4 pb-24 md:pb-8 lg:pr-[360px]">
        <div className="py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">Live Markets</h1>
              <div className="flex items-center gap-1.5">
                {isLive ? (
                  <Wifi className="w-3 h-3 text-[var(--status-won)]" />
                ) : (
                  <WifiOff className="w-3 h-3 text-[var(--status-lost)]" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[10px] font-medium text-[var(--black-dim)]">
                {totalMarkets} markets
              </span>
              {liveCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--status-lost)]">
                  <Activity className="w-3 h-3 animate-pulse" />
                  {liveCount} LIVE
                </span>
              )}
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

        {/* CATEGORY TABS — for Supabase markets */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide mb-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold whitespace-nowrap transition-all shrink-0",
                activeCategory === cat
                  ? "border-[var(--gold)] text-[var(--gold)] bg-[var(--gold-muted)]"
                  : "border-[var(--black-border)] text-[var(--black-dim)] hover:border-[var(--black-muted)] hover:text-white"
              )}
            >
              <span>{CATEGORY_EMOJI[cat]}</span>
              {cat}
            </button>
          ))}
        </div>

        {/* SPORT TABS — for mock markets */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide mb-3">
          {SPORTS.map((sport) => (
            <button
              key={sport}
              onClick={() => setActiveSport(sport)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold whitespace-nowrap transition-all shrink-0",
                activeSport === sport
                  ? "border-[var(--gold)] text-[var(--gold)] bg-[var(--gold-muted)]"
                  : "border-[var(--black-border)] text-[var(--black-dim)] hover:border-[var(--black-muted)] hover:text-white"
              )}
            >
              <span>{SPORT_EMOJI[sport]}</span>
              {sport}
              {sport !== "ALL" && (
                <span className="text-[9px] opacity-60">
                  {markets.filter((m) => m.sport === sport).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 mb-5">
          {BET_TYPES.map((bt) => (
            <button
              key={bt}
              onClick={() => setActiveBetType(bt)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                activeBetType === bt
                  ? "bg-white text-black"
                  : "bg-[var(--black-card)] text-[var(--black-dim)] hover:text-white hover:bg-[var(--black-border)]"
              )}
            >
              {bt}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: "Total Volume", value: "$2.4M", sub: "+12.3% today" },
            { label: "Open Markets", value: totalMarkets.toString(), sub: `${liveCount} live` },
            { label: "Avg Odds", value: "-112", sub: "Moneyline" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-xl p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--black-dim)] mb-1">{stat.label}</p>
              <p className="text-base font-black font-mono text-white">{stat.value}</p>
              <p className="text-[9px] text-[var(--black-subtle)] font-medium mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* SUPABASE MARKETS — Kenya + Global */}
        {supabaseMarkets.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--gold)] mb-3">
              📍 Kenya & Global Markets
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {supabaseMarkets.map((market) => (
                <div
                  key={market.id}
                  className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-xl p-4 hover:border-[var(--gold)] transition-all cursor-pointer"
                >
                  {/* Category + Status */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--gold)] text-[var(--gold)] bg-[var(--gold-muted)]">
                      {market.category}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase",
                      market.status === 'open' ? 'text-[var(--status-won)]' : 'text-[var(--gold)]'
                    )}>
                      ● {market.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Title */}
                  <p className="text-[13px] font-semibold text-white leading-snug mb-3 line-clamp-2">
                    {market.title}
                  </p>

                  {/* Probability bar */}
                  <div className="w-full h-1 rounded-full bg-[var(--black-border)] mb-2 overflow-hidden">
                    <div
                      className="h-full bg-[var(--status-won)] rounded-full transition-all"
                      style={{ width: `${market.yes_probability}%` }}
                    />
                  </div>

                  {/* YES / NO */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] font-bold text-[var(--status-won)]">
                      ● YES {market.yes_probability}%
                    </span>
                    <span className="text-[12px] font-bold text-[var(--status-lost)]">
                      ● NO {market.no_probability}%
                    </span>
                  </div>

                  {/* Volume + Resolves */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--black-dim)] font-mono">
                      KSh {(market.total_volume || 0).toLocaleString()} vol
                    </span>
                    <span className="text-[10px] text-[var(--black-subtle)]">
                      {market.resolves_at
                        ? new Date(market.resolves_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
                        : 'TBD'}
                    </span>
                  </div>

                  {/* Bet buttons */}
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 py-2 rounded-lg bg-[rgba(76,175,125,0.15)] border border-[var(--status-won)] text-[var(--status-won)] text-[11px] font-bold hover:bg-[rgba(76,175,125,0.25)] transition-all">
                      YES
                    </button>
                    <button className="flex-1 py-2 rounded-lg bg-[rgba(224,82,82,0.15)] border border-[var(--status-lost)] text-[var(--status-lost)] text-[11px] font-bold hover:bg-[rgba(224,82,82,0.25)] transition-all">
                      NO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading state for Supabase markets */}
        {supabaseLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-xl p-4 animate-pulse">
                <div className="h-3 bg-[var(--black-border)] rounded w-1/3 mb-3" />
                <div className="h-4 bg-[var(--black-border)] rounded w-full mb-2" />
                <div className="h-4 bg-[var(--black-border)] rounded w-3/4 mb-4" />
                <div className="h-1 bg-[var(--black-border)] rounded w-full mb-3" />
                <div className="flex gap-2">
                  <div className="flex-1 h-8 bg-[var(--black-border)] rounded-lg" />
                  <div className="flex-1 h-8 bg-[var(--black-border)] rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EXISTING MOCK MARKETS */}
        {filteredMockMarkets.length > 0 && (
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--black-dim)] mb-3">
              🔴 Live Sports Markets
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredMockMarkets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  activeBetType={activeBetType}
                  onSelect={handleSelectBet}
                />
              ))}
            </div>
          </div>
        )}

        {totalMarkets === 0 && !supabaseLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <TrendingUp size={32} className="text-[var(--black-muted)] mb-3" />
            <p className="text-sm text-[var(--black-dim)] font-medium">No markets available</p>
          </div>
        )}
      </main>

      <BetSlip />
      <BottomNav />
    </div>
  )
}
