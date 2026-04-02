'use client'

import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useWallet, useCurrency } from '@/src/hooks/useWallet'
import { Activity, Wallet, ChevronDown, Plus, Target, ArrowLeftRight, Crown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'

export default function Header() {
  const { user } = useUser()
  const pathname = usePathname()
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [showWalletMenu, setShowWalletMenu] = useState(false)
  const wallet = useWallet()
  const { currency, toggleCurrency, displaySymbol } = useCurrency()

  const handleConnect = useCallback(() => {
    if (connectors && connectors.length > 0) connect({ connector: connectors[0] })
  }, [connect, connectors])

  const shortAddr = address ? address.slice(0, 6) + '...' + address.slice(-4) : ''

  return (
    <header className="border-b border-[#1F1F1F] bg-[#000000]/95 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="text-lg font-black tracking-wider flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B8960C] flex items-center justify-center">
            <Activity className="w-4 h-4 text-black" />
          </div>
          <span className="hidden sm:inline bg-gradient-to-r from-[#D4AF37] to-[#F0D060] bg-clip-text text-transparent">PARLAYZ</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { href: '/', label: 'Markets' },
            { href: '/wallet', label: 'Wallet' },
          ].map(item => (
            <Link key={item.href} href={item.href} className={`text-sm font-semibold transition-colors ${pathname === item.href ? 'text-[#D4AF37]' : 'text-gray-500 hover:text-gray-300'}`}>
              {item.label}
            </Link>
          ))}
          <SignedIn>
            {(user?.publicMetadata as any)?.role === 'admin' && (
              <Link href="/admin/resolution" className={`text-sm font-semibold transition-colors ${pathname === '/admin/resolution' ? 'text-[#D4AF37]' : 'text-gray-500 hover:text-gray-300'}`}>Admin</Link>
            )}
          </SignedIn>
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Currency Toggle */}
          <SignedIn>
            <button onClick={toggleCurrency} className="flex items-center gap-1.5 bg-[#111] border border-[#1F1F1F] rounded-full px-2.5 py-1.5 hover:border-[#D4AF37]/50 transition">
              <ArrowLeftRight className="w-3 h-3 text-[#D4AF37]" />
              <span className="text-[10px] font-bold text-[#D4AF37]">{currency}</span>
            </button>
          </SignedIn>

          {/* Active Bets */}
          <SignedIn>
            <Link href="/wallet" className="flex items-center gap-1.5 bg-[#111] border border-[#1F1F1F] rounded-full px-2.5 py-1.5 hover:border-[#D4AF37]/50 transition">
              <Target className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-xs font-bold text-white font-mono">{wallet.activeBets}</span>
            </Link>
          </SignedIn>

          {/* Balance */}
          <SignedIn>
            <Link href="/wallet" className="flex items-center gap-2 bg-[#111] border border-[#1F1F1F] rounded-full px-3 py-1.5 hover:border-[#D4AF37]/50 transition">
              <span className="text-xs font-bold text-white font-mono">{displaySymbol}{wallet.displayBalance.toFixed(currency === 'KSH' ? 0 : 2)}</span>
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
            </Link>
          </SignedIn>

          {/* Wallet Connect */}
          {isConnected ? (
            <div className="relative">
              <button onClick={() => setShowWalletMenu(!showWalletMenu)} className="flex items-center gap-1.5 bg-[#111] border border-[#1F1F1F] hover:border-[#D4AF37]/50 rounded-full px-2.5 py-1.5 transition">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                <span className="text-xs font-mono font-bold text-[#D4AF37]">{shortAddr}</span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>
              {showWalletMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowWalletMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-44 bg-[#111] border border-[#1F1F1F] rounded-xl shadow-2xl z-50 overflow-hidden">
                    <button onClick={() => { navigator.clipboard.writeText(address || ''); setShowWalletMenu(false) }} className="w-full text-left px-3 py-2.5 text-xs text-gray-300 hover:bg-[#1a1a1a] transition">Copy Address</button>
                    <button onClick={() => { disconnect(); setShowWalletMenu(false) }} className="w-full text-left px-3 py-2.5 text-xs text-gray-300 hover:bg-[#1a1a1a] transition">Disconnect</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button onClick={handleConnect} className="flex items-center gap-1.5 bg-gradient-to-r from-[#D4AF37] to-[#F0D060] text-black font-bold px-3 py-1.5 rounded-full text-xs hover:opacity-90 transition">
              <Wallet className="w-3.5 h-3.5" />
              Connect
            </button>
          )}

          {/* Auth */}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-[#111] border border-[#1F1F1F] text-gray-300 font-bold px-3 py-1.5 rounded-full text-xs hover:border-[#D4AF37]/50 transition">Sign In</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: 'w-7 h-7' } }} />
          </SignedIn>
        </div>
      </div>
    </header>
  )
}
