"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { toast } from "sonner"

export interface BetSlipItem {
  id: string
  marketId: number
  sport: string
  homeTeam: string
  awayTeam: string
  betType: string
  selection: string
  odds: number
}

interface BetSlipContextType {
  bets: BetSlipItem[]
  addBet: (bet: Omit<BetSlipItem, "id">) => void
  removeBet: (id: string) => void
  clearBets: () => void
  totalOdds: number
  potentialPayout: number
  stake: number
  setStake: (amount: number) => void
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined)

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function calculateTotalOdds(bets: BetSlipItem[]): number {
  if (bets.length === 0) return 0
  
  const decimalOdds = bets.reduce((acc, bet) => {
    const decimal = bet.odds > 0 ? bet.odds / 100 + 1 : 100 / Math.abs(bet.odds) + 1
    return acc * decimal
  }, 1)
  
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100)
  }
  return Math.round(-100 / (decimalOdds - 1))
}

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const [bets, setBets] = useState<BetSlipItem[]>([])
  const [stake, setStake] = useState(10)

  const addBet = useCallback((bet: Omit<BetSlipItem, "id">) => {
    setBets((prev) => {
      if (prev.some((b) => b.marketId === bet.marketId && b.selection === bet.selection)) {
        toast.info("Selection already in slip")
        return prev
      }
      if (prev.length >= 6) {
        toast.warning("Maximum 6 legs per parlay")
        return prev
      }
      toast.success("Added to bet slip")
      return [...prev, { ...bet, id: generateId() }]
    })
  }, [])

  const removeBet = useCallback((id: string) => {
    setBets((prev) => prev.filter((b) => b.id !== id))
    toast.info("Removed from bet slip")
  }, [])

  const clearBets = useCallback(() => {
    setBets([])
  }, [])

  const totalOdds = calculateTotalOdds(bets)
  
  const potentialPayout = stake * (
    totalOdds > 0 
      ? totalOdds / 100 + 1 
      : 100 / Math.abs(totalOdds) + 1
  )

  return (
    <BetSlipContext.Provider
      value={{
        bets,
        addBet,
        removeBet,
        clearBets,
        totalOdds,
        potentialPayout,
        stake,
        setStake,
      }}
    >
      {children}
    </BetSlipContext.Provider>
  )
}

export function useBetSlip() {
  const context = useContext(BetSlipContext)
  if (context === undefined) {
    throw new Error("useBetSlip must be used within a BetSlipProvider")
  }
  return context
}
