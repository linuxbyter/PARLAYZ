import { useState, useEffect, useRef } from "react";
import { RefreshCw, TrendingUp, Activity } from "lucide-react";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import BetSlip from "@/components/BetSlip";
import MarketCard from "@/components/MarketCard";
import { MOCK_MARKETS, MarketData } from "@/lib/mockMarkets";
import { cn } from "@/lib/utils";

type Sport = "ALL" | "NFL" | "NBA" | "MLB" | "Soccer";
type BetType = "Moneyline" | "Spread" | "Over/Under";

const SPORTS: Sport[] = ["ALL", "NFL", "NBA", "MLB", "Soccer"];
const BET_TYPES: BetType[] = ["Moneyline", "Spread", "Over/Under"];

const SPORT_EMOJI: Record<string, string> = {
  ALL: "🏆",
  NFL: "🏈",
  NBA: "🏀",
  MLB: "⚾",
  Soccer: "⚽",
};

export default function Home() {
  const [activeSport, setActiveSport] = useState<Sport>("ALL");
  const [activeBetType, setActiveBetType] = useState<BetType>("Moneyline");
  const [markets, setMarkets] = useState<MarketData[]>(MOCK_MARKETS);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulate live odds ticking for LIVE markets
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setMarkets((prev) =>
        prev.map((m) => {
          if (m.status !== "live") return m;
          const delta = Math.floor(Math.random() * 5) - 2;
          const newOdds = m.homeOddsML + delta;
          return {
            ...m,
            homeOddsML: newOdds,
            awayOddsML: -newOdds - 10,
            oddsHistory: [...m.oddsHistory.slice(1), newOdds],
          };
        })
      );
      setLastUpdated(new Date());
    }, 4000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setLastUpdated(new Date());
    setRefreshing(false);
  }

  const filteredMarkets = activeSport === "ALL"
    ? markets
    : markets.filter((m) => m.sport === activeSport);

  const liveCount = markets.filter((m) => m.status === "live").length;

  return (
    <div className="min-h-screen bg-black text-white">
      <TopNav />

      <main className="max-w-[1400px] mx-auto px-4 pb-20 md:pb-8 lg:pr-[360px]">
        {/* Hero strip */}
        <div className="py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Live Markets</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[10px] font-medium text-[#5A5A5A]">
                {filteredMarkets.length} markets
              </span>
              {liveCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
                  <Activity size={8} className="animate-pulse" />
                  {liveCount} LIVE
                </span>
              )}
              <span className="text-[10px] text-[#3A3A3A] font-mono">
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg border border-[#1F1F1F] text-[#5A5A5A] hover:text-white hover:border-[#2A2A2A] transition-all"
          >
            <RefreshCw size={14} className={cn(refreshing && "animate-spin")} />
          </button>
        </div>

        {/* Sport filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide mb-3">
          {SPORTS.map((sport) => (
            <button
              key={sport}
              onClick={() => setActiveSport(sport)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold whitespace-nowrap transition-all shrink-0",
                activeSport === sport
                  ? "border-[#D4AF37] text-[#D4AF37] bg-[#D4AF3712]"
                  : "border-[#1F1F1F] text-[#5A5A5A] hover:border-[#2A2A2A] hover:text-white"
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

        {/* Bet type filter */}
        <div className="flex gap-1.5 mb-5">
          {BET_TYPES.map((bt) => (
            <button
              key={bt}
              onClick={() => setActiveBetType(bt)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                activeBetType === bt
                  ? "bg-white text-black"
                  : "bg-[#111111] text-[#5A5A5A] hover:text-white hover:bg-[#1A1A1A]"
              )}
            >
              {bt}
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: "Total Volume", value: "$2.4M", sub: "+12.3% today" },
            { label: "Open Markets", value: filteredMarkets.length.toString(), sub: `${liveCount} live now` },
            { label: "Avg Odds", value: "-112", sub: "Moneyline" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#5A5A5A] mb-1">{stat.label}</p>
              <p className="text-base font-black font-mono text-white">{stat.value}</p>
              <p className="text-[9px] text-[#3A3A3A] font-medium mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Market grid */}
        {filteredMarkets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <TrendingUp size={32} className="text-[#2A2A2A] mb-3" />
            <p className="text-sm text-[#5A5A5A] font-medium">No markets available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredMarkets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                activeBetType={activeBetType}
              />
            ))}
          </div>
        )}
      </main>

      {/* Desktop Bet Slip (persistent right panel) */}
      <div className="hidden lg:block">
        <BetSlip />
      </div>

      {/* Mobile Bet Slip (bottom sheet) */}
      <div className="lg:hidden">
        <BetSlip />
      </div>

      <BottomNav />
    </div>
  );
}
