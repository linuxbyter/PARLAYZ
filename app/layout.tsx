import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Providers } from './providers'
import { CurrencyProvider } from '@/src/hooks/useWallet'

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
        <body className="bg-[#000000] text-white font-sans min-h-screen">
          <Providers>
            <CurrencyProvider>
              <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                  <h1 className="text-4xl font-black text-[#D4AF37] mb-4">PARLAYZ</h1>
                  <p className="text-gray-400 mb-2">Clerk authentication not configured.</p>
                  <p className="text-xs text-gray-600 font-mono bg-[#111] p-3 rounded-lg mt-4">
                    Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to your Vercel environment variables.
                  </p>
                </div>
              </div>
            </CurrencyProvider>
          </Providers>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className="bg-[#000000] text-white font-sans min-h-screen">
        <ClerkProvider
          publishableKey={publishableKey}
          appearance={{
            baseTheme: undefined,
            variables: {
              colorBackground: '#000000',
              colorInputBackground: '#111111',
              colorPrimary: '#D4AF37',
              colorText: '#ffffff',
              colorTextSecondary: '#888888',
              colorTextOnPrimaryBackground: '#000000',
              borderRadius: '0.75rem',
            },
            elements: {
              card: 'bg-[#000000] border border-[#1F1F1F]',
              headerTitle: 'text-white',
              headerSubtitle: 'text-gray-400',
              socialButtonsBlockButton: 'bg-[#111] border border-[#1F1F1F] text-white hover:bg-[#1a1a1a]',
              socialButtonsBlockButtonText: 'text-white',
              formButtonPrimary: 'bg-[#D4AF37] hover:bg-[#c4a030] text-black',
              formFieldInput: 'bg-[#111] border border-[#1F1F1F] text-white focus:border-[#D4AF37]',
              footerActionLink: 'text-[#D4AF37] hover:text-[#c4a030]',
              identityPreviewText: 'text-white',
              identityPreviewEditButton: 'text-[#D4AF37]',
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
            <CurrencyProvider>
              {children}
            </CurrencyProvider>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}
