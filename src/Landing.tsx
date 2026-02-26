import { useState } from 'react'
import Auth from './components/Auth'
import { TrendingUp, Users, ShieldCheck, ArrowRight } from 'lucide-react'

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false)

  if (showAuth) {
    return (
      <div className="min-h-screen bg-matte-900 flex flex-col items-center justify-center p-4 relative">
        <button 
          onClick={() => setShowAuth(false)}
          className="absolute top-6 sm:top-10 left-6 sm:left-10 text-gray-400 hover:text-gold-400 transition font-semibold text-sm flex items-center gap-2"
        >
          ← Back to Home
        </button>
        <div className="w-full max-w-md animate-in fade-in duration-300">
          <Auth />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-matte-900 text-white selection:bg-gold-500/30 font-sans overflow-hidden">
      
      {/* Top Navigation */}
      <header className="max-w-6xl mx-auto px-4 py-5 flex justify-between items-center relative z-20 border-b border-matte-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-gold-400" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Parlayz<span className="text-gold-400">Market</span></h1>
        </div>
        <button 
          onClick={() => setShowAuth(true)}
          className="text-sm font-semibold text-white bg-matte-800 hover:bg-matte-700 px-4 py-2 rounded-lg border border-matte-700 transition hover:shadow-[0_0_15px_rgba(251,191,36,0.15)]"
        >
          Log In
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 pt-20 sm:pt-28 pb-20 sm:pb-28 flex flex-col items-center text-center relative z-10">
        
        {/* --- ANIMATED BACKGROUND ORBS --- */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-gold-500/10 rounded-full blur-[100px] pointer-events-none animate-[pulse_6s_ease-in-out_infinite]"></div>
        <div className="absolute top-1/4 left-1/4 w-[200px] h-[200px] bg-yellow-500/5 rounded-full blur-[80px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite_alternate]"></div>

        {/* --- ANIMATED HERO CONTENT --- */}
        <div className="relative z-10 flex flex-col items-center animate-[fade-in-up_1s_ease-out_forwards]">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-matte-800 border border-matte-700 text-gray-300 text-xs font-medium tracking-wide mb-8 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-[pulse_2s_ease-in-out_infinite]"></span>
            Live in Kenya
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.15]">
            Where Prediction Markets<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-yellow-200 animate-[pulse_4s_ease-in-out_infinite]">
              Meet True Parlays.
            </span>
          </h2>
          
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            The future of prediction markets. Stop paying massive bookie margins. Set your own odds, lock funds in secure escrow, and trade predictions directly with other players.
          </p>

          <button 
            onClick={() => setShowAuth(true)}
            className="bg-gold-500 hover:bg-gold-400 text-black font-semibold text-base py-3 px-7 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(251,191,36,0.15)] hover:shadow-[0_0_40px_rgba(251,191,36,0.4)] hover:-translate-y-1 flex items-center gap-2"
          >
            Enter the Exchange <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Value Props Section */}
      <section className="border-t border-matte-800 bg-matte-900/30 relative z-10">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* CARDS WITH HOVER ANIMATIONS */}
          <div className="bg-matte-800/50 border border-matte-700/50 p-6 rounded-xl hover:border-gold-500/30 transition-all duration-300 hover:-translate-y-2 group">
            <div className="w-10 h-10 bg-matte-900 border border-matte-700 rounded-lg flex items-center justify-center mb-5 group-hover:border-gold-500/50 group-hover:scale-110 transition-all duration-300">
              <Users className="w-5 h-5 text-gold-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Peer-to-Peer Escrow</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your funds are locked in secure escrow. No shady bookies holding your money. When the market resolves, the winner takes the pot instantly.
            </p>
          </div>

          <div className="bg-matte-800/50 border border-matte-700/50 p-6 rounded-xl hover:border-gold-500/30 transition-all duration-300 hover:-translate-y-2 group delay-100">
            <div className="w-10 h-10 bg-matte-900 border border-matte-700 rounded-lg flex items-center justify-center mb-5 group-hover:border-gold-500/50 group-hover:scale-110 transition-all duration-300">
              <TrendingUp className="w-5 h-5 text-gold-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Set Your Own Odds</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Don't like the market price? Create your own P2P offer. Demand a massive payout and wait for the open market to match your liquidity.
            </p>
          </div>

          <div className="bg-matte-800/50 border border-matte-700/50 p-6 rounded-xl hover:border-gold-500/30 transition-all duration-300 hover:-translate-y-2 group delay-200">
            <div className="w-10 h-10 bg-matte-900 border border-matte-700 rounded-lg flex items-center justify-center mb-5 group-hover:border-gold-500/50 group-hover:scale-110 transition-all duration-300">
              <ShieldCheck className="w-5 h-5 text-gold-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Transparent 3% Fee</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Traditional sportsbooks bake massive invisible margins into their odds. Parlayz takes a flat 3% platform fee only from the winner's net profit.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-matte-800 py-6 text-center text-gray-500 text-xs relative z-10 bg-matte-900">
        <p>© 2026 ParlayzMarket. All rights reserved.</p>
      </footer>

      {/* INLINE CUSTOM KEYFRAMES FOR THE FADE/SLIDE UP */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}} />
    </div>
  )
}
