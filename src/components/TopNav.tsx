"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Wallet, Sparkles } from "lucide-react"
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs"
import { useAccount } from "wagmi"

export default function TopNav() {
  const pathname = usePathname()
  const { isConnected } = useAccount()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--black-border)] bg-[var(--black)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--black)]/80">
      <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--gold)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span className="font-black text-lg tracking-tight">PARLAYZ</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: "/", label: "Markets" },
            { href: "/parlay", label: "Parlay AI" },
            { href: "/history", label: "History" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                pathname === item.href
                  ? "text-[var(--gold)] bg-[var(--gold-muted)]"
                  : "text-[var(--black-dim)] hover:text-white hover:bg-[var(--black-card)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <SignedIn>
              <Link
                href="/wallet"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--gold-muted)] text-[var(--gold)] text-xs font-bold hover:bg-[var(--gold)]/20 transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Wallet</span>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          ) : (
            <SignedOut>
              <SignInButton mode="modal">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--gold)] text-black text-sm font-bold hover:bg-[var(--gold-light)] transition-colors">
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          )}
        </div>
      </div>
    </header>
  )
}
