'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// --- NECESSARY CHANGES: 5-MINUTE CYCLE LOGIC ---
const CYCLE_MS = 5 * 60 * 1000       // Total cycle: 5 mins
const LOCK_MS = 4 * 60 * 1000        // Betting closes at: 4 mins
const GRACE_END_MS = 4.5 * 60 * 1000  // Grace period ends at: 4 mins 30 secs
// ----------------------------------------------

export type MarketPhase = 'OPEN' | 'LOCKED' | 'GRACE' | 'RESOLVED'

export interface MarketState {
  phase: MarketPhase
  strikePrice: number | null
  livePrice: number
  openStartMs: number
  lockAtMs: number
  graceEndMs: number
  resolveAtMs: number
  upPool: number
  downPool: number
  userUpStake: number
  userDownStake: number
  resolution: 'UP' | 'DOWN' | null
  poolHistory: { time: number; upPct: number }[]
}

function getCycleBoundary(): number {
  return Math.floor(Date.now() / CYCLE_MS) * CYCLE_MS
}

function getPhase(ms: number, lockAtMs: number, graceEndMs: number, resolveAtMs: number): MarketPhase {
  if (ms >= resolveAtMs) return 'RESOLVED'
  if (ms >= lockAtMs && ms < graceEndMs) return 'GRACE'
  if (ms >= lockAtMs) return 'LOCKED'
  return 'OPEN'
}

