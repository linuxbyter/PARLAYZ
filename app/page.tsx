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

type Sport = "ALL" | "NFL" | "NBA" | "MLB" | "Soccer"
type BetType = "Moneyline" | "Spread" | "Over/Under"

const SPORTS: Sport[] = ["ALL", "NFL", "NBA", "MLB", "Soccer"]
const BET_TYPES: BetType[] = ["Moneyline", "Spread", "Over/Under"]

const SPORT_EMOJI: Record<string, string> = {
  ALL: "🏆",
  NFL: "🏈",
  NBA: "🏀",
  MLB: "⚾",
  Soccer: "⚽",
}

export default function Home() {
  const [activeSport, setActiveSport] = useState<Sport>("ALL")
  const [activeBetType, setActiveBetType] = useState<BetType>("Moneyline")
  const [markets, setMarkets] = useState<MarketData[]>(MOCK_MARKETS)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const [isLive, setIsLive] = useState(true)
  const { addBet } = useBetSlip()
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
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

  const filteredMarkets =
    activeSport === "ALL" ? markets : markets.filter((m) => m.sport === activeSport)

  const liveCount = markets.filter((m) => m.status === "live").length

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
                {filteredMarkets.length} markets
              </span>
              {liveCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--status-lost)]">
                  <Activity className="w-3 h-3 animate-pulse" />
                  {liveCount} LIVE
                </span>
              )}
              <span className="text-[10px] text-[var(--black-subtle)] font-mono">
                {lastUpdated.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
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
            { label: "Open Markets", value: filteredMarkets.length.toString(), sub: `${liveCount} live` },
            { label: "Avg Odds", value: "-112", sub: "Moneyline" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-xl p-3"
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--black-dim)] mb-1">
                {stat.label}
              </p>
              <p className="text-base font-black font-mono text-white">{stat.value}</p>
              <p className="text-[9px] text-[var(--black-subtle)] font-medium mt-0.5">
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {filteredMarkets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <TrendingUp size={32} className="text-[var(--black-muted)] mb-3" />
            <p className="text-sm text-[var(--black-dim)] font-medium">
              No markets available
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredMarkets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                activeBetType={activeBetType}
                onSelect={handleSelectBet}
              />
            ))}
          </div>
        )}
      </main>

      <BetSlip />
      <BottomNav />
    </div>
  )
}
