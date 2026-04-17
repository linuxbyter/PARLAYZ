# PARLAYZ — Project TODO

## Design System & Foundation
- [x] Dark theme CSS variables (black #000, gold #D4AF37, high-contrast)
- [x] JetBrains Mono + Inter fonts via Google Fonts
- [x] Global index.css with design tokens
- [x] App shell with routing (Dashboard, Bet History, Parlay AI)
- [x] Top navigation bar (desktop) with PARLAYZ logo
- [x] Bottom navigation bar (mobile)

## Logo
- [x] Generate geometric PARLAYZ logo (SVG, gold on black)
- [x] Upload to CDN and integrate into nav

## Database Schema
- [x] markets table (sport, teams, odds, bet types, line movement)
- [x] bets table (user_id, market_id, stake, payout, status: Won/Lost/Pending)
- [x] wallet_connections table (user_id, address, balance)

## tRPC Routers
- [x] markets router (list, filter by sport/bet type, live odds)
- [x] bets router (place bet, get history)
- [x] parlay router (AI suggestion via LLM)
- [x] wallet router (connect, get balance)

## Dashboard
- [x] Market filter bar (NFL, NBA, MLB, Soccer + Moneyline, Spread, Over/Under)
- [x] Market cards (sport, matchup, odds, line movement indicator)
- [x] Live odds sparkline chart per card (Recharts)
- [x] Sentiment/pool bar (public betting split %)
- [x] Live odds data via Manus Data API (mock with live ticking simulation)

## Bet Slip
- [x] Collapsible side drawer (desktop) / bottom sheet (mobile)
- [x] Selected bets list
- [x] Stake input field
- [x] Potential payout calculation
- [x] Place Bet CTA button

## Wallet UI
- [x] Mock Web3 wallet connect button (MetaMask / WalletConnect styled)
- [x] Connected address display (truncated)
- [x] Balance chip

## Bet History Page
- [x] Table/list of past bets
- [x] Status badges: Won, Lost, Pending
- [x] Payout amounts display

## AI Parlay Engine
- [x] LLM-powered parlay suggestion from selected markets
- [x] Confidence score per suggestion
- [x] Reasoning explanation display

## Responsive / QA
- [x] Mobile-first layout (375px+)
- [x] Desktop layout (1440px)
- [x] Vitest unit tests (11 tests passing)
- [x] Checkpoint and publish
