'use client'

import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Activity, Wallet, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Header() {
  const { user } = useUser()
  const pathname = usePathname()
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [showWalletMenu, setShowWalletMenu] = useState(false)
  const [readyConnector, setReadyConnector] = useState<any>(null)

  useEffect(() => {
    if (connectors && connectors.length > 0) {
      setReadyConnector(connectors[0])
    }
  }, [connectors])

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  return (
    <header className="border-b border-[#1F1F1F] bg-[#0a0a0a]/90 backdrop-blur-xl sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-wide flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-[#D9C5A0]/30 flex items-center justify-center text-xs">
            <Activity className="w-4 h-4 text-[#D9C5A0]" />
          </div>
          PARLAYZ
        </Link>

        <nav className="hidden sm:flex items-center gap-6">
          <Link href="/" className={`text-sm font-semibold transition-colors ${pathname === '/' ? 'text-[#D9C5A0]' : 'text-gray-500 hover:text-gray-300'}`}>
            Markets
          </Link>
          <Link href="/wallet" className={`text-sm font-semibold transition-colors ${pathname === '/wallet' ? 'text-[#D9C5A0]' : 'text-gray-500 hover:text-gray-300'}`}>
            Wallet
          </Link>
          <SignedIn>
            {(user?.publicMetadata as any)?.role === 'admin' && (
              <Link href="/admin/resolution" className={`text-sm font-semibold transition-colors ${pathname === '/admin/resolution' ? 'text-[#D9C5A0]' : 'text-gray-500 hover:text-gray-300'}`}>
                Admin
              </Link>
            )}
          </SignedIn>
        </nav>

        <div className="flex items-center gap-3">
          {isConnected ? (
            <div className="relative">
              <button
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className="flex items-center gap-2 bg-[#111] border border-[#1F1F1F] hover:border-[#D9C5A0]/50 rounded-xl px-3 py-2 transition"
              >
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-mono font-bold text-[#D9C5A0]">{shortAddr}</span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>
              {showWalletMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowWalletMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#111] border border-[#1F1F1F] rounded-xl shadow-2xl z-50 overflow-hidden">
                    <button
                      onClick={() => { navigator.clipboard.writeText(address || ''); setShowWalletMenu(false) }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-[#1a1a1a] transition"
                    >
                      Copy Address
                    </button>
                    <button
                      onClick={() => { disconnect(); setShowWalletMenu(false) }}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-[#1a1a1a] transition"
                    >
                      Disconnect
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => readyConnector && connect({ connector: readyConnector })}
              disabled={!readyConnector}
              className="flex items-center gap-2 bg-[#D9C5A0] text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#c4b18f] transition disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" />
              Connect
            </button>
          )}

          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-[#111] border border-[#1F1F1F] text-gray-300 font-bold px-4 py-2 rounded-xl text-sm hover:border-[#D9C5A0]/50 transition">
                Sign In
              </button>
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
