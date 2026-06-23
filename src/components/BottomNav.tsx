"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#000000]/95 backdrop-blur-xl border-t border-[#2D2D2D]">
      <div className="flex items-center justify-around h-16 px-4">
        <Link
          href="/"
          className={`${pathname === '/'
            ? 'text-white font-semibold'
            : 'text-gray-400 hover:text-white transition-colors'}`}
        >
          Markets
        </Link>
        <Link
          href="/parlay"
          className={`${pathname === '/parlay'
            ? 'text-white font-semibold'
            : 'text-gray-400 hover:text-white transition-colors'}`}
        >
          Parlay AI
        </Link>
        <Link
          href="/history"
          className={`${pathname === '/history'
            ? 'text-white font-semibold'
            : 'text-gray-400 hover:text-white transition-colors'}`}
        >
          History
        </Link>
        <Link
          href="/wallet"
          className={`${pathname === '/wallet'
            ? 'text-white font-semibold'
            : 'text-gray-400 hover:text-white transition-colors'}`}
        >
          Wallet
        </Link>
      </div>
    </nav>
  )
}
