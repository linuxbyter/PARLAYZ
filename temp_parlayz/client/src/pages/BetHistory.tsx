import { useState } from "react";
import { Clock, CheckCircle, XCircle, Trophy, Filter } from "lucide-react";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { formatOdds } from "@/lib/mockMarkets";

type BetStatus = "All" | "Won" | "Lost" | "Pending";

interface MockBet {
  id: number;
  sport: string;
  matchup: string;
  betType: string;
  selection: string;
  odds: number;
  stake: number;
  payout: number;
  status: "Won" | "Lost" | "Pending";
  date: string;
  isParlay: boolean;
}

const MOCK_BET_HISTORY: MockBet[] = [
  { id: 1, sport: "NFL", matchup: "Chiefs vs Ravens", betType: "Moneyline", selection: "Chiefs", odds: -145, stake: 50, payout: 84.48, status: "Won", date: "2026-04-15T20:00:00Z", isParlay: false },
  { id: 2, sport: "NBA", matchup: "Celtics vs Warriors", betType: "Spread", selection: "Celtics -5.5", odds: -110, stake: 25, payout: 0, status: "Lost", date: "2026-04-15T18:30:00Z", isParlay: false },
  { id: 3, sport: "MLB", matchup: "Yankees vs Dodgers", betType: "Over/Under", selection: "Over 8.5", odds: -115, stake: 30, payout: 0, status: "Pending", date: "2026-04-16T19:00:00Z", isParlay: false },
  { id: 4, sport: "Soccer", matchup: "Man City vs Arsenal", betType: "Moneyline", selection: "Man City", odds: -120, stake: 100, payout: 183.33, status: "Won", date: "2026-04-14T15:00:00Z", isParlay: false },
  { id: 5, sport: "NFL", matchup: "49ers vs Cowboys", betType: "Spread", selection: "49ers -4.0", odds: -110, stake: 75, payout: 0, status: "Lost", date: "2026-04-13T21:00:00Z", isParlay: false },
  { id: 6, sport: "NBA", matchup: "Heat vs Nuggets", betType: "Moneyline", selection: "Nuggets", odds: -155, stake: 40, payout: 0, status: "Pending", date: "2026-04-16T21:30:00Z", isParlay: false },
  { id: 7, sport: "NFL+NBA", matchup: "2-Leg Parlay", betType: "Parlay", selection: "Chiefs ML + Celtics -5.5", odds: 265, stake: 20, payout: 73, status: "Won", date: "2026-04-12T20:00:00Z", isParlay: true },
  { id: 8, sport: "MLB", matchup: "Astros vs Braves", betType: "Moneyline", selection: "Astros", odds: -140, stake: 60, payout: 0, status: "Lost", date: "2026-04-11T19:00:00Z", isParlay: false },
  { id: 9, sport: "Soccer", matchup: "Real Madrid vs Barcelona", betType: "Over/Under", selection: "Under 2.5", odds: +100, stake: 35, payout: 0, status: "Pending", date: "2026-04-16T17:00:00Z", isParlay: false },
  { id: 10, sport: "NBA", matchup: "3-Leg Parlay", betType: "Parlay", selection: "Celtics ML + Nuggets ML + Over 224.5", odds: 580, stake: 10, payout: 0, status: "Lost", date: "2026-04-10T20:00:00Z", isParlay: true },
];

const STATUS_CONFIG = {
  Won: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20", label: "Won" },
  Lost: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", label: "Lost" },
  Pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", label: "Pending" },
};

const SPORT_COLORS: Record<string, string> = {
  NFL: "#D4AF37",
  NBA: "#FF6B35",
  MLB: "#4FC3F7",
  Soccer: "#66BB6A",
  "NFL+NBA": "#D4AF37",
};

