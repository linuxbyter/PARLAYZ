"use client"

import { useState } from "react"
import { useBetSlip } from "@/src/contexts/BetSlipContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/src/components/ui/dialog"

export interface SportsMarket {
  id: number
  sport: string
  homeTeam: string
  awayTeam: string
  league?: string
  startTime: string
  homeOdds: number
  awayOdds: number
  status?: "live" | "pregame" | "finished"
}

export function MarketCard({ market }: { market: SportsMarket }) {
  const { addBet } = useBetSlip()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away">("home")
  const [betAmount, setBetAmount] = useState("500")

  const selectedOdds = selectedTeam === "home" ? market.homeOdds : market.awayOdds
  const selectedName = selectedTeam === "home" ? market.homeTeam : market.awayTeam

  const formatOdds = (odds: number) => odds > 0 ? `+${odds}` : `${odds}`

  const potentialPayout = (() => {
    const amount = parseFloat(betAmount) || 0
    const decimal = selectedOdds > 0
      ? selectedOdds / 100 + 1
      : 100 / Math.abs(selectedOdds) + 1
    return (amount * decimal).toFixed(2)
  })()

  const handleAddBet = () => {
    addBet({
      marketId: market.id,
      sport: market.sport,
      homeTeam: market.homeTeam,
      awayTeam: market.awayTeam,
      betType: "Moneyline",
      selection: selectedName,
      odds: selectedOdds,
    })
    setIsOpen(false)
  }

  return (
    <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-xl overflow-hidden hover:border-[var(--black-muted)] transition-all">
      <div className="px-4 py-3">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--gold)]">
            {market.sport}
          </span>
          <span className="text-[9px] font-medium text-[var(--black-dim)]">
            {market.league || ''}
          </span>
        </div>

        <div className="mb-3">
          <h3 className="font-bold text-white text-sm leading-tight">
            {market.homeTeam}
          </h3>
          <p className="text-[10px] text-[var(--black-dim)] font-medium my-1">vs</p>
          <h3 className="font-bold text-white text-sm leading-tight">
            {market.awayTeam}
          </h3>
        </div>

        <div className="text-[10px] text-[var(--black-subtle)] font-mono">
          {new Date(market.startTime).toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </div>
      </div>

      <div className="border-t border-[var(--black-border)]">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-[var(--black-soft)] transition-colors">
              <div className="flex gap-3">
                <span className="text-[10px] font-bold text-[var(--status-won)]">
                  {market.homeTeam.split(' ').pop()} {formatOdds(market.homeOdds)}
                </span>
                <span className="text-[10px] text-[var(--black-dim)]">|</span>
                <span className="text-[10px] font-bold text-[var(--status-lost)]">
                  {market.awayTeam.split(' ').pop()} {formatOdds(market.awayOdds)}
                </span>
              </div>
              <span className="text-[10px] text-[var(--gold)] font-bold">Place Bet</span>
            </div>
          </DialogTrigger>

          <DialogContent className="bg-[var(--black)] border border-[var(--black-border)] text-white p-6 max-w-sm">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-base font-bold text-white">
                {market.homeTeam} vs {market.awayTeam}
              </DialogTitle>
              <p className="text-[10px] text-[var(--black-dim)]">{market.sport} · {market.league}</p>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--black-dim)] mb-2">Pick Winner</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTeam("home")}
                    className={`flex-1 py-2.5 rounded-lg border text-[11px] font-bold transition-all ${
                      selectedTeam === "home"
                        ? "border-[var(--status-won)] bg-[var(--status-won-bg)] text-[var(--status-won)]"
                        : "border-[var(--black-border)] text-[var(--black-dim)] hover:text-white"
                    }`}
                  >
                    {market.homeTeam.split(' ').pop()} {formatOdds(market.homeOdds)}
                  </button>
                  <button
                    onClick={() => setSelectedTeam("away")}
                    className={`flex-1 py-2.5 rounded-lg border text-[11px] font-bold transition-all ${
                      selectedTeam === "away"
                        ? "border-[var(--status-lost)] bg-[var(--status-lost-bg)] text-[var(--status-lost)]"
                        : "border-[var(--black-border)] text-[var(--black-dim)] hover:text-white"
                    }`}
                  >
                    {market.awayTeam.split(' ').pop()} {formatOdds(market.awayOdds)}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--black-dim)] mb-2">Stake (KSh)</p>
                <div className="flex gap-2 mb-2">
                  {[500, 1000, 2000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setBetAmount(String(amt))}
                      className={`flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all ${
                        betAmount === String(amt)
                          ? "border-[var(--gold)] text-[var(--gold)] bg-[var(--gold-muted)]"
                          : "border-[var(--black-border)] text-[var(--black-dim)] hover:text-white"
                      }`}
                    >
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={betAmount}
                  onChange={e => setBetAmount(e.target.value)}
                  className="w-full bg-[var(--black-soft)] border border-[var(--black-border)] text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--gold)]"
                />
              </div>

              <div className="bg-[var(--black-soft)] rounded-lg p-3">
                <div className="flex justify-between text-[10px] text-[var(--black-dim)] mb-1">
                  <span>Odds</span>
                  <span className="font-mono text-white">{formatOdds(selectedOdds)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-[var(--black-dim)] mb-1">
                  <span>Stake</span>
                  <span className="font-mono text-white">KSh {parseFloat(betAmount || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold pt-2 border-t border-[var(--black-border)]">
                  <span className="text-[var(--gold)]">Potential Payout</span>
                  <span className="font-mono text-[var(--gold)]">KSh {parseFloat(potentialPayout).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleAddBet}
              className="w-full py-3 rounded-lg bg-[var(--gold)] text-black font-bold text-sm uppercase tracking-wider hover:bg-[var(--gold-light)] transition-all mt-2"
            >
              Add to Bet Slip
            </button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default MarketCard
