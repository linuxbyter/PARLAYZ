// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Zap, ArrowRight, Send, X, Link2 } from "lucide-react"
import Auth from './components/Auth' // <-- REAL AUTH INJECTED HERE

// Unique bet notifications - each one appears only once
const betNotifications = [
  { id: 1, user: "SATOSHIN", amount: "5,000 KSh", market: "BTC > $100k" },
  { id: 2, user: "WHALE_ALPHA", amount: "12,500 USDC", market: "ETH flips BTC" },
  { id: 3, user: "TRADER_99", amount: "2,500 on YES", market: "Hamilton P1 Monaco" },
  { id: 4, user: "CRYPTO_KING", amount: "8,000 KSh", market: "SOL > $500" },
  { id: 5, user: "ARSENAL_FAN", amount: "3,200 USDC", market: "Arsenal UCL Win" },
  { id: 6, user: "DEGEN_LORD", amount: "15,000 KSh", market: "DOGE > $1" },
  { id: 7, user: "F1_EXPERT", amount: "4,800 USDC", market: "Verstappen WDC 2027" },
  { id: 8, user: "FASHION_WHALE", amount: "6,500 KSh", market: "Balenciaga IPO" },
  { id: 9, user: "ANON_TRADER", amount: "9,200 USDC", market: "Fed Rate Cut Q2" },
  { id: 10, user: "BULL_MARKET", amount: "20,000 KSh", market: "NVDA > $200" },
  { id: 11, user: "RISK_TAKER", amount: "7,100 USDC", market: "Chelsea Top 4" },
  { id: 12, user: "DIAMOND_HANDS", amount: "11,000 KSh", market: "XRP > $5" },
  { id: 13, user: "SPORTS_GURU", amount: "5,500 USDC", market: "Lakers Championship" },
  { id: 14, user: "MACRO_CHAD", amount: "18,000 KSh", market: "Gold > $3000" },
  { id: 15, user: "FINAL_BOSS", amount: "25,000 USDC", market: "Trump 2028" },
]

// Mock market data
const markets = [
  {
    id: 1,
    title: "Will Hamilton win Monaco GP?",
    category: "F1",
    image: "https://images.unsplash.com/photo-1504707748692-419802cf939d?w=800&auto=format&fit=crop",
    yesPercent: 64,
    noPercent: 36,
    poolSize: "$1,200,000",
  },
  {
    id: 2,
    title: "Will BTC hit $80k?",
    category: "Crypto",
    image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop",
    yesPercent: 72,
    noPercent: 28,
    poolSize: "$2,500,000",
  },
  {
    id: 3,
    title: "Balenciaga Paris Fashion Week",
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
    yesPercent: 45,
    noPercent: 55,
    poolSize: "$800,000",
  },
  {
    id: 4,
    title: "Arsenal to beat Liverpool",
    category: "Sports",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop",
    yesPercent: 58,
    noPercent: 42,
    poolSize: "$1,800,000",
  },
  {
    id: 5,
    title: "ETH > $5K by Q2 2027",
    category: "Crypto",
    image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&auto=format&fit=crop",
    yesPercent: 51,
    noPercent: 49,
    poolSize: "$1,400,000",
  },
  {
    id: 6,
    title: "Verstappen WDC 2027",
    category: "F1",
    image: "https://images.unsplash.com/photo-1541773319920-190f5f8f81b6?w=800&auto=format&fit=crop",
    yesPercent: 78,
    noPercent: 22,
    poolSize: "$3,200,000",
  },
]

const categories = ["All", "Sports", "Crypto", "F1", "Fashion"]

interface Market {
  id: number
  title: string
  category: string
  image: string
  yesPercent: number
  noPercent: number
  poolSize: string
}

