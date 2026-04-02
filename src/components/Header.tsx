'use client'

import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useWallet } from '@/src/hooks/useWallet'
import { Activity, Wallet, ChevronDown, Plus, Target, ArrowLeftRight } from 'lucide-react'
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

  const handleConnect = useCallback(() => {
    if (connectors && connectors.length > 0) {
      connect({ connector: connectors[0] })
    }
  }, [connect, connectors])

  const shortAddr = address ? address.slice(0, 6) + '...' + address.slice(-4) : ''

  return (
    <header className="border-b border-[#1F1F1F] bg-[#000000]/95 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <Link href="/" className="text-lg font-bold tracking-wide flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-full border border-[#D4AF37]/30 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <span className="hidden sm:inline">PARLAYZ</span>
        </Link>

        <nav className="hidden md:flex items-center gap-5">
          <Link href="/" className={'text-sm font-semibold transition-colors ' + (pathname === '/' ? 'text-[#D4AF37]' : 'text-gray-500 hover:text-gray-300')}>Markets</Link>
          <Link href="/wallet" className={'text-sm font-semibold transition-colors ' + (pathname === '/wallet' ? 'text-[#D4AF37]' : 'text-gray-500 hover:text-gray-300')}>Wallet</Link>
          <SignedIn>
            {(user?.publicMetadata as any)?.role === 'admin' && (
              <Link href="/admin/resolution" className={'text-sm font-semibold transition-colors ' + (pathname === '/admin/resolution' ? 'text-[#D4AF37]' : 'text-gray-500 hover:text-gray-300')}>Admin</Link>
            )}
          </SignedIn>
        </nav>

        <div className="flex items-center gap-2">
          <SignedIn>
            <button
              onClick={wallet.toggleCurrency}
              className="flex items-center gap-1.5 bg-[#111] border border-[#1F1F1F] rounded-full px-3 py-1.5 hover:border-[#D4AF37]/50 transition"
            >
              <ArrowLeftRight className="w-3 h-3 text-[#D4AF37]" />
              <span className="text-[10px] font-bold text-[#D4AF37]">{wallet.currency}</span>
            </button>
          </SignedIn>

          <SignedIn>
            <Link href="/wallet" className="flex items-center gap-1.5 bg-[#111] border border-[#1F1F1F] rounded-full px-3 py-1.5 hover:border-[#D4AF37]/50 transition">
              <Target className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-xs font-bold text-white">{wallet.activeBets}</span>
              <span className="text-[10px] text-gray-500 font-bold uppercase hidden sm:inline">Active</span>
            </Link>
          </SignedIn>

          <SignedIn>
            <Link href="/wallet" className="flex items-center gap-2 bg-[#111] border border-[#1F1F1F] rounded-full px-3 py-1.5 hover:border-[#D4AF37]/50 transition">
              <span className="text-xs font-bold text-white font-mono">{wallet.displayCurrency === 'USDT' ? '$' : 'KSh '}{wallet.displayBalance.toFixed(wallet.displayCurrency === 'KSH' ? 0 : 2)}</span>
              <Plus className="w-3.5 h-3.5 text-green-400" />
            </Link>
          </SignedIn>

          {isConnected ? (
            <div className="relative">
              <button
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className="flex items-center gap-1.5 bg-[#111] border border-[#1F1F1F] hover:border-[#D4AF37]/50 rounded-full px-3 py-1.5 transition"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
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
            <button
              onClick={handleConnect}
              className="flex items-center gap-1.5 bg-[#D4AF37] text-black font-bold px-3 py-1.5 rounded-full text-xs hover:bg-[#c4a030] transition"
            >
              <Wallet className="w-3.5 h-3.5" />
              Connect
            </button>
          )}

          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-[#111] border border-[#1F1F1F] text-gray-300 font-bold px-3 py-1.5 rounded-full text-xs hover:border-[#D4AF37]/50 transition">Sign In</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  )
}
