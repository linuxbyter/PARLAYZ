import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'PARLAYZ - Crypto Prediction Markets on Base',
  description: 'Non-custodial betting on Base L2. USDT only.',
}

export const dynamic = 'force-dynamic'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0D0D0D] text-white font-sans min-h-screen">
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_'}
        >
          <Providers>
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}