// iOS-style Notification Toast
function NotificationToast({ notification, isVisible }: { notification: typeof betNotifications[0] | null; isVisible: boolean }) {
  if (!notification) return null
  
  return (
    <div 
      className={`fixed left-1/2 top-6 z-50 -translate-x-1/2 transition-all duration-500 ease-out ${
        isVisible 
          ? "translate-y-0 opacity-100" 
          : "-translate-y-full opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 rounded-3xl bg-[#1c1c1e]/90 px-5 py-3 shadow-2xl backdrop-blur-xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D9C5A0]">
          <Zap className="h-5 w-5 text-[#0D0D0D]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            <span className="text-[#D9C5A0]">{notification.user}</span> just bet
          </p>
          <p className="text-xs text-[#8e8e93]">
            {notification.amount} on <span className="text-white">{notification.market}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// Navbar
function Navbar({ onEnterWarzone }: { onEnterWarzone: () => void }) {
  return (
    <nav className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-2">
        <Zap className="h-6 w-6 text-[#D9C5A0]" />
        <span className="text-xl font-bold text-white">Parlayz</span>
      </div>
      <button 
        onClick={onEnterWarzone}
        className="border border-[#1F1F1F] bg-transparent px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#D9C5A0] hover:text-[#D9C5A0]"
      >
        Enter Warzone
      </button>
    </nav>
  )
}

// Terminal Mockup
function TerminalMockup() {
  return (
    <div 
      className="relative hidden lg:block"
      style={{ 
        transform: "perspective(1000px) rotateY(-5deg) rotateX(5deg)",
        transformStyle: "preserve-3d"
      }}
    >
      <div className="w-[380px] border border-[#D9C5A0]/30 bg-[#0a0a0a] p-5">
        <div className="mb-5">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-[#666]">Live Warzones Active</div>
          <div className="text-4xl font-bold text-[#D9C5A0]">14,023</div>
        </div>
        
        <div className="mb-5">
          <div className="mb-3 text-[10px] uppercase tracking-wider text-[#666]">Recent Matches</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between border border-[#1F1F1F] bg-[#111] p-3">
              <div>
                <div className="text-sm font-bold text-white">USER133 vs USER456</div>
                <div className="text-xs text-[#D9C5A0]">(500 USDC)</div>
                <div className="text-xs text-[#666]">Arsenal to win</div>
              </div>
              <div className="h-3 w-3 rounded-full bg-red-500" />
            </div>
            <div className="flex items-center justify-between border border-[#1F1F1F] bg-[#111] p-3">
              <div>
                <div className="text-sm font-bold text-white">USER758 vs USER612</div>
                <div className="text-xs text-[#D9C5A0]">(1200 USDC)</div>
                <div className="text-xs text-[#666]">Chelsea vs PSG Draw</div>
              </div>
              <div className="h-3 w-3 rounded-full bg-blue-500" />
            </div>
          </div>
        </div>
        
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#666]">Bet MRS</span>
            <ArrowRight className="h-3 w-3 text-[#666]" />
          </div>
          <div className="h-20 overflow-hidden text-[7px] leading-relaxed text-[#333]">
            {Array(12).fill(0).map((_, i) => (
              <div key={i}>
                USER{100 + i} vs USER{200 + i} in prediction match vs market format...
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div 
        className="absolute -right-24 top-0 w-24 border border-[#1F1F1F] bg-[#0a0a0a] p-3"
        style={{ transform: "translateZ(-20px) rotateY(10deg)" }}
      >
        <div className="mb-1 text-[8px] uppercase tracking-wider text-[#666]">Live Activity</div>
        <div className="text-lg font-bold text-[#D9C5A0]">80%</div>
        <svg viewBox="0 0 80 40" className="mt-3 h-12 w-full">
          <path d="M0 35 L15 28 L30 32 L45 20 L60 25 L80 15" fill="none" stroke="#D9C5A0" strokeWidth="1.5" />
        </svg>
      </div>
      
      <div 
        className="absolute -right-52 top-0 w-24 border border-[#1F1F1F] bg-[#0a0a0a] p-3"
        style={{ transform: "translateZ(-40px) rotateY(10deg)" }}
      >
        <div className="mb-1 text-[8px] uppercase tracking-wider text-[#666]">Market Sentiment</div>
        <div className="mt-2 flex flex-col gap-1 text-[8px] text-[#444]">
          <span>60</span>
          <span>40</span>
          <span>20</span>
        </div>
        <svg viewBox="0 0 80 40" className="mt-2 h-12 w-full">
          <path d="M0 30 L20 22 L40 28 L60 12 L80 18" fill="none" stroke="#D9C5A0" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  )
}

// Hero Section
function HeroSection({ onStartWarzone }: { onStartWarzone: () => void }) {
  return (
    <section className="px-6 py-16 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-12 lg:flex-row lg:items-center">
        <div className="max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1F1F1F] bg-[#111] px-4 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[#888]">Live Warzones Active</span>
          </div>
          
          <h1 className="mb-6 text-5xl font-black leading-[1.1] tracking-tight text-white lg:text-7xl">
            Put your money where{" "}
            <span className="text-[#D9C5A0]">your mouth is.</span>
          </h1>
          
          <p className="mb-8 text-lg leading-relaxed text-[#666]">
            Stop arguing in the group chat. Lock your stance, share the challenge link, and turn your debates into liquid cash in a live peer-to-peer exchange.
          </p>
          
          <button 
            onClick={onStartWarzone}
            className="inline-flex items-center gap-2 bg-[#D9C5A0] px-8 py-4 text-base font-bold text-[#0D0D0D] transition-colors hover:bg-[#c9b590] rounded-xl"
          >
            Start a Warzone
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
        <TerminalMockup />
      </div>
    </section>
  )
}

// Market Card
function MarketCard({ market, onClick }: { market: Market; onClick: () => void }) {
  return (
    <div className="overflow-hidden border border-[#1F1F1F] bg-[#151515] rounded-2xl cursor-pointer hover:border-[#D9C5A0]/50 transition group">
      <div className="relative h-48 overflow-hidden">
        <img
          src={market.image}
          alt={market.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-[#151515]/50 to-transparent" />
      </div>
      
      <div className="p-4">
        <h3 className="mb-4 text-lg font-bold leading-tight text-white group-hover:text-[#D9C5A0] transition-colors">
          {market.title}
        </h3>
        
        <div className="mb-2 flex h-6 w-full overflow-hidden text-xs font-bold rounded-full">
          <div
            className="flex items-center justify-start bg-[#D9C5A0] pl-3 text-[#0D0D0D]"
            style={{ width: `${market.yesPercent}%` }}
          >
            Yes {market.yesPercent}%
          </div>
          <div
            className="flex items-center justify-end bg-[#2A2A2A] pr-3 text-white"
            style={{ width: `${market.noPercent}%` }}
          >
            No {market.noPercent}%
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-6">
          <p className="text-xs text-[#666] font-bold uppercase tracking-widest">
            Pool: <span className="text-[#D9C5A0]">{market.poolSize}</span>
          </p>
          <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="bg-[#D9C5A0] px-4 py-2 text-xs font-bold text-[#0D0D0D] transition-colors hover:bg-[#c9b590] rounded-lg"
          >
            Trade
          </button>
        </div>
      </div>
    </div>
  )
}

// Markets Section
function MarketsSection({ 
  selectedCategory, 
  setSelectedCategory,
  onSelectMarket 
}: { 
  selectedCategory: string
  setSelectedCategory: (cat: string) => void
  onSelectMarket: (market: Market) => void 
}) {
  const filteredMarkets = selectedCategory === "All" 
    ? markets 
    : markets.filter(m => m.category === selectedCategory)
  
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-white text-[#0D0D0D]"
                  : "border border-[#1F1F1F] bg-transparent text-[#888] hover:border-[#D9C5A0] hover:text-[#D9C5A0]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMarkets.map((market) => (
            <MarketCard 
              key={market.id} 
              market={market} 
              onClick={() => onSelectMarket(market)} 
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// Stats Footer
function StatsFooter() {
  return (
    <footer className="border-t border-[#1F1F1F] bg-[#111111] px-6 py-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 md:grid-cols-4">
        <div className="text-center">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-[#666]">Total Locked Value</p>
          <p className="text-2xl font-bold text-[#D9C5A0]">$12,500,000</p>
        </div>
        <div className="text-center">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-[#666]">Active Traders</p>
          <p className="text-2xl font-bold text-white">25,456</p>
        </div>
        <div className="text-center">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-[#666]">Avg Return</p>
          <p className="text-2xl font-bold text-[#D9C5A0]">18%</p>
        </div>
        <div className="text-center">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-[#666]">Protocol Fee</p>
          <p className="text-2xl font-bold text-white">3%</p>
        </div>
      </div>
    </footer>
  )
}

// THE REAL AUTH MODAL
function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md border border-[#D9C5A0]/30 bg-[#111111] p-8 rounded-3xl shadow-[0_0_50px_rgba(217,197,160,0.15)]">
        <button 
          onClick={onClose}
          className="absolute right-5 top-5 text-[#666] transition-colors hover:text-white z-50"
        >
          <X className="h-6 w-6" />
        </button>
        
        <h2 className="mb-6 text-center text-3xl font-bold text-white">
          Enter the Arena
        </h2>
        
        {/* THIS IS YOUR ACTUAL CLERK/SUPABASE COMPONENT */}
        <div className="w-full">
           <Auth /> 
        </div>
      </div>
    </div>
  )
}

// Live Chat
const chatMessages = [
  { user: "USER789", type: "trade" as const, amount: "$500", side: "Yes" },
  { user: "USER456", type: "message" as const, text: "It's pumping!" },
  { user: "USER789", type: "trade" as const, amount: "$500", side: "Yes" },
  { user: "USER456", type: "message" as const, text: "Branks gaming!" },
  { user: "USER789", type: "trade" as const, amount: "$500", side: "Yes" },
  { user: "USER456", type: "message" as const, text: "It's pumping!" },
  { user: "USER789", type: "trade" as const, amount: "$500", side: "Yes" },
  { user: "USER456", type: "message" as const, text: "It's pumping!" },
]

function LiveChat() {
  const [message, setMessage] = useState("")
  
  return (
    <div className="border border-[#1F1F1F] bg-[#111111] rounded-2xl overflow-hidden mt-6">
      <div className="max-h-64 overflow-y-auto p-4">
        {chatMessages.map((msg, i) => (
          <div key={i} className="mb-2 rounded bg-[#1a1a1a] px-3 py-2 text-sm border border-[#1F1F1F]">
            {msg.type === "trade" ? (
              <>
                <span className="font-bold text-[#D9C5A0]">{msg.user}</span>
                <span className="text-[#666]"> bought </span>
                <span className="text-white">{msg.amount}</span>
                <span className="text-[#10b981]"> {msg.side}</span>
              </>
            ) : (
              <>
                <span className="font-bold text-[#D9C5A0]">{msg.user}:</span>
                <span className="text-white"> "{msg.text}"</span>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex border-t border-[#1F1F1F]">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-[#444] focus:outline-none"
        />
        <button className="px-4 text-[#D9C5A0] transition-colors hover:text-white">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Trade Slip
function TradeSlip({ market, onRequireAuth }: { market: Market, onRequireAuth: () => void }) {
  const [mode, setMode] = useState<"POOL" | "DUEL">("POOL")
  const [stake, setStake] = useState("")
  const [youRisk, setYouRisk] = useState("")
  const [opponentPays, setOpponentPays] = useState("")
  
  const isDuel = mode === "DUEL"
  
  return (
    <div className={`border border-[#1F1F1F] rounded-3xl overflow-hidden ${isDuel ? "bg-[#1a0a0c]" : "bg-[#111111]"}`}>
      <div className="flex border-b border-[#1F1F1F] bg-[#0D0D0D] p-1 m-2 rounded-xl">
        <button
          onClick={() => setMode("POOL")}
          className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider transition-colors rounded-lg ${
            mode === "POOL"
              ? "bg-[#1a1a1a] text-[#D9C5A0]"
              : "bg-transparent text-[#666] hover:text-[#888]"
          }`}
        >
          Pool
        </button>
        <button
          onClick={() => setMode("DUEL")}
          className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider transition-colors rounded-lg ${
            mode === "DUEL"
              ? "bg-[#2a0a0e] text-[#f43f5e]"
              : "bg-transparent text-[#666] hover:text-[#888]"
          }`}
        >
          Duel
        </button>
      </div>
      
      <div className="p-4">
        {isDuel ? (
          <>
            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f43f5e]/70">
                You Risk
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#f43f5e]">$</span>
                <input
                  type="number"
                  value={youRisk}
                  onChange={(e) => setYouRisk(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-[#f43f5e]/30 bg-[#0D0D0D] py-3 pl-8 pr-4 text-lg text-white placeholder-[#444] focus:border-[#f43f5e] focus:outline-none"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f43f5e]/70">
                Opponent Pays
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#f43f5e]">$</span>
                <input
                  type="number"
                  value={opponentPays}
                  onChange={(e) => setOpponentPays(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-[#f43f5e]/30 bg-[#0D0D0D] py-3 pl-8 pr-4 text-lg text-white placeholder-[#444] focus:border-[#f43f5e] focus:outline-none"
                />
              </div>
            </div>
            
            <div className="mb-4 rounded-xl border border-[#f43f5e]/20 bg-[#0D0D0D] p-3">
              <div className="flex justify-between text-xs text-[#666]">
                <span>Implied Odds</span>
                <span className="text-[#f43f5e] font-bold">
                  {youRisk && opponentPays
                    ? `${((parseFloat(youRisk) / (parseFloat(youRisk) + parseFloat(opponentPays))) * 100).toFixed(1)}%`
                    : "—"}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-[#666]">
                <span>Potential Profit</span>
                <span className="text-[#10b981] font-bold">{opponentPays ? `+$${opponentPays}` : "—"}</span>
              </div>
            </div>
            
            <button onClick={onRequireAuth} className="flex w-full rounded-xl items-center justify-center gap-2 bg-[#f43f5e] py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#e11d48]">
              <Link2 className="h-4 w-4" />
              Generate Challenge Link
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3">
              <button className="w-full rounded-xl bg-[#D9C5A0] py-3.5 text-lg font-bold text-[#0D0D0D]">
                Buy Yes
              </button>
              <button className="w-full rounded-xl border border-[#1F1F1F] bg-[#2A2A2A] py-3.5 text-lg font-bold text-white">
                Buy No
              </button>
            </div>
            
            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#666]">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D9C5A0]">$</span>
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-[#1F1F1F] bg-[#0D0D0D] py-3 pl-8 pr-4 text-lg text-white placeholder-[#444] focus:border-[#D9C5A0] focus:outline-none"
                />
              </div>
            </div>
            
            <div className="mb-4 flex gap-2">
              {["+1K", "+5K", "+10K", "MAX"].map((chip) => (
                <button
                  key={chip}
                  className="flex-1 rounded-lg border border-[#1F1F1F] bg-[#0D0D0D] py-2 text-xs font-bold text-[#D9C5A0] transition-colors hover:border-[#D9C5A0]/50"
                >
                  {chip}
                </button>
              ))}
            </div>
            
            <button onClick={onRequireAuth} className="w-full rounded-xl bg-[#D9C5A0] py-4 text-sm font-bold uppercase tracking-wider text-[#0D0D0D] transition-colors hover:bg-[#c9b590]">
              Submit Order
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// Market Detail View
function MarketDetailView({ market, onBack, onRequireAuth }: { market: Market; onBack: () => void; onRequireAuth: () => void }) {
  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <Navbar onEnterWarzone={onRequireAuth} />
      
      <div className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <button 
            onClick={onBack}
            className="mb-6 text-sm font-bold text-[#666] transition-colors hover:text-white uppercase tracking-widest"
          >
            ← Back to Markets
          </button>
          
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h1 className="mb-6 text-4xl font-black leading-tight text-white lg:text-5xl">
                {market.title.split(" ").slice(0, -1).join(" ")}{" "}
                <span className="text-[#D9C5A0]">{market.title.split(" ").slice(-1)}</span>
              </h1>
              
              <div className="relative mb-6 h-64 overflow-hidden border border-[#1F1F1F] bg-[#111111] rounded-2xl">
                <img
                  src={market.image}
                  alt={market.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-20"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent" />
                <svg viewBox="0 0 400 150" className="absolute inset-0 h-full w-full">
                  <path 
                    d="M0 120 L50 100 L100 110 L150 80 L200 90 L250 60 L300 70 L350 40 L400 50" 
                    fill="none" 
                    stroke="#D9C5A0" 
                    strokeWidth="2"
                  />
                </svg>
              </div>
              
              <div className="mb-2 text-sm font-bold uppercase tracking-widest text-[#666]">Market Sentiment</div>
              <div className="mb-2 flex h-12 w-full overflow-hidden rounded-xl text-base font-bold">
                <div
                  className="flex items-center justify-start bg-[#D9C5A0] pl-4 text-[#0D0D0D]"
                  style={{ width: `${market.yesPercent}%` }}
                >
                  {market.yesPercent}%
                </div>
                <div
                  className="flex items-center justify-end bg-[#2A2A2A] pr-4 text-white"
                  style={{ width: `${market.noPercent}%` }}
                >
                  {market.noPercent}%
                </div>
              </div>
              <div className="mb-8 flex justify-between text-sm font-bold uppercase tracking-widest">
                <span className="text-[#D9C5A0]">Yes</span>
                <span className="text-[#666]">No</span>
              </div>
              
              <div className="mb-8">
                <p className="text-sm font-bold uppercase tracking-widest text-[#666]">Current Pool Size</p>
                <p className="text-4xl font-bold text-[#D9C5A0]">{market.poolSize}</p>
              </div>
              
              <LiveChat />
            </div>
            
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <TradeSlip market={market} onRequireAuth={onRequireAuth} />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <StatsFooter />
    </div>
  )
}

// Main Component
export default function Landing() {
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0)
  const [isNotificationVisible, setIsNotificationVisible] = useState(false)
  const [notificationsDone, setNotificationsDone] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)
  
  // iOS notification cycle
  useEffect(() => {
    if (notificationsDone) return
    
    const showTimer = setTimeout(() => {
      setIsNotificationVisible(true)
    }, 500)
    
    const hideTimer = setTimeout(() => {
      setIsNotificationVisible(false)
    }, 3500)
    
    const nextTimer = setTimeout(() => {
      if (currentNotificationIndex < betNotifications.length - 1) {
        setCurrentNotificationIndex(prev => prev + 1)
      } else {
        setNotificationsDone(true)
      }
    }, 5500)
    
    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
      clearTimeout(nextTimer)
    }
  }, [currentNotificationIndex, notificationsDone])
  
  if (selectedMarket) {
    return (
      <MarketDetailView 
        market={selectedMarket} 
        onBack={() => setSelectedMarket(null)} 
        onRequireAuth={() => setShowAuthModal(true)}
      />
    )
  }
  
  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {!notificationsDone && (
        <NotificationToast 
          notification={betNotifications[currentNotificationIndex]} 
          isVisible={isNotificationVisible} 
        />
      )}
      
      <Navbar onEnterWarzone={() => setShowAuthModal(true)} />
      <HeroSection onStartWarzone={() => setShowAuthModal(true)} />
      <MarketsSection 
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onSelectMarket={setSelectedMarket}
      />
      <StatsFooter />
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}
