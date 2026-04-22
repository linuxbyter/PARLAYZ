"use client"

import { useState } from "react"
import { Activity } from "lucide-react"
import { useBetSlip } from "@/src/contexts/BetSlipContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/src/components/ui/dialog"

// Updated interface: id is now a number to match BetSlipItem requirements
interface PredictionMarket {
  id: number
  category: string
  question: string
  volume: string
  endDate: string
  yesPrice: number
  noPrice: number
}

export function MarketCard({ market }: { market: PredictionMarket }) {
  const { addBet } = useBetSlip()
  const [isOpen, setIsOpen] = useState(false)

  const handleAddBet = (selection: "YES" | "NO", price: number) => {
    addBet({
      marketId: market.id, // Corrected: passing number to number
      sport: market.category,
      selection: selection,
      homeTeam: market.question,
      awayTeam: "",
      betType: "Prediction Market",
      odds: price / 100, // Converts 74¢ to 0.74 decimal odds
    })
  }

  return (
    <div className="p-4 rounded-xl bg-[var(--black-card)] border border-[var(--black-border)] hover:border-[var(--black-dim)] transition-all flex flex-col justify-between h-full group">
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold)] px-2 py-1 bg-[var(--black-soft)] rounded">
          {market.category}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D27D] animate-pulse"></span>
          <span className="text-[10px] font-bold text-[#00D27D] uppercase tracking-tighter">Live</span>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="cursor-pointer mb-6">
            <h3 className="text-[15px] font-bold text-white leading-tight group-hover:text-[var(--gold)] transition-colors line-clamp-2">
              {market.question}
            </h3>
          </div>
        </DialogTrigger>

        <DialogContent className="bg-[var(--black)] border-[var(--black-border)] text-white max-w-2xl p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold leading-tight">{market.question}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="h-48 border border-[var(--black-border)] rounded-xl bg-[var(--black-soft)] relative flex items-end overflow-hidden">
                <svg className="w-full h-full text-[var(--gold)] opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M0,100 L0,70 Q25,80 50,40 T100,10 L100,100 Z" fill="currentColor" fillOpacity="0.1" />
                  <path d="M0,70 Q25,80 50,40 T100,10" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <div className="absolute top-4 left-4 text-3xl font-black text-[#00D27D]">{market.yesPrice}¢</div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-black uppercase">
                  <span className="text-[#00D27D]">YES {market.yesPrice}%</span>
                  <span className="text-[#F23F43]">NO {market.noPrice}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--black-border)] flex overflow-hidden">
                  <div className="bg-[#00D27D] h-full" style={{ width: `${market.yesPrice}%` }}></div>
                  <div className="bg-[#F23F43] h-full" style={{ width: `${market.noPrice}%` }}></div>
                </div>
              </div>
            </div>
            <div className="border border-[var(--black-border)] rounded-xl p-4 bg-[var(--black-soft)]">
              <h4 className="text-[10px] font-black text-[var(--black-dim)] mb-4 uppercase">Orderbook</h4>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-[#F23F43]"><span>0.28</span><span className="text-white/40">14k</span></div>
                <div className="border-y border-[var(--black-border)] my-2 py-1 text-center text-white text-xs">0.265</div>
                <div className="flex justify-between text-[#00D27D]"><span>0.25</span><span className="text-white/40">8.2k</span></div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-auto pt-3 border-t border-[var(--black-border)]">
        <div className="flex justify-between text-[10px] font-bold text-[var(--black-dim)] mb-3 uppercase">
          <span className="flex items-center gap-1"><Activity size={10}/> {market.volume} Vol</span>
          <span>{market.endDate}</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleAddBet("YES", market.yesPrice)} 
            className="flex-1 py-2.5 rounded-lg border border-[#00D27D]/30 bg-[#00D27D]/10 hover:bg-[#00D27D]/20 text-[#00D27D] font-black text-sm transition-all active:scale-95"
          >
            YES {market.yesPrice}¢
          </button>
          <button 
            onClick={() => handleAddBet("NO", market.noPrice)} 
            className="flex-1 py-2.5 rounded-lg border border-[#F23F43]/30 bg-[#F23F43]/10 hover:bg-[#F23F43]/20 text-[#F23F43] font-black text-sm transition-all active:scale-95"
          >
            NO {market.noPrice}¢
          </button>
        </div>
      </div>
    </div>
  )
}

export default MarketCard
