import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Clock, Zap } from "lucide-react";
import { MarketData, formatOdds } from "@/lib/mockMarkets";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { cn } from "@/lib/utils";

interface MarketCardProps {
  market: MarketData;
  activeBetType: "Moneyline" | "Spread" | "Over/Under";
}

const SPORT_COLORS: Record<string, string> = {
  NFL: "#D4AF37",
  NBA: "#FF6B35",
  MLB: "#4FC3F7",
  Soccer: "#66BB6A",
};

const SPORT_LABELS: Record<string, string> = {
  NFL: "NFL",
  NBA: "NBA",
  MLB: "MLB",
  Soccer: "⚽",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const diff = d.getDate() - today.getDate();
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MarketCard({ market, activeBetType }: MarketCardProps) {
  const { addBet, removeBet, hasBet } = useBetSlip();
  const [oddsFlash, setOddsFlash] = useState<Record<string, "up" | "down" | null>>({});
  const prevOddsRef = useRef<Record<string, number>>({});

  // Simulate live odds ticking
  useEffect(() => {
    if (market.status !== "live") return;
    const interval = setInterval(() => {
      // Odds would update from server in production
    }, 5000);
    return () => clearInterval(interval);
  }, [market.status]);

  const chartData = market.oddsHistory.map((v, i) => ({ i, v: Math.abs(v) }));
  const lastOdds = market.oddsHistory[market.oddsHistory.length - 1];
  const prevOdds = market.oddsHistory[market.oddsHistory.length - 2];
  const oddsMovingUp = lastOdds > prevOdds;

  const sportColor = SPORT_COLORS[market.sport] || "#D4AF37";

  // Determine which odds to show based on active bet type
  function getBetOptions() {
    if (activeBetType === "Moneyline") {
      return [
        {
          id: `${market.id}-ml-home`,
          label: market.homeTeam.split(" ").slice(-1)[0],
          odds: market.homeOddsML,
          selection: "home",
          betType: "moneyline" as const,
          line: null,
        },
        {
          id: `${market.id}-ml-away`,
          label: market.awayTeam.split(" ").slice(-1)[0],
          odds: market.awayOddsML,
          selection: "away",
          betType: "moneyline" as const,
          line: null,
        },
      ];
    }
    if (activeBetType === "Spread") {
      return [
        {
          id: `${market.id}-sp-home`,
          label: `${market.homeTeam.split(" ").slice(-1)[0]} ${market.spreadLine > 0 ? "+" : ""}${market.spreadLine}`,
          odds: market.homeOddsSpread,
          selection: "home",
          betType: "spread" as const,
          line: market.spreadLine,
        },
        {
          id: `${market.id}-sp-away`,
          label: `${market.awayTeam.split(" ").slice(-1)[0]} +${Math.abs(market.spreadLine)}`,
          odds: market.awayOddsSpread,
          selection: "away",
          betType: "spread" as const,
          line: market.spreadLine,
        },
      ];
    }
    // Over/Under
    return [
      {
        id: `${market.id}-ou-over`,
        label: `O ${market.totalLine}`,
        odds: market.overOdds,
        selection: "over",
        betType: "over" as const,
        line: market.totalLine,
      },
      {
        id: `${market.id}-ou-under`,
        label: `U ${market.totalLine}`,
        odds: market.underOdds,
        selection: "under",
        betType: "under" as const,
        line: market.totalLine,
      },
    ];
  }

  const betOptions = getBetOptions();

  function handleBetClick(opt: ReturnType<typeof getBetOptions>[0]) {
    if (hasBet(opt.id)) {
      removeBet(opt.id);
    } else {
      addBet({
        id: opt.id,
        marketId: market.id,
        sport: market.sport,
        homeTeam: market.homeTeam,
        awayTeam: market.awayTeam,
        betType: activeBetType,
        selection: opt.label,
        odds: opt.odds,
        line: opt.line != null ? String(opt.line) : null,
      });
    }
  }

  return (
    <div
      className="rounded-xl border border-[#1F1F1F] bg-[#111111] overflow-hidden transition-all duration-200 hover:border-[#2A2A2A] group"
      style={{ borderLeft: `2px solid ${sportColor}` }}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ color: sportColor, backgroundColor: `${sportColor}18` }}
          >
            {market.sport}
          </span>
          {market.status === "live" && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 uppercase tracking-wider">
              <Zap size={8} className="fill-red-400" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[#5A5A5A]">
          <Clock size={10} />
          <span className="text-[10px] font-medium font-mono">
            {formatDate(market.commenceTime)} · {formatTime(market.commenceTime)}
          </span>
        </div>
      </div>

      {/* Teams */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#5A5A5A] font-medium uppercase tracking-wider mb-0.5">
              {market.awayTeam}
            </p>
            <p className="text-sm font-bold text-white leading-tight">
              {market.homeTeam}
            </p>
          </div>
          {/* Sparkline */}
          <div className="w-20 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`grad-${market.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={oddsMovingUp ? "#22C55E" : "#EF4444"} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={oddsMovingUp ? "#22C55E" : "#EF4444"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={oddsMovingUp ? "#22C55E" : "#EF4444"}
                  strokeWidth={1.5}
                  fill={`url(#grad-${market.id})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-1">
            {oddsMovingUp ? (
              <TrendingUp size={12} className="text-green-400" />
            ) : (
              <TrendingDown size={12} className="text-red-400" />
            )}
            <span className={cn("text-[10px] font-mono font-bold", oddsMovingUp ? "text-green-400" : "text-red-400")}>
              {formatOdds(lastOdds)}
            </span>
          </div>
        </div>
      </div>

      {/* Sentiment Bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#5A5A5A]">Public</span>
          <div className="flex-1 h-1 rounded-full bg-[#1F1F1F] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${market.homePublicPct}%`,
                background: `linear-gradient(90deg, ${sportColor} 0%, ${sportColor}88 100%)`,
              }}
            />
          </div>
          <span className="text-[9px] font-mono font-bold text-[#A0A0A0]">
            {market.homePublicPct}% / {100 - market.homePublicPct}%
          </span>
        </div>
      </div>

      {/* Bet Buttons */}
      <div className="px-3 pb-3 grid grid-cols-2 gap-2">
        {betOptions.map((opt) => {
          const selected = hasBet(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => handleBetClick(opt)}
              className={cn(
                "flex flex-col items-center justify-center py-2.5 px-3 rounded-lg border transition-all duration-150",
                "text-center cursor-pointer",
                selected
                  ? "border-[#D4AF37] bg-[#D4AF3715] text-[#D4AF37]"
                  : "border-[#1F1F1F] bg-[#0A0A0A] text-white hover:border-[#2A2A2A] hover:bg-[#161616]"
              )}
            >
              <span className="text-[10px] font-medium text-[#A0A0A0] truncate w-full text-center leading-none mb-1">
                {opt.label}
              </span>
              <span className={cn("text-sm font-bold font-mono", selected ? "text-[#D4AF37]" : "text-white")}>
                {formatOdds(opt.odds)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
