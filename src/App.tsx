import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

interface Event {
  id: string
  title: string
  description: string
  category: string
  outcomes: string[]
  closes_at: string
  created_at: string
}

interface Bet {
  id: string
  event_id: string
  outcome_index: number
  stake: number
  status: string
}

const BASE_STAKE = 200
const PLATFORM_FEE_PERCENT = 3 // 3% like Polymarket

function App() {
  const [events, setEvents] = useState<Event[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOutcome, setSelectedOutcome] = useState<{eventId: string, idx: number} | null>(null)

  useEffect(() => {
    fetchEvents()
    fetchBets()
    
    // Real-time updates
    const channel = supabase
      .channel('bets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, () => {
        fetchBets()
      })
      .subscribe()
    
    return () => { channel.unsubscribe() }
  }, [])

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false })

    if (!error) setEvents(data || [])
    setLoading(false)
  }

  const fetchBets = async () => {
    const { data } = await supabase.from('bets').select('*')
    setBets(data || [])
  }

  const placeBet = async () => {
    if (!selectedOutcome) return
    
    const { error } = await supabase.from('bets').insert({
      event_id: selectedOutcome.eventId,
      outcome_index: selectedOutcome.idx,
      stake: BASE_STAKE,
      odds: 200,
      status: 'open'
    })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert(`Bet placed! ${BASE_STAKE} credits`)
      setSelectedOutcome(null)
      fetchBets()
    }
  }

  const getOdds = (eventId: string, outcomeIndex: number) => {
    const outcomeBets = bets.filter(b => b.event_id === eventId && b.outcome_index === outcomeIndex)
    const totalStake = outcomeBets.reduce((sum, b) => sum + b.stake, 0)
    const allBets = bets.filter(b => b.event_id === eventId)
    const total = allBets.reduce((sum, b) => sum + b.stake, 0)
    return total === 0 ? 50 : Math.round((totalStake / total) * 100)
  }

  const calculatePayout = (oddsPercent: number) => {
    // Odds as decimal (50% = 2.0x)
    const oddsDecimal = oddsPercent === 0 ? 2 : 100 / oddsPercent
    const grossPayout = BASE_STAKE * oddsDecimal
    const fee = grossPayout * (PLATFORM_FEE_PERCENT / 100)
    const netPayout = grossPayout - fee
    
    return {
      gross: Math.round(grossPayout),
      fee: Math.round(fee),
      net: Math.round(netPayout),
      odds: oddsDecimal.toFixed(2)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-matte-900 flex items-center justify-center">
        <div className="text-gold-400 text-2xl font-bold">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-matte-900">
      <header className="border-b border-matte-700 bg-matte-800/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gold-400 tracking-tight">PARLAYZ</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Balance: <span className="text-gold-400 font-bold">10,000</span></span>
            <button className="bg-gold-500 hover:bg-gold-400 text-matte-900 font-bold px-6 py-2 rounded-lg transition">
              Connect
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-white">Live Markets</h2>
          <div className="text-sm text-gray-400">
            Base Stake: <span className="text-gold-400 font-bold">{BASE_STAKE}</span> credits
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-matte-800 border border-matte-700 rounded-2xl p-6 hover:border-gold-500/50 transition">
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider bg-gold-400/10 px-3 py-1 rounded-full">
                  {event.category}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(event.closes_at).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
              <p className="text-gray-400 text-sm mb-6">{event.description}</p>

              <div className="space-y-3">
                {event.outcomes.map((outcome, idx) => {
                  const oddsPercent = getOdds(event.id, idx)
                  const payout = calculatePayout(oddsPercent)
                  const isSelected = selectedOutcome?.eventId === event.id && selectedOutcome?.idx === idx

                  return (
                    <div key={idx} className="space-y-2">
                      <button
                        onClick={() => setSelectedOutcome({eventId: event.id, idx})}
                        className={`w-full flex items-center justify-between rounded-xl px-4 py-3 transition border ${
                          isSelected 
                            ? 'bg-gold-500/20 border-gold-500' 
                            : 'bg-matte-900 border-matte-600 hover:border-gold-500/50'
                        }`}
                      >
                        <span className={`font-medium ${isSelected ? 'text-gold-400' : 'text-white'}`}>
                          {outcome}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-2 bg-matte-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gold-500" style={{ width: `${oddsPercent}%` }} />
                          </div>
                          <span className="text-gold-400 font-bold text-sm w-12 text-right">{oddsPercent}%</span>
                        </div>
                      </button>
                      
                      {isSelected && (
                        <div className="bg-matte-900 rounded-lg p-3 text-sm space-y-1 border border-gold-500/30">
                          <div className="flex justify-between text-gray-400">
                            <span>Your Stake:</span>
                            <span className="text-white">{BASE_STAKE}</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Odds:</span>
                            <span className="text-white">{payout.odds}x</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Gross Payout:</span>
                            <span className="text-white">{payout.gross}</span>
                          </div>
                          <div className="flex justify-between text-red-400">
                            <span>Platform Fee ({PLATFORM_FEE_PERCENT}%):</span>
                            <span>-{payout.fee}</span>
                          </div>
                          <div className="flex justify-between text-gold-400 font-bold pt-1 border-t border-matte-700">
                            <span>You Receive:</span>
                            <span>{payout.net} credits</span>
                          </div>
                          <button
                            onClick={placeBet}
                            className="w-full mt-3 bg-gold-500 hover:bg-gold-400 text-matte-900 font-bold py-2 rounded-lg transition"
                          >
                            Confirm Bet
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-matte-700 flex items-center justify-between text-xs text-gray-500">
                <span>Volume: {bets.filter(b => b.event_id === event.id).reduce((sum, b) => sum + b.stake, 0).toLocaleString()} credits</span>
                <span>{bets.filter(b => b.event_id === event.id).length} bets</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
