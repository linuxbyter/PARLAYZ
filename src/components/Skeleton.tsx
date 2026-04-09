'use client'

import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-[#1a1a1a] rounded animate-pulse ${className}`} />
  )
}

export function MarketCardSkeleton() {
  return (
    <div className="bg-[#111] rounded-2xl overflow-hidden border border-[#1F1F1F]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a0a] border-b border-[#1F1F1F]">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="w-16 h-3 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-20 h-4 rounded" />
          <Skeleton className="w-10 h-3 rounded" />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="w-20 h-5 rounded" />
          <Skeleton className="w-4 h-4 rounded" />
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-[10px] mb-1">
            <Skeleton className="w-12 h-3 rounded" />
            <Skeleton className="w-12 h-3 rounded" />
          </div>
          <Skeleton className="w-full h-2 rounded-full" />
          <Skeleton className="w-24 h-3 rounded mt-1" />
        </div>
        <Skeleton className="w-full h-8 rounded-lg" />
      </div>
    </div>
  )
}

export function MarketGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <MarketCardSkeleton />
        </motion.div>
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = 180 }: { height?: number }) {
  return (
    <div className="w-full rounded-xl bg-[#0a0a0a] p-3" style={{ height: height + 24 }}>
      <div className="w-full h-full flex items-end gap-1">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-gradient-to-t from-[#C5A059]/20 to-[#C5A059]/5 rounded-t"
            initial={{ height: '20%' }}
            animate={{ height: `${20 + Math.random() * 60}%` }}
            transition={{ duration: 0.5, delay: i * 0.02 }}
          />
        ))}
      </div>
    </div>
  )
}

export function PoolStatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-[#0a0a0a] rounded-xl p-3 text-center">
          <Skeleton className="w-16 h-2 mx-auto rounded mb-2" />
          <Skeleton className="w-20 h-5 mx-auto rounded mb-1" />
          <Skeleton className="w-12 h-2 mx-auto rounded" />
        </div>
      ))}
    </div>
  )
}

export function BetButtonSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="w-10 h-3 rounded" />
        <Skeleton className="w-24 h-8 rounded-lg" />
        <div className="flex gap-1">
          {[1, 5, 10].map((i) => (
            <Skeleton key={i} className="w-8 h-6 rounded" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
    </div>
  )
}
