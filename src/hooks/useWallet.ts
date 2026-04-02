'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/src/lib/supabase'

export type Currency = 'USDT' | 'KSH'
const KSH_RATE = 125.0

let globalBalance = 0
let globalActiveBets = 0

export function useWallet() {
  const [balance, setBalance] = useState(globalBalance)
  const [currency, setCurrency] = useState<Currency>('USDT')
  const [activeBets, setActiveBets] = useState(globalActiveBets)
  const [loading, setLoading] = useState(true)

  const displayBalance = currency === 'USDT' ? balance : balance * KSH_RATE
  const displayCurrency = currency

  const fetchBalance = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
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
    } catch (e) {
      console.error('Failed to fetch balance:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchBalance() }, [fetchBalance])

  const toggleCurrency = useCallback(() => {
    setCurrency(prev => prev === 'USDT' ? 'KSH' : 'USDT')
  }, [])

  const addBalance = useCallback(async (amount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('usdt_balance')
        .eq('id', user.id)
        .single()
      const newBalance = (data?.usdt_balance ?? 0) + amount
      await supabase.from('profiles').update({ usdt_balance: newBalance }).eq('id', user.id)
      globalBalance = newBalance
      setBalance(newBalance)
    } catch (e) {
      console.error('Failed to add balance:', e)
    }
  }, [])

  const subtractBalance = useCallback(async (amount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('usdt_balance')
        .eq('id', user.id)
        .single()
      const newBalance = Math.max(0, (data?.usdt_balance ?? 0) - amount)
      await supabase.from('profiles').update({ usdt_balance: newBalance }).eq('id', user.id)
      globalBalance = newBalance
      setBalance(newBalance)
    } catch (e) {
      console.error('Failed to subtract balance:', e)
    }
  }, [])

  const incrementActiveBets = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.rpc('increment_active_bets', { p_user_id: user.id })
      globalActiveBets++
      setActiveBets(globalActiveBets)
    } catch (e) {
      globalActiveBets++
      setActiveBets(globalActiveBets)
    }
  }, [])

  const decrementActiveBets = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.rpc('decrement_active_bets', { p_user_id: user.id })
      globalActiveBets = Math.max(0, globalActiveBets - 1)
      setActiveBets(globalActiveBets)
    } catch (e) {
      globalActiveBets = Math.max(0, globalActiveBets - 1)
      setActiveBets(globalActiveBets)
    }
  }, [])

  return {
    balance,
    displayBalance,
    currency,
    displayCurrency,
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
