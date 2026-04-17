"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider, createConfig, http } from "wagmi"
import { mainnet, polygon, base } from "wagmi/chains"
import { injected } from "wagmi/connectors"
import { useState } from "react"
import { Toaster } from "sonner"
import { BetSlipProvider } from "@/src/contexts/BetSlipContext"

const config = createConfig({
  chains: [mainnet, polygon, base],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BetSlipProvider>
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "var(--black-card)",
                border: "1px solid var(--black-border)",
                color: "white",
              },
            }}
          />
          {children}
        </BetSlipProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
