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
  const [selectedOutcome, setSelectedOutcome] = useState<{eventId: string, idx: number} | null>(null)
  
  // UX STATES
  const [stakeAmount, setStakeAmount] = useState<number>(MIN_STAKE)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [lastBetDetails, setLastBetDetails] = useState<{stake: number, payout: number, outcomeName: string} | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('All') // New state for filtering

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

  const placeBet = async () => {
    if (!selectedOutcome || !session?.user) return
    
    if (!profile || profile.wallet_balance < stakeAmount) {
      alert('Insufficient balance!')
      return
    }

    if (stakeAmount < MIN_STAKE) {
      alert(`Minimum stake is ${MIN_STAKE} credits`)
      return
    }

    const event = events.find(e => e.id === selectedOutcome.eventId)
    const outcomeName = event?.outcomes[selectedOutcome.idx] || 'Unknown Outcome'
    const oddsPercent = getOdds(selectedOutcome.eventId, selectedOutcome.idx)
    const payoutInfo = calculatePayout(oddsPercent, stakeAmount)

    const { error } = await supabase.from('bets').insert({
      event_id: selectedOutcome.eventId,
      outcome_index: selectedOutcome.idx,
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
      
      setLastBetDetails({
        stake: stakeAmount,
        payout: payoutInfo.net,
        outcomeName: outcomeName
      })
      
      setShowSuccessModal(true)
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

  const calculatePayout = (oddsPercent: number, currentStake: number) => {
    const oddsDecimal = oddsPercent === 0 ? 2 : 100 / oddsPercent
    const grossPayout = currentStake * oddsDecimal
    const fee = grossPayout * (PLATFORM_FEE_PERCENT / 100)
    const netPayout = grossPayout - fee
    
    return {
      gross: Math.round(grossPayout),
      fee: Math.round(fee),
      net: Math.round(netPayout),
      odds: oddsDecimal.toFixed(2)
    }
  }

  // DYNAMIC CATEGORY FILTERING
  // This automatically finds all unique categories in your database
  const categories = ['All', ...Array.from(new Set(events.map(e => e.category)))]
  
  // This filters the feed based on what the user tapped
  const filteredEvents = activeCategory === 'All' 
    ? events 
    : events.filter(e => e.category === activeCategory)

  if (!session) {
    return <Auth />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-matte-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-matte-900 relative">
      
      {/* PREMIUM KALSHI-STYLE HEADER */}
      <header className="border-b border-matte-800 bg-matte-900/90 backdrop-blur-xl sticky top-0 z-20">
        
        {/* Top Row: Logo & User Controls */}
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gold-400 tracking-tight">PARLAYZ</h1>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sleek Balance Pill */}
            <div className="bg-matte-800 border border-matte-700 rounded-full px-3 sm:px-4 py-1.5 flex items-center gap-2 shadow-inner">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gold-500 animate-pulse"></div>
              <span className="text-white font-bold text-sm sm:text-base">{profile?.wallet_balance.toLocaleString() || '0'}</span>
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider hidden sm:inline">KSh</span>
            </div>
            
            {/* Minimalist Logout Icon Button */}
            <button 
              onClick={handleLogout}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-matte-800 border border-matte-700 hover:border-gold-500/50 hover:text-gold-400 text-gray-400 transition"
              title="Sign Out"
            >
              <svg className="w-4 h-4 sm:w-4 sm:h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom Row: Horizontal Category Scroller */}
        <div className="max-w-6xl mx-auto px-4 mt-1">
          <div className="flex items-center gap-6 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat)
                  setSelectedOutcome(null) // Reset selected bet when switching tabs
                }}
                className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 ${
                  activeCategory === cat 
                    ? 'text-gold-400 border-gold-400' 
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}
              >
                {cat === 'All' ? 'Trending' : cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {activeCategory === 'All' ? 'All Markets' : `${activeCategory} Markets`}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredEvents.length === 0 ? (
            <div className="col-span-full py-10 text-center text-gray-500">
              No live markets in this category yet.
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div key={event.id} className="bg-matte-800 border border-matte-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-gold-500/50 transition">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider bg-gold-400/10 px-2 sm:px-3 py-1 rounded-full">
                    {event.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(event.closes_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{event.title}</h3>
                <p className="text-gray-400 text-sm mb-4 sm:mb-6 line-clamp-2">{event.description}</p>

                <div className="space-y-2 sm:space-y-3">
                  {event.outcomes.map((outcome, idx) => {
                    const oddsPercent = getOdds(event.id, idx)
                    const payout = calculatePayout(oddsPercent, stakeAmount)
                    const isSelected = selectedOutcome?.eventId === event.id && selectedOutcome?.idx === idx

                    return (
                      <div key={idx} className="space-y-2">
                        <button
                          onClick={() => {
                            setSelectedOutcome({eventId: event.id, idx})
                            setStakeAmount(MIN_STAKE)
                          }}
                          className={`w-full flex items-center justify-between rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 transition border ${
                            isSelected 
                              ? 'bg-gold-500/20 border-gold-500' 
                              : 'bg-matte-900 border-matte-600 hover:border-gold-500/50'
                          }`}
                        >
                          <span className={`font-medium text-sm sm:text-base ${isSelected ? 'text-gold-400' : 'text-white'}`}>
                            {outcome}
                          </span>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-12 sm:w-16 h-2 bg-matte-700 rounded-full overflow-hidden">
                              <div className="h-full bg-gold-500" style={{ width: `${oddsPercent}%` }} />
                            </div>
                            <span className="text-gold-400 font-bold text-xs sm:text-sm w-10 sm:w-12 text-right">{oddsPercent}%</span>
                          </div>
                        </button>
                        
                        {isSelected && (
                          <div className="bg-matte-900 rounded-lg p-3 sm:p-4 text-xs sm:text-sm space-y-3 border border-gold-500/30 mt-2">
                            
                            <div className="bg-matte-800 p-3 rounded-lg border border-matte-700">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400">Wager Amount</span>
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    value={stakeAmount || ''}
                                    onChange={(e) => setStakeAmount(Number(e.target.value))}
                                    className="bg-transparent text-gold-400 font-bold text-right w-20 focus:outline-none text-base"
                                    min={MIN_STAKE}
                                  />
                                  <span className="text-gray-500 ml-1 text-base">KSh</span>
                                </div>
                              </div>
                              <input
                                type="range"
                                min={MIN_STAKE}
                                max={profile?.wallet_balance ? Math.max(profile.wallet_balance, 1000) : 10000}
                                step="100"
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(Number(e.target.value))}
                                className="w-full h-1.5 bg-matte-900 rounded-lg appearance-none cursor-pointer accent-gold-500"
                              />
                            </div>

                            <div className="space-y-1.5 px-1">
                              <div className="flex justify-between text-gray-400">
                                <span>Odds:</span>
                                <span className="text-white">{payout.odds}x</span>
                              </div>
                              <div className="flex justify-between text-gray-400">
                                <span>Gross Payout:</span>
                                <span className="text-white">{payout.gross.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-red-400">
                                <span>Fee ({PLATFORM_FEE_PERCENT}%):</span>
                                <span>-{payout.fee.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gold-400 font-bold pt-2 border-t border-matte-700 mt-2">
                                <span>You Receive:</span>
                                <span className="text-lg">{payout.net.toLocaleString()} credits</span>
                              </div>
                            </div>

                            <button
                              onClick={placeBet}
                              disabled={!profile || profile.wallet_balance < stakeAmount || stakeAmount < MIN_STAKE}
                              className="w-full mt-4 bg-gold-500 hover:bg-gold-400 disabled:bg-matte-700 disabled:text-gray-500 text-matte-900 font-bold py-3 rounded-xl transition text-sm sm:text-base shadow-[0_0_15px_rgba(251,191,36,0.2)] hover:shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                            >
                              {!profile ? 'Loading...' : profile.wallet_balance < stakeAmount ? 'Insufficient Balance' : stakeAmount < MIN_STAKE ? `Min ${MIN_STAKE} KSh` : 'Confirm Bet'}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-matte-700 flex items-center justify-between text-xs text-gray-500">
                  <span>Vol: {bets.filter(b => b.event_id === event.id).reduce((sum, b) => sum + b.stake, 0).toLocaleString()}</span>
                  <span>{bets.filter(b => b.event_id === event.id).length} bets</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* PREMIUM VIP SUCCESS MODAL */}
      {showSuccessModal && lastBetDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-matte-800 border border-gold-500/50 rounded-2xl p-6 sm:p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(251,191,36,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gold-500/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gold-500/10 border-2 border-gold-500 text-gold-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                ✓
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Wager Locked</h3>
              <p className="text-gray-400 text-sm mb-6">Your position is secured on the network.</p>
              
              <div className="bg-matte-900 rounded-xl p-4 mb-6 text-left border border-matte-700">
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Prediction</div>
                <div className="text-white font-medium mb-4 line-clamp-1">{lastBetDetails.outcomeName}</div>
                
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-gray-400">Stake Placed:</span>
                  <span className="text-white font-bold">{lastBetDetails.stake.toLocaleString()} KSh</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-matte-700">
                  <span className="text-gray-400">To Win:</span>
                  <span className="text-gold-400 font-bold text-lg">
                    {lastBetDetails.payout.toLocaleString()} KSh
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black font-bold py-3.5 rounded-xl transition shadow-[0_0_20px_rgba(251,191,36,0.3)]"
              >
                Return to Markets
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
