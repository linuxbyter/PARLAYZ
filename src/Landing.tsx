import { useState } from 'react'
import Auth from './components/Auth'
import { TrendingUp, Users, ShieldCheck, ArrowRight } from 'lucide-react'

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false)

  // If they click "Enter", show the login/signup screen
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

  // Otherwise, show the premium landing page
  return (
    <div className="min-h-screen bg-matte-900 text-white selection:bg-gold-500/30">
      
      {/* Top Navigation */}
      <header className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center relative z-10">
        <h1 className="text-2xl font-bold text-gold-400 tracking-tight">PARLAYZ</h1>
        <button 
          onClick={() => setShowAuth(true)}
          className="text-sm font-bold text-white bg-matte-800 hover:bg-matte-700 px-5 py-2.5 rounded-xl border border-matte-700 transition shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        >
          Log In
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 pt-20 sm:pt-32 pb-24 sm:pb-32 flex flex-col items-center text-center relative">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-gold-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-bold uppercase tracking-wide mb-8 relative z-10">
          <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse"></span>
          Live in Kenya
        </div>
        
        <h2 className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight mb-6 leading-[1.1] relative z-10">
          The House Always Wins.<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-500 to-yellow-200">
            So Be The House.
          </span>
        </h2>
        
        <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed relative z-10">
          Kenya's premier Peer-to-Peer prediction market. Stop paying massive bookie margins. Set your own odds, lock funds in secure escrow, and trade predictions directly with other players.
        </p>

        <button 
          onClick={() => setShowAuth(true)}
          className="bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black font-bold text-lg py-4 px-8 rounded-xl transition shadow-[0_0_30px_rgba(251,191,36,0.2)] hover:shadow-[0_0_50px_rgba(251,191,36,0.4)] flex items-center gap-2 relative z-10 scale-100 hover:scale-105 active:scale-95"
        >
          Enter the Exchange <ArrowRight className="w-5 h-5" />
        </button>
      </main>

      {/* Value Props Section */}
      <section className="border-t border-matte-800 bg-matte-900/50 relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-20 sm:py-24 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          <div className="bg-matte-800 border border-matte-700 p-8 rounded-2xl hover:border-gold-500/50 transition group shadow-lg">
            <div className="w-14 h-14 bg-matte-900 border border-matte-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold-500/10 group-hover:border-gold-500/50 transition">
              <Users className="w-7 h-7 text-gold-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Peer-to-Peer Escrow</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your funds are locked in secure smart escrow. No shady bookies holding your money. When the market resolves, the winner takes the pot instantly.
            </p>
          </div>

          <div className="bg-matte-800 border border-matte-700 p-8 rounded-2xl hover:border-gold-500/50 transition group shadow-lg">
            <div className="w-14 h-14 bg-matte-900 border border-matte-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold-500/10 group-hover:border-gold-500/50 transition">
              <TrendingUp className="w-7 h-7 text-gold-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Set Your Own Odds</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Don't like the market price? Create your own P2P offer. Demand a massive payout and wait for the open market to match your liquidity.
            </p>
          </div>

          <div className="bg-matte-800 border border-matte-700 p-8 rounded-2xl hover:border-gold-500/50 transition group shadow-lg">
            <div className="w-14 h-14 bg-matte-900 border border-matte-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold-500/10 group-hover:border-gold-500/50 transition">
              <ShieldCheck className="w-7 h-7 text-gold-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Transparent 3% Fee</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Traditional sportsbooks bake 10-15% invisible margins into their odds. Parlayz takes a flat 3% platform fee only from the winner's net profit.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-matte-800 py-8 text-center text-gray-500 text-sm relative z-10 bg-matte-900">
        <p>© 2026 Parlayz Exchange. All rights reserved.</p>
      </footer>
    </div>
  )
}
