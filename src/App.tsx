import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'

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
  user_id: string
  created_at: string
}

interface Profile {
  id: string
  username: string
  wallet_balance: number
}

const MIN_STAKE = 200
const PLATFORM_FEE_PERCENT = 3

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b']

function App() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null)
  const [stakeAmount, setStakeAmount] = useState(MIN_STAKE)
  const [stakeAmount, setStakeAmount] = useState(200)
  const [showSuccessModal, setShowSuccessModal] = useState(false)


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session?.user) {
      fetchProfile()
      fetchEvents()
      fetchBets()
      
      const channel = supabase
        .channel('bets')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, () => {
          fetchBets()
          fetchProfile()
        })
        .subscribe()
      
      return () => { channel.unsubscribe() }
    }
  }, [session])

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (data) setProfile(data)
  }

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

  const openEventModal = (event: Event) => {
    setSelectedEvent(event)
    setSelectedOutcome(null)
    setStakeAmount(MIN_STAKE)
  }

  const closeModal = () => {
    setSelectedEvent(null)
    setSelectedOutcome(null)
  }

  const placeBet = async () => {
    if (!selectedEvent || selectedOutcome === null || !session?.user) return
    
    if (!profile || profile.wallet_balance < stakeAmount) {
      alert('Insufficient balance!')
      return
    }

    const { error } = await supabase.from('bets').insert({
      event_id: selectedEvent.id,
      outcome_index: selectedOutcome,
      stake: stakeAmount,
      odds: 200,
      status: 'open',
      user_id: session.user.id
    })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      await supabase.from('profiles').update({
        wallet_balance: profile.wallet_balance - stakeAmount
      }).eq('id', session.user.id)
      
      alert(`Bet placed! ${stakeAmount} credits on ${selectedEvent.outcomes[selectedOutcome]}`)
      setSelectedOutcome(null)
      setStakeAmount(MIN_STAKE)
      fetchBets()
      fetchProfile()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const getOdds = (eventId: string, outcomeIndex: number) => {
    const outcomeBets = bets.filter(b => b.event_id === eventId && b.outcome_index === outcomeIndex)
    const totalStake = outcomeBets.reduce((sum, b) => sum + b.stake, 0)
    const allBets = bets.filter(b => b.event_id === eventId)
    const total = allBets.reduce((sum, b) => sum + b.stake, 0)
    return total === 0 ? 50 : Math.round((totalStake / total) * 100)
  }

  const getBetHistory = (eventId: string, outcomeIndex: number) => {
    const eventBets = bets
      .filter(b => b.event_id === eventId && b.outcome_index === outcomeIndex)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    
    if (eventBets.length === 0) return [50, 50, 50, 50, 50, 50, 50]
    
    const history: number[] = []
    let runningTotal = 0
    let totalAll = 0
    
    eventBets.forEach((bet) => {
      runningTotal += bet.stake
      totalAll += bet.stake
      const odds = Math.round((runningTotal / totalAll) * 100)
      history.push(odds)
    })
    
    while (history.length < 7) history.unshift(50)
    return history.slice(-7)
  }

  const calculatePayout = (stake: number, oddsPercent: number) => {
    const oddsDecimal = oddsPercent === 0 ? 2 : 100 / oddsPercent
    const grossPayout = stake * oddsDecimal
    const fee = grossPayout * (PLATFORM_FEE_PERCENT / 100)
    const netPayout = grossPayout - fee
    
    return {
      gross: Math.round(grossPayout),
      fee: Math.round(fee),
      net: Math.round(netPayout),
      odds: oddsDecimal.toFixed(2)
    }
  }

  const MarketChart = ({ event }: { event: Event }) => {
    const allHistories = event.outcomes.map((_, i) => getBetHistory(event.id, i))
    const allOdds = event.outcomes.map((_, i) => getOdds(event.id, i))
    
    const maxVal = Math.max(...allHistories.flat(), ...allOdds, 100)
    const minVal = Math.min(...allHistories.flat(), ...allOdds, 0)
    const range = maxVal - minVal || 100

    return (
      <div className="relative h-40 w-full bg-matte-900/50 rounded-lg p-4">
        {[0, 25, 50, 75, 100].map((tick) => (
          <div 
            key={tick} 
            className="absolute w-full border-t border-matte-700/50 text-xs text-gray-600"
            style={{ bottom: `${tick}%` }}
          >
            <span className="absolute -left-8 -top-2">{tick}%</span>
          </div>
        ))}
        
        <svg viewBox="0 0 100 100" className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)]" preserveAspectRatio="none">
          {event.outcomes.map((_, outcomeIdx) => {
            const history = allHistories[outcomeIdx]
            const points = history.map((val, i) => {
              const x = (i / (history.length - 1)) * 100
              const y = 100 - ((val - minVal) / range) * 100
              return `${x},${y}`
            }).join(' ')
            
            return (
              <g key={outcomeIdx}>
                <polyline 
                  fill="none" 
                  stroke={COLORS[outcomeIdx % COLORS.length]} 
                  strokeWidth="2" 
                  points={points}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle 
                  cx="100" 
                  cy={100 - ((allOdds[outcomeIdx] - minVal) / range) * 100} 
                  r="3" 
                  fill={COLORS[outcomeIdx % COLORS.length]}
                />
              </g>
            )
          })}
        </svg>
        
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {event.outcomes.map((outcome, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-gray-400 truncate max-w-[100px]">{outcome}</span>
              <span className="text-white font-bold">{allOdds[i]}%</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-matte-900 flex items-center justify-center">
        <div className="text-gold-400 text-2xl font-bold">Loading markets...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-matte-900">
      <header className="border-b border-matte-700 bg-matte-800/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gold-400 tracking-tight">PARLAYZ</h1>
          
          <div className="flex items-center gap-3">
            <div className="bg-matte-900 border border-matte-600 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-xs text-gray-400">Balance</span>
              <span className="text-gold-400 font-bold text-sm">
                {profile?.wallet_balance.toLocaleString() || '0'}
              </span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-white text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Live Markets</h2>
          <span className="text-xs text-gray-400">Min: {MIN_STAKE} credits</span>
        </div>

        <div className="space-y-3">
          {events.map((event) => {
            const totalVolume = bets
              .filter(b => b.event_id === event.id)
              .reduce((sum, b) => sum + b.stake, 0)
            
            return (
              <div 
                key={event.id} 
                onClick={() => openEventModal(event)}
                className="bg-matte-800 border border-matte-700 rounded-lg p-4 hover:border-gold-500/30 transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs text-gold-400 font-medium uppercase tracking-wider">
                      {event.category}
                    </span>
                    <h3 className="text-base font-semibold text-white mt-0.5">{event.title}</h3>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(event.closes_at).toLocaleDateString('en-KE')}
                  </span>
                </div>
                
                <div className="my-3">
                  <MarketChart event={event} />
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-matte-700">
                  <span>Volume: {totalVolume.toLocaleString()} credits</span>
                  <span className="text-gold-400">{event.outcomes.length} outcomes</span>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div 
            className="bg-matte-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-matte-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-matte-800 border-b border-matte-700 p-4 flex justify-between items-center">
              <div>
                <span className="text-xs text-gold-400 font-medium uppercase">{selectedEvent.category}</span>
                <h2 className="text-lg font-semibold text-white">{selectedEvent.title}</h2>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-300">{selectedEvent.description}</p>
              
              <div className="text-xs text-gray-400">
                Closes: {new Date(selectedEvent.closes_at).toLocaleString('en-KE')}
              </div>

              <div className="bg-matte-900 rounded-lg p-3">
                <MarketChart event={selectedEvent} />
              </div>

              <div className="bg-matte-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Your Stake</span>
                  <span className="text-gold-400 font-bold">{stakeAmount} credits</span>
                </div>
                <input
                  type="range"
                  min={MIN_STAKE}
                  max={Math.min(profile?.wallet_balance || MIN_STAKE, 10000)}
                  step={100}
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(Number(e.target.value))}
                  className="w-full h-2 bg-matte-700 rounded-lg appearance-none cursor-pointer accent-gold-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{MIN_STAKE}</span>
                  <span>{profile?.wallet_balance || 0}</span>
                </div>
              </div>

              <div className="space-y-2">
                {selectedEvent.outcomes.map((outcome, i) => {
                  const odds = getOdds(selectedEvent.id, i)
                  const payout = calculatePayout(stakeAmount, odds)
                  const isSelected = selectedOutcome === i

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedOutcome(i)}
                      className={`w-full p-3 rounded-lg border text-left transition ${
                        isSelected 
                          ? 'border-gold-500 bg-gold-500/10' 
                          : 'border-matte-600 hover:border-matte-500 bg-matte-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[i % COLORS.length] }} 
                          />
                          <span className="text-white font-medium">{outcome}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-gold-400 font-bold">{odds}%</div>
                          {isSelected && (
                            <div className="text-xs text-gray-400">
                              Win {payout.net} credits
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {selectedOutcome !== null && (
                <button
                  onClick={placeBet}
                  disabled={!profile || (profile?.wallet_balance || 0) < stakeAmount}
                  className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-matte-600 disabled:text-gray-400 text-matte-900 py-3 rounded-lg font-bold transition"
                >
                  {!profile ? 'Loading...' : (profile?.wallet_balance || 0) < stakeAmount ? 'Insufficient Balance' : `Bet ${stakeAmount} credits`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
