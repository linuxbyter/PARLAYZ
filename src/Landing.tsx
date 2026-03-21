"use client"

import { useState, useEffect } from "react"
import Auth from './components/Auth' // <-- INJECTED REAL AUTH COMPONENT
import { Zap, ArrowRight, Send, X, Link2 } from "lucide-react"

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

// Mock market data (Bait for Landing Page)
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
      <div className="flex items-center gap-3 rounded-3xl bg-[#1c1c1e]/90 px-5 py-3 shadow-2xl backdrop-blur-xl border border-[#ffffff10]">
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
    <nav className="flex items-center justify-between px-6 py-4 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-2">
        <Zap className="h-6 w-6 text-[#D9C5A0]" />
        <span className="text-xl font-bold text-white tracking-wide">Parlayz</span>
      </div>
      <button 
        onClick={onEnterWarzone}
        className="border border-[#1F1F1F] bg-transparent px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-300 transition-colors hover:border-[#D9C5A0] hover:text-[#D9C5A0]"
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
      <div className="w-[380px] border border-[#D9C5A0]/30 rounded-3xl bg-[#0a0a0a] p-5 shadow-[0_0_50px_rgba(197,168,128,0.1)]">
        {/* Live Warzones Header */}
        <div className="mb-5 bg-[#111] border border-[#1F1F1F] p-4 rounded-xl">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-[#666] font-bold">Live Warzones Active</div>
          <div className="text-4xl font-bold text-white">14,023</div>
        </div>
        
        {/* Recent Matches */}
        <div className="mb-5 bg-[#111] border border-[#1F1F1F] p-4 rounded-xl">
          <div className="mb-3 text-[10px] uppercase tracking-wider text-[#666] font-bold">Recent Matches</div>
          <div className="space-y-3">
            <div className="border-b border-[#1F1F1F] pb-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-white">USER133 vs USER456</div>
                <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-[6px]">🛡️</div>
              </div>
              <div className="text-[10px] text-[#D9C5A0] mt-0.5">(500 USDC)</div>
              <div className="text-[10px] text-[#666] mt-1">Arsenal to win</div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-white">USER758 vs USER612</div>
                <div className="h-3 w-3 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center text-[6px]">🌐</div>
              </div>
              <div className="text-[10px] text-[#D9C5A0] mt-0.5">(1200 USDC)</div>
              <div className="text-[10px] text-[#666] mt-1">Chelsea vs PSG Draw</div>
            </div>
          </div>
        </div>
        
        {/* Bet MRS */}
        <div className="bg-[#111] border border-[#1F1F1F] p-4 rounded-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#666] font-bold">Bet Activity <Activity className="inline w-3 h-3"/></span>
          </div>
          <div className="h-16 overflow-hidden space-y-1.5 mt-3">
             <div className="h-1.5 w-full bg-[#1a1a1a] rounded-full"></div>
             <div className="h-1.5 w-[90%] bg-[#1a1a1a] rounded-full"></div>
             <div className="h-1.5 w-[95%] bg-[#1a1a1a] rounded-full"></div>
             <div className="h-1.5 w-[80%] bg-[#1a1a1a] rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Side Panels */}
      <div 
        className="absolute -right-24 top-4 w-28 border border-[#1F1F1F] rounded-xl bg-[#0a0a0a] p-4 shadow-xl"
        style={{ transform: "translateZ(-20px) rotateY(10deg)" }}
      >
        <div className="mb-1 text-[8px] uppercase tracking-wider text-[#666] font-bold">Live Activity</div>
        <div className="text-lg font-bold text-white">824/s</div>
        <svg viewBox="0 0 80 40" className="mt-3 h-12 w-full">
          <path d="M0 35 L15 28 L30 32 L45 20 L60 25 L80 15" fill="none" stroke="#D9C5A0" strokeWidth="2" />
        </svg>
      </div>
      
      <div 
        className="absolute -right-32 top-48 w-32 border border-[#1F1F1F] rounded-xl bg-[#0a0a0a] p-4 shadow-xl"
        style={{ transform: "translateZ(-40px) rotateY(10deg)" }}
      >
        <div className="mb-1 text-[8px] uppercase tracking-wider text-[#666] font-bold">Matching</div>
        <svg viewBox="0 0 80 40" className="mt-4 h-12 w-full">
          <path d="M0 30 L20 22 L40 28 L60 12 L80 18" fill="none" stroke="#10b981" strokeWidth="2" />
        </svg>
      </div>
    </div>
  )
}

