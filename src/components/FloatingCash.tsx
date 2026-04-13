'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FloatingCash {
  id: string
  amount: number
  marketId: string
}

interface FloatingCashContextType {
  showFloatingCash: (amount: number, marketId: string) => void
}

const FloatingCashContext = createContext<FloatingCashContextType | null>(null)

export function useFloatingCash() {
  const context = useContext(FloatingCashContext)
  if (!context) {
    return { showFloatingCash: () => {} }
  }
  return context
}

export function FloatingCashProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FloatingCash[]>([])

  const showFloatingCash = (amount: number, marketId: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setItems(prev => [...prev, { id, amount, marketId }])
    setTimeout(() => {
      setItems(prev => prev.filter(item => item.id !== id))
    }, 2500)
  }

  return (
    <FloatingCashContext.Provider value={{ showFloatingCash }}>
      {children}
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -50, scale: 1 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.5 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
          >
            <div className="bg-[#1E3D2F] border border-[#4CAF7D] px-4 py-2 rounded-full shadow-2xl">
              <span className="text-[#4CAF7D] font-bold text-lg">+KSh {item.amount.toLocaleString()}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </FloatingCashContext.Provider>
  )
}