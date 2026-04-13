'use client'

import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { Search, TrendingUp, Trophy, History, Sparkles, Globe, Cpu, Zap, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { SidebarMenu } from '@/src/components/SidebarMenu'
import { NotificationBell } from '@/src/components/NotificationBell'

const NAV_TABS = [
  { href: '/', label: 'Trending', icon: TrendingUp },
  { href: '/?cat=sports', label: 'Sports', icon: Trophy },
  { href: '/?cat=crypto', label: 'Crypto', icon: Zap },
  { href: '/?cat=politics', label: 'Politics', icon: Globe },
  { href: '/?cat=tech', label: 'Tech', icon: Cpu },
  { href: '/?cat=meme', label: 'Meme', icon: Sparkles },
  { href: '/?cat=futures', label: 'Futures', icon: History },
]

export default function Header() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState('Trending')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cat = params.get('cat')
    const tab = NAV_TABS.find(t => t.label.toLowerCase() === cat?.toLowerCase())
    if (tab) setActiveTab(tab.label)
    else setActiveTab('Trending')
  }, [pathname])

  return (
    <header className={`border-b transition-all duration-300 sticky top-0 z-50 ${
      scrolled ? 'bg-[#0a0a0a]/95 backdrop-blur-xl border-[#222222]' : 'bg-[#0a0a0a] border-[#222222]'
    }`}>
      <div className="max-w-[1400px] mx-auto px-3 md:px-4">
        {/* Top Row */}
        <div className="flex items-center justify-between h-14">
          {/* Logo - P icon only */}
          <Link href="/" className="shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#B8860B] flex items-center justify-center">
              <span className="text-black font-black text-sm">P</span>
            </div>
          </Link>

        {/* Desktop Nav Tabs */}
        <nav className="hidden md:flex items-center gap-6 px-4">
          {NAV_TABS.map(tab => {
            const isActive = activeTab === tab.label
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setActiveTab(tab.label)}
                className={`text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'text-[#C9A84C] font-semibold' 
                    : 'text-[#555555] hover:text-white'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Hamburger Menu */}
            <SidebarMenu />

            {/* Mobile Search */}
            <Link href="/search" className="md:hidden p-2 text-[#8B8B8B] hover:text-[#F0A500] transition">
              <Search className="w-5 h-5" />
            </Link>

            {/* Notifications */}
            <NotificationBell />

            {/* Auth */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-[#141414] border border-[#222222] text-[#8B8B8B] font-bold px-3 py-1.5 rounded-lg text-sm hover:border-[#F0A500]/50 hover:text-[#F0A500] transition">Sign In</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: 'w-8 h-8' } }} />
            </SignedIn>
          </div>
        </div>

        {/* Mobile Nav Tabs - Horizontal Scroll */}
        <nav className="md:hidden flex items-center gap-6 overflow-x-auto pb-2 px-4 scrollbar-hide">
          {NAV_TABS.map(tab => {
            const isActive = activeTab === tab.label
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setActiveTab(tab.label)}
                className={`text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'text-[#C9A84C] font-semibold' 
                    : 'text-[#555555]'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}