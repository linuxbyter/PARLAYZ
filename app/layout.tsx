import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'PARLAYZ - Crypto Prediction Markets on Base',
  description: 'Non-custodial betting on Base L2. USDT only.',
}

export const dynamic = 'force-dynamic'

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (!publishableKey.startsWith('pk_')) {
    return (
      <html lang="en">
        <body className="bg-[#0D0D0D] text-white font-sans min-h-screen">
          <Providers>
            <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center p-4">
              <div className="text-center">
                <h1 className="text-3xl font-black text-[#D9C5A0] mb-4">PARLAYZ</h1>
                <p className="text-gray-400 mb-2">Clerk authentication keys not configured.</p>
                <p className="text-xs text-gray-600 font-mono">Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in your environment.</p>
              </div>
            </div>
          </Providers>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className="bg-[#0D0D0D] text-white font-sans min-h-screen">
        <ClerkProvider publishableKey={publishableKey}>
          <Providers>
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}