// Hero Section
function HeroSection({ onStartWarzone }: { onStartWarzone: () => void }) {
  return (
    <section className="px-6 py-16 lg:py-24 max-w-[1400px] mx-auto">
      <div className="mx-auto flex flex-col items-start justify-between gap-12 lg:flex-row lg:items-center">
        {/* Left - Text */}
        <div className="max-w-xl">
          {/* Live Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#ffffff10] bg-[#141414] px-4 py-1.5 shadow-md">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Live Warzones Active</span>
          </div>
          
          {/* Headline */}
          <h1 className="mb-6 text-6xl font-bold leading-[0.95] tracking-tighter text-white lg:text-[80px] uppercase">
            Put your <br/> money <br/> where <span className="text-[#D9C5A0]">your <br/> mouth is.</span>
          </h1>
          
          {/* Subheadline */}
          <p className="mb-10 text-sm lg:text-base leading-relaxed text-gray-400 font-light max-w-md">
            Stop arguing in the group chat. Lock your stance, share the challenge link, and turn your debates into liquid cash in a live peer-to-peer exchange.
          </p>
          
          {/* CTA Button */}
          <button 
            onClick={onStartWarzone}
            className="inline-flex items-center gap-3 rounded-xl bg-[#D9C5A0] px-8 py-4 text-sm font-bold text-[#0a0a0a] transition-all hover:bg-[#b0956e] shadow-[0_0_30px_rgba(197,168,128,0.2)] group"
          >
            Start a Warzone
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        {/* Right - Terminal */}
        <TerminalMockup />
      </div>
    </section>
  )
}

