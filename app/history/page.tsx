"use client"

import { useState } from "react"
import { Clock, CheckCircle, XCircle, RefreshCw, ChevronRight } from "lucide-react"
import TopNav from "@/src/components/TopNav"
import BottomNav from "@/src/components/BottomNav"
import { Badge } from "@/src/components/ui/badge"
import { cn } from "@/src/lib/utils"

interface BetHistoryItem {
  id: string
  date: string
  legs: { selection: string; odds: number; result?: "won" | "lost" | "pending" }[]
  totalOdds: number
  stake: number
  payout: number
  status: "won" | "lost" | "pending"
}

const MOCK_HISTORY: BetHistoryItem[] = [
  {
    id: "bet-001",
    date: "Today, 2:30 PM",
    legs: [
      { selection: "Chiefs -3.5", odds: -110, result: "won" },
      { selection: "Lakers +5.5", odds: -105, result: "won" },
    ],
    totalOdds: 210,
    stake: 25,
    payout: 77.50,
    status: "won",
  },
  {
    id: "bet-002",
    date: "Yesterday, 8:15 PM",
    legs: [
      { selection: "Dodgers ML", odds: -150, result: "won" },
      { selection: "Yankees ML", odds: 120, result: "lost" },
      { selection: "Over 8.5", odds: -110, result: "pending" },
    ],
    totalOdds: 180,
    stake: 50,
    payout: 0,
    status: "pending",
  },
  {
    id: "bet-003",
    date: "Mar 15, 2024",
    legs: [
      { selection: "Barcelona ML", odds: -200, result: "lost" },
      { selection: "Real Madrid +1", odds: 105, result: "lost" },
    ],
    totalOdds: -95,
    stake: 100,
    payout: 0,
    status: "lost",
  },
  {
    id: "bet-004",
    date: "Mar 14, 2024",
    legs: [
      { selection: "Celtics -7", odds: -110, result: "won" },
      { selection: "Warriors +3", odds: -110, result: "won" },
      { selection: "Suns ML", odds: -130, result: "won" },
    ],
    totalOdds: 480,
    stake: 20,
    payout: 116.00,
    status: "won",
  },
]

type FilterStatus = "all" | "won" | "lost" | "pending"

export default function BetHistory() {
  const [filter, setFilter] = useState<FilterStatus>("all")

  const filteredHistory =
    filter === "all" ? MOCK_HISTORY : MOCK_HISTORY.filter((b) => b.status === filter)

  const stats = {
    total: MOCK_HISTORY.length,
    won: MOCK_HISTORY.filter((b) => b.status === "won").length,
    lost: MOCK_HISTORY.filter((b) => b.status === "lost").length,
    pending: MOCK_HISTORY.filter((b) => b.status === "pending").length,
    totalStaked: MOCK_HISTORY.reduce((acc, b) => acc + b.stake, 0),
    totalWon: MOCK_HISTORY.filter((b) => b.status === "won").reduce((acc, b) => acc + b.payout, 0),
  }

  return (
    <div className="min-h-screen bg-[var(--black)] text-white">
      <TopNav />

      <main className="max-w-[800px] mx-auto px-4 pb-24 md:pb-8">
        <div className="py-4">
          <h1 className="text-xl font-black tracking-tight">Bet History</h1>
          <p className="text-[11px] text-[var(--black-dim)] mt-0.5">
            Track your parlay performance over time
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-xl p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--black-dim)] mb-1">
              Total Bets
            </p>
            <p className="text-lg font-black font-mono text-white">{stats.total}</p>
          </div>
          <div className="bg-[var(--status-won-bg)] border border-[var(--status-won)]/20 rounded-xl p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--status-won)] mb-1">
              Won
            </p>
            <p className="text-lg font-black font-mono text-[var(--status-won)]">{stats.won}</p>
          </div>
          <div className="bg-[var(--status-lost-bg)] border border-[var(--status-lost)]/20 rounded-xl p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--status-lost)] mb-1">
              Lost
            </p>
            <p className="text-lg font-black font-mono text-[var(--status-lost)]">{stats.lost}</p>
          </div>
          <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-xl p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--black-dim)] mb-1">
              Pending
            </p>
            <p className="text-lg font-black font-mono text-[var(--status-pending)]">
              {stats.pending}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { id: "all", label: "All" },
            { id: "won", label: "Won" },
            { id: "lost", label: "Lost" },
            { id: "pending", label: "Pending" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as FilterStatus)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                filter === f.id
                  ? "bg-white text-black"
                  : "bg-[var(--black-card)] border border-[var(--black-border)] text-[var(--black-dim)] hover:text-white"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-8 h-8 text-[var(--black-muted)] mx-auto mb-3" />
              <p className="text-sm text-[var(--black-dim)]">No bets found</p>
            </div>
          ) : (
            filteredHistory.map((bet) => (
              <div
                key={bet.id}
                className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-xl overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[var(--black-dim)]" />
                      <span className="text-[10px] text-[var(--black-dim)]">{bet.date}</span>
                    </div>
                    <Badge
                      variant={
                        bet.status === "won"
                          ? "success"
                          : bet.status === "lost"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {bet.status === "won" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {bet.status === "lost" && <XCircle className="w-3 h-3 mr-1" />}
                      {bet.status === "pending" && <RefreshCw className="w-3 h-3 mr-1" />}
                      {bet.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {bet.legs.map((leg, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="text-white">{leg.selection}</span>
                        <span
                          className={cn(
                            "font-mono font-bold",
                            leg.result === "won"
                              ? "text-[var(--status-won)]"
                              : leg.result === "lost"
                                ? "text-[var(--status-lost)]"
                                : "text-[var(--black-dim)]"
                          )}
                        >
                          {leg.odds > 0 ? `+${leg.odds}` : leg.odds}
                          {leg.result && (
                            <span className="ml-1 text-[9px]">
                              {leg.result === "won" ? "W" : leg.result === "lost" ? "L" : "-"}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--black-border)]">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[9px] text-[var(--black-dim)] uppercase tracking-wider">
                          Odds
                        </p>
                        <p className="text-xs font-mono font-bold text-[var(--gold)]">
                          {bet.totalOdds > 0 ? `+${bet.totalOdds}` : bet.totalOdds}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[var(--black-dim)] uppercase tracking-wider">
                          Stake
                        </p>
                        <p className="text-xs font-mono font-bold text-white">
                          ${bet.stake.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-[var(--black-dim)] uppercase tracking-wider">
                        Payout
                      </p>
                      <p
                        className={cn(
                          "text-sm font-mono font-bold",
                          bet.status === "won"
                            ? "text-[var(--status-won)]"
                            : "text-white"
                        )}
                      >
                        ${bet.payout.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
