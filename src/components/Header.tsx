'use client'

import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const { user } = useUser()
  const pathname = usePathname()

  return (
    <header className="border-b border-[#2D2D2D] bg-[#000000]/95 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-black text-xl tracking-tight">PARLAYZ</span>
        </Link>

        {/* Nav */}
        <div className="hidden md:flex items-center gap-4">
          {[
            { href: '/', label: 'Markets' },
            { href: '/wallet', label: 'Wallet' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${pathname === item.href
                ? 'text-white font-semibold'
                : 'text-gray-400 hover:text-white transition-colors'}`}
            >
              {item.label}
            </Link>
          ))}
          <SignedIn>
            {(user?.publicMetadata as any)?.role === 'admin' && (
              <Link
                href="/admin/resolution"
                className={`${pathname === '/admin/resolution'
                  ? 'text-white font-semibold'
                  : 'text-gray-400 hover:text-white transition-colors'}`}
              >
                Admin
              </Link>
            )}
          </SignedIn>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-lg hover:opacity-90 transition">
                Sign In
              </button>
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
