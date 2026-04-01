'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

const CYCLE_MS = 10 * 60 * 1000
const LOCK_MS = 5 * 60 * 1000
const GRACE_MS = 1 * 60 * 1000

export type MarketPhase = 'OPEN' | 'LOCKED' | 'GRACE' | 'RESOLVED'

export interface MarketState {
  phase: MarketPhase
  strikePrice: number | null
  livePrice: number
  openStartMs: number
  lockAtMs: number
  resolveAtMs: number
  upPool: number
  downPool: number
  userBets: { side: 'UP' | 'DOWN'; amount: number; timestamp: number }[]
  resolution: 'UP' | 'DOWN' | null
  poolHistory: { time: number; upPct: number; downPct: number }[]
}

export function getCycleBoundary(): number {
  const now = Date.now()
  return Math.floor(now / CYCLE_MS) * CYCLE_MS
}

export function getPhase(ms: number, openStartMs: number, lockAtMs: number, resolveAtMs: number): MarketPhase {
  if (ms >= resolveAtMs) return 'RESOLVED'
  if (ms >= lockAtMs && ms < lockAtMs + GRACE_MS) return 'GRACE'
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
  chickenOut: () => number
  userTotalStake: number
  userSide: 'UP' | 'DOWN' | null
} {
  const openStartMs = useRef(getCycleBoundary())
  const lockAtMs = useRef(openStartMs.current + LOCK_MS)
  const resolveAtMs = useRef(openStartMs.current + CYCLE_MS)
  const resolvedRef = useRef(false)

  const [state, setState] = useState<MarketState>({
    phase: 'OPEN',
    strikePrice: null,
    livePrice: initialPrice,
    openStartMs: openStartMs.current,
    lockAtMs: lockAtMs.current,
    resolveAtMs: resolveAtMs.current,
    upPool: 0,
    downPool: 0,
    userBets: [],
    resolution: null,
    poolHistory: [{ time: Date.now(), upPct: 50, downPct: 50 }],
  })

  const [timeRemaining, setTimeRemaining] = useState(LOCK_MS)

  const strikeCaptured = useRef(false)
  const graceStarted = useRef(false)

  useEffect(() => {
    const tick = setInterval(() => {
      const now = Date.now()
      const phase = getPhase(now, openStartMs.current, lockAtMs.current, resolveAtMs.current)
      const remaining = phase === 'OPEN'
        ? lockAtMs.current - now
        : phase === 'LOCKED' || phase === 'GRACE'
        ? resolveAtMs.current - now
        : 0

      setTimeRemaining(Math.max(0, remaining))

      setState(prev => {
        const next = { ...prev, phase, livePrice }

        // Capture strike at lock moment
        if (phase !== 'OPEN' && !strikeCaptured.current) {
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
        userBets: [...prev.userBets, { side, amount, timestamp: Date.now() }],
      }
    })
  }, [])

  const chickenOut = useCallback((): number => {
    let refund = 0
    setState(prev => {
      if (prev.phase !== 'GRACE') return prev
      const totalStake = prev.userBets.reduce((s, b) => s + b.amount, 0)
      if (totalStake <= 0) return prev
      refund = totalStake * 0.8
      return {
        ...prev,
        upPool: prev.upPool - prev.userBets.filter(b => b.side === 'UP').reduce((s, b) => s + b.amount * 0.2, 0),
        downPool: prev.downPool - prev.userBets.filter(b => b.side === 'DOWN').reduce((s, b) => s + b.amount * 0.2, 0),
        userBets: [],
      }
    })
    return refund
  }, [])

  const userTotalStake = state.userBets.reduce((s, b) => s + b.amount, 0)
  const userSide = state.userBets.length > 0 ? state.userBets[state.userBets.length - 1].side : null
  const canBet = state.phase === 'OPEN'
  const canChickenOut = state.phase === 'GRACE' && userTotalStake > 0
  const chickenOutRefund = userTotalStake * 0.8

  return {
    ...state,
    timeRemaining,
    canBet,
    canChickenOut,
    chickenOutRefund,
    placeBet,
    chickenOut,
    userTotalStake,
    userSide,
  }
}
