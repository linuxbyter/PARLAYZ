'use client'

import { useState, useCallback } from 'react'

const KSH_RATE = 125.0

export type Currency = 'USDT' | 'KSH'

interface WalletState {
  balance: number
  currency: Currency
  activeBets: number
}

let globalBalance = 2138.00
let globalActiveBets = 3

export function useWallet() {
  const [balance, setBalance] = useState(globalBalance)
  const [currency, setCurrency] = useState<Currency>('USDT')
  const [activeBets, setActiveBets] = useState(globalActiveBets)

  const displayBalance = currency === 'USDT' ? balance : balance * KSH_RATE
  const displayCurrency = currency

  const toggleCurrency = useCallback(() => {
    setCurrency(prev => prev === 'USDT' ? 'KSH' : 'USDT')
  }, [])

  const addBalance = useCallback((amount: number) => {
    setBalance(prev => {
      globalBalance = prev + amount
      return globalBalance
    })
  }, [])

  const subtractBalance = useCallback((amount: number) => {
    setBalance(prev => {
      globalBalance = Math.max(0, prev - amount)
      return globalBalance
    })
  }, [])

  const incrementActiveBets = useCallback(() => {
    setActiveBets(prev => {
      globalActiveBets = prev + 1
      return globalActiveBets
    })
  }, [])

  const decrementActiveBets = useCallback(() => {
    setActiveBets(prev => {
      globalActiveBets = Math.max(0, prev - 1)
      return globalActiveBets
    })
  }, [])

  return {
    balance,
    displayBalance,
    currency,
    displayCurrency,
    activeBets,
    toggleCurrency,
    addBalance,
    subtractBalance,
    incrementActiveBets,
    decrementActiveBets,
  }
}
