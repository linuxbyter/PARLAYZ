import { useState } from "react";
import { Sparkles, Plus, X, Loader2, TrendingUp, AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import { MOCK_MARKETS, formatOdds } from "@/lib/mockMarkets";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ParlayLeg {
  id: number;
  marketId: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  betType: string;
  selection: string;
  odds: number;
}

interface ParlaysuggestionResult {
  suggestions: Array<{
    legs: string[];
    confidence: number;
    combinedOdds: number;
    reasoning: string;
    riskLevel: "Low" | "Medium" | "High";
  }>;
  insight: string;
}

const RISK_CONFIG = {
  Low: { color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  Medium: { color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
  High: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
};

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? "#22C55E" : value >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#1F1F1F] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-bold font-mono" style={{ color }}>{value}%</span>
    </div>
  );
}

export default function ParlayAI() {
  const [selectedLegs, setSelectedLegs] = useState<ParlayLeg[]>([]);
  const [result, setResult] = useState<ParlaysuggestionResult | null>(null);
  const { addBet } = useBetSlip();

  const suggestMutation = trpc.parlay.suggest.useMutation({
    onSuccess: (data) => {
      setResult(data as ParlaysuggestionResult);
    },
    onError: () => {
      toast.error("Failed to generate suggestions. Please try again.");
    },
  });

  function addLeg(market: typeof MOCK_MARKETS[0]) {
    if (selectedLegs.find((l) => l.marketId === market.id)) {
      toast.info("Market already added");
      return;
    }
    if (selectedLegs.length >= 6) {
      toast.warning("Maximum 6 legs per parlay");
      return;
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
    ]);
    setResult(null);
  }

  function removeLeg(marketId: number) {
    setSelectedLegs((prev) => prev.filter((l) => l.marketId !== marketId));
    setResult(null);
  }

  function handleAnalyze() {
    if (selectedLegs.length < 2) {
      toast.warning("Add at least 2 legs to build a parlay");
      return;
    }
    suggestMutation.mutate({ markets: selectedLegs });
  }

  function addSuggestionToSlip(suggestion: ParlaysuggestionResult["suggestions"][0]) {
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
      });
    });
    toast.success("Parlay added to bet slip!");
  }

  const totalDecimalOdds = selectedLegs.reduce((acc, leg) => {
    const decimal = leg.odds > 0 ? leg.odds / 100 + 1 : 100 / Math.abs(leg.odds) + 1;
    return acc * decimal;
  }, 1);
  const parlayAmericanOdds = totalDecimalOdds >= 2
    ? Math.round((totalDecimalOdds - 1) * 100)
    : Math.round(-100 / (totalDecimalOdds - 1));

  return (
    <div className="min-h-screen bg-black text-white">
      <TopNav />

      <main className="max-w-[1000px] mx-auto px-4 pb-20 md:pb-8">
        {/* Header */}
        <div className="py-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-[#D4AF37]" />
            <h1 className="text-xl font-black text-white tracking-tight">Parlay AI</h1>
          </div>
          <p className="text-[11px] text-[#5A5A5A]">
            Select markets below, then let AI analyze and recommend optimal parlay combinations with confidence scores.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          {/* Left: Market selector */}
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#5A5A5A] mb-3">
              Available Markets — Select up to 6 legs
            </h2>
            <div className="space-y-2">
              {MOCK_MARKETS.map((market) => {
                const isAdded = selectedLegs.some((l) => l.marketId === market.id);
                return (
                  <div
                    key={market.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                      isAdded
                        ? "border-[#D4AF37] bg-[#D4AF3708]"
                        : "border-[#1F1F1F] bg-[#111111] hover:border-[#2A2A2A]"
                    )}
                    onClick={() => isAdded ? removeLeg(market.id) : addLeg(market)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#D4AF37]">
                          {market.sport}
                        </span>
                        {market.status === "live" && (
                          <span className="text-[9px] font-bold text-red-400 uppercase">LIVE</span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-white truncate">
                        {market.awayTeam} @ {market.homeTeam}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[9px] text-[#5A5A5A]">ML</p>
                        <p className="text-xs font-mono font-bold text-white">{formatOdds(market.homeOddsML)}</p>
                      </div>
                      <button
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                          isAdded
                            ? "bg-[#D4AF37] text-black"
                            : "bg-[#1F1F1F] text-[#5A5A5A] hover:bg-[#2A2A2A] hover:text-white"
                        )}
                      >
                        {isAdded ? <X size={10} /> : <Plus size={10} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Builder + Results */}
          <div className="space-y-4">
            {/* Parlay builder */}
            <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1F1F1F] flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                  Parlay Builder
                </span>
                {selectedLegs.length > 0 && (
                  <span className="text-[10px] font-bold text-[#D4AF37]">
                    {selectedLegs.length} leg{selectedLegs.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {selectedLegs.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <Plus size={20} className="text-[#2A2A2A] mx-auto mb-2" />
                  <p className="text-[11px] text-[#5A5A5A]">Add markets from the left to build your parlay</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {selectedLegs.map((leg) => (
                    <div key={leg.marketId} className="flex items-center gap-2 p-2 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F]">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-[#D4AF37] uppercase">{leg.sport}</p>
                        <p className="text-[10px] text-white truncate">{leg.homeTeam} vs {leg.awayTeam}</p>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-white shrink-0">{formatOdds(leg.odds)}</span>
                      <button onClick={() => removeLeg(leg.marketId)} className="text-[#3A3A3A] hover:text-red-400 transition-colors shrink-0">
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {selectedLegs.length >= 2 && (
                    <div className="pt-2 border-t border-[#1F1F1F]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-[#5A5A5A]">Combined Odds</span>
                        <span className="text-sm font-bold font-mono text-[#D4AF37]">
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
                  disabled={selectedLegs.length < 2 || suggestMutation.isPending}
                  className={cn(
                    "w-full py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                    selectedLegs.length >= 2
                      ? "bg-[#D4AF37] text-black hover:bg-[#E5C84A]"
                      : "bg-[#1F1F1F] text-[#5A5A5A] cursor-not-allowed"
                  )}
                >
                  {suggestMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Analyze with AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Results */}
            {result && (
              <div className="space-y-3">
                {/* Market insight */}
                <div className="bg-[#D4AF3710] border border-[#D4AF3730] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={12} className="text-[#D4AF37]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">AI Insight</span>
                  </div>
                  <p className="text-[11px] text-[#A0A0A0] leading-relaxed">{result.insight}</p>
                </div>

                {/* Suggestions */}
                {result.suggestions.map((suggestion, i) => {
                  const riskCfg = RISK_CONFIG[suggestion.riskLevel as keyof typeof RISK_CONFIG] || RISK_CONFIG.Medium;
                  return (
                    <div key={i} className="bg-[#111111] border border-[#1F1F1F] rounded-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-[#1F1F1F] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={12} className="text-[#D4AF37]" />
                          <span className="text-[11px] font-bold text-white">Suggestion {i + 1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border", riskCfg.bg, riskCfg.color)}>
                            {suggestion.riskLevel} Risk
                          </span>
                          <span className="text-[11px] font-bold font-mono text-[#D4AF37]">
                            {formatOdds(suggestion.combinedOdds)}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        {/* Legs */}
                        <div className="space-y-1">
                          {suggestion.legs.map((leg, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <ChevronRight size={10} className="text-[#D4AF37] shrink-0" />
                              <span className="text-[10px] text-[#A0A0A0]">{leg}</span>
                            </div>
                          ))}
                        </div>

                        {/* Confidence */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#5A5A5A]">Confidence</span>
                          </div>
                          <ConfidenceBar value={suggestion.confidence} />
                        </div>

                        {/* Reasoning */}
                        <p className="text-[10px] text-[#5A5A5A] leading-relaxed border-t border-[#1F1F1F] pt-3">
                          {suggestion.reasoning}
                        </p>

                        {/* Add to slip */}
                        <button
                          onClick={() => addSuggestionToSlip(suggestion)}
                          className="w-full py-2 rounded-lg bg-[#1F1F1F] text-[11px] font-bold text-white hover:bg-[#2A2A2A] transition-all flex items-center justify-center gap-1.5"
                        >
                          <Plus size={12} />
                          Add to Bet Slip
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#1F1F1F]">
              <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[9px] text-[#5A5A5A] leading-relaxed">
                AI suggestions are for informational purposes only. Always bet responsibly. Past performance does not guarantee future results.
              </p>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
