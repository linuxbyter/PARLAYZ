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
        <ClerkProvider
          publishableKey={publishableKey}
          appearance={{
            baseTheme: undefined,
            variables: {
              colorBackground: '#0D0D0D',
              colorInputBackground: '#111111',
              colorPrimary: '#D9C5A0',
              colorText: '#ffffff',
              colorTextSecondary: '#888888',
              colorTextOnPrimaryBackground: '#0D0D0D',
              borderRadius: '0.75rem',
            },
            elements: {
              card: 'bg-[#0D0D0D] border border-[#1F1F1F]',
              headerTitle: 'text-white',
              headerSubtitle: 'text-gray-400',
              socialButtonsBlockButton: 'bg-[#111] border border-[#1F1F1F] text-white hover:bg-[#1a1a1a]',
              socialButtonsBlockButtonText: 'text-white',
              formButtonPrimary: 'bg-[#D9C5A0] hover:bg-[#c4b18f] text-black',
              formFieldInput: 'bg-[#111] border border-[#1F1F1F] text-white focus:border-[#D9C5A0]',
              footerActionLink: 'text-[#D9C5A0] hover:text-[#c4b18f]',
              identityPreviewText: 'text-white',
              identityPreviewEditButton: 'text-[#D9C5A0]',
              dividerLine: 'bg-[#1F1F1F]',
              dividerText: 'text-gray-500',
              formFieldLabel: 'text-gray-300',
              userButtonPopoverActionButton: 'text-white hover:bg-[#1a1a1a]',
              userButtonPopoverActionButtonText: 'text-white',
              userButtonPopoverActionButtonIconBox: 'text-white',
            },
          }}
        >
          <Providers>
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}
