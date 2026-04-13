import { ClerkProvider } from '@clerk/nextjs'
import './styles.css'
import { Providers } from './providers'
import { CurrencyProvider } from '@/src/hooks/useWallet'
import ClientLayout from '@/src/components/ClientLayout'
import { Suspense } from 'react'

export const metadata = {
  title: 'PARLAYZ - Kenya Prediction Market',
  description: 'Prediction markets on sports, crypto, politics & more. KSh only, M-Pesa native.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/icon-192.png',
  },
}

export const dynamic = 'force-dynamic'

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
const isValidKey = publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_')

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (!isValidKey) {
    return (
      <html lang="en">
        <body>
          <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <h1 className="text-4xl font-black text-[#C9A84C] mb-4">PARLAYZ</h1>
              <p className="text-[#8B8B8B] mb-2">Clerk authentication not configured.</p>
              <p className="text-xs text-[#555555] font-mono bg-[#141414] p-3 rounded-lg mt-4">
                Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to your environment variables.
              </p>
            </div>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ClerkProvider
          publishableKey={publishableKey}
          appearance={{
            baseTheme: undefined,
            variables: {
              colorBackground: '#141414',
              colorInputBackground: '#141414',
              colorPrimary: '#B8860B',
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
              formButtonPrimary: 'bg-[#B8860B] hover:bg-[#C9A84C] text-black',
              formFieldInput: 'bg-[#141414] border border-[#222222] text-white focus:border-[#B8860B]',
              footerActionLink: 'text-[#B8860B] hover:text-[#C9A84C]',
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