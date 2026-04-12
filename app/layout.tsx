import { ClerkProvider } from '@clerk/nextjs'
import './styles.css'
import { Providers } from './providers'
import { CurrencyProvider } from '@/src/hooks/useWallet'
import ClientLayout from '@/src/components/ClientLayout'

export const metadata = {
  title: 'PARLAYZ - Kenya Prediction Market',
  description: 'Prediction markets on sports, crypto, politics & more. KSh only, M-Pesa native.',
}

export const dynamic = 'force-dynamic'

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
const isValidKey = publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_')

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (!isValidKey) {
    return (
      <html lang="en">
<body>
          <Providers>
            <CurrencyProvider>
              <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                  <h1 className="text-4xl font-black text-[#F0A500] mb-4">PARLAYZ</h1>
                  <p className="text-[#8B8B8B] mb-2">Clerk authentication not configured.</p>
                  <p className="text-xs text-[#555555] font-mono bg-[#141414] p-3 rounded-lg mt-4">
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
      <body>
        <ClerkProvider
          publishableKey={publishableKey}
          appearance={{
            baseTheme: undefined,
            variables: {
              colorBackground: '#141414',
              colorInputBackground: '#141414',
              colorPrimary: '#F0A500',
              colorText: '#ffffff',
              colorTextSecondary: '#8B8B8B',
              colorTextOnPrimaryBackground: '#0a0a0a',
              borderRadius: '0.75rem',
            },
            elements: {
              card: 'bg-[#141414] border border-[#222222]',
              headerTitle: 'text-white',
              headerSubtitle: 'text-[#8B8B8B]',
              socialButtonsBlockButton: 'bg-[#141414] border border-[#222222] text-white hover:bg-[#1a1a1a]',
              socialButtonsBlockButtonText: 'text-white',
              formButtonPrimary: 'bg-[#F0A500] hover:bg-[#D4A843] text-black',
              formFieldInput: 'bg-[#141414] border border-[#222222] text-white focus:border-[#F0A500]',
              footerActionLink: 'text-[#F0A500] hover:text-[#D4A843]',
              identityPreviewText: 'text-white',
              identityPreviewEditButton: 'text-[#F0A500]',
              dividerLine: 'bg-[#222222]',
              dividerText: 'text-[#8B8B8B]',
              formFieldLabel: 'text-[#8B8B8B]',
              userButtonPopoverActionButton: 'text-white hover:bg-[#1a1a1a]',
              userButtonPopoverActionButtonText: 'text-white',
              userButtonPopoverActionButtonIconBox: 'text-white',
            },
          }}
        >
          <Providers>
            <CurrencyProvider>
              <ClientLayout>{children}</ClientLayout>
            </CurrencyProvider>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}