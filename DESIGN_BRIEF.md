# PARLAYZ - Technical & Design Brief

## For: Manus AI Agent
**Project**: High-Fidelity Web3 Betting Application  
**Date**: April 16, 2026  
**Status**: Active Development (v2.0.0)

### Target Markets
**Primary**: United States, United Kingdom, Canada, Australia

> **UI Mandate**: Financial-grade interface required. Users expect Bloomberg/Robinhood-level polish. This is not a crypto "degen" app—it's a professional prediction market.

---

## 1. Core Architecture

### Tech Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 15.1.0 |
| Language | TypeScript | 5.2.2 |
| Styling | Tailwind CSS | 3.4.0 |
| State | React hooks + TanStack Query | 5.66.0 |
| Auth | Clerk | 6.12.0 |
| Blockchain | Wagmi + Viem | 2.14.0 / 2.23.0 |
| Database | Supabase | 2.100.1 |
| Animation | Framer Motion | 12.38.0 |
| Icons | Lucide React | 0.475.0 |
| Charts | Recharts | 3.8.1 |
| Dates | date-fns | 4.1.0 |

### State Management Pattern
- **Client Components**: `'use client'` directive with `useState`, `useEffect`, `useCallback`, `useRef`
- **Custom Hooks**: `useMarketLogic.ts` for betting logic, `useWallet.tsx` for wallet state
- **Providers**: React Context for global state (CurrencyProvider, ClerkProvider)
- **Server Components**: Layout and pages use React Server Components where possible

### Data Flow
```
Binance API → Live Price Feed
    ↓
useMarketLogic Hook → MarketState (phase, pools, stakes)
    ↓
Components → UI Updates (Framer Motion animations)
    ↓
Smart Contracts (Wagmi/Viem) → Blockchain Transactions
```

---

## 2. Design System

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `gold` | `#C5A059` | Secondary accent |
| `gold-light` | `#D4AF37` | Primary accent (borders, buttons, highlights) |
| `gold-dark` | `#B8860B` | Scrollbars, hover states |
| `black` | `#000000` | Primary background |
| `black-soft` | `#0A0A0A` | Card backgrounds, nested elements |
| `black-card` | `#111111` | Elevated surfaces |
| `black-border` | `#1F1F1F` | Borders, dividers |

### Typography
| Style | Font | Weight | Usage |
|-------|------|--------|-------|
| Monospace | JetBrains Mono | 400-800 | Numbers, prices, addresses, code |
| Sans | Inter | 400-900 | Body text, headings, UI labels |

**Scale**:
- Hero: `text-4xl font-black`
- Section: `text-xl font-bold`
- Card titles: `text-sm font-bold`
- Labels: `text-[10px] font-bold uppercase tracking-wider`
- Micro: `text-[9px] font-medium`

### Component Structure
```
Component Architecture:
├── Layout Components
│   └── layout.tsx (ClerkProvider, CurrencyProvider, metadata)
├── Page Components
│   ├── page.tsx (home)
│   ├── wallet/page.tsx
│   ├── market/[id]/page.tsx
│   ├── duel/[id]/page.tsx
│   └── admin/resolution/page.tsx
├── Feature Components
│   ├── BettingDashboard.tsx (NEW)
│   ├── CryptoMarketCard.tsx
│   ├── CryptoMarketSection.tsx
│   ├── LivePriceChart.tsx
│   ├── SentimentChart.tsx
│   ├── PoolAnimation.tsx
│   ├── ParimutuelGraph.tsx
│   └── Header.tsx
├── Hooks
│   ├── useMarketLogic.ts
│   └── useWallet.tsx
└── Utilities
    ├── instruments.ts
    ├── abi/ (contracts)
    └── lib/
```

### Spacing & Border Radius
- Border radius: `rounded-xl` (12px) for cards, `rounded-lg` (8px) for buttons
- Padding: `p-4` standard, `p-3` compact, `p-6` spacious
- Borders: `border border-[#1F1F1F]` standard, `border-2` emphasis

---

## 3. The 'Anti-Overcode' Directive

