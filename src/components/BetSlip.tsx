"use client"

import { useState } from "react"
import { X, Plus, Minus, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { useBetSlip } from "@/src/contexts/BetSlipContext"
import { Button } from "@/src/components/ui/button"
import { formatOdds } from "@/src/lib/mockMarkets"
import { cn } from "@/src/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/src/components/ui/sheet"

export default function BetSlip() {
  const { bets, removeBet, clearBets, totalOdds, potentialPayout, stake, setStake } = useBetSlip()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isPlacing, setIsPlacing] = useState(false)

  const handlePlaceBet = async () => {
    setIsPlacing(true)
    await new Promise((r) => setTimeout(r, 1500))
    setIsPlacing(false)
    clearBets()
  }

  const incrementStake = () => setStake(Math.min(stake + 10, 10000))
  const decrementStake = () => setStake(Math.max(stake - 10, 1))

  const SlipContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--black-border)]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold flex items-center gap-2 text-white">
            Bet Slip
            {bets.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--gold)] text-black text-xs font-bold">
                {bets.length}
              </span>
            )}
          </h3>
          {bets.length > 0 && (
            <button
              onClick={clearBets}
              className="text-[10px] font-bold text-[var(--black-dim)] hover:text-[var(--status-lost)] transition-colors uppercase tracking-wider"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {bets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--black-border)] flex items-center justify-center mb-4">
              <Plus className="w-5 h-5 text-[var(--black-dim)]" />
            </div>
            <p className="text-sm font-medium text-white mb-1">No selections</p>
            <p className="text-[11px] text-[var(--black-dim)]">
              Click on odds to add bets to your slip
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {bets.map((bet) => (
              <div
                key={bet.id}
                className="p-3 rounded-lg bg-[var(--black-soft)] border border-[var(--black-border)]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--gold)]">
                      {bet.sport}
                    </span>
                    <p className="text-[11px] font-medium text-white truncate">
                      {bet.selection}
                    </p>
                    <p className="text-[10px] text-[var(--black-dim)]">
                      {bet.homeTeam} vs {bet.awayTeam}
                    </p>
                  </div>
                  <button
                    onClick={() => removeBet(bet.id)}
                    className="p-1 rounded hover:bg-[var(--black-border)] text-[var(--black-dim)] hover:text-[var(--status-lost)] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--black-dim)]">{bet.betType}</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {formatOdds(bet.odds)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {bets.length > 0 && (
        <div className="border-t border-[var(--black-border)] p-4 space-y-4 bg-[var(--black-card)]">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--black-dim)]">
            <span>Parlay Odds</span>
            <span className="text-[var(--gold)]">{formatOdds(totalOdds)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--black-dim)]">
              Stake (USDT)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={decrementStake}
                className="w-7 h-7 rounded-lg bg-[var(--black-border)] hover:bg-[var(--black-muted)] flex items-center justify-center transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(Number(e.target.value))}
                className="w-20 bg-transparent text-center text-lg font-mono font-bold text-white focus:outline-none"
              />
              <button
                onClick={incrementStake}
                className="w-7 h-7 rounded-lg bg-[var(--black-border)] hover:bg-[var(--black-muted)] flex items-center justify-center transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--black-border)]">
            <span className="text-xs font-bold text-white">Potential Payout</span>
            <span className="text-sm font-mono font-bold text-[var(--gold)]">
              ${potentialPayout.toFixed(2)}
            </span>
          </div>

          <Button
            onClick={handlePlaceBet}
            disabled={isPlacing}
            className="w-full h-12 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-black font-bold text-sm"
          >
            {isPlacing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Placing Bet...
              </>
            ) : (
              `Place ${bets.length} Leg Parlay`
            )}
          </Button>

          <p className="text-[9px] text-center text-[var(--black-dim)]">
            By placing this bet, you agree to the terms of service
          </p>
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="hidden lg:block fixed right-0 top-14 bottom-0 w-[340px] z-30">
        <div className="h-full bg-[var(--black)] border-l border-[var(--black-border)]">
          <SlipContent />
        </div>
      </div>

      <div className="lg:hidden fixed bottom-16 right-4 z-40">
        <Sheet>
          <SheetTrigger asChild>
            <button className="relative w-14 h-14 rounded-full bg-[var(--gold)] text-black shadow-lg flex items-center justify-center hover:bg-[var(--gold-light)] transition-all hover:scale-105">
              {bets.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--status-lost)] text-white text-[10px] font-bold flex items-center justify-center">
                  {bets.length}
                </span>
              )}
              <span className="text-lg font-black">+</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0 overflow-hidden">
            <SlipContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}