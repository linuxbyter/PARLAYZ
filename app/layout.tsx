import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'PARLAYZ - Crypto Prediction Markets on Base',
  description: 'Non-custodial betting on Base L2. USDT only.',
}

export const dynamic = 'force-dynamic'

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
const isValidKey = publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_')

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (!isValidKey) {
    return (
      <html lang="en">
        <body className="bg-[#0D0D0D] text-white font-sans min-h-screen">
          <Providers>
            <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center p-4">
              <div className="text-center max-w-md">
                <h1 className="text-4xl font-black text-[#D9C5A0] mb-4">PARLAYZ</h1>
                <p className="text-gray-400 mb-2">Clerk authentication not configured.</p>
                <p className="text-xs text-gray-600 font-mono bg-[#111] p-3 rounded-lg mt-4">
                  Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to your Vercel environment variables.
                </p>
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
