"use client"

import { useState } from "react"
import { Sparkles, Plus, X, Loader2, TrendingUp, AlertTriangle, CheckCircle, ChevronRight } from "lucide-react"
import TopNav from "@/src/components/TopNav"
import BottomNav from "@/src/components/BottomNav"
import { MOCK_MARKETS, formatOdds } from "@/src/lib/mockMarkets"
import { useBetSlip } from "@/src/contexts/BetSlipContext"
import { cn } from "@/src/lib/utils"
import { toast } from "sonner"

interface ParlayLeg {
  id: number
  marketId: number
  sport: string
  homeTeam: string
  awayTeam: string
  betType: string
  selection: string
  odds: number
}

interface ParlaySuggestionResult {
  suggestions: Array<{
    legs: string[]
    confidence: number
    combinedOdds: number
    reasoning: string
    riskLevel: "Low" | "Medium" | "High"
  }>
  insight: string
}

const RISK_CONFIG = {
  Low: { color: "text-[var(--status-won)]", bg: "bg-[var(--status-won-bg)] border-[var(--status-won)]/20" },
  Medium: { color: "text-[var(--status-pending)]", bg: "bg-[var(--status-pending-bg)] border-[var(--status-pending)]/20" },
  High: { color: "text-[var(--status-lost)]", bg: "bg-[var(--status-lost-bg)] border-[var(--status-lost)]/20" },
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? "#22C55E" : value >= 50 ? "#F59E0B" : "#EF4444"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[var(--black-border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-bold font-mono" style={{ color }}>
        {value}%
      </span>
    </div>
  )
}

export default function ParlayAI() {
  const [selectedLegs, setSelectedLegs] = useState<ParlayLeg[]>([])
  const [result, setResult] = useState<ParlaySuggestionResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { addBet } = useBetSlip()

  function addLeg(market: typeof MOCK_MARKETS[0]) {
    if (selectedLegs.find((l) => l.marketId === market.id)) {
      toast.info("Market already added")
      return
    }
    if (selectedLegs.length >= 6) {
      toast.warning("Maximum 6 legs per parlay")
      return
    }
    setSelectedLegs((prev) => [
      ...prev,
      {
        id: market.id,
        marketId: market.id,
        sport: market.sport,
        homeTeam: market.homeTeam,
        awayTeam: market.awayTeam,
        betType: "Moneyline",
        selection: market.homeTeam,
        odds: market.homeOddsML,
      },
    ])
    setResult(null)
  }

  function removeLeg(marketId: number) {
    setSelectedLegs((prev) => prev.filter((l) => l.marketId !== marketId))
    setResult(null)
  }

  function handleAnalyze() {
    if (selectedLegs.length < 2) {
      toast.warning("Add at least 2 legs to build a parlay")
      return
    }
    setIsAnalyzing(true)
    
    setTimeout(() => {
      const mockSuggestions: ParlaySuggestionResult = {
        insight: `Based on current market conditions and historical data, your ${selectedLegs.length}-leg parlay shows interesting value patterns. The combined odds suggest moderate variance.`,
        suggestions: [
          {
            legs: selectedLegs.map((l) => `${l.homeTeam} ${formatOdds(l.odds)}`),
            confidence: Math.floor(Math.random() * 30) + 50,
            combinedOdds: calculateTotalOdds(),
            reasoning: "This combination leverages correlated outcomes in your selected markets. The value is derived from historical performance patterns.",
            riskLevel: selectedLegs.length >= 4 ? "High" : selectedLegs.length >= 3 ? "Medium" : "Low",
          },
          {
            legs: selectedLegs.slice(0, Math.min(2, selectedLegs.length)).map((l) => `${l.homeTeam} ${formatOdds(l.odds)}`),
            confidence: Math.floor(Math.random() * 20) + 70,
            combinedOdds: calculateTotalOdds() - 20,
            reasoning: "A more conservative approach focusing on the strongest selections. Lower payout but higher hit probability.",
            riskLevel: "Low",
          },
        ],
      }
      setResult(mockSuggestions)
      setIsAnalyzing(false)
    }, 2000)
  }

  function calculateTotalOdds(): number {
    const decimal = selectedLegs.reduce((acc, leg) => {
      const dec = leg.odds > 0 ? leg.odds / 100 + 1 : 100 / Math.abs(leg.odds) + 1
      return acc * dec
    }, 1)
    return decimal >= 2 ? Math.round((decimal - 1) * 100) : Math.round(-100 / (decimal - 1))
  }

  function addSuggestionToSlip() {
    selectedLegs.forEach((leg, i) => {
      addBet({
        id: `parlay-ai-${leg.marketId}-${i}`,
        marketId: leg.marketId,
        sport: leg.sport,
        homeTeam: leg.homeTeam,
        awayTeam: leg.awayTeam,
        betType: leg.betType,
        selection: leg.selection,
        odds: leg.odds,
      })
    })
    toast.success("Parlay added to bet slip!")
  }

  const totalDecimalOdds = selectedLegs.reduce((acc, leg) => {
    const decimal = leg.odds > 0 ? leg.odds / 100 + 1 : 100 / Math.abs(leg.odds) + 1
    return acc * decimal
  }, 1)
  const parlayAmericanOdds = totalDecimalOdds >= 2 ? Math.round((totalDecimalOdds - 1) * 100) : Math.round(-100 / (totalDecimalOdds - 1))

  return (
    <div className="min-h-screen bg-[var(--black)] text-white">
      <TopNav />

      <main className="max-w-[1000px] mx-auto px-4 pb-24 md:pb-8">
        <div className="py-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-[var(--gold)]" />
            <h1 className="text-xl font-black tracking-tight">Parlay AI</h1>
          </div>
          <p className="text-[11px] text-[var(--black-dim)]">
            Select markets below, then let AI analyze and recommend optimal parlay combinations with confidence scores.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--black-dim)] mb-3">
              Available Markets — Select up to 6 legs
            </h2>
            <div className="space-y-2">
              {MOCK_MARKETS.map((market) => {
                const isAdded = selectedLegs.some((l) => l.marketId === market.id)
                return (
                  <div
                    key={market.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                      isAdded
                        ? "border-[var(--gold)] bg-[var(--gold-muted)]"
                        : "border-[var(--black-border)] bg-[var(--black-card)] hover:border-[var(--black-muted)]"
                    )}
                    onClick={() => (isAdded ? removeLeg(market.id) : addLeg(market))}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--gold)]">
                          {market.sport}
                        </span>
                        {market.status === "live" && (
                          <span className="text-[9px] font-bold text-[var(--status-lost)] uppercase animate-pulse">
                            LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-white truncate">
                        {market.awayTeam} @ {market.homeTeam}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[9px] text-[var(--black-dim)]">ML</p>
                        <p className="text-xs font-mono font-bold text-white">
                          {formatOdds(market.homeOddsML)}
                        </p>
                      </div>
                      <button
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                          isAdded
                            ? "bg-[var(--gold)] text-black"
                            : "bg-[var(--black-border)] text-[var(--black-dim)] hover:bg-[var(--black-muted)] hover:text-white"
                        )}
                      >
                        {isAdded ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--black-border)] flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                  Parlay Builder
                </span>
                {selectedLegs.length > 0 && (
                  <span className="text-[10px] font-bold text-[var(--gold)]">
                    {selectedLegs.length} leg{selectedLegs.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {selectedLegs.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <Plus className="w-5 h-5 text-[var(--black-muted)] mx-auto mb-2" />
                  <p className="text-[11px] text-[var(--black-dim)]">
                    Add markets from the left to build your parlay
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {selectedLegs.map((leg) => (
                    <div
                      key={leg.marketId}
                      className="flex items-center gap-2 p-2 rounded-lg bg-[var(--black-soft)] border border-[var(--black-border)]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-[var(--gold)] uppercase">
                          {leg.sport}
                        </p>
                        <p className="text-[10px] text-white truncate">
                          {leg.homeTeam} vs {leg.awayTeam}
                        </p>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-white shrink-0">
                        {formatOdds(leg.odds)}
                      </span>
                      <button
                        onClick={() => removeLeg(leg.marketId)}
                        className="text-[var(--black-subtle)] hover:text-[var(--status-lost)] transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {selectedLegs.length >= 2 && (
                    <div className="pt-2 border-t border-[var(--black-border)]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-[var(--black-dim)]">Combined Odds</span>
                        <span className="text-sm font-bold font-mono text-[var(--gold)]">
                          {formatOdds(parlayAmericanOdds)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="px-3 pb-3">
                <button
                  onClick={handleAnalyze}
                  disabled={selectedLegs.length < 2 || isAnalyzing}
                  className={cn(
                    "w-full py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                    selectedLegs.length >= 2
                      ? "bg-[var(--gold)] text-black hover:bg-[var(--gold-light)]"
                      : "bg-[var(--black-border)] text-[var(--black-dim)] cursor-not-allowed"
                  )}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze with AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {result && (
              <div className="space-y-3 animate-fade-in-up">
                <div className="bg-[var(--gold-muted)] border border-[var(--gold)]/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--gold)]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold)]">
                      AI Insight
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--black-dim)] leading-relaxed">
                    {result.insight}
                  </p>
                </div>

                {result.suggestions.map((suggestion, i) => {
                  const riskCfg =
                    RISK_CONFIG[suggestion.riskLevel as keyof typeof RISK_CONFIG] ||
                    RISK_CONFIG.Medium
                  return (
                    <div
                      key={i}
                      className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-xl overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-[var(--black-border)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-[var(--gold)]" />
                          <span className="text-[11px] font-bold text-white">
                            Suggestion {i + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                              riskCfg.bg,
                              riskCfg.color
                            )}
                          >
                            {suggestion.riskLevel} Risk
                          </span>
                          <span className="text-[11px] font-bold font-mono text-[var(--gold)]">
                            {formatOdds(suggestion.combinedOdds)}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="space-y-1">
                          {suggestion.legs.map((leg, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <ChevronRight className="w-3 h-3 text-[var(--gold)] shrink-0" />
                              <span className="text-[10px] text-[var(--black-dim)]">{leg}</span>
                            </div>
                          ))}
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--black-dim)]">
                              Confidence
                            </span>
                          </div>
                          <ConfidenceBar value={suggestion.confidence} />
                        </div>

                        <p className="text-[10px] text-[var(--black-dim)] leading-relaxed border-t border-[var(--black-border)] pt-3">
                          {suggestion.reasoning}
                        </p>

                        <button
                          onClick={addSuggestionToSlip}
                          className="w-full py-2 rounded-lg bg-[var(--black-border)] text-[11px] font-bold text-white hover:bg-[var(--black-muted)] transition-all flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add to Bet Slip
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--black-border)]">
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--status-pending)] shrink-0 mt-0.5" />
              <p className="text-[9px] text-[var(--black-dim)] leading-relaxed">
                AI suggestions are for informational purposes only. Always bet responsibly. Past
                performance does not guarantee future results.
              </p>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
