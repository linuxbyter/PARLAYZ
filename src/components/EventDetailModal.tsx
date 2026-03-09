import { useState, useEffect } from 'react'

interface Event {
  id: string
  title: string
  description: string
  category: string
  outcomes: string[]
  closes_at: string
}

interface Props {
  event: Event | null
  isOpen: boolean
  onClose: () => void
}

export default function EventDetailModal({ event, isOpen, onClose }: Props) {
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null)
  const [betAmount, setBetAmount] = useState('')
  
  // New Timer State
  const [timeLeft, setTimeLeft] = useState('')
  const [isLocked, setIsLocked] = useState(false)

  // Live Countdown Engine
  useEffect(() => {
    if (!event) return;

    const calculateTime = () => {
      const lockTime = new Date(event.closes_at).getTime()
      const now = new Date().getTime()
      const distance = lockTime - now

      if (distance <= 0) {
        setIsLocked(true)
        setTimeLeft('MARKET LOCKED')
      } else {
        setIsLocked(false)
        const days = Math.floor(distance / (1000 * 60 * 60 * 24))
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`)
        } else {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
        }
      }
    }

    calculateTime()
    const timer = setInterval(calculateTime, 1000) // Ticks every second
    return () => clearInterval(timer)
  }, [event])

  if (!isOpen || !event) return null

  const handlePlaceBet = () => {
    if (isLocked) {
      alert("This market is locked. No more bets accepted.")
      return;
    }
    alert(`Betting ${betAmount} KES on "${selectedOutcome}"`)
    setBetAmount('')
    setSelectedOutcome(null)
  }

  return (
    // Backdrop
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div 
        className="bg-matte-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-matte-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-matte-800 border-b border-matte-700 p-6 flex justify-between items-start z-10">
          <div>
            <span className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-sm font-medium uppercase tracking-wider">
              {event.category}
            </span>
            <h2 className="text-2xl font-bold text-white mt-3">{event.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-white mb-2">About This Market</h3>
            <p className="text-gray-300 leading-relaxed">{event.description}</p>
          </div>

          {/* DYNAMIC LIVE TIMER */}
          <div className={`mb-6 border rounded-lg p-5 flex items-center justify-between transition-colors duration-300 ${
            isLocked ? 'bg-red-500/10 border-red-500/30' : 'bg-gold-500/10 border-gold-500/30'
          }`}>
            <div>
              <p className="text-sm font-medium text-gray-300 uppercase tracking-widest">
                {isLocked ? "Status:" : "Time Remaining:"}
              </p>
              <p className={`text-2xl font-mono font-bold mt-1 ${
                isLocked ? 'text-red-500' : 'text-gold-400 animate-pulse'
              }`}>
                {timeLeft}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Lock Date:</p>
              <p className="text-sm font-medium text-gray-400">
                {new Date(event.closes_at).toLocaleString('en-KE', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: 'Africa/Nairobi'
                })}
              </p>
            </div>
          </div>

          {/* Outcomes (Only clickable if NOT locked) */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-white mb-3">
              {isLocked ? 'Outcomes (Locked)' : 'Choose Outcome'}
            </h3>
            <div className="space-y-2">
              {event.outcomes.map((outcome) => (
                <button
                  key={outcome}
                  onClick={() => !isLocked && setSelectedOutcome(outcome)}
                  disabled={isLocked}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    isLocked 
                      ? 'border-matte-700 bg-matte-900 opacity-50 cursor-not-allowed'
                      : selectedOutcome === outcome 
                        ? 'border-gold-500 bg-gold-500/10 shadow-[0_0_15px_rgba(197,168,128,0.15)]' 
                        : 'border-matte-600 hover:border-matte-500 bg-matte-900'
                  }`}
                >
                  <div className="font-medium text-white">{outcome}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Bet Input (Only shows if outcome selected AND market is open) */}
          {selectedOutcome && !isLocked && (
            <div className="bg-matte-900 rounded-lg p-6 border-2 border-gold-500/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="font-semibold text-lg text-white mb-4">Place Your Bet</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Selected: <strong className="text-gold-400">{selectedOutcome}</strong>
                </label>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Amount (KES)
                </label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="1000"
                  min="1"
                  className="w-full bg-matte-800 border border-matte-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 font-mono text-lg"
                />
              </div>

              <button
                onClick={handlePlaceBet}
                disabled={!betAmount || parseFloat(betAmount) <= 0 || isLocked}
                className="w-full bg-gradient-to-r from-[#8E7651] to-[#A3885C] text-matte-900 py-3.5 rounded-lg font-bold hover:scale-[1.02] disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                Confirm Liquidity
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