export function useMarketLogic(
  instrumentId: string,
  initialPrice: number,
  livePrice: number,
  onResolve?: (resolution: 'UP' | 'DOWN') => void
): MarketState & {
  timeRemaining: number
  cycleProgress: number
  canBet: boolean
  canChickenOut: boolean
  chickenOutRefund: number
  placeBet: (side: 'UP' | 'DOWN', amount: number) => void
  withdrawStake: (side: 'UP' | 'DOWN') => number
  userTotalStake: number
  upProbability: number
} {
  const openStartMs = useRef(getCycleBoundary())
  const lockAtMs = useRef(openStartMs.current + LOCK_MS)
  const graceEndMs = useRef(openStartMs.current + GRACE_END_MS)
  const resolveAtMs = useRef(openStartMs.current + CYCLE_MS)
  const resolvedRef = useRef(false)
  const strikeCaptured = useRef(false)
  const houseSeeded = useRef(false)

  const [state, setState] = useState<MarketState>({
    phase: 'OPEN',
    strikePrice: null,
    livePrice: initialPrice,
    openStartMs: openStartMs.current,
    lockAtMs: lockAtMs.current,
    graceEndMs: graceEndMs.current,
    resolveAtMs: resolveAtMs.current,
    upPool: 0,
    downPool: 0,
    userUpStake: 0,
    userDownStake: 0,
    resolution: null,
    poolHistory: [{ time: Date.now(), upPct: 50 }],
  })

  const [timeRemaining, setTimeRemaining] = useState(LOCK_MS)

  useEffect(() => {
    if (!houseSeeded.current) {
      houseSeeded.current = true
      // House seeding for "vibe"
      const totalSeed = 30 + Math.random() * 50
      const upRatio = 0.3 + Math.random() * 0.4
      const upPool = Math.round(totalSeed * upRatio * 10) / 10
      const downPool = Math.round((totalSeed - upPool) * 10) / 10
      const upPct = (upPool / (upPool + downPool)) * 100
      setState(prev => ({
        ...prev,
        upPool,
        downPool,
        poolHistory: [{ time: Date.now(), upPct }],
      }))
    }
  }, [])

  useEffect(() => {
    const tick = setInterval(() => {
      const now = Date.now()
      const phase = getPhase(now, lockAtMs.current, graceEndMs.current, resolveAtMs.current)
      
      // FIX: Ensure time remaining stays positive and relevant to phase
      const remaining = phase === 'OPEN'
        ? lockAtMs.current - now
        : resolveAtMs.current - now

      setTimeRemaining(Math.max(0, remaining))

      setState(prev => {
        const next = { ...prev, phase, livePrice }

        // Capture strike price exactly at the lock boundary
        if ((phase === 'LOCKED' || phase === 'GRACE' || phase === 'RESOLVED') && !strikeCaptured.current) {
          strikeCaptured.current = true
          next.strikePrice = livePrice
        }

        // Keep history moving for the graph
        const total = next.upPool + next.downPool
        const upPct = total > 0 ? (next.upPool / total) * 100 : 50
        const lastHistory = prev.poolHistory[prev.poolHistory.length - 1]
        if (!lastHistory || now - lastHistory.time > 3000) {
          next.poolHistory = [...prev.poolHistory.slice(-119), { time: now, upPct }]
        }

        // Handle Resolution
        if (phase === 'RESOLVED' && !resolvedRef.current) {
          resolvedRef.current = true
          const strike = next.strikePrice ?? initialPrice
          const resolution: 'UP' | 'DOWN' = livePrice > strike ? 'UP' : 'DOWN'
          next.resolution = resolution
          if (onResolve) onResolve(resolution)
        }

        return next
      })
    }, 1000)

    return () => clearInterval(tick)
  }, [livePrice, initialPrice, onResolve])

  const placeBet = useCallback((side: 'UP' | 'DOWN', amount: number) => {
    setState(prev => {
      if (prev.phase !== 'OPEN') return prev
      const newUpPool = side === 'UP' ? prev.upPool + amount : prev.upPool
      const newDownPool = side === 'DOWN' ? prev.downPool + amount : prev.downPool
      const total = newUpPool + newDownPool
      const upPct = total > 0 ? (newUpPool / total) * 100 : 50
      return {
        ...prev,
        upPool: newUpPool,
        downPool: newDownPool,
        userUpStake: side === 'UP' ? prev.userUpStake + amount : prev.userUpStake,
        userDownStake: side === 'DOWN' ? prev.userDownStake + amount : prev.userDownStake,
        poolHistory: [...prev.poolHistory.slice(-119), { time: Date.now(), upPct }],
      }
    })
  }, [])

  const withdrawStake = useCallback((side: 'UP' | 'DOWN'): number => {
    let refund = 0
    setState(prev => {
      const stake = side === 'UP' ? prev.userUpStake : prev.userDownStake
      if (stake <= 0 || prev.phase === 'RESOLVED' || prev.phase === 'LOCKED') return prev

      const refundRate = prev.phase === 'GRACE' ? 0.8 : 1.0
      refund = stake * refundRate
      
      return {
        ...prev,
        upPool: side === 'UP' ? Math.max(0, prev.upPool - stake) : prev.upPool,
        downPool: side === 'DOWN' ? Math.max(0, prev.downPool - stake) : prev.downPool,
        userUpStake: side === 'UP' ? 0 : prev.userUpStake,
        userDownStake: side === 'DOWN' ? 0 : prev.userDownStake,
      }
    })
    return refund
  }, [])

  const userTotalStake = state.userUpStake + state.userDownStake
  const canBet = state.phase === 'OPEN'
  const canChickenOut = (state.phase === 'OPEN' || state.phase === 'GRACE') && userTotalStake > 0
  const chickenOutRefund = state.phase === 'OPEN' ? userTotalStake : userTotalStake * 0.8

  const totalPool = state.upPool + state.downPool
  const upProbability = totalPool > 0 ? (state.upPool / totalPool) * 100 : 50
  const cycleProgress = Math.min(1, (Date.now() - state.openStartMs) / CYCLE_MS)

  return {
    ...state,
    timeRemaining,
    cycleProgress,
    canBet,
    canChickenOut,
    chickenOutRefund,
    placeBet,
    withdrawStake,
    userTotalStake,
    upProbability,
  }
}
