import { ClerkProvider } from '@clerk/nextjs'
import { Providers } from './providers'
import { CurrencyProvider } from '@/src/hooks/useWallet'
import ClientLayout from '@/src/components/ClientLayout'

export const metadata = {
  title: 'PARLAYZ - Kenya Prediction Market',
  description: 'Prediction markets on sports, crypto, politics & more. KSh only, M-Pesa native.',
}

const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #0a0a0a; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; min-height: 100vh; }
  a { color: inherit; text-decoration: none; }
  button { font-family: inherit; cursor: pointer; }
  
  /* Layout */
  .container { max-width: 1400px; margin: 0 auto; padding: 0 1rem; }
  .min-h-screen { min-height: 100vh; }
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .justify-center { justify-content: center; }
  .justify-between { justify-content: space-between; }
  .grid { display: grid; }
  .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  .gap-3 { gap: 0.75rem; }
  .gap-4 { gap: 1rem; }
  
  /* Spacing */
  .p-3 { padding: 0.75rem; }
  .p-4 { padding: 1rem; }
  .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
  .px-4 { padding-left: 1rem; padding-right: 1rem; }
  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
  .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
  .pt-3 { padding-top: 0.75rem; }
  .pt-4 { padding-top: 1rem; }
  .pb-20 { padding-bottom: 5rem; }
  .mb-2 { margin-bottom: 0.5rem; }
  .mb-3 { margin-bottom: 0.75rem; }
  .mb-4 { margin-bottom: 1rem; }
  .mb-6 { margin-bottom: 1.5rem; }
  .mt-1 { margin-top: 0.25rem; }
  .mt-2 { margin-top: 0.5rem; }
  .mt-4 { margin-top: 1rem; }
  .mx-auto { margin-left: auto; margin-right: auto; }
  
  /* Colors */
  .bg-primary { background-color: #0a0a0a; }
  .bg-card { background-color: #141414; }
  .bg-card-hover { background-color: #1a1a1a; }
  .bg-gold { background-color: #F0A500; }
  .text-white { color: #ffffff; }
  .text-black { color: #000000; }
  .text-gold { color: #F0A500; }
  .text-muted { color: #555555; }
  .text-secondary { color: #8B8B8B; }
  .text-gray-400 { color: #9ca3af; }
  .text-gray-500 { color: #6b7280; }
  .text-gray-600 { color: #4b5563; }
  
  /* Borders */
  .border { border: 1px solid #222222; }
  .border-b { border-bottom: 1px solid #222222; }
  .border-t { border-top: 1px solid #222222; }
  .rounded { border-radius: 0.25rem; }
  .rounded-lg { border-radius: 0.5rem; }
  .rounded-xl { border-radius: 0.75rem; }
  .rounded-full { border-radius: 9999px; }
  
  /* Typography */
  .font-bold { font-weight: 700; }
  .font-black { font-weight: 900; }
  .font-medium { font-weight: 500; }
  .font-mono { font-family: monospace; }
  .text-xs { font-size: 0.75rem; }
  .text-sm { font-size: 0.875rem; }
  .text-lg { font-size: 1.125rem; }
  .text-xl { font-size: 1.25rem; }
  .text-2xl { font-size: 1.5rem; }
  .text-3xl { font-size: 1.875rem; }
  .text-4xl { font-size: 2.25rem; }
  .uppercase { text-transform: uppercase; }
  .tracking-widest { letter-spacing: 0.1em; }
  .leading-snug { line-height: 1.375; }
  
  /* Sizing */
  .w-full { width: 100%; }
  .h-full { height: 100%; }
  .w-8 { width: 2rem; }
  .h-8 { height: 2rem; }
  .w-10 { width: 2.5rem; }
  .h-10 { height: 2.5rem; }
  .w-2 { width: 0.5rem; }
  .h-2 { height: 0.5rem; }
  .w-1\\.5 { width: 0.375rem; }
  .h-1\\.5 { height: 0.375rem; }
  .w-3 { width: 0.75rem; }
  .h-3 { height: 0.75rem; }
  .w-3\\.5 { width: 0.875rem; }
  .h-3\\.5 { height: 0.875rem; }
  .w-4 { width: 1rem; }
  .h-4 { height: 1rem; }
  .w-32 { width: 8rem; }
  .h-8 { height: 2rem; }
  
  /* Position */
  .relative { position: relative; }
  .absolute { position: absolute; }
  .sticky { position: sticky; }
  .fixed { position: fixed; }
  .top-0 { top: 0; }
  .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
  .z-10 { z-index: 10; }
  .z-50 { z-index: 50; }
  
  /* Effects */
  .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
  .transition { transition: all 0.2s ease; }
  .transition-all { transition: all 0.2s ease; }
  .duration-200 { transition-duration: 0.2s; }
  .duration-300 { transition-duration: 0.3s; }
  .opacity-0 { opacity: 0; }
  .opacity-90 { opacity: 0.9; }
  
  /* Hover */
  .hover\\:bg-card-hover:hover { background-color: #1a1a1a; }
  .hover\\:text-gold:hover { color: #F0A500; }
  .hover\\:border-gold:hover { border-color: #F0A500; }
  .hover\\:opacity-90:hover { opacity: 0.9; }
  
  /* Responsiveness */
  @media (min-width: 640px) {
    .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (min-width: 768px) {
    .md\\:flex { display: flex; }
    .md\\:px-4 { padding-left: 1rem; padding-right: 1rem; }
    .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (min-width: 1024px) {
    .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (min-width: 1280px) {
    .xl\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }
  
  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0a0a0a; }
  ::-webkit-scrollbar-thumb { background: #F0A500; border-radius: 3px; }
  ::selection { background: rgba(201, 168, 76, 0.3); }
`

export const dynamic = 'force-dynamic'

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
const isValidKey = publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_')

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (!isValidKey) {
    return (
      <html lang="en">
<body style={{ background: '#0a0a0a', color: '#ffffff', minHeight: '100vh' }}>
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
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
      <body style={{ background: '#0a0a0a', color: '#ffffff', minHeight: '100vh' }}>
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