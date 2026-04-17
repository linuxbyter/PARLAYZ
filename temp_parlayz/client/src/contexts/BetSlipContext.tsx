import React, { createContext, useContext, useState, useCallback } from "react";

export interface BetSlipItem {
  id: string;
  marketId: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  betType: string;
  selection: string;
  odds: number;
  line?: string | number | null;
}

interface BetSlipState {
  items: BetSlipItem[];
  stake: string;
  isOpen: boolean;
}

interface BetSlipContextValue extends BetSlipState {
  addBet: (item: BetSlipItem) => void;
  removeBet: (id: string) => void;
  clearSlip: () => void;
  setStake: (stake: string) => void;
  toggleSlip: () => void;
  openSlip: () => void;
  potentialPayout: number;
  totalOdds: number;
  hasBet: (id: string) => boolean;
}

const BetSlipContext = createContext<BetSlipContextValue | null>(null);

function americanToDecimal(odds: number): number {
  if (odds > 0) return odds / 100 + 1;
  return 100 / Math.abs(odds) + 1;
}

export function BetSlipProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BetSlipItem[]>([]);
  const [stake, setStakeValue] = useState("10");
  const [isOpen, setIsOpen] = useState(false);

  const addBet = useCallback((item: BetSlipItem) => {
    setItems((prev) => {
      if (prev.find((b) => b.id === item.id)) return prev;
      return [...prev, item];
    });
    setIsOpen(true);
  }, []);

  const removeBet = useCallback((id: string) => {
    setItems((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const clearSlip = useCallback(() => {
    setItems([]);
    setStakeValue("10");
  }, []);

  const setStake = useCallback((s: string) => {
    setStakeValue(s);
  }, []);

  const toggleSlip = useCallback(() => setIsOpen((o) => !o), []);
  const openSlip = useCallback(() => setIsOpen(true), []);

  const hasBet = useCallback((id: string) => items.some((b) => b.id === id), [items]);

  // Parlay total odds (multiply all decimal odds)
  const totalOdds = items.reduce((acc, item) => {
    return acc * americanToDecimal(item.odds);
  }, 1);

  const stakeNum = parseFloat(stake) || 0;
  const potentialPayout = stakeNum * totalOdds;

  return (
    <BetSlipContext.Provider
      value={{
        items,
        stake,
        isOpen,
        addBet,
        removeBet,
        clearSlip,
        setStake,
        toggleSlip,
        openSlip,
        potentialPayout,
        totalOdds,
        hasBet,
      }}
    >
      {children}
    </BetSlipContext.Provider>
  );
}

export function useBetSlip() {
  const ctx = useContext(BetSlipContext);
  if (!ctx) throw new Error("useBetSlip must be used within BetSlipProvider");
  return ctx;
}
