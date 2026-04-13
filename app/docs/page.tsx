'use client'

import { BookOpen, Code, TrendingUp, Shield, HelpCircle } from 'lucide-react'

const docsSections = [
  {
    icon: BookOpen,
    title: 'How Parlayz Works',
    content: `Parlayz is a prediction market platform where users can trade on the outcomes of real-world events. Unlike traditional betting, prices are determined by market demand (like a stock exchange).

When you buy a "Yes" share and the event happens, you win KSh 1.00 per share. If the event doesn't happen, your shares are worth nothing. The price of "Yes" reflects the market's belief in probability - if 70% think something will happen, "Yes" trades at 70¢.`
  },
  {
    icon: TrendingUp,
    title: 'How Prices Are Set',
    content: `Parlayz uses an Automated Market Maker (AMM) system similar to Polymarket:

- Each market starts with 50/50 odds (50¢ for Yes, 50¢ for No)
- As more people buy "Yes", the price rises toward 99¢
- As more people buy "No", the price falls toward 1¢
- This creates a dynamic, real-time probability based on collective wisdom

The more trading activity, the more accurate the prices become.`
  },
  {
    icon: Shield,
    title: 'How Resolution Works',
    content: `Markets are resolved using trusted data sources:

**Crypto Markets**: Prices verified via Binance API at exact close time
**Sports**: Results from SportRadar official feeds
**Politics**: Sources include Wikipedia, official government announcements
**Custom**: Market creator specifies resolution source in market terms

If there's a dispute, our admin team reviews the evidence and makes a final decision. All resolution data is transparent and publicly verifiable.`
  },
  {
    icon: Code,
    title: 'API Access',
    content: `Parlayz offers API access for developers:

**Endpoints**:
- GET /api/markets - List all active markets
- GET /api/markets/[id] - Get market details and prices
- POST /api/place-bet - Place a bet (requires auth)

**Rate Limits**: 100 requests/minute
**Authentication**: API key required (contact support)

Coming soon: WebSocket for real-time price updates.`
  },
  {
    icon: HelpCircle,
    title: 'Getting Started',
    content: `**For Traders**:
1. Sign up with Google or email
2. Deposit via M-Pesa (KSh) or crypto (USDT)
3. Browse markets - no login required to view!
4. Click "Yes" or "No" to place a bet
5. Collect winnings when market resolves

**Tips**:
- Start small and diversify across markets
- Follow your expertise (sports, crypto, politics)
- Check the "Accuracy" page to see our track record
- Join our Discord for market discussion`
  },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-8 h-8 text-[#C9A84C]" />
          <h1 className="text-2xl font-black">Documentation</h1>
        </div>

        <div className="space-y-6">
          {docsSections.map((section, i) => {
            const Icon = section.icon
            return (
              <div 
                key={i}
                className="bg-[#141414] border border-[#222222] rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#2A1F00] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#C9A84C]" />
                  </div>
                  <h2 className="text-lg font-bold text-white">{section.title}</h2>
                </div>
                <div className="text-[#8B8B8B] whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 p-6 bg-[#141414] border border-[#222222] rounded-xl text-center">
          <h3 className="font-bold text-white mb-2">Need More Help?</h3>
          <p className="text-[#8B8B8B] text-sm mb-4">Join our community or contact support</p>
          <div className="flex justify-center gap-4">
            <a href="https://discord.gg/parlayz" className="px-4 py-2 bg-[#C9A84C] text-black font-bold rounded-lg hover:bg-[#B8860B] transition">
              Join Discord
            </a>
            <a href="mailto:support@parlayz.com" className="px-4 py-2 bg-[#222222] text-white font-bold rounded-lg hover:bg-[#333] transition">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}