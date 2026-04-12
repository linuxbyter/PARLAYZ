'use client'

import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { useWallet } from '@/src/hooks/useWallet'
import { Wallet, Bell, TrendingUp, Trophy, Search, History, Sparkles, Globe, Cpu, Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

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
  const wallet = useWallet()
  const [showBalanceModal, setShowBalanceModal] = useState(false)
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
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C9A84C] to-[#B8860B] flex items-center justify-center">
              <span className="text-black font-black text-sm">P</span>
            </div>
            <span className="text-lg font-black tracking-wider text-[#C9A84C]">PARLAYZ</span>
          </Link>

          {/* Desktop Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 ml-8">
            {NAV_TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.label
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setActiveTab(tab.label)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all relative ${
                    isActive ? 'text-[#C9A84C]' : 'text-[#8B8B8B] hover:text-[#FFFFFF]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#C9A84C] rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Mobile Search */}
            <Link href="/search" className="md:hidden p-2 text-[#8B8B8B] hover:text-[#C9A84C] transition">
              <Search className="w-5 h-5" />
            </Link>

            {/* Balance */}
            <SignedIn>
              <button 
                onClick={() => setShowBalanceModal(!showBalanceModal)}
                className="flex items-center gap-2 bg-[#141414] border border-[#222222] rounded-lg px-3 py-1.5 hover:border-[#C9A84C]/50 transition"
              >
                <Wallet className="w-4 h-4 text-[#C9A84C]" />
                <span className="text-sm font-bold text-white font-mono">KSh {wallet.displayBalance.toLocaleString()}</span>
              </button>
              {showBalanceModal && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowBalanceModal(false)} />
                  <div className="absolute right-2 top-full mt-2 w-64 bg-[#141414] border border-[#222222] rounded-xl shadow-2xl z-50 p-4">
                    <div className="text-xs text-[#8B8B8B] mb-1">Total Balance</div>
                    <div className="text-2xl font-bold text-white mb-3">KSh {wallet.displayBalance.toLocaleString()}</div>
                    <div className="text-xs text-[#8B8B8B] mb-1">Active Bets</div>
                    <div className="text-lg font-bold text-[#C9A84C]">KSh {wallet.activeBets.toLocaleString()}</div>
                    <Link href="/wallet" className="block mt-4 text-center bg-[#C9A84C] text-black font-bold py-2 rounded-lg text-sm hover:bg-[#D4A843] transition">
                      View Wallet
                    </Link>
                  </div>
                </>
              )}
            </SignedIn>

            {/* Notifications */}
            <SignedIn>
              <button className="p-2 text-[#8B8B8B] hover:text-[#C9A84C] transition relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#E05252] rounded-full" />
              </button>
            </SignedIn>

            {/* Auth */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-[#141414] border border-[#222222] text-[#8B8B8B] font-bold px-3 py-1.5 rounded-lg text-sm hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition">Sign In</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: 'w-8 h-8' } }} />
            </SignedIn>
          </div>
        </div>

        {/* Mobile Nav Tabs - Horizontal Scroll */}
        <nav className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide">
          {NAV_TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.label
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setActiveTab(tab.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all rounded-full ${
                  isActive 
                    ? 'bg-[#1E1A0F] text-[#C9A84C] border border-[#C9A84C]/30' 
                    : 'text-[#8B8B8B] border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}