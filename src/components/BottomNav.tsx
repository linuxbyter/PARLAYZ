"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Sparkles, History, Menu } from "lucide-react"
import { cn } from "@/src/lib/utils"

const navItems = [
  { href: "/", icon: Home, label: "Markets" },
  { href: "/parlay", icon: Sparkles, label: "Parlay AI" },
  { href: "/history", icon: History, label: "History" },
  { href: "/wallet", icon: Menu, label: "More" },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--black)] border-t border-[var(--black-border)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
                isActive ? "text-[var(--gold)]" : "text-[var(--black-dim)]"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "animate-pulse-gold")} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
