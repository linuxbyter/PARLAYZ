import { useState, useEffect } from 'react'
import Auth from './components/Auth'
import { ArrowRight, Activity, TrendingUp, MessageCircle } from 'lucide-react'

// --- EXACT IMAGES FOR BAIT MARKETS ---
const BAIT_MARKETS = [
  {
    id: 'f1-mock',
    title: 'Lewis Hamilton Podium Finish',
    category: 'F1',
    sentiment: 60,
    sentimentLabel: 'Yes',
    poolSize: '1,200,000',
    image: 'https://images.unsplash.com/photo-1532986427357-19fbcc0fa5ea?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'crypto-mock',
    title: 'BTC > $80k by Dec 31',
    category: 'Crypto',
    sentiment: 75,
    sentimentLabel: 'Yes',
    poolSize: '2,500,000',
    image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'fashion-mock',
    title: 'Balenciaga Paris Fashion Week Debut',
    category: 'Fashion',
    sentiment: 45,
    sentimentLabel: 'Hot',
    poolSize: '800,000',
    image: 'https://images.unsplash.com/photo-1492288991661-058aa541ff43?q=80&w=800&auto=format&fit=crop',
  }
]

// --- LIVE BET ALERTS (For iMessage Popups) ---
const LIVE_ALERTS = [
  "🐳 SATOSHIN staked 5,000 KSh on BTC > $100k",
  "🎯 USER123 bet 1,000 USDC on Arsenal Win",
  "🏎️ TRADER99 placed 2,500 on F1 Hamilton Podium",
  "⚔️ WHALE_0X challenged BAZUU_99 to a Duel",
  "📈 NEW POOL: Safaricom Q3 Earnings Live"
]

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false)
  const [toastAlert, setToastAlert] = useState<string | null>(null)

  // --- iMessage Popup Logic ---
  useEffect(() => {
    let alertIndex = 0;
    const interval = setInterval(() => {
      // Show the alert
      setToastAlert(LIVE_ALERTS[alertIndex]);
      
      // Hide the alert after 3.5 seconds
      setTimeout(() => {
        setToastAlert(null);
      }, 3500);

      alertIndex = (alertIndex + 1) % LIVE_ALERTS.length;
    }, 6000); // Trigger a new alert every 6 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#C5A880]/20 font-sans relative">
      
      {/* BACKGROUND GLOWS */}
      <div className="absolute top-0 left-0 w-full sm:w-[600px] h-[400px] sm:h-[600px] bg-[#C5A880]/5 rounded-full blur-[100px] sm:blur-[150px] pointer-events-none"></div>

      {/* --- iMESSAGE STYLE POPUP --- */}
      <div 
        className={`fixed top-24 sm:top-28 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
          toastAlert ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-8 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-[#1c1c1e]/90 backdrop-blur-xl border border-[#2c2c2e] text-white px-5 py-3 rounded-[24px] rounded-tl-sm text-sm font-medium shadow-2xl flex items-center gap-3 max-w-[90vw] w-max">
          <MessageCircle className="w-4 h-4 text-[#0a84ff]" />
          <span className="tracking-wide leading-snug">{toastAlert}</span>
        </div>
      </div>

      {/* 1. TOP NAVIGATION */}
      <header className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">
            Parlayz
          </h1>
        </div>
        <button 
          onClick={() => setShowAuth(true)}
          className="text-xs font-bold text-gray-300 bg-transparent px-4 sm:px-5 py-2.5 rounded-lg border border-[#ffffff20] hover:bg-[#ffffff0a] hover:text-white transition-all tracking-wider"
        >
          Enter Warzone
        </button>
      </header>

      {/* 2. ASYMMETRICAL HERO SECTION */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24 grid grid-cols-1 xl:grid-cols-2 gap-10 lg:gap-16 items-center relative z-10">
        
        {/* LEFT SIDE: THE TEXT & CTA */}
        <div className="flex flex-col items-start text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141414] border border-[#ffffff10] text-gray-400 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase mb-6 sm:mb-8 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            LIVE WARZONES ACTIVE
          </div>
          
          <h2 className="text-5xl sm:text-6xl lg:text-[80px] font-bold tracking-tighter mb-4 sm:mb-6 leading-[0.95] uppercase">
            Put your <br />
            money <br />
            where <span className="text-[#C5A880]">your <br />
            mouth is.</span>
          </h2>
          
          <p className="text-gray-400 text-sm lg:text-base max-w-md mb-8 sm:mb-10 leading-relaxed font-light">
            Stop arguing in the group chat. Lock your stance, share the challenge link, and turn your debates into liquid cash in a live peer-to-peer exchange.
          </p>
          
          <button 
            onClick={() => setShowAuth(true)}
            className="bg-[#C5A880] text-[#0a0a0a] font-bold text-sm py-4 px-8 rounded-xl transition-all hover:bg-[#b0956e] flex items-center gap-3 group shadow-[0_0_30px_rgba(197,168,128,0.2)] w-full sm:w-auto justify-center"
          >
            Start a Warzone <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* RIGHT SIDE: THE EXACT TERMINAL MOCKUP (Hidden on small screens) */}
        <div className="relative w-full hidden xl:flex justify-end perspective-1000">
          <div className="w-[600px] bg-[#0a0a0a] border border-[#C5A880]/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(197,168,128,0.1)] transform rotate-y-[-5deg] rotate-x-[5deg] transition-transform duration-700 hover:rotate-0">
            
            <div className="grid grid-cols-2 gap-4">
              {/* Terminal Left Column */}
              <div className="space-y-4">
                <div className="bg-[#111111] border border-[#ffffff0a] p-4 rounded-xl">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Live Warzones Active</p>
                  <p className="text-3xl font-bold text-white">14,023</p>
                </div>
                
                <div className="bg-[#111111] border border-[#ffffff0a] p-4 rounded-xl">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Recent Matches</p>
                  <div className="space-y-4">
                    <div className="border-b border-[#ffffff0a] pb-3">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-bold text-white">USER123 vs USER456</p>
                        <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center text-[8px]">🛡️</div>
                      </div>
                      <p className="text-[10px] text-gray-500">(500 USDC)</p>
                      <p className="text-xs text-gray-400 mt-1">Arsenal to win</p>
                    </div>
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-bold text-white">USER789 vs USER012</p>
                        <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center text-[8px]">🌐</div>
                      </div>
                      <p className="text-[10px] text-gray-500">(1200 USDC)</p>
                      <p className="text-xs text-gray-400 mt-1">Chelsea vs PSG Draw</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111111] border border-[#ffffff0a] p-4 rounded-xl">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 flex justify-between">Bet Info <Activity className="w-3 h-3"/></p>
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-[#1a1a1a] rounded-full"></div>
                    <div className="h-1.5 w-[90%] bg-[#1a1a1a] rounded-full"></div>
                    <div className="h-1.5 w-[95%] bg-[#1a1a1a] rounded-full"></div>
                    <div className="h-1.5 w-[80%] bg-[#1a1a1a] rounded-full"></div>
                    <div className="h-1.5 w-full bg-[#1a1a1a] rounded-full"></div>
                    <div className="h-1.5 w-[85%] bg-[#1a1a1a] rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Terminal Right Column */}
              <div className="space-y-4">
                <div className="bg-[#111111] border border-[#ffffff0a] p-4 rounded-xl">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Live Activity TPS</p>
                  <p className="text-xl font-bold text-white">824/s</p>
                </div>

                <div className="bg-[#111111] border border-[#ffffff0a] p-4 rounded-xl h-[140px] flex flex-col">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Market Sentiment</p>
                  <div className="flex-grow relative">
                     <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full stroke-[#C5A880]" fill="none" strokeWidth="2">
                       <path d="M0,40 Q10,30 20,35 T40,20 T60,25 T80,10 T100,5" />
                     </svg>
                  </div>
                </div>

                <div className="bg-[#111111] border border-[#ffffff0a] p-4 rounded-xl h-[140px] flex flex-col">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Bet Matching</p>
                  <div className="flex-grow relative">
                     <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full stroke-[#10b981]" fill="none" strokeWidth="2">
                       <path d="M0,45 Q15,40 25,25 T50,30 T75,15 T100,20" />
                     </svg>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </main>

      {/* 3. THE MARKET BAIT CARDS */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        
        {/* Category Pills */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 sm:pb-6 no-scrollbar mb-4 sm:mb-6 select-none">
           {['All', 'Sports', 'Crypto', 'F1', 'Fashion', 'Politics'].map(cat => (
             <button key={cat} className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border whitespace-nowrap ${cat === 'All' ? 'bg-[#C5A880] text-[#0a0a0a] border-[#C5A880]' : 'bg-transparent text-gray-400 border-[#ffffff20] hover:border-[#ffffff40] hover:text-white'}`}>
               {cat}
             </button>
           ))}
        </div>

        {/* 3 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BAIT_MARKETS.map(market => (
            <div key={market.id} onClick={() => setShowAuth(true)} className="bg-transparent rounded-3xl border border-[#ffffff15] overflow-hidden group cursor-pointer transition-all duration-300 hover:border-[#C5A880]/50 hover:-translate-y-1 shadow-lg flex flex-col p-4 pb-6">
              
              {/* Image */}
              <div 
                className="h-48 sm:h-64 rounded-2xl bg-cover bg-center mb-5"
                style={{ backgroundImage: `url(${market.image})` }}
              ></div>
              
              {/* Card Body */}
              <div className="flex-grow flex flex-col px-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 leading-tight group-hover:text-[#C5A880] transition-colors">{market.title}</h3>
                
                <div className="mt-auto">
                   <div className="flex justify-between text-xs text-gray-500 mb-2">
                     <span>Market sentiment</span>
                     <span className="text-white">{market.sentiment}% {market.sentimentLabel}</span>
                   </div>
                   
                   {/* Progress Bar */}
                   <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full mb-6 overflow-hidden">
                     <div className="h-full bg-[#C5A880]" style={{ width: `${market.sentiment}%` }} />
                   </div>

                   {/* Footer of Card */}
                   <div className="space-y-4">
                     <p className="text-xs text-gray-500">Pool Size: <span className="text-white font-bold ml-1">${market.poolSize}</span></p>
                     
                     <button className="w-full bg-[#C5A880] text-[#0a0a0a] text-sm font-bold py-3 sm:py-3.5 rounded-xl hover:bg-[#b0956e] transition">
                       Trade Now
                     </button>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. GLOBAL STATS FOOTER */}
      <footer className="w-full bg-[#0a0a0a] border-t border-[#ffffff10] py-10 sm:py-12 relative z-10">
         <div className="max-w-[1400px] mx-auto px-4 sm:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest mb-1 sm:mb-2 font-semibold">Total Locked Value:</p>
              <p className="text-xl sm:text-3xl font-bold text-white">$12,500,000</p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest mb-1 sm:mb-2 font-semibold">Active Traders:</p>
              <p className="text-xl sm:text-3xl font-bold text-white">25,456</p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest mb-1 sm:mb-2 font-semibold">Avg Return:</p>
              <p className="text-xl sm:text-3xl font-bold text-[#C5A880]">18%</p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest mb-1 sm:mb-2 font-semibold">Protocol Fee:</p>
              <p className="text-xl sm:text-3xl font-bold text-white">3%</p>
            </div>
         </div>
      </footer>

      {/* --- AUTH MODAL OVERLAY (THE FIX) --- */}
      {showAuth && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in-up">
          <div className="bg-[#111111] border border-[#C5A880]/30 rounded-3xl p-6 sm:p-10 w-full max-w-md text-center shadow-[0_0_50px_rgba(197,168,128,0.15)] relative">
            
            {/* Soft Glow inside Modal */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#C5A880]/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Enter the Arena</h2>
              <p className="text-sm text-gray-400 mb-8">Authenticate to start trading.</p>
              
              {/* THE REAL AUTH COMPONENT INSTEAD OF DUMMY BUTTONS */}
              <div className="w-full">
                <Auth />
              </div>
            </div>

            {/* Close button */}
            <button 
              onClick={() => setShowAuth(false)} 
              className="absolute top-4 right-5 text-gray-500 hover:text-white text-2xl transition"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* --- CSS --- */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .perspective-1000 { perspective: 1000px; }
      `}} />
    </div>
  )
}
