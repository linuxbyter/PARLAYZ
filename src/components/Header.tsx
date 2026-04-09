'use client'

import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useWallet, useCurrency } from '@/src/hooks/useWallet'
import { Activity, Wallet, ChevronDown } from 'lucide-react'
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
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const wallet = useWallet()
  const { currency, toggleCurrency, displaySymbol } = useCurrency()

  const handleConnect = useCallback(() => {
    if (connectors && connectors.length > 0) connect({ connector: connectors[0] })
  }, [connect, connectors])

  const shortAddr = address ? address.slice(0, 6) + '...' + address.slice(-4) : ''

  return (
    <header className="border-b border-[#1F1F1F] bg-[#000000]/95 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="text-lg font-black tracking-wider flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A059] to-[#B8860B] flex items-center justify-center">
            <Activity className="w-4 h-4 text-black" />
          </div>
          <span className="hidden sm:inline bg-gradient-to-r from-[#C5A059] to-[#D4AF37] bg-clip-text text-transparent">PARLAYZ</span>
        </Link>

        {/* Mobile Nav */}
        <nav className="flex items-center gap-4 md:hidden">
          <Link href="/" className={`text-sm font-semibold transition-colors ${pathname === '/' ? 'text-[#C5A059]' : 'text-gray-400'}`}>Markets</Link>
          <Link href="/wallet" className={`text-sm font-semibold transition-colors ${pathname === '/wallet' ? 'text-[#C5A059]' : 'text-gray-400'}`}>Wallet</Link>
        </nav>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { href: '/', label: 'Markets' },
            { href: '/wallet', label: 'Wallet' },
          ].map(item => (
            <Link key={item.href} href={item.href} className={`text-sm font-semibold transition-colors ${pathname === item.href ? 'text-[#C5A059]' : 'text-gray-400 hover:text-gray-200'}`}>
              {item.label}
            </Link>
          ))}
          <SignedIn>
            {(user?.publicMetadata as any)?.role === 'admin' && (
              <Link href="/admin/resolution" className={`text-sm font-semibold transition-colors ${pathname === '/admin/resolution' ? 'text-[#C5A059]' : 'text-gray-400 hover:text-gray-200'}`}>Admin</Link>
            )}
          </SignedIn>
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Currency Toggle */}
          <SignedIn>
            <button onClick={toggleCurrency} className="text-xs font-bold text-[#C5A059] bg-[#111] border border-[#1F1F1F] rounded-full px-2.5 py-1.5 hover:border-[#C5A059]/50 transition">
              {currency}
            </button>
          </SignedIn>

          {/* Balance */}
          <SignedIn>
            <button onClick={() => setShowBalanceModal(!showBalanceModal)} className="flex items-center gap-1.5 bg-[#111] border border-[#1F1F1F] rounded-full px-2.5 py-1.5 hover:border-[#C5A059]/50 transition">
              <Wallet className="w-4 h-4 text-[#C5A059]" />
              <span className="text-xs font-bold text-white font-mono">{displaySymbol}{wallet.displayBalance.toFixed(currency === 'KSH' ? 0 : 2)}</span>
            </button>
            {showBalanceModal && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowBalanceModal(false)} />
                <div className="absolute right-4 top-full mt-2 w-56 bg-[#111] border border-[#1F1F1F] rounded-xl shadow-2xl z-50 p-4">
                  <div className="text-xs text-gray-400 mb-1">Balance</div>
                  <div className="text-xl font-bold text-white mb-3">{displaySymbol}{wallet.displayBalance.toFixed(currency === 'KSH' ? 0 : 2)}</div>
                  <div className="text-xs text-gray-400 mb-1">Active Bets</div>
                  <div className="text-lg font-bold text-[#C5A059]">{wallet.activeBets}</div>
                </div>
              </>
            )}
          </SignedIn>

          {/* Wallet Connect */}
          {isConnected ? (
            <div className="relative">
              <button onClick={() => setShowWalletMenu(!showWalletMenu)} className="flex items-center gap-1 bg-[#111] border border-[#1F1F1F] hover:border-[#C5A059]/50 rounded-full px-2.5 py-1.5 transition">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
                <span className="text-xs font-mono font-bold text-[#C5A059] hidden sm:inline">{shortAddr}</span>
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
            <button onClick={handleConnect} className="flex items-center gap-1.5 bg-gradient-to-r from-[#C5A059] to-[#B8860B] text-black font-bold px-3 py-1.5 rounded-full text-xs hover:opacity-90 transition">
              <Wallet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Connect</span>
            </button>
          )}

          {/* Auth */}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-[#111] border border-[#1F1F1F] text-gray-300 font-bold px-3 py-1.5 rounded-full text-xs hover:border-[#C5A059]/50 transition">Sign In</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: 'w-8 h-8' } }} />
          </SignedIn>
        </div>
      </div>
    </header>
  )
}
