'use client'

import { useState, useCallback, useEffect, createContext, useContext } from 'react'
import { supabase, isSupabaseReady } from '@/src/lib/supabase'

export type Currency = 'USDT' | 'KSH'
const KSH_RATE = 125.0

interface CurrencyContextType {
  currency: Currency
  toggleCurrency: () => void
  convert: (amount: number) => number
  displaySymbol: string
  displayCurrency: Currency
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USDT',
  toggleCurrency: () => {},
  convert: (a) => a,
  displaySymbol: '$',
  displayCurrency: 'USDT',
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('parlayz_currency') as Currency) || 'USDT'
    }
    return 'USDT'
  })

  const toggleCurrency = useCallback(() => {
    setCurrency(prev => {
      const next = prev === 'USDT' ? 'KSH' : 'USDT'
      if (typeof window !== 'undefined') localStorage.setItem('parlayz_currency', next)
      return next
    })
  }, [])

  const convert = useCallback((amount: number) => {
    return currency === 'KSH' ? amount * KSH_RATE : amount
  }, [currency])

  const displaySymbol = currency === 'USDT' ? '$' : 'KSh '

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, convert, displaySymbol, displayCurrency: currency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}

let globalBalance = 0
let globalActiveBets = 0

export function useWallet() {
  const { currency, convert, displaySymbol, displayCurrency, toggleCurrency } = useCurrency()
  const [balance, setBalance] = useState(globalBalance)
  const [activeBets, setActiveBets] = useState(globalActiveBets)
  const [loading, setLoading] = useState(true)

  const displayBalance = convert(balance)

  const fetchBalance = useCallback(async () => {
    if (!isSupabaseReady) { setLoading(false); return }
    setLoading(true)
    try {
      const { data: { user } } = await supabase!.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase!
        .from('profiles')
        .select('usdt_balance, active_bets_count')
        .eq('id', user.id)
        .single()
      if (data) {
        globalBalance = data.usdt_balance ?? 0
        globalActiveBets = data.active_bets_count ?? 0
        setBalance(globalBalance)
        setActiveBets(globalActiveBets)
      }
    } catch (e) {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchBalance() }, [fetchBalance])

  const addBalance = useCallback(async (amount: number) => {
    if (!isSupabaseReady) return
    try {
      const { data: { user } } = await supabase!.auth.getUser()
      if (!user) return
      const { data } = await supabase!
        .from('profiles')
        .select('usdt_balance')
        .eq('id', user.id)
        .single()
      const newBalance = (data?.usdt_balance ?? 0) + amount
      await supabase!.from('profiles').update({ usdt_balance: newBalance }).eq('id', user.id)
      globalBalance = newBalance
      setBalance(newBalance)
    } catch (e) {}
  }, [])

  const subtractBalance = useCallback(async (amount: number) => {
    if (!isSupabaseReady) return
    try {
      const { data: { user } } = await supabase!.auth.getUser()
      if (!user) return
      const { data } = await supabase!
        .from('profiles')
        .select('usdt_balance')
        .eq('id', user.id)
        .single()
      const newBalance = Math.max(0, (data?.usdt_balance ?? 0) - amount)
      await supabase!.from('profiles').update({ usdt_balance: newBalance }).eq('id', user.id)
      globalBalance = newBalance
      setBalance(newBalance)
    } catch (e) {}
  }, [])

  const incrementActiveBets = useCallback(async () => {
    globalActiveBets++
    setActiveBets(globalActiveBets)
    if (!isSupabaseReady) return
    try {
      const { data: { user } } = await supabase!.auth.getUser()
      if (!user) return
      await supabase!.rpc('increment_active_bets', { p_user_id: user.id })
    } catch (e) {}
  }, [])

  const decrementActiveBets = useCallback(async () => {
    globalActiveBets = Math.max(0, globalActiveBets - 1)
    setActiveBets(globalActiveBets)
    if (!isSupabaseReady) return
    try {
      const { data: { user } } = await supabase!.auth.getUser()
      if (!user) return
      await supabase!.rpc('decrement_active_bets', { p_user_id: user.id })
    } catch (e) {}
  }, [])

  return {
    balance,
    displayBalance,
    currency,
    displayCurrency,
    displaySymbol,
    activeBets,
    loading,
    toggleCurrency,
    addBalance,
    subtractBalance,
    incrementActiveBets,
    decrementActiveBets,
    refresh: fetchBalance,
  }
}
