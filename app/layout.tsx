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

// Force fallback for testing when key is invalid
const useFallback = !isValidKey || publishableKey === 'pk_test_...'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Show simple fallback if Clerk key is invalid
  if (useFallback) {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>PARLAYZ - Kenya Prediction Market</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
          <style>{`
            body { margin: 0; padding: 0; background: #0a0a0a; color: #ffffff; font-family: 'Geist', system-ui, sans-serif; }
            .container { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            .content { text-align: center; max-width: 400px; padding: 20px; }
            h1 { color: #C9A84C; font-size: 48px; font-weight: 900; margin-bottom: 16px; }
            p { color: #8B8B8B; margin-bottom: 8px; }
            .code { background: #141414; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 12px; color: #555555; }
          `}</style>
        </head>
        <body>
          <div className="container">
            <div className="content">
              <h1>PARLAYZ</h1>
              <p>Clerk authentication not configured.</p>
              <div className="code">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not set</div>
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