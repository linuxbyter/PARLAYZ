"use client"

import { useState, useEffect, useRef } from "react"
import { Activity, Clock, TrendingUp, TrendingDown } from "lucide-react"
import { MarketData, formatOdds } from "@/src/lib/mockMarkets"
import { Badge } from "@/src/components/ui/badge"
import { cn } from "@/src/lib/utils"

interface MarketCardProps {
  market: MarketData
  activeBetType: "Moneyline" | "Spread" | "Over/Under"
  onSelect?: (market: MarketData, selection: string, odds: number) => void
}

const SPORT_EMOJI: Record<string, string> = {
  NFL: "🏈",
  NBA: "🏀",
  MLB: "⚾",
  Soccer: "⚽",
}

export default function MarketCard({ market, activeBetType, onSelect }: MarketCardProps) {
  const [prevOdds, setPrevOdds] = useState(market.homeOddsML)
  const [oddsDirection, setOddsDirection] = useState<"up" | "down" | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (market.homeOddsML !== prevOdds) {
      if (market.homeOddsML > prevOdds) {
        setOddsDirection("up")
      } else {
        setOddsDirection("down")
      }
      setPrevOdds(market.homeOddsML)
      
      const timer = setTimeout(() => setOddsDirection(null), 1000)
      return () => clearTimeout(timer)
    }
  }, [market.homeOddsML, prevOdds])

  const getOddsForBetType = () => {
    switch (activeBetType) {
      case "Moneyline":
        return {
          home: { label: market.homeTeam, odds: market.homeOddsML },
          away: { label: market.awayTeam, odds: market.awayOddsML },
        }
      case "Spread":
        const homeSpread = market.spread > 0 ? `+${market.spread}` : market.spread.toString()
        const awaySpread = market.spread > 0 ? (market.spread * -1).toString() : `+${Math.abs(market.spread)}`
        return {
          home: { label: `${market.homeTeam} ${homeSpread}`, odds: -110 },
          away: { label: `${market.awayTeam} ${awaySpread}`, odds: -110 },
        }
      case "Over/Under":
        return {
          home: { label: `Over ${market.total}`, odds: -110 },
          away: { label: `Under ${market.total}`, odds: -110 },
        }
    }
  }

  const odds = getOddsForBetType()

  return (
    <div
      ref={cardRef}
      className="group relative bg-[var(--black-card)] border border-[var(--black-border)] rounded-xl overflow-hidden transition-all duration-200 hover:border-[var(--black-muted)] hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]"
    >
      {/* Live indicator for live games */}
      {market.status === "live" && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--status-lost)] via-[var(--status-lost)] to-transparent" />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">{SPORT_EMOJI[market.sport] || "🏆"}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--black-dim)]">
              {market.sport}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {market.status === "live" && (
              <Badge variant="live">
                <Activity className="w-2.5 h-2.5 mr-1" />
                LIVE
              </Badge>
            )}
            {market.status === "pregame" && (
              <span className="flex items-center gap-1 text-[10px] text-[var(--black-dim)] font-medium">
                <Clock className="w-3 h-3" />
                {market.startTime}
              </span>
            )}
          </div>
        </div>

        {/* Matchup */}
        <div className="mb-4">
          <p className="text-[11px] text-[var(--black-dim)] truncate">
            {market.awayTeam} @ {market.homeTeam}
          </p>
        </div>

        {/* Odds */}
        <div className="space-y-2">
          {[odds.home, odds.away].map((option, idx) => (
            <button
              key={idx}
              onClick={() => onSelect?.(market, option.label, option.odds)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-[var(--black-soft)] border border-[var(--black-border)] hover:border-[var(--gold)]/50 hover:bg-[var(--black-border)] transition-all group/odds"
            >
              <span className="text-[11px] font-medium text-white truncate max-w-[60%]">
                {option.label}
              </span>
              <div className="flex items-center gap-2">
                {market.status === "live" && oddsDirection && idx === 0 && (
                  oddsDirection === "up" ? (
                    <TrendingUp className="w-3 h-3 text-[var(--status-won)]" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-[var(--status-lost)]" />
                  )
                )}
                <span
                  className={cn(
                    "text-sm font-mono font-bold transition-colors",
                    oddsDirection && idx === 0
                      ? oddsDirection === "up"
                        ? "text-[var(--status-won)] odds-up"
                        : "text-[var(--status-lost)] odds-down"
                      : "text-white group-hover/odds:text-[var(--gold)]"
                  )}
                >
                  {formatOdds(option.odds)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bet type indicator */}
      <div className="px-4 py-2 border-t border-[var(--black-border)] bg-[var(--black-soft)]/50">
        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--black-subtle)]">
          {activeBetType}
        </span>
      </div>
    </div>
  )
}