### Explicit Requirements
> **MINIMALIST FIRST. EVERY PIXEL MUST JUSTIFY ITS EXISTENCE.**

#### Do This
- Clean, uncluttered interfaces with generous whitespace
- Single-purpose components with clear visual hierarchy
- Data-dense displays that remain scannable (e.g., price/labels in `text-[10px]`)
- Subtle animations that guide attention, not distract
- Gold accents used sparingly as highlights, not backgrounds
- Dark mode default: `#000000` background, `#111` cards

#### Never This
- Gradient backgrounds on entire sections
- Excessive shadows or glows
- Cluttered data tables with 10+ columns
- Animated backgrounds or particle effects
- Neon colors outside the gold/black palette
- Decorative borders or ornamental UI elements
- Overstuffed cards with multiple competing CTAs
- "Busy" designs with too many colors or gradients

### Web3-Native Principles
- **Data clarity**: Prices, addresses, and numbers in monospace
- **Transparency**: Show pool sizes, odds, timestamps prominently
- **Trust signals**: Lock icons for locked phases, checkmarks for resolved
- **Non-custodial**: Wallet-first, no "deposit" flows
- **On-chain data**: Transaction hashes, block confirmations visible

### Financial-Grade UI (US/UK/CA/AU Markets)
Users in these markets expect institutional-quality interfaces. Reference points:
- **Bloomberg Terminal**: Dense, scannable, professional
- **Robinhood**: Clean entry points, progressive disclosure
- **Betfair Exchange**: Odds-first, data-heavy but organized

#### Mandatory Standards
| Requirement | Rationale |
|-------------|-----------|
| Sub-second price updates | Trust in real-time data |
| Clear position sizing | Risk management |
| Order book / pool visibility | Transparency |
| Withdrawal transparency | "Where are my funds?" |
| Mobile-first responsive | US/UK/CA/AU = high mobile usage |
| No dark patterns | Regulatory scrutiny in these markets |

---

## 4. Branding Direction

### Logo Brief: "Slips-Inspired Minimalism"

**Reference**: The Slips app aesthetic—geometric precision, high impact, instantly recognizable at any scale.

#### Visual Direction
```
Concept: A stylized "P" merged with an upward arrow/chevron
- Represents: Prediction + Momentum + Win
- Feel: Bold, confident, premium
- Memorability: Single glyph, no text needed
```

#### Design Specifications
| Element | Requirement |
|---------|------------|
| **Geometry** | Clean lines, no curves unless essential |
| **Weight** | Bold/Black weight for impact |
| **Negative Space** | Use strategically—whitespace = sophistication |
| **Monochrome** | Works in gold (#D4AF37) or white on black |
| **Scalability** | Readable at 16px favicon and 512px app icon |
| **Variants** | Horizontal (with "PARLAYZ" text) + Icon-only |

#### Mood Words
- Precise | Bold | Premium | Minimal | Trustworthy

#### Avoid
- Generic crypto logos (no diamonds, no coins, no abstract blobs)
- Text-heavy marks
- gradients or 3D effects
- Detailed illustrations or mascots

### Brand Voice
- **Confident**: "Trade with conviction"
- **Minimal**: No jargon, no hype
- **Transparent**: "Non-custodial. Your keys, your funds."

---

## 5. Implementation Notes for Manus

### Priority Features (Next Sprint)
1. BettingDashboard integration into main page
2. Wallet connection flow (Wagmi + MetaMask)
3. Live price feed from Binance WebSocket
4. 10-minute market cycle with countdown timer

### Key Files to Reference
- `src/components/CryptoMarketCard.tsx` - Current UI patterns
- `src/hooks/useMarketLogic.ts` - Market state machine
- `src/lib/instruments.ts` - Instrument configuration
- `app/globals.css` - CSS variables and animations

### Testing Requirements
- Responsive: 375px (mobile) to 1440px (desktop)
- Accessibility: WCAG 2.1 AA contrast ratios
- Performance: <100ms UI response for betting interactions

---

*Brief compiled from codebase analysis. Updates to be made as architecture evolves.*
