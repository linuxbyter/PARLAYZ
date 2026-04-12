'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-[#222222] py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#C9A84C] font-black text-lg">PARLAYZ</span>
            <span className="text-[#555555] text-sm">Kenya's Prediction Market</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link href="/terms" className="text-[#8B8B8B] hover:text-[#C9A84C] transition">Terms</Link>
            <Link href="/privacy" className="text-[#8B8B8B] hover:text-[#C9A84C] transition">Privacy</Link>
            <Link href="/rules" className="text-[#8B8B8B] hover:text-[#C9A84C] transition">Rules</Link>
            <Link href="/fees" className="text-[#8B8B8B] hover:text-[#C9A84C] transition">Fees</Link>
            <Link href="/responsible-gaming" className="text-[#8B8B8B] hover:text-[#C9A84C] transition">Responsible Gaming</Link>
          </div>

          <div className="text-[#555555] text-xs">
            © 2026 Parlayz Kenya Ltd
          </div>
        </div>
      </div>
    </footer>
  )
}