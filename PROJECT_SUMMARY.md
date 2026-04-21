# PARLAYZ - Web3 Prediction Market Application

## What It Is

PARLAYZ is a **non-custodial sports and crypto prediction market** built on Next.js 15 with Base L2 blockchain integration. Users can bet on sports outcomes (NFL, NBA, MLB, Soccer) and crypto price movements using USDT, with integrated deposit/withdrawal via M-Pesa, card, and bank transfers.

## Tech Stack

- **Framework**: Next.js 15.1.0 (App Router)
- **Language**: TypeScript 5.2.2
- **Styling**: Tailwind CSS 3.4.0
- **Auth**: Clerk
- **Blockchain**: Wagmi v2 + Viem (Base L2)
- **Database**: Supabase
- **State**: React hooks + TanStack Query
- **Animation**: Framer Motion
- **Charts**: Recharts

## Current Features (Built)

### UI/UX
- Dark theme with gold accents (#D4AF37)
- Mobile-first responsive design
- Live sports markets with mock data
- Bet type filters (Moneyline, Spread, Over/Under)
- Sport filters (ALL, NFL, NBA, MLB, Soccer)
- Live odds simulation (updates every 4 seconds)
- Bet slip with parlay builder (max 6 legs)
- Desktop: fixed right sidebar | Mobile: bottom sheet

### Pages
- **Home** - Live markets grid with filters
- **Wallet** - Deposit (M-Pesa/Card/Bank) + Withdraw
- **History** - Bet history with win/loss/pending stats
- **Duel** - Head-to-head betting
- **Parlay AI** - AI-assisted parlay building (stub)

### Functionality
- 10-minute market cycle (OPEN → LOCKED → GRACE → RESOLVED)
- Parlay odds calculation
- Potential payout display
- Currency toggle (USDT ↔ KSH)
- Clerk authentication
- Wagmi wallet connection (MetaMask, etc.)

## What's Missing (Not Yet Implemented)

- Real market data (currently mock)
- Live crypto price feed (Binance WebSocket)
- Actual blockchain settlement
- Real payment processing (Kotani API keys needed)
- Supabase backend integration
- AI Chat integration
- Real leaderboard data
- Admin resolution flow

## Design

- **Primary Background**: #000000
- **Card Background**: #111111
- **Borders**: #1F1F1F
- **Accent**: #D4AF37 (Gold)
- **Success**: #22C55E (Green)
- **Error**: #EF4444 (Red)
- **Typography**: Inter (sans) + JetBrains Mono (numbers)
- **Reference**: Bloomberg Terminal meets Robinhood - financial-grade, data-dense but scannable

## Project Structure

```
PARLAYZ/
├── app/                    # Next.js pages
│   ├── page.tsx           # Home
│   ├── wallet/            # Deposit/Withdraw
│   ├── history/           # Bet history
│   ├── duel/[id]/         # Duel betting
│   └── api/               # API routes
├── src/
│   ├── components/        # React components
│   ├── contexts/          # React Context
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities
│   └── abi/               # Contract ABI
├── contracts/             # Solidity contracts
└── supabase/              # DB + Edge functions
```

## Quick Start

```bash
npm install
npm run dev
```

Add to .env:
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
