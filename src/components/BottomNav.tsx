'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Compass, Radio, Search, Ticket } from 'lucide-react'
import { useState, useEffect } from 'react'

const LIVE_MARKET_COUNT = 3

export default function BottomNav() {
  const pathname = usePathname()
  const [hasLive, setHasLive] = useState(false)

  useEffect(() => {
    setHasLive(LIVE_MARKET_COUNT > 0)
  }, [])

  const navItems = [
    { href: '/', label: 'Browse', icon: Compass },
    { href: '/live', label: 'Live', icon: Radio, hasDot: hasLive },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/my-bets', label: 'My Bets', icon: Ticket },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-[#222222] z-50 px-2 pb-safe">
      <div className="flex items-center justify-around h-14">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all relative min-w-[64px] ${
                isActive ? 'text-[#F0A500]' : 'text-[#8B8B8B]'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.hasDot && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#E05252] rounded-full animate-pulse" />
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#F0A500] rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}