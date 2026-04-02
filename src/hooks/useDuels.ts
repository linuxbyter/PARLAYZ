'use client'

import { useCallback } from 'react'
import { supabase, isSupabaseReady } from '@/src/lib/supabase'

export function useDuels() {
  const createChallenge = useCallback(async (marketId: string, side: 'UP' | 'DOWN', stake: number, durationMinutes: number = 10) => {
    if (!isSupabaseReady || !supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase.rpc('create_duel_challenge', {
      p_market_id: marketId,
      p_side: side,
      p_stake: stake,
      p_duration_minutes: durationMinutes,
    })
    if (error) throw new Error(error.message)
    return data as { success: boolean; duel_id: string }
  }, [])

  const acceptChallenge = useCallback(async (duelId: string, stake: number) => {
    if (!isSupabaseReady || !supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase.rpc('accept_duel', {
      p_duel_id: duelId,
      p_stake: stake,
    })
    if (error) throw new Error(error.message)
    return data as { success: boolean; duel_id: string }
  }, [])

  const getOpenChallenges = useCallback(async (marketId: string) => {
    if (!isSupabaseReady || !supabase) return []
    const { data, error } = await supabase
      .from('duel_challenges')
      .select('*')
      .eq('market_id', marketId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
  }, [])

  return { createChallenge, acceptChallenge, getOpenChallenges }
}
