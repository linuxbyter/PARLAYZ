'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const CYCLE_MS = 10 * 60 * 1000
const LOCK_MS = 5 * 60 * 1000
const GRACE_END_MS = 6 * 60 * 1000

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
  poolHistory: { time: number; upPct: number; downPct: number }[]
}

export function getCycleBoundary(): number {
  return Math.floor(Date.now() / CYCLE_MS) * CYCLE_MS
}

export function getPhase(ms: number, openStartMs: number, lockAtMs: number, graceEndMs: number, resolveAtMs: number): MarketPhase {
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
  canBet: boolean
  canChickenOut: boolean
  chickenOutRefund: number
  placeBet: (side: 'UP' | 'DOWN', amount: number) => void
  withdrawStake: (side: 'UP' | 'DOWN') => number
  userTotalStake: number
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
    poolHistory: [{ time: Date.now(), upPct: 50, downPct: 50 }],
  })

  const [timeRemaining, setTimeRemaining] = useState(LOCK_MS)

  // House seeding: $30-$80 randomized, not 50/50
  useEffect(() => {
    if (!houseSeeded.current) {
      houseSeeded.current = true
      const totalSeed = 30 + Math.random() * 50
      const upRatio = 0.3 + Math.random() * 0.4
      const upPool = Math.round(totalSeed * upRatio * 10) / 10
      const downPool = Math.round((totalSeed - upPool) * 10) / 10
      const upPct = (upPool / (upPool + downPool)) * 100
      setState(prev => ({
        ...prev,
        upPool,
        downPool,
        poolHistory: [{ time: Date.now(), upPct, downPct: 100 - upPct }],
      }))
    }
  }, [])

  useEffect(() => {
    const tick = setInterval(() => {
      const now = Date.now()
      const phase = getPhase(now, openStartMs.current, lockAtMs.current, graceEndMs.current, resolveAtMs.current)
      const remaining = phase === 'OPEN'
        ? lockAtMs.current - now
        : phase === 'LOCKED' || phase === 'GRACE'
        ? resolveAtMs.current - now
        : 0

      setTimeRemaining(Math.max(0, remaining))

      setState(prev => {
        const next = { ...prev, phase, livePrice }

        // Capture strike at lock moment
        if ((phase === 'LOCKED' || phase === 'GRACE' || phase === 'RESOLVED') && !strikeCaptured.current) {
          strikeCaptured.current = true
          next.strikePrice = livePrice
        }

        // Record pool history every 3 seconds
        const total = next.upPool + next.downPool
        const upPct = total > 0 ? (next.upPool / total) * 100 : 50
        const lastHistory = prev.poolHistory[prev.poolHistory.length - 1]
        if (!lastHistory || now - lastHistory.time > 3000) {
          next.poolHistory = [...prev.poolHistory.slice(-119), { time: now, upPct, downPct: 100 - upPct }]
        }

        // Auto-resolve
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
      return {
        ...prev,
        upPool: side === 'UP' ? prev.upPool + amount : prev.upPool,
        downPool: side === 'DOWN' ? prev.downPool + amount : prev.downPool,
        userUpStake: side === 'UP' ? prev.userUpStake + amount : prev.userUpStake,
        userDownStake: side === 'DOWN' ? prev.userDownStake + amount : prev.userDownStake,
      }
    })
  }, [])

  const withdrawStake = useCallback((side: 'UP' | 'DOWN'): number => {
    let refund = 0
    setState(prev => {
      const stake = side === 'UP' ? prev.userUpStake : prev.userDownStake
      if (stake <= 0) return prev
      if (prev.phase === 'RESOLVED') return prev

      let refundRate = 1.0
      if (prev.phase === 'GRACE') refundRate = 0.8
      else if (prev.phase === 'LOCKED') return prev

      refund = stake * refundRate
      const penalty = stake - refund

      return {
        ...prev,
        upPool: side === 'UP' ? Math.max(0, prev.upPool - penalty) : prev.upPool,
        downPool: side === 'DOWN' ? Math.max(0, prev.downPool - penalty) : prev.downPool,
        userUpStake: side === 'UP' ? 0 : prev.userUpStake,
        userDownStake: side === 'DOWN' ? 0 : prev.userDownStake,
      }
    })
    return refund
  }, [])

  const userTotalStake = state.userUpStake + state.userDownStake
  const canBet = state.phase === 'OPEN'
  const canChickenOut = (state.phase === 'OPEN' || state.phase === 'GRACE') && userTotalStake > 0
  const chickenOutRefund = state.phase === 'OPEN'
    ? userTotalStake
    : state.phase === 'GRACE'
    ? userTotalStake * 0.8
    : 0

  return {
    ...state,
    timeRemaining,
    canBet,
    canChickenOut,
    chickenOutRefund,
    placeBet,
    withdrawStake,
    userTotalStake,
  }
}
