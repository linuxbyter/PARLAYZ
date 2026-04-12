'use client'

import { usePathname } from 'next/navigation'
import Footer from '@/src/components/Footer'
import BottomNav from '@/src/components/BottomNav'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showBottomNav = !pathname?.startsWith('/sign-') && (
    pathname === '/' || 
    pathname === '/live' || 
    pathname === '/search' || 
    pathname === '/my-bets'
  )
  const showFooter = !pathname?.startsWith('/sign-')

  return (
    <>
      {children}
      {showBottomNav && <BottomNav />}
      {showFooter && <Footer />}
    </>
  )
}