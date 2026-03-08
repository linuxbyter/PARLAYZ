import { useState } from 'react'
import Auth from './components/Auth'
import { TrendingUp, Users, ShieldCheck, ArrowRight } from 'lucide-react'

// --- REALISTIC DYNAMIC TICKER DATA ---
const TICKER_ITEMS = [
  { id: 1, color: 'text-[#C5A880]', text: '🔥 LIQUIDITY PUMP:' },
  { id: 2, color: 'text-gray-300', text: '🐳 NairobiWhale dropped 5,000 KSh on Arsenal' },
  { id: 3, color: 'text-gray-400', text: '💬 Kevo_254: "You guys are delusional if you think they win"' },
  { id: 4, color: 'text-gray-300', text: '🎯 vvs_Amad took the other side for 3,500 KSh' },
  { id: 5, color: 'text-green-500', text: '💰 TOTAL POOL: 8,500 KSh' },
  { id: 6, color: 'text-[#C5A880]', text: '🔥 LIQUIDITY PUMP:' },
  { id: 7, color: 'text-gray-300', text: '🥷 Bazuu_99 dropped 1,200 KSh on Draw' },
  { id: 8, color: 'text-gray-400', text: '💬 Lexi_T: "Easy money tonight boys"' },
  { id: 9, color: 'text-gray-300', text: '📈 CityBoy_NBO dropped 10,000 KSh on Man City' },
  { id: 10, color: 'text-gray-400', text: '💬 Trader_Max: "Who is matching my 10K?"' },
  { id: 11, color: 'text-gray-300', text: '⚡ Kiptoo_BTC matched 10,000 KSh' },
]

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false)

  // --- AUTH SCREEN ---
  if (showAuth) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-trading-grid opacity-20 animate-pan-grid pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#A3885C]/5 rounded-full blur-[120px] pointer-events-none"></div>

        <button 
          onClick={() => setShowAuth(false)}
          className="absolute top-6 sm:top-10 left-6 sm:left-10 text-gray-500 hover:text-[#C5A880] transition font-semibold text-sm flex items-center gap-2 z-10"
        >
          ← Back to Exchange
        </button>
        <div className="w-full max-w-md animate-in fade-in duration-500 relative z-10">
          <Auth />
        </div>
      </div>
    )
  }

  // --- MAIN LANDING PAGE ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#C5A880]/20 font-sans overflow-hidden relative">
      
      {/* THE PHANTOM TRADING GRID */}
      <div className="absolute inset-0 bg-trading-grid opacity-15 animate-pan-grid pointer-events-none"></div>
      
      {/* MUTED PREMIUM ORBS */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#A3885C]/10 rounded-full blur-[120px] pointer-events-none animate-float-slow"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#7A6340]/10 rounded-full blur-[150px] pointer-events-none animate-float-delayed"></div>

      {/* Top Navigation */}
      <header className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center relative z-20 border-b border-[#ffffff0a] backdrop-blur-md">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-[#C5A880]/5 border border-[#C5A880]/20 flex items-center justify-center group-hover:bg-[#C5A880]/10 transition-all duration-500">
            <TrendingUp className="w-4 h-4 text-[#C5A880]" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Parlayz
          </h1>
        </div>
        <button 
          onClick={() => setShowAuth(true)}
          className="text-sm font-semibold text-gray-300 bg-[#ffffff05] hover:bg-[#ffffff0a] hover:text-white px-5 py-2.5 rounded-xl border border-[#ffffff15] transition-all duration-300 hover:shadow-[0_0_20px_rgba(197,168,128,0.05)]"
        >
         Enter Warzone
        </button>
      </header>

      {/* THE FOMO TICKER */}
      <div className="w-full bg-[#0d0d0d] border-b border-[#ffffff0a] py-2.5 flex overflow-hidden whitespace-nowrap relative z-20">
        <div className="animate-marquee flex gap-8 items-center text-sm font-medium">
          {/* First loop */}
          {TICKER_ITEMS.map((item) => (
            <div key={`loop1-${item.id}`} className="flex items-center gap-8">
              <span className={item.color}>{item.text}</span>
              <span className="text-gray-700">•</span>
            </div>
          ))}
          {/* Duplicate loop for infinite scroll illusion */}
          {TICKER_ITEMS.map((item) => (
            <div key={`loop2-${item.id}`} className="flex items-center gap-8">
              <span className={item.color}>{item.text}</span>
              <span className="text-gray-700">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* NEW ASYMMETRICAL HERO SECTION */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        
        {/* LEFT SIDE: THE HOOK */}
        <div className="flex flex-col items-start text-left animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#141414] border border-[#ffffff10] text-gray-400 text-xs font-semibold tracking-widest uppercase mb-8 shadow-2xl backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
            LIVE WARZONES ACTIVE
          </div>
          
          <h2 className="text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]">
            Put your money <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#C5A880] via-[#E8D4B0] to-[#A3885C] animate-shimmer-text bg-[length:200%_auto]">
              where your mouth is.
            </span>
          </h2>
          
          <p className="text-gray-400/90 text-lg max-w-md mb-10 leading-relaxed font-light">
            Stop arguing in the group chat. Lock your stance, share the challenge link, and turn your debates into liquid cash in a live peer-to-peer exchange.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              onClick={() => setShowAuth(true)}
              className="relative overflow-hidden bg-gradient-to-r from-[#8E7651] to-[#A3885C] text-[#0a0a0a] font-bold text-base py-4 px-8 rounded-xl transition-all duration-500 hover:scale-[1.02] shadow-[0_0_40px_rgba(163,136,92,0.2)] flex items-center justify-center gap-3 group"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#ffffff50] to-transparent -translate-x-full animate-sweep-shimmer"></span>
              <span className="relative z-10">Start a Warzone</span> 
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            <button 
              onClick={() => setShowAuth(true)}
              className="px-8 py-4 rounded-xl bg-transparent border border-[#ffffff20] text-white font-semibold text-base hover:bg-[#ffffff0a] hover:border-[#ffffff40] transition-colors flex items-center justify-center"
            >
              Spectate Live Pools
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: THE LIVE MOCKUP */}
        <div className="relative w-full flex justify-center lg:justify-end animate-fade-in-up animation-delay-200">
          <div className="relative w-[320px] h-[600px] bg-[#0d0d0d]/80 backdrop-blur-xl border border-[#ffffff15] rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] p-5 flex flex-col">
            
            {/* Phone Top Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#0a0a0a] border-b border-x border-[#ffffff10] rounded-b-3xl z-20"></div>

            {/* Mock App UI - Header */}
            <div className="w-full flex justify-between items-center pb-4 border-b border-[#ffffff10] mt-6">
              <span className="font-bold text-sm text-white tracking-tight">⚔️ Arsenal vs Brentford</span>
              <span className="text-[10px] font-bold tracking-widest bg-red-500/10 border border-red-500/20 text-red-500 px-2 py-1 rounded-md uppercase animate-pulse">Live</span>
            </div>

            {/* Mock App UI - Liquidity Orbs/Bar */}
            <div className="w-full mt-5 bg-[#1a1a1a] rounded-full h-2.5 overflow-hidden flex border border-[#ffffff05]">
              <div className="bg-[#C5A880] h-full w-[60%] shadow-[0_0_10px_rgba(197,168,128,0.5)]"></div>
              <div className="bg-[#333] h-full w-[40%]"></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono font-medium">
              <span className="text-[#C5A880]">60% ARS</span>
              <span>40% BRE</span>
            </div>

            {/* Mock App UI - Chat Room */}
            <div className="flex-1 w-full mt-6 flex flex-col gap-4 overflow-hidden relative">
              <div className="w-full bg-[#141414] border border-[#ffffff0a] rounded-xl p-3.5 text-sm shadow-lg">
                <span className="font-bold text-[#C5A880] text-xs uppercase tracking-wider">🐳 NairobiWhale</span>
                <p className="text-gray-300 mt-1.5 leading-snug">Arsenal takes this easily. 5K locked. Who wants it?</p>
              </div>
              
              <div className="w-full bg-[#1a1a1a] border border-[#ffffff0a] rounded-xl p-3.5 text-sm self-end shadow-lg ml-4">
                <span className="font-bold text-red-400 text-xs uppercase tracking-wider">🎯 Kevo_254</span>
                <p className="text-gray-300 mt-1.5 leading-snug">You're getting cooked. Matched your 5K.</p>
              </div>

              {/* Gradient fade out at bottom of chat */}
              <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-[#0d0d0d] to-transparent"></div>
            </div>

            {/* Mock App UI - Fake Button */}
            <div className="w-full mt-auto pt-4 relative z-10">
              <div className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1a1a1a] to-[#222] text-center text-sm font-bold border border-[#ffffff10] text-white shadow-lg">
                Tap to Join Pool
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Value Props Section */}
      <section className="border-t border-[#ffffff0a] relative z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#ffffff02] to-transparent pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto px-4 py-20 sm:py-28 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          <div className="bg-[#111111]/80 backdrop-blur-xl border border-[#ffffff0a] p-8 rounded-2xl hover:border-[#C5A880]/30 transition-all duration-500 hover:-translate-y-2 group shadow-2xl animate-fade-in-up animation-delay-400">
            <div className="w-12 h-12 bg-[#0a0a0a] border border-[#ffffff10] rounded-xl flex items-center justify-center mb-6 group-hover:border-[#C5A880]/40 group-hover:bg-[#C5A880]/5 transition-all duration-500">
              <Users className="w-5 h-5 text-[#A3885C] group-hover:text-[#C5A880]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Peer-to-Peer Escrow</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-light">
              Capital is locked in secure smart escrow. No central bookies holding your liquidity. When the market resolves, the victor sweeps the pot instantly.
            </p>
          </div>

          <div className="bg-[#111111]/80 backdrop-blur-xl border border-[#ffffff0a] p-8 rounded-2xl hover:border-[#C5A880]/30 transition-all duration-500 hover:-translate-y-2 group shadow-2xl animate-fade-in-up animation-delay-500">
            <div className="w-12 h-12 bg-[#0a0a0a] border border-[#ffffff10] rounded-xl flex items-center justify-center mb-6 group-hover:border-[#C5A880]/40 group-hover:bg-[#C5A880]/5 transition-all duration-500">
              <TrendingUp className="w-5 h-5 text-[#A3885C] group-hover:text-[#C5A880]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Dictate Your Odds</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-light">
              Reject the market price. Draft your own P2P offer. Demand a premium payout and wait for the open market to match your liquidity threshold.
            </p>
          </div>

          <div className="bg-[#111111]/80 backdrop-blur-xl border border-[#ffffff0a] p-8 rounded-2xl hover:border-[#C5A880]/30 transition-all duration-500 hover:-translate-y-2 group shadow-2xl animate-fade-in-up animation-delay-600">
            <div className="w-12 h-12 bg-[#0a0a0a] border border-[#ffffff10] rounded-xl flex items-center justify-center mb-6 group-hover:border-[#C5A880]/40 group-hover:bg-[#C5A880]/5 transition-all duration-500">
              <ShieldCheck className="w-5 h-5 text-[#A3885C] group-hover:text-[#C5A880]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Immutable 3% Fee</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-light">
              Traditional sportsbooks bake massive 15% invisible margins into their spreads. Parlayz enforces a flat 3% protocol fee solely from the winner's net profit.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ffffff0a] py-8 text-center text-gray-600 text-xs tracking-wider uppercase relative z-10 bg-[#0a0a0a]">
        <p>© 2026 Parlayz Protocol. All rights reserved.</p>
      </footer>

      {/* --- ALL-OUT CUSTOM CSS INJECTIONS --- */}
      <style dangerouslySetInnerHTML={{__html: `
        /* The Moving Grid Background */
        .bg-trading-grid {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
        }

        /* Keyframes */
        @keyframes pan-grid {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) scale(1.05); }
          50% { transform: translateY(40px) scale(1); }
        }

        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmer-text {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        @keyframes sweep-shimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          50%, 100% { transform: translateX(200%) skewX(-15deg); }
        }

        /* Utility Classes for Animations */
        .animate-pan-grid { animation: pan-grid 3s linear infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 10s ease-in-out infinite; }
        .animate-fade-in-up { 
          opacity: 0; 
          animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
        .animate-shimmer-text { animation: shimmer-text 4s linear infinite; }
        .animate-sweep-shimmer { animation: sweep-shimmer 3s ease-in-out infinite; }

        /* Stagger Delays */
        .animation-delay-100 { animation-delay: 100ms; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-300 { animation-delay: 300ms; }
        .animation-delay-400 { animation-delay: 400ms; }
        .animation-delay-500 { animation-delay: 500ms; }
        .animation-delay-600 { animation-delay: 600ms; }
      `}} />
    </div>
  )
}
