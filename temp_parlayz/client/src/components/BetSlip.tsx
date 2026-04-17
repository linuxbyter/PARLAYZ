import { useState } from "react";
import { X, Trash2, ChevronRight, Loader2, CheckCircle } from "lucide-react";
import { useBetSlip } from "@/contexts/BetSlipContext";
import { useWallet } from "@/contexts/WalletContext";
import { formatOdds } from "@/lib/mockMarkets";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

function americanToDecimal(odds: number): number {
  if (odds > 0) return odds / 100 + 1;
  return 100 / Math.abs(odds) + 1;
}

export default function BetSlip() {
  const { items, stake, setStake, removeBet, clearSlip, potentialPayout, totalOdds, isOpen, toggleSlip } = useBetSlip();
  const { connected, address } = useWallet();
  const { isAuthenticated } = useAuth();
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const placeBetMutation = trpc.bets.place.useMutation();

  const stakeNum = parseFloat(stake) || 0;
  const isParlay = items.length > 1;

  async function handlePlaceBet() {
    if (!connected) {
      toast.error("Connect your wallet to place bets");
      return;
    }
    if (stakeNum <= 0) {
      toast.error("Enter a valid stake amount");
      return;
    }
    setPlacing(true);
    try {
      if (isAuthenticated && items.length > 0) {
        // Place each leg via tRPC
        const parlayId = isParlay ? `parlay-${Date.now()}` : undefined;
        for (const item of items) {
          await placeBetMutation.mutateAsync({
            marketId: item.marketId,
            betType: item.betType.toLowerCase().replace("/", "").replace(" ", "") as "moneyline" | "spread" | "over" | "under",
            selection: item.selection,
            odds: item.odds,
            stake: stakeNum,
            potentialPayout,
            isParlay: isParlay ? 1 : 0,
            parlayId,
          });
        }
      }
      setPlaced(true);
      toast.success(`Bet placed! Potential payout: $${potentialPayout.toFixed(2)}`);
      setTimeout(() => {
        setPlaced(false);
        clearSlip();
      }, 2000);
    } catch {
      toast.error("Failed to place bet. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  const QUICK_STAKES = ["5", "10", "25", "50", "100"];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop (mobile) */}
      <div
        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        onClick={toggleSlip}
      />

      {/* Drawer */}
      <div className={cn(
        "fixed z-50 flex flex-col",
        "bottom-16 left-0 right-0 max-h-[80vh] rounded-t-2xl lg:rounded-none",
        "lg:top-0 lg:right-0 lg:bottom-0 lg:left-auto lg:w-[340px] lg:max-h-none",
        "bg-[#0A0A0A] border-t border-[#1F1F1F] lg:border-t-0 lg:border-l",
        "overflow-hidden"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F1F] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Bet Slip</span>
            {items.length > 0 && (
              <span className="text-[10px] font-bold bg-[#D4AF37] text-black rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {items.length}
              </span>
            )}
            {isParlay && (
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Parlay</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearSlip}
                className="text-[#5A5A5A] hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button onClick={toggleSlip} className="text-[#5A5A5A] hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 rounded-xl bg-[#1F1F1F] flex items-center justify-center mb-3">
              <ChevronRight size={20} className="text-[#5A5A5A]" />
            </div>
            <p className="text-sm font-medium text-[#5A5A5A] text-center">
              Select odds to add bets
            </p>
            <p className="text-[11px] text-[#3A3A3A] text-center mt-1">
              Tap any odds button on a market card
            </p>
          </div>
        )}

        {/* Bets list */}
        {items.length > 0 && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#111111] rounded-lg border border-[#1F1F1F] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#D4AF37]">
                          {item.sport}
                        </span>
                        <span className="text-[9px] text-[#5A5A5A]">·</span>
                        <span className="text-[9px] font-medium text-[#5A5A5A] uppercase tracking-wider">
                          {item.betType}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-white leading-tight truncate">
                        {item.homeTeam} vs {item.awayTeam}
                      </p>
                      <p className="text-[11px] text-[#A0A0A0] mt-0.5 truncate">
                        {item.selection}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold font-mono text-[#D4AF37]">
                        {formatOdds(item.odds)}
                      </span>
                      <button
                        onClick={() => removeBet(item.id)}
                        className="text-[#3A3A3A] hover:text-red-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Parlay summary */}
            {isParlay && (
              <div className="mx-3 mb-2 p-3 rounded-lg bg-[#D4AF3710] border border-[#D4AF3730]">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                    Parlay Odds
                  </span>
                  <span className="text-sm font-bold font-mono text-[#D4AF37]">
                    {formatOdds(Math.round((totalOdds - 1) * 100))}
                  </span>
                </div>
              </div>
            )}

            {/* Stake */}
            <div className="px-3 pb-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A5A] block mb-2">
                Stake (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A5A] text-sm font-mono">$</span>
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  className="w-full bg-[#111111] border border-[#1F1F1F] rounded-lg pl-7 pr-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              {/* Quick stake buttons */}
              <div className="flex gap-1.5 mt-2">
                {QUICK_STAKES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStake(s)}
                    className={cn(
                      "flex-1 py-1 rounded text-[10px] font-bold font-mono border transition-all",
                      stake === s
                        ? "border-[#D4AF37] text-[#D4AF37] bg-[#D4AF3710]"
                        : "border-[#1F1F1F] text-[#5A5A5A] hover:border-[#2A2A2A] hover:text-white"
                    )}
                  >
                    ${s}
                  </button>
                ))}
              </div>
            </div>

            {/* Payout */}
            <div className="mx-3 mb-3 p-3 rounded-lg bg-[#111111] border border-[#1F1F1F]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-[#5A5A5A] font-medium">Stake</span>
                <span className="text-[11px] font-mono text-white">${stakeNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A5A]">
                  Potential Payout
                </span>
                <span className="text-base font-bold font-mono text-[#D4AF37]">
                  ${potentialPayout.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Place Bet CTA */}
            <div className="px-3 pb-4">
              <button
                onClick={handlePlaceBet}
                disabled={placing || placed || stakeNum <= 0}
                className={cn(
                  "w-full py-3 rounded-lg font-bold text-sm transition-all duration-200",
                  placed
                    ? "bg-green-500 text-white"
                    : "bg-[#D4AF37] text-black hover:bg-[#E5C84A] disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {placing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Confirming...
                  </span>
                ) : placed ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle size={14} />
                    Bet Placed!
                  </span>
                ) : !connected ? (
                  "Connect Wallet to Bet"
                ) : (
                  `Place ${isParlay ? "Parlay " : ""}Bet · $${stakeNum.toFixed(2)}`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
