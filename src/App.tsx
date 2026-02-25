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

function App() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null)
  const [stakeAmount, setStakeAmount] = useState(MIN_STAKE)

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
    // Simulate historical odds based on bet timestamps
    const eventBets = bets
      .filter(b => b.event_id === eventId && b.outcome_index === outcomeIndex)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    
    if (eventBets.length === 0) return [50, 50, 50, 50, 50]
    
    const history: number[] = []
    let runningTotal = 0
    let totalAll = 0
    
    eventBets.forEach((bet, idx) => {
      runningTotal += bet.stake
      totalAll += bet.stake
      const odds = Math.round((runningTotal / totalAll) * 100)
      history.push(odds)
    })
    
    // Pad to 5 points for chart
    while (history.length < 5) history.unshift(50)
    return history.slice(-5)
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

  // Simple sparkline chart component
  const Sparkline = ({ data, color = "#fbbf24" }: { data: number[], color?: string }) => {
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    
    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * 100
      const y = 100 - ((val - min) / range) * 100
      return `${x},${y}`
    }).join(' ')
    
    return (
      <svg viewBox="0 0 100 100" className="w-full h-16" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          points={points}
        />
        <circle cx="100" cy={100 - ((data[data.length - 1] - min) / range) * 100} r="4" fill={color} />
      </svg>
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
      {/* Premium Header */}
      <header className="border-b border-matte-700 bg-matte-800/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gold-400 tracking-tight">PARLAYZ</h1>
          
          {/* Premium Balance Card */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-gold-500/20 to-gold-600/20 border border-gold-500/30 rounded-xl px-4 py-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center">
                <span className="text-matte-900 font-bold text-sm">K</span>
              </div>
              <div>
                <div className="text-xs text-gold-400/70 uppercase tracking-wider">Balance</div>
                <div className="text-gold-400 font-bold text-lg">
                  {profile?.wallet_balance.toLocaleString() || '0'}
                  <span className="text-xs ml-1">credits</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="bg-matte-700 hover:bg-matte-600 text-white font-bold px-4 py-2 rounded-lg transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white">Live Markets</h2>
            <p className="text-gray-400 text-sm mt-1">Click any market to trade</p>
          </div>
          <div className="text-sm text-gray-400 bg-matte-800 px-4 py-2 rounded-lg">
            Min Stake: <span className="text-gold-400 font-bold">{MIN_STAKE}</span> credits
          </div>
        </div>

        {/* Events Grid with Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event) => {
            const totalVolume = bets
              .filter(b => b.event_id === event.id)
              .reduce((sum, b) => sum + b.stake, 0)
            
            return (
              <div 
                key={event.id} 
                onClick={() => openEventModal(event)}
                className="bg-matte-800 border border-matte-700 rounded-xl p-5 hover:border-gold-500/50 hover:shadow-lg hover:shadow-gold-500/10 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider bg-gold-400/10 px-2 py-1 rounded">
                    {event.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(event.closes_at).toLocaleDateString('en-KE')}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-gold-400 transition line-clamp-2">
                  {event.title}
                </h3>
                
                {/* Kalshi-style Chart Preview */}
                <div className="mb-4 bg-matte-900/50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>Odds Trend</span>
                    <span className="text-gold-400">Live</span>
                  </div>
                  <div className="flex gap-2">
                    {event.outcomes.slice(0, 2).map(() => {
                      const history = getBetHistory(event.id, idx)
                      const currentOdds = getOdds(event.id, idx)
                      return (
                        <div key={idx} className="flex-1">
                          <Sparkline data={history} color={idx === 0 ? '#fbbf24' : '#f59e0b'} />
                          <div className="text-center text-xs text-gray-400 mt-1">{currentOdds}%</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-matte-700 flex items-center justify-between text-xs text-gray-500">
                  <span>Vol: {totalVolume.toLocaleString()}</span>
                  <span className="text-gold-400 group-hover:underline">Trade →</span>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Event Detail Modal - Kalshi Style */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div 
            className="bg-matte-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-matte-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-matte-800 border-b border-matte-700 p-6 flex justify-between items-start z-10">
              <div>
                <span className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-sm font-medium">
                  {selectedEvent.category}
                </span>
                <h2 className="text-2xl font-bold text-white mt-3">{selectedEvent.title}</h2>
              </div>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Description */}
              <div className="mb-6">
                <p className="text-gray-300 leading-relaxed">{selectedEvent.description}</p>
              </div>

              {/* Big Chart Area */}
              <div className="mb-6 bg-matte-900 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4">Market Activity</h3>
                <div className="flex gap-4 h-32">
                  {selectedEvent.outcomes.map((outcome, idx) => {
                    const history = getBetHistory(selectedEvent.id, idx)
                    const currentOdds = getOdds(selectedEvent.id, idx)
                    return (
                      <div key={idx} className="flex-1 bg-matte-800 rounded-lg p-3">
                        <div className="text-sm text-gray-400 mb-2">{outcome}</div>
                        <Sparkline data={history} color={idx === 0 ? '#fbbf24' : '#f59e0b'} />
                        <div className="text-2xl font-bold text-gold-400 mt-2">{currentOdds}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Stake Input */}
              <div className="mb-6 bg-matte-900 rounded-xl p-4 border border-matte-700">
                <label className="block text-sm text-gray-400 mb-2">Your Stake (Min: {MIN_STAKE})</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={MIN_STAKE}
                    max={profile?.wallet_balance || MIN_STAKE}
                    step={100}
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(Number(e.target.value))}
                    className="flex-1 h-2 bg-matte-700 rounded-lg appearance-none cursor-pointer accent-gold-500"
                  />
                  <div className="bg-matte-800 border border-matte-600 rounded-lg px-4 py-2 min-w-[120px] text-center">
                    <span className="text-2xl font-bold text-white">{stakeAmount}</span>
                    <span className="text-xs text-gray-400 ml-1">credits</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Min: {MIN_STAKE}</span>
                  <span>Max: {profile?.wallet_balance || 0}</span>
                </div>
              </div>

              {/* Outcomes */}
              <div className="space-y-3">
                {selectedEvent.outcomes.map((outcome, idx) => {
                  const odds = getOdds(selectedEvent.id, idx)
                  const payout = calculatePayout(stakeAmount, odds)
                  const isSelected = selectedOutcome === idx

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedOutcome(idx)}
                      className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                        isSelected 
                          ? 'border-gold-500 bg-gold-500/10' 
                          : 'border-matte-600 hover:border-matte-500 bg-matte-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-white text-lg mb-1">{outcome}</div>
                          <div className="text-sm text-gray-400">
                            If you win: <span className="text-gold-400 font-bold">{payout.net} credits</span>
                            <span className="text-xs text-gray-500 ml-2">(after {PLATFORM_FEE_PERCENT}% fee)</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-3xl font-bold text-gold-400">{odds}%</div>
                          <div className="text-xs text-gray-500">implied probability</div>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-3 w-full h-2 bg-matte-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-gold-500 to-gold-400" 
                          style={{ width: `${odds}%` }} 
                        />
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Confirm Button */}
              {selectedOutcome !== null && (
                <button
                  onClick={placeBet}
                  disabled={!profile || profile.wallet_balance < stakeAmount}
                  className="w-full mt-6 bg-gold-500 hover:bg-gold-400 disabled:bg-matte-600 disabled:text-gray-400 text-matte-900 py-4 rounded-xl font-bold text-lg transition"
                >
                  {!profile ? 'Loading...' : profile.wallet_balance < stakeAmount ? 'Insufficient Balance' : `Place Bet for ${stakeAmount} credits`}
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