export default function BetHistory() {
  const [activeStatus, setActiveStatus] = useState<BetStatus>("All");

  const filtered = activeStatus === "All"
    ? MOCK_BET_HISTORY
    : MOCK_BET_HISTORY.filter((b) => b.status === activeStatus);

  const totalWon = MOCK_BET_HISTORY.filter((b) => b.status === "Won").reduce((a, b) => a + b.payout - b.stake, 0);
  const totalStaked = MOCK_BET_HISTORY.reduce((a, b) => a + b.stake, 0);
  const winRate = Math.round((MOCK_BET_HISTORY.filter((b) => b.status === "Won").length / MOCK_BET_HISTORY.filter((b) => b.status !== "Pending").length) * 100);

  return (
    <div className="min-h-screen bg-black text-white">
      <TopNav />

      <main className="max-w-[900px] mx-auto px-4 pb-20 md:pb-8">
        {/* Header */}
        <div className="py-4">
          <h1 className="text-xl font-black text-white tracking-tight">Bet History</h1>
          <p className="text-[11px] text-[#5A5A5A] mt-0.5">Your complete betting record</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#5A5A5A] mb-1">Total P&L</p>
            <p className={cn("text-base font-black font-mono", totalWon >= 0 ? "text-green-400" : "text-red-400")}>
              {totalWon >= 0 ? "+" : ""}${totalWon.toFixed(2)}
            </p>
            <p className="text-[9px] text-[#3A3A3A] mt-0.5">All time</p>
          </div>
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#5A5A5A] mb-1">Win Rate</p>
            <p className="text-base font-black font-mono text-[#D4AF37]">{winRate}%</p>
            <p className="text-[9px] text-[#3A3A3A] mt-0.5">Settled bets</p>
          </div>
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#5A5A5A] mb-1">Total Wagered</p>
            <p className="text-base font-black font-mono text-white">${totalStaked}</p>
            <p className="text-[9px] text-[#3A3A3A] mt-0.5">{MOCK_BET_HISTORY.length} bets</p>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5 mb-4">
          {(["All", "Won", "Lost", "Pending"] as BetStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                activeStatus === s
                  ? s === "Won" ? "bg-green-400/15 text-green-400 border border-green-400/30"
                    : s === "Lost" ? "bg-red-400/15 text-red-400 border border-red-400/30"
                    : s === "Pending" ? "bg-amber-400/15 text-amber-400 border border-amber-400/30"
                    : "bg-white text-black"
                  : "bg-[#111111] text-[#5A5A5A] hover:text-white hover:bg-[#1A1A1A]"
              )}
            >
              {s}
              <span className="ml-1.5 text-[9px] opacity-70">
                {s === "All" ? MOCK_BET_HISTORY.length : MOCK_BET_HISTORY.filter((b) => b.status === s).length}
              </span>
            </button>
          ))}
        </div>

        {/* Bets list */}
        <div className="space-y-2">
          {filtered.map((bet) => {
            const cfg = STATUS_CONFIG[bet.status];
            const StatusIcon = cfg.icon;
            const sportColor = SPORT_COLORS[bet.sport] || "#D4AF37";
            const profit = bet.status === "Won" ? bet.payout - bet.stake : bet.status === "Lost" ? -bet.stake : 0;

            return (
              <div
                key={bet.id}
                className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-4 flex items-center gap-4 hover:border-[#2A2A2A] transition-all"
                style={{ borderLeft: `2px solid ${sportColor}` }}
              >
                {/* Status icon */}
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", cfg.bg)}>
                  <StatusIcon size={14} className={cfg.color} />
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ color: sportColor, backgroundColor: `${sportColor}18` }}
                    >
                      {bet.sport}
                    </span>
                    {bet.isParlay && (
                      <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-0.5">
                        <Trophy size={8} />
                        Parlay
                      </span>
                    )}
                    <span className="text-[9px] text-[#5A5A5A]">{bet.betType}</span>
                  </div>
                  <p className="text-[11px] font-bold text-white truncate">{bet.matchup}</p>
                  <p className="text-[10px] text-[#A0A0A0] truncate">{bet.selection}</p>
                </div>

                {/* Odds */}
                <div className="text-center shrink-0 hidden sm:block">
                  <p className="text-[9px] text-[#5A5A5A] uppercase tracking-wider mb-0.5">Odds</p>
                  <p className="text-sm font-bold font-mono text-white">{formatOdds(bet.odds)}</p>
                </div>

                {/* Stake */}
                <div className="text-center shrink-0 hidden md:block">
                  <p className="text-[9px] text-[#5A5A5A] uppercase tracking-wider mb-0.5">Stake</p>
                  <p className="text-sm font-mono text-white">${bet.stake}</p>
                </div>

                {/* P&L */}
                <div className="text-right shrink-0">
                  <p className="text-[9px] text-[#5A5A5A] uppercase tracking-wider mb-0.5">
                    {bet.status === "Pending" ? "Potential" : "P&L"}
                  </p>
                  <p className={cn(
                    "text-sm font-bold font-mono",
                    bet.status === "Won" ? "text-green-400"
                    : bet.status === "Lost" ? "text-red-400"
                    : "text-amber-400"
                  )}>
                    {bet.status === "Pending"
                      ? `$${bet.payout > 0 ? bet.payout.toFixed(2) : (bet.stake * 1.9).toFixed(2)}`
                      : bet.status === "Won"
                      ? `+$${profit.toFixed(2)}`
                      : `-$${bet.stake}`
                    }
                  </p>
                  {/* Status badge */}
                  <span className={cn("text-[9px] font-bold uppercase tracking-wider", cfg.color)}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Trophy size={32} className="text-[#2A2A2A] mb-3" />
            <p className="text-sm text-[#5A5A5A] font-medium">No bets found</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
