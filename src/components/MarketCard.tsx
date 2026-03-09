import { useState, useEffect } from 'react';
import { Clock, Lock, TrendingUp } from 'lucide-react';

// Define the shape of your Supabase Event data
interface EventProps {
  id: string;
  title: string;
  category: string;
  description: string;
  outcomes: string[];
  locks_at: string; // The timestamp from Supabase
}

export default function MarketCard({ event }: { event: EventProps }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const lockTime = new Date(event.locks_at).getTime();
      const now = new Date().getTime();
      const distance = lockTime - now;

      if (distance <= 0) {
        setIsLocked(true);
        setTimeLeft('MARKET LOCKED');
      } else {
        setIsLocked(false);
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Format the timer string
        if (days > 0) {
          setTimeLeft(`Locks in ${days}d ${hours}h`);
        } else {
          setTimeLeft(`Locks in ${hours}h ${minutes}m ${seconds}s`);
        }
      }
    };

    // Run immediately, then update every second for that live "ticking" feel
    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [event.locks_at]);

  return (
    <div className={`relative w-full rounded-2xl border p-6 transition-all duration-300 ${
      isLocked 
        ? 'bg-[#0a0a0a] border-[#ffffff0a] opacity-80 grayscale-[30%]' 
        : 'bg-[#111111]/80 backdrop-blur-xl border-[#ffffff10] hover:border-[#C5A880]/30 shadow-lg hover:-translate-y-1'
    }`}>
      
      {/* Top Row: Category & Timer */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-900 px-3 py-1 rounded-md">
          {event.category}
        </span>
        
        <div className={`flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-md border ${
          isLocked 
            ? 'bg-red-500/10 text-red-500 border-red-500/20' 
            : 'bg-[#C5A880]/10 text-[#C5A880] border-[#C5A880]/20 animate-pulse'
        }`}>
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          {timeLeft}
        </div>
      </div>

      {/* Main Content */}
      <h3 className="text-xl font-bold text-white mb-2 leading-tight">
        {event.title}
      </h3>
      <p className="text-sm text-zinc-400 mb-6 line-clamp-2">
        {event.description}
      </p>

      {/* Outcomes Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {event.outcomes.map((outcome, index) => (
          <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
            isLocked ? 'bg-zinc-900 border-zinc-800' : 'bg-[#1a1a1a] border-[#ffffff0a]'
          }`}>
            <span className="text-sm font-semibold text-zinc-300">{outcome}</span>
            {/* Fake percentage for visual flavor - we can wire this to real pool data later */}
            <span className="text-xs font-mono text-zinc-500">Vol</span>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <button 
        disabled={isLocked}
        className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
          isLocked 
            ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800'
            : 'bg-gradient-to-r from-[#8E7651] to-[#A3885C] text-[#0a0a0a] hover:scale-[1.02] shadow-[0_0_20px_rgba(163,136,92,0.2)]'
        }`}
      >
        {isLocked ? 'Market Closed' : 'Enter Pool'}
        {!isLocked && <TrendingUp className="w-4 h-4" />}
      </button>
    </div>
  );
}