// Market Card
function MarketCard({ market, onClick }: { market: Market; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="flex flex-col overflow-hidden rounded-3xl border border-[#ffffff15] bg-[#111111] cursor-pointer group transition-all duration-300 hover:border-[#D9C5A0]/50 hover:-translate-y-1 shadow-lg"
    >
      {/* Image */}
      <div className="relative h-56 transition duration-500 group-hover:scale-105">
        <img
          src={market.image}
          alt={market.title}
          className="absolute inset-0 h-full w-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/40 to-transparent" />
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-[#0a0a0a]/80 backdrop-blur-md border border-[#ffffff10] text-[#D9C5A0] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm">
            {market.category}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-grow flex flex-col p-6 bg-[#111111] relative z-20">
        <h3 className="mb-6 text-xl font-bold leading-tight text-white group-hover:text-[#D9C5A0] transition-colors line-clamp-2">
          {market.title}
        </h3>
        
        <div className="mt-auto">
          <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <span>Market sentiment</span>
            <span className="text-white">{market.yesPercent}% Yes</span>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-6 flex h-1.5 w-full overflow-hidden rounded-full bg-[#1a1a1a] border border-[#ffffff05]">
            <div className="bg-[#D9C5A0] transition-all duration-500" style={{ width: `${market.yesPercent}%` }} />
          </div>
          
          {/* Footer & CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-[#ffffff10]">
             <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Pool Size</p>
                <p className="text-lg font-bold tracking-tight text-white">{market.poolSize}</p>
             </div>
             <button className="rounded-lg bg-[#C5A880] px-6 py-2.5 text-xs font-black uppercase tracking-widest text-[#0a0a0a] transition hover:bg-[#a3885c] shadow-md">
               Trade Now
             </button>
          </div>
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
    <section className="px-6 pb-24 max-w-[1400px] mx-auto relative z-10">
      <div className="mx-auto">
        {/* Filter Pills */}
        <div className="mb-6 flex gap-3 overflow-x-auto pb-6 no-scrollbar select-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-xl px-6 py-2.5 text-sm font-semibold transition border ${
                selectedCategory === cat
                  ? "bg-[#D9C5A0] text-[#0a0a0a] border-[#D9C5A0]"
                  : "bg-transparent text-gray-400 border-[#ffffff20] hover:border-[#ffffff40] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {/* Cards Grid */}
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
    <footer className="border-t border-[#ffffff10] bg-[#0a0a0a] px-8 py-12 relative z-10">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-8 lg:grid-cols-4 text-center">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Total Locked Value</p>
          <p className="text-3xl font-bold text-white">$12,500,000</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Active Traders</p>
          <p className="text-3xl font-bold text-white">25,456</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Avg Return</p>
          <p className="text-3xl font-bold text-[#D9C5A0]">18%</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Protocol Fee</p>
          <p className="text-3xl font-bold text-white">3%</p>
        </div>
      </div>
    </footer>
  )
}

// Auth Modal (INJECTED REAL AUTH)
function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="relative w-full max-w-md border border-[#D9C5A0]/30 rounded-3xl bg-[#111111] p-8 sm:p-10 shadow-[0_0_50px_rgba(197,168,128,0.15)]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#C5A880]/10 rounded-full blur-[80px] pointer-events-none"></div>
        <button 
          onClick={onClose}
          className="absolute right-5 top-4 text-[#666] transition-colors hover:text-white z-20 text-2xl"
        >
          ×
        </button>
        
        <div className="relative z-10">
          <h2 className="mb-2 text-center text-3xl font-bold text-white">
            Enter the Arena
          </h2>
          <p className="text-sm text-gray-400 mb-8 text-center">Authenticate to start trading.</p>
          
          {/* THE REAL AUTH COMPONENT INSTEAD OF DUMMY BUTTONS */}
          <div className="w-full">
             <Auth />
          </div>
        </div>
      </div>
    </div>
  )
}

// Live Chat (For Detail View)
const chatMessages = [
  { user: "USER789", type: "trade" as const, amount: "$500", side: "Yes" },
  { user: "USER456", type: "message" as const, text: "It's pumping!" },
  { user: "USER789", type: "trade" as const, amount: "$500", side: "Yes" },
  { user: "USER456", type: "message" as const, text: "Branks gaming!" },
  { user: "USER789", type: "trade" as const, amount: "$500", side: "Yes" },
  { user: "USER456", type: "message" as const, text: "It's pumping!" },
]

function LiveChat() {
  const [message, setMessage] = useState("")
  
  return (
    <div className="border border-[#1F1F1F] bg-[#111111] rounded-2xl overflow-hidden mt-8">
      <div className="bg-[#0a0a0a] border-b border-[#1F1F1F] p-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">Live Warzone Chat</h3>
      </div>
      <div className="max-h-64 overflow-y-auto p-4">
        {chatMessages.map((msg, i) => (
          <div key={i} className="mb-2 rounded-xl bg-[#1a1a1a] border border-[#ffffff0a] px-4 py-2.5 text-sm">
            {msg.type === "trade" ? (
              <>
                <span className="font-bold text-[#D9C5A0]">{msg.user}</span>
                <span className="text-[#666]"> bought </span>
                <span className="text-white">{msg.amount}</span>
                <span className="text-[#10b981] font-bold"> {msg.side}</span>
              </>
            ) : (
              <>
                <span className="font-bold text-[#D9C5A0]">{msg.user}:</span>
                <span className="text-gray-300"> {msg.text}</span>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex border-t border-[#1F1F1F] bg-[#0a0a0a] p-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-[#111] rounded-xl px-4 py-3 text-sm text-white placeholder-[#444] border border-[#1F1F1F] focus:border-[#D9C5A0] focus:outline-none"
        />
        <button className="px-4 text-[#D9C5A0] transition-colors hover:text-white">
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

// Trade Slip (Passes up auth requirement)
function TradeSlip({ market, onRequireAuth }: { market: Market; onRequireAuth: () => void }) {
  const [mode, setMode] = useState<"POOL" | "DUEL">("POOL")
  const [stake, setStake] = useState("")
  const [youRisk, setYouRisk] = useState("")
  const [opponentPays, setOpponentPays] = useState("")
  
  const isDuel = mode === "DUEL"
  
  return (
    <div className={`border border-[#1F1F1F] rounded-3xl overflow-hidden shadow-2xl ${isDuel ? "bg-[#1a0a0c]" : "bg-[#151515]"}`}>
      {/* Mode Toggle */}
      <div className="flex bg-[#0D0D0D] p-1 m-4 rounded-xl border border-[#1F1F1F]">
        <button
          onClick={() => setMode("POOL")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
            mode === "POOL"
              ? "bg-[#333] text-white shadow-md"
              : "bg-transparent text-[#666] hover:text-white"
          }`}
        >
          Trade
        </button>
        <button
          onClick={() => setMode("DUEL")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
            mode === "DUEL"
              ? "bg-[#f43f5e] text-white shadow-md"
              : "bg-transparent text-[#666] hover:text-white"
          }`}
        >
          Duel
        </button>
      </div>
      
      <div className="p-6 pt-2">
        {isDuel ? (
          <div className="animate-in fade-in duration-200">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Swords className="w-5 h-5 text-[#f43f5e]" /> Duel
            </h3>
            
            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f43f5e]/70">You Risk (KSh)</label>
              <div className="relative">
                <input
                  type="number"
                  value={youRisk}
                  onChange={(e) => setYouRisk(e.target.value)}
                  placeholder="50,000"
                  className="w-full rounded-xl border border-[#f43f5e]/30 bg-[#0D0D0D] py-4 px-4 text-xl font-bold text-white placeholder-[#444] focus:border-[#f43f5e] focus:outline-none"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f43f5e]/70">Opponent Pays (KSh)</label>
              <div className="relative">
                <input
                  type="number"
                  value={opponentPays}
                  onChange={(e) => setOpponentPays(e.target.value)}
                  placeholder="50,000"
                  className="w-full rounded-xl border border-[#f43f5e]/30 bg-[#0D0D0D] py-4 px-4 text-xl font-bold text-[#f43f5e] placeholder-[#444] focus:border-[#f43f5e] focus:outline-none"
                />
              </div>
            </div>
            
            <div className="mb-6 border-t border-[#1F1F1F] pt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-[#666] uppercase font-bold">Implied Odds</p>
                <p className="text-sm font-bold text-[#f43f5e]">
                  {youRisk && opponentPays ? `${((parseFloat(youRisk) / (parseFloat(youRisk) + parseFloat(opponentPays))) * 100).toFixed(1)}%` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#666] uppercase font-bold">Total Pot</p>
                <p className="text-sm font-bold text-white">
                  {youRisk && opponentPays ? `${(parseFloat(youRisk) + parseFloat(opponentPays)).toLocaleString()}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#666] uppercase font-bold">Pot. Profit</p>
                <p className="text-sm font-bold text-[#10b981]">
                  {opponentPays ? `+${parseFloat(opponentPays).toLocaleString()}` : "—"}
                </p>
              </div>
            </div>
            
            <button onClick={onRequireAuth} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f43f5e] py-4 text-lg font-black uppercase tracking-wider text-white transition-colors hover:bg-[#e11d48] shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              Generate Challenge Link ⚔️
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-200">
            {/* Buy Yes / Buy No */}
            <div className="mb-6 flex gap-3">
              <button className="flex-1 rounded-xl bg-[#D9C5A0] py-3.5 text-lg font-bold text-[#0D0D0D] shadow-[0_0_20px_rgba(217,197,160,0.2)]">
                Buy YES
              </button>
              <button className="flex-1 rounded-xl border border-[#1F1F1F] bg-[#2A2A2A] py-3.5 text-lg font-bold text-gray-400">
                Buy NO
              </button>
            </div>
            
            {/* Stake */}
            <div className="mb-6">
              <label className="mb-2 block text-sm text-gray-400">Stake (KSh)</label>
              <div className="relative">
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-[#1F1F1F] bg-[#0D0D0D] py-4 pl-4 pr-32 text-xl font-bold text-white placeholder-[#444] focus:border-[#D9C5A0] focus:outline-none"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button onClick={() => setStake("1000")} className="bg-[#2A2A2A] hover:bg-[#333] text-gray-300 text-[10px] font-bold px-2 py-1.5 rounded-md transition">+1K</button>
                  <button onClick={() => setStake("5000")} className="bg-[#2A2A2A] hover:bg-[#333] text-gray-300 text-[10px] font-bold px-2 py-1.5 rounded-md transition">+5K</button>
                  <button onClick={() => setStake("10000")} className="bg-[#2A2A2A] hover:bg-[#333] text-gray-300 text-[10px] font-bold px-2 py-1.5 rounded-md transition">+10K</button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between text-sm mb-6">
               <span className="text-gray-500">Est. Payout: <span className="text-white font-bold ml-1">—</span></span>
               <span className="text-gray-500">Protocol Fee: <span className="text-white">3%</span></span>
            </div>
            
            <button onClick={onRequireAuth} className="w-full rounded-xl bg-[#D9C5A0] py-4 text-lg font-black text-[#0D0D0D] transition-colors hover:bg-[#c9b590]">
              Submit Pool Order
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Market Detail View
function MarketDetailView({ market, onBack, onRequireAuth }: { market: Market; onBack: () => void; onRequireAuth: () => void }) {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <Navbar onEnterWarzone={onRequireAuth} />
      
      <div className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <button 
            onClick={onBack}
            className="mb-8 text-xs font-bold uppercase tracking-widest text-[#666] transition-colors hover:text-white flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Markets
          </button>
          
          <div className="grid gap-12 lg:grid-cols-3 items-start">
            {/* Main Content (Graph & Chat) */}
            <div className="lg:col-span-2">
              <h1 className="mb-8 text-4xl font-black leading-tight text-white lg:text-5xl">
                {market.title}
              </h1>
              
              {/* Chart Area */}
              <div className="relative mb-6 h-80 overflow-hidden border-b border-[#1F1F1F] bg-[#0D0D0D]">
                <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-gray-600 font-mono text-right pr-2 py-2 z-10 pointer-events-none">
                  <span>14¢</span><span>12¢</span><span>10¢</span><span>8¢</span><span>6¢</span>
                </div>
                
                <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Yes Line Area */}
                  <path d="M0,130 H20 V140 H40 V110 H60 V110 H80 V120 H100 V120 H120 V80 H150 V80 H180 V100 H200 V100 H220 V50 H260 V50 H280 V70 H300 V70 H320 V40 H360 V60 H400 V200 L0,200 Z" fill="url(#greenGradient)" />
                  {/* No Line */}
                  <path d="M0,160 H20 V150 H40 V180 H60 V180 H80 V170 H100 V170 H120 V190 H150 V190 H180 V170 H200 V170 H220 V195 H260 V195 H280 V180 H300 V180 H320 V190 H360 V170 H400" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
                  {/* Yes Line */}
                  <path d="M0,130 H20 V140 H40 V110 H60 V110 H80 V120 H100 V120 H120 V80 H150 V80 H180 V100 H200 V100 H220 V50 H260 V50 H280 V70 H300 V70 H320 V40 H360 V60 H400" fill="none" stroke="#10b981" strokeWidth="2.5" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  <circle cx="400" cy="60" r="4" fill="#10b981" className="animate-pulse" />
                </svg>

                {/* Animated Popups */}
                <div className="absolute top-[30%] left-[40%] text-[#10b981] px-2 py-0.5 font-mono text-[11px] font-bold animate-liquidity-pop">+ $375</div>
                <div className="absolute top-[10%] left-[80%] text-[#10b981] px-2 py-0.5 font-mono text-[11px] font-bold animate-liquidity-pop" style={{animationDelay: '1s'}}>+ $1,068</div>
                <div className="absolute top-[40%] left-[20%] text-[#10b981] px-2 py-0.5 font-mono text-[11px] font-bold animate-liquidity-pop" style={{animationDelay: '2.5s'}}>+ $500</div>
              </div>
              
              <div className="flex justify-between items-end mb-8">
                <div>
                  <span className="text-3xl font-bold text-[#D9C5A0]">{market.yesPercent}%</span><br/>
                  <span className="text-gray-400 text-sm">Yes</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-[#f43f5e]">{market.noPercent}%</span><br/>
                  <span className="text-gray-400 text-sm">No</span>
                </div>
              </div>
              
              {/* Chat */}
              <LiveChat />
            </div>
            
            {/* Trade Slip (Right side) */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
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
  
  // iOS notification cycle (Runs exactly 15 times, once per unique bet)
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
        setNotificationsDone(true) // Stops after array is exhausted
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
        onRequireAuth={() => setShowAuthModal(true)} // <-- Funnels directly to login on trade
      />
    )
  }
  
  return (
    <div className="min-h-screen bg-[#0D0D0D] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#C5A880]/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* iOS Notification */}
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
        onSelectMarket={setSelectedMarket} // Shows the fake graph view
      />
      <StatsFooter />
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* --- CSS INJECTIONS --- */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-up-fade {
          0% { opacity: 0; transform: translateY(10px) scale(0.9); }
          20% { opacity: 1; transform: translateY(0px) scale(1); }
          80% { opacity: 1; transform: translateY(-15px) scale(1); }
          100% { opacity: 0; transform: translateY(-25px) scale(0.9); }
        }
        .animate-liquidity-pop {
          animation: float-up-fade 2.5s ease-out forwards;
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  )
}
