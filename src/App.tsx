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

function App() {
  const [events, setEvents] = useState<Event[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [betAmount, setBetAmount] = useState(100)

  useEffect(() => {
    fetchEvents()
    fetchBets()
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

  const placeBet = async (eventId: string, outcomeIndex: number) => {
    const { error } = await supabase.from('bets').insert({
      event_id: eventId,
      outcome_index: outcomeIndex,
      stake: betAmount,
      odds: 200,
      status: 'open'
    })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert(`Bet placed! ${betAmount} credits`)
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
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Bet amount:</span>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="bg-matte-800 border border-matte-600 rounded-lg px-3 py-1 text-white w-24"
              min="10"
              step="10"
            />
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

              <div className="space-y-2">
                {event.outcomes.map((outcome, idx) => {
                  const odds = getOdds(event.id, idx)
                  return (
                    <button
                      key={idx}
                      onClick={() => placeBet(event.id, idx)}
                      className="w-full flex items-center justify-between bg-matte-900 hover:bg-gold-500/20 border border-matte-600 hover:border-gold-500 rounded-xl px-4 py-3 transition group"
                    >
                      <span className="text-white font-medium group-hover:text-gold-400">{outcome}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-matte-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gold-500" style={{ width: `${odds}%` }} />
                        </div>
                        <span className="text-gold-400 font-bold text-sm w-10 text-right">{odds}%</span>
                      </div>
                    </button>
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
