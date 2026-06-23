"use client"

import { useState } from "react"
import { useBetSlip } from "@/src/contexts/BetSlipContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/src/components/ui/dialog"

// Updated interface: id is now a number to match BetSlipItem requirements
interface SportsMarket {
  id: number
  sport: string
  homeTeam: string
  awayTeam: string
  league?: string
  startTime: string
  homeOdds: number  // American odds format (e.g., 150 for +150, -200 for -200)
  awayOdds: number  // American odds format
}

export function MarketCard({ market }: { market: SportsMarket }) {
  const { addBet } = useBetSlip()
  const [isOpen, setIsOpen] = useState(false)

  const handleAddBet = (team: "home" | "away", amount: number) => {
    // For simplicity, we're using a fixed stake amount for now
    // In a real implementation, this would use the selected amount
    const odds = team === "home" ? market.homeOdds : market.awayOdds
    addBet({
      marketId: market.id,
      sport: market.sport,
      selection: team === "home" ? market.homeTeam : market.awayTeam,
      amount: amount, // This would come from a bet amount selector
      odds: odds,
    })
  }

  return (
    <div className="bg-[#111] border border-[#2D2D2D] rounded-xl overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold text-gray-500 uppercase">
            {market.sport}
          </span>
          <span className="text-xs text-gray-400">
            {market.league || ''}
          </span>
        </div>
        
        <div className="mb-3">
          <h3 className="font-bold text-white text-lg">
            {market.homeTeam}
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            vs
          </p>
          <h3 className="font-bold text-white text-lg">
            {market.awayTeam}
          </h3>
        </div>
        
        <div className="text-xs text-gray-500 mb-2">
          {new Date(market.startTime).toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </div>
      </div>
      
      <div className="border-t border-[#2D2D2D]">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#1a1a1a]">
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-500 uppercase">Place Bet</p>
                <p className="text-sm text-white">Select team and enter amount</p>
              </div>
              <span className="text-xs text-gray-400">▼</span>
            </div>
          </DialogTrigger>
          
          <DialogContent className="bg-[#111] border border-[#2D2D2D] text-white p-4">
            <DialogHeader className="mb-3">
              <DialogTitle className="text-lg font-bold text-white">
                Place your bet
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Team Selection */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase">Select Team</p>
                <div className="flex gap-3">
                  <label className="flex flex-col items-center flex-1">
                    <input
                      type="radio"
                      name="team"
                      value="home"
                      defaultChecked
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-lg border border-[#2D2D2D] flex items-center justify-center mb-2">
                      <span className="font-bold text-white text-xs">{market.homeTeam.slice(0, 3)}</span>
                    </div>
                    <span className="text-xs font-bold text-white mt-1">
                      {market.homeTeam}
                    </span>
                  </label>
                  <label className="flex flex-col items-center flex-1">
                    <input
                      type="radio"
                      name="team"
                      value="away"
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-lg border border-[#2D2D2D] flex items-center justify-center mb-2">
                      <span className="font-bold text-white text-xs">{market.awayTeam.slice(0, 3)}</span>
                    </div>
                    <span className="text-xs font-bold text-white mt-1">
                      {market.awayTeam}
                    </span>
                  </label>
                </div>
              </div>
              
              {/* Amount Input */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase">Amount (KSh)</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {/* Handle quick amount selection */}}
                    className="flex-1 px-3 py-2 text-xs font-bold text-gray-400 bg-[#1a1a1a] border border-[#2D2D2D] hover:text-white hover:border-gray-400"
                  >
                    500
                  </button>
                  <button
                    onClick={() => {/* Handle quick amount selection */}}
                    className="flex-1 px-3 py-2 text-xs font-bold text-gray-400 bg-[#1a1a1a] border border-[#2D2D2D] hover:text-white hover:border-gray-400"
                  >
                    1000
                  </button>
                  <button
                    onClick={() => {/* Handle quick amount selection */}}
                    className="flex-1 px-3 py-2 text-xs font-bold text-gray-400 bg-[#1a1a1a] border border-[#2D2D2D] hover:text-white hover:border-gray-400"
                  >
                    2000
                  </button>
                </div>
                <input
                  type="number"
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 text-xs font-bold text-white bg-[#1a1a1a] border border-[#2D2D2D] rounded-lg"
                />
              </div>
              
              {/* Potential Payout */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase">Potential Payout</p>
                <p className="text-sm font-mono text-gray-400">KSh 0.00</p>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-[#2D2D2D]">
              <button
                onClick={() => {
                  setIsOpen(false)
                  // In a real implementation, we would collect the selected values and place the bet
                }}
                className="w-full px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-lg hover:opacity-90 transition"
              >
                Place Bet
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="px-4 py-3 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Home Odds: {market.homeOdds > 0 ? `+${market.homeOdds}` : market.homeOdds}</span>
          <span>Away Odds: {market.awayOdds > 0 ? `+${market.awayOdds}` : market.awayOdds}</span>
        </div>
      </div>
    </div>
  )
}

export default MarketCard
