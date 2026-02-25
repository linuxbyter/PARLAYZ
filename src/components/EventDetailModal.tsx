import { useState } from 'react'

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

  if (!isOpen || !event) return null

  const handlePlaceBet = () => {
    alert(`Betting ${betAmount} KES on "${selectedOutcome}"`)
    setBetAmount('')
    setSelectedOutcome(null)
  }

  return (
    // Backdrop
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div 
        className="bg-matte-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-matte-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-matte-800 border-b border-matte-700 p-6 flex justify-between items-start z-10">
          <div>
            <span className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-sm font-medium">
              {event.category}
            </span>
            <h2 className="text-2xl font-bold text-white mt-3">{event.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl leading-none"
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

          {/* Closing Time */}
          <div className="mb-6 bg-gold-500/10 border border-gold-500/30 rounded-lg p-4">
            <p className="text-sm text-gray-300">
              <strong className="text-gold-400">Closes:</strong>{' '}
              {new Date(event.closes_at).toLocaleString('en-KE', {
                dateStyle: 'full',
                timeStyle: 'short',
                timeZone: 'Africa/Nairobi'
              })}
            </p>
          </div>

          {/* Outcomes */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-white mb-3">Choose Outcome</h3>
            <div className="space-y-2">
              {event.outcomes.map((outcome) => (
                <button
                  key={outcome}
                  onClick={() => setSelectedOutcome(outcome)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedOutcome === outcome 
                      ? 'border-gold-500 bg-gold-500/10' 
                      : 'border-matte-600 hover:border-matte-500 bg-matte-900'
                  }`}
                >
                  <div className="font-medium text-white">{outcome}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Bet Input (only shows when outcome selected) */}
          {selectedOutcome && (
            <div className="bg-matte-900 rounded-lg p-6 border-2 border-gold-500/30">
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
                  placeholder="100"
                  min="1"
                  className="w-full bg-matte-800 border border-matte-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <button
                onClick={handlePlaceBet}
                disabled={!betAmount || parseFloat(betAmount) <= 0}
                className="w-full bg-gold-500 text-matte-900 py-3 rounded-lg font-bold hover:bg-gold-400 disabled:bg-matte-600 disabled:cursor-not-allowed transition-colors"
              >
                Place Bet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
