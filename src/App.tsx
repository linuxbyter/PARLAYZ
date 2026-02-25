import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import EventDetailModal from './components/EventDetailModal'

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
}

interface Profile {
  id: string
  username: string
  wallet_balance: number
}

const BASE_STAKE = 200
const PLATFORM_FEE_PERCENT = 3

function App() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null)

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
    setIsModalOpen(true)
    setSelectedOutcome(null)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedEvent(null)
    setSelectedOutcome(null)
  }

  const placeBet = async () => {
    if (!selectedEvent || selectedOutcome === null || !session?.user) return
    
    if (!profile || profile.wallet_balance < BASE_STAKE) {
      alert('Insufficient balance!')
      return
    }

    const { error } = await supabase.from('bets').insert({
      event_id: selectedEvent.id,
      outcome_index: selectedOutcome,
      stake: BASE_STAKE,
      odds: 200,
      status: 'open',
      user_id: session.user.id
    })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      await supabase.from('profiles').update({
        wallet_balance: profile.wallet_balance - BASE_STAKE
      }).eq('id', session.user.id)
      
      alert(`Bet placed! ${BASE_STAKE} credits on ${selectedEvent.outcomes[selectedOutcome]}`)
      setSelectedOutcome(null)
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

  const calculatePayout = (oddsPercent: number) => {
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
      {/* Header */}
      <header className="border-b border-matte-700 bg-matte-800/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gold-400 tracking-tight">PARLAYZ</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-gray-400 text-sm sm:text-base">
              <span className="hidden sm:inline">Balance: </span>
              <span className="text-gold-400 font-bold">{profile?.wallet_balance.toLocaleString() || '0'}</span>
            </span>
            <button 
              onClick={handleLogout}
              className="bg-matte-700 hover:bg-matte-600 text-white font-bold px-3 sm:px-4 py-2 rounded-lg transition text-sm"
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">→</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white">Live Markets</h2>
            <p className="text-gray-400 text-sm mt-1">Click any market to view details and bet</p>
          </div>
          <div className="text-sm text-gray-400 bg-matte-800 px-4 py-2 rounded-lg">
            Base Stake: <span className="text-gold-400 font-bold">{BASE_STAKE}</span> credits
          </div>
        </div>

        {/* Events Grid - Kalshi Style */}
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
                {/* Category & Date */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider bg-gold-400/10 px-2 py-1 rounded">
                    {event.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(event.closes_at).toLocaleDateString('en-KE')}
                  </span>
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-gold-400 transition line-clamp-2">
                  {event.title}
                </h3>
                
                {/* Description Preview */}
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {event.description}
                </p>

                {/* Outcomes Preview */}
                <div className="space-y-2 mb-4">
                  {event.outcomes.slice(0, 2).map((outcome, idx) => {
                    const odds = getOdds(event.id, idx)
                    return (
                      <div key={idx} className="flex items-center justify-between bg-matte-900 rounded-lg px-3 py-2">
                        <span className="text-sm text-white truncate max-w-[60%]">{outcome}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-matte-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gold-500" style={{ width: `${odds}%` }} />
                          </div>
                          <span className="text-gold-400 font-bold text-xs">{odds}%</span>
                        </div>
                      </div>
                    )
                  })}
                  {event.outcomes.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{event.outcomes.length - 2} more outcomes
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-matte-700 flex items-center justify-between text-xs text-gray-500">
                  <span>Vol: {totalVolume.toLocaleString()}</span>
                  <span className="text-gold-400 group-hover:underline">View Details →</span>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-matte-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-matte-700"
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

            {/* Body */}
            <div className="p-6">
              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg text-white mb-2">About This Market</h3>
                <p className="text-gray-300 leading-relaxed">{selectedEvent.description}</p>
              </div>

              {/* Closing Time */}
              <div className="mb-6 bg-gold-500/10 border border-gold-500/30 rounded-lg p-4">
                <p className="text-sm text-gray-300">
                  <strong className="text-gold-400">Closes:</strong>{' '}
                  {new Date(selectedEvent.closes_at).toLocaleString('en-KE', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                    timeZone: 'Africa/Nairobi'
                  })}
                </p>
              </div>

              {/* Outcomes */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg text-white mb-3">Choose Outcome</h3>
                <div className="space-y-3">
                  {selectedEvent.outcomes.map((outcome, idx) => {
                    const odds = getOdds(selectedEvent.id, idx)
                    const payout = calculatePayout(odds)
                    const isSelected = selectedOutcome === idx

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedOutcome(idx)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected 
                            ? 'border-gold-500 bg-gold-500/10' 
                            : 'border-matte-600 hover:border-matte-500 bg-matte-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white text-lg">{outcome}</div>
                            {isSelected && (
                              <div className="text-sm text-gold-400 mt-1">
                                Potential payout: {payout.net} credits (after {PLATFORM_FEE_PERCENT}% fee)
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gold-400">{odds}%</div>
                            <div className="text-xs text-gray-500">chance</div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Bet Confirmation */}
              {selectedOutcome !== null && (
                <div className="bg-matte-900 rounded-xl p-6 border-2 border-gold-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-400">Your Stake</div>
                      <div className="text-2xl font-bold text-white">{BASE_STAKE} credits</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Potential Win</div>
                      <div className="text-2xl font-bold text-gold-400">
                        {calculatePayout(getOdds(selectedEvent.id, selectedOutcome)).net} credits
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={placeBet}
                    disabled={!profile || profile.wallet_balance < BASE_STAKE}
                    className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-matte-600 disabled:text-gray-400 text-matte-900 py-4 rounded-xl font-bold text-lg transition"
                  >
                    {!profile ? 'Loading...' : profile.wallet_balance < BASE_STAKE ? 'Insufficient Balance' : 'Confirm Bet'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
