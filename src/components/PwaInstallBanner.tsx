'use client'

import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function PwaInstallBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already dismissed
    const wasDismissed = localStorage.getItem('pwa-banner-dismissed')
    if (wasDismissed) {
      setDismissed(true)
      return
    }

    // Check if running as PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
    if (isPWA) {
      setDismissed(true)
      return
    }

    // Show banner after a delay
    const timer = setTimeout(() => {
      setShowBanner(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setShowBanner(false)
    setDismissed(true)
    localStorage.setItem('pwa-banner-dismissed', 'true')
  }

  const handleInstall = () => {
    // Trigger iOS install prompt or show Android instructions
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (isIOS) {
      alert('To install: Tap the Share button → "Add to Home Screen"')
    } else {
    // For Android/Chrome, we can try to trigger the install prompt
    const deferredPrompt = (window as unknown as { deferredPrompt?: { prompt: () => void } }).deferredPrompt
    if (deferredPrompt) {
        deferredPrompt.prompt()
      }
    }
  }

  if (dismissed || !showBanner) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:hidden"
      >
        <div className="bg-[#141414] border border-[#222222] rounded-xl p-4 flex items-center gap-3 shadow-2xl">
          <div className="w-10 h-10 rounded-lg bg-[#B8860B] flex items-center justify-center shrink-0">
            <span className="text-black font-black text-lg">P</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">Add Parlayz to your home screen</p>
            <p className="text-[#8B8B8B] text-xs">For the best experience</p>
          </div>

          <button
            onClick={handleInstall}
            className="p-2 bg-[#C9A84C] rounded-lg shrink-0 hover:bg-[#B8860B] transition"
          >
            <Download className="w-5 h-5 text-black" />
          </button>

          <button
            onClick={handleDismiss}
            className="p-2 text-[#8B8B8B] hover:text-white shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}