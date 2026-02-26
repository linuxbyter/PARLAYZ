import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import { LogOut, X, AlertTriangle, Bell } from 'lucide-react'
import Landing from './Landing'

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
  odds?: number
  status: string
  user_id: string
  matcher_id?: string
}

interface Profile {
  id: string
  username: string
  wallet_balance: number
}

// NEW: Notification Interface
interface AppNotification {
  id: string
  user_id: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

const MIN_STAKE = 200
const PLATFORM_FEE_PERCENT = 3

function App() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOutcome, setSelectedOutcome] = useState<{eventId: string, idx: number} | null>(null)

  const [stakeAmount, setStakeAmount] = useState<number>(MIN_STAKE)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [lastBetDetails, setLastBetDetails] = useState<{stake: number, payout: number, outcomeName: string} | null>(null)
  
  // NAVIGATION STATES
  const [activeCategory, setActiveCategory] = useState<string>('All') 
  const [activeView, setActiveView] = useState<'markets' | 'wagers' | 'p2p'>('markets')

  // P2P STATES
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false)
  const [offerToMatch, setOfferToMatch] = useState<Bet | null>(null)
  const [p2pSelectedEventId, setP2pSelectedEventId] = useState<string>('')
  const [p2pSelectedOutcomeIdx, setP2pSelectedOutcomeIdx] = useState<number>(0)
  const [p2pStake, setP2pStake] = useState<number>(MIN_STAKE)
  const [p2pOdds, setP2pOdds] = useState<number>(2.00)

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
      fetchNotifications()

      const betsChannel = supabase
        .channel('bets_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, () => {
          fetchBets()
          fetchProfile()
        })
        .subscribe()

      const notifsChannel = supabase
        .channel('notifs_channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, () => {
          fetchNotifications()
        })
        .subscribe()

      return () => { 
        betsChannel.unsubscribe() 
        notifsChannel.unsubscribe()
      }
    }
  }, [session])

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) setProfile(data)
  }

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('events').select('*').eq('resolved', false).order('created_at', { ascending: false })
    if (!error) setEvents(data || [])
    setLoading(false)
  }

  const fetchBets = async () => {
    const { data } = await supabase.from('bets').select('*')
    setBets(data || [])
  }

  // --- NEW: FETCH NOTIFICATIONS ---
  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data || [])
  }

  const markNotificationsAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return

    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
  }

  const placeBet = async () => {
    if (!selectedOutcome || !session?.user || !profile) return
    if (profile.wallet_balance < stakeAmount) return alert('Insufficient balance!')
    if (stakeAmount < MIN_STAKE) return alert(`Minimum stake is ${MIN_STAKE} credits`)

    const event = events.find(e => e.id === selectedOutcome.eventId)
    const outcomeName = event?.outcomes[selectedOutcome.idx] || 'Unknown Outcome'
    const oddsPercent = getOdds(selectedOutcome.eventId, selectedOutcome.idx)
    const payoutInfo = calculatePayout(oddsPercent, stakeAmount)

    const { error } = await supabase.from('bets').insert({
      event_id: selectedOutcome.eventId,
      outcome_index: selectedOutcome.idx,
      stake: stakeAmount,
      odds: payoutInfo.oddsDecimal, 
      status: 'open',
      user_id: session.user.id
    })

    if (!error) {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - stakeAmount }).eq('id', session.user.id)
      setLastBetDetails({ stake: stakeAmount, payout: payoutInfo.net, outcomeName })
      setShowSuccessModal(true)
      setSelectedOutcome(null)
      setStakeAmount(MIN_STAKE)
      fetchBets()
      fetchProfile()
    }
  }

  const submitP2POffer = async () => {
    if (!p2pSelectedEventId || !session?.user || !profile) return
    if (profile.wallet_balance < p2pStake) return alert('Insufficient balance!')
    if (p2pStake < MIN_STAKE) return alert(`Minimum stake is ${MIN_STAKE} KSh`)

    const event = events.find(e => e.id === p2pSelectedEventId)
    const outcomeName = event?.outcomes[p2pSelectedOutcomeIdx] || 'Unknown Outcome'
    const grossPayout = p2pStake * p2pOdds
    const netPayout = Math.round(grossPayout - (grossPayout * (PLATFORM_FEE_PERCENT / 100)))

    const { error } = await supabase.from('bets').insert({
      event_id: p2pSelectedEventId,
      outcome_index: p2pSelectedOutcomeIdx,
      stake: p2pStake,
      odds: p2pOdds,
      status: 'p2p_open', 
      user_id: session.user.id
    })

    if (!error) {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - p2pStake }).eq('id', session.user.id)
      setLastBetDetails({ stake: p2pStake, payout: netPayout, outcomeName: `[P2P] ${outcomeName} @ ${p2pOdds}x` })
      setShowCreateOfferModal(false)
      setShowSuccessModal(true)
      setP2pSelectedEventId('')
      setP2pSelectedOutcomeIdx(0)
      setP2pStake(MIN_STAKE)
      setP2pOdds(2.00)
      fetchBets()
      fetchProfile()
    }
  }

  const initiateMatch = (offer: Bet) => {
    if (!session?.user || !profile) return
    if (offer.user_id === session.user.id) return alert("You cannot match your own offer!")
    
    const liability = Math.round((offer.stake * (offer.odds || 2)) - offer.stake)
    if (profile.wallet_balance < liability) return alert(`Insufficient funds! You need ${liability.toLocaleString()} KSh.`)
    
    setOfferToMatch(offer)
  }

  const confirmMatch = async () => {
    if (!offerToMatch || !session?.user || !profile) return
    const liability = Math.round((offerToMatch.stake * (offerToMatch.odds || 2)) - offerToMatch.stake)

    setBets(currentBets => currentBets.map(b => b.id === offerToMatch.id ? { ...b, status: 'p2p_matched', matcher_id: session.user.id } : b))
    setProfile({ ...profile, wallet_balance: profile.wallet_balance - liability })
    setOfferToMatch(null)

    const { error: betError } = await supabase.from('bets').update({ status: 'p2p_matched', matcher_id: session.user.id }).eq('id', offerToMatch.id)
    if (betError) return alert('Error matching offer')
    
    await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - liability }).eq('id', session.user.id)

    // --- SEND NOTIFICATION TO THE MAKER ---
    const event = events.find(e => e.id === offerToMatch.event_id)
    await supabase.from('notifications').insert({
      user_id: offerToMatch.user_id,
      message: `Someone just matched your ${offerToMatch.odds}x offer on ${event?.title || 'a market'}!`,
      type: 'p2p_matched',
      is_read: false
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setShowLogoutModal(false)
  }

  const getOdds = (eventId: string, outcomeIndex: number) => {
    const outcomeBets = bets.filter(b => b.event_id === eventId && b.outcome_index === outcomeIndex && b.status !== 'p2p_open')
    const totalStake = outcomeBets.reduce((sum, b) => sum + b.stake, 0)
    const allBets = bets.filter(b => b.event_id === eventId && b.status !== 'p2p_open')
    const total = allBets.reduce((sum, b) => sum + b.stake, 0)
    return total === 0 ? 50 : Math.round((totalStake / total) * 100)
  }

  const calculatePayout = (oddsPercent: number, currentStake: number) => {
    const oddsDecimal = oddsPercent === 0 ? 2 : 100 / oddsPercent
    const grossPayout = currentStake * oddsDecimal
    const fee = grossPayout * (PLATFORM_FEE_PERCENT / 100)
    return { gross: Math.round(grossPayout), fee: Math.round(fee), net: Math.round(grossPayout - fee), odds: oddsDecimal.toFixed(2), oddsDecimal }
  }

  const categories = ['All', ...Array.from(new Set(events.map(e => e.category)))]
  const filteredEvents = activeCategory === 'All' ? events : events.filter(e => e.category === activeCategory)
  
  // MY WAGERS FILTERING
  const myPendingOffers = bets.filter(b => b.user_id === session?.user?.id && b.status === 'p2p_open')
  const myActiveWagers = bets.filter(b => (b.user_id === session?.user?.id || b.matcher_id === session?.user?.id) && b.status !== 'p2p_open')
  const unreadCount = notifications.filter(n => !n.is_read).length

  if (!session) {
    return <Auth />
  }
  if (loading) return <div className="min-h-screen bg-matte-900 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div className="min-h-screen bg-matte-900 relative">

      <header className="border-b border-matte-800 bg-matte-900/90 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gold-400 tracking-tight">PARLAYZ</h1>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* NOTIFICATION BELL */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  if (!showNotifications) markNotificationsAsRead()
                }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-matte-800 border border-matte-700 hover:border-gold-500/50 text-gray-400 hover:text-white transition relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>
                )}
              </button>

              {/* NOTIFICATION DROPDOWN */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-matte-800 border border-matte-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50">
                  <div className="p-4 border-b border-matte-700 bg-matte-900 flex justify-between items-center">
                    <h4 className="text-white font-bold">Notifications</h4>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 text-sm">No new notifications.</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-matte-700/50 text-sm ${!n.is_read ? 'bg-gold-500/5' : 'bg-transparent'}`}>
                          <p className="text-gray-300">{n.message}</p>
                          <span className="text-xs text-gray-500 mt-2 block">{new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-matte-800 border border-matte-700 rounded-full px-3 sm:px-4 py-1.5 flex items-center gap-2 shadow-inner">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gold-500 animate-pulse"></div>
              <span className="text-white font-bold text-sm sm:text-base">{profile?.wallet_balance.toLocaleString() || '0'}</span>
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider hidden sm:inline">KSh</span>
            </div>

            <button 
              onClick={() => setShowLogoutModal(true)}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-matte-800 border border-matte-700 hover:border-red-500/50 hover:text-red-400 text-gray-400 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 mt-1">
          <div className="flex items-center gap-6 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            
            <button
              onClick={() => { setActiveView('wagers'); setSelectedOutcome(null) }}
              className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'wagers' ? 'text-gold-400 border-gold-400' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
            >
              <span className={`w-2 h-2 rounded-full ${activeView === 'wagers' ? 'bg-gold-500 animate-pulse' : 'bg-gray-500'}`}></span>
              My Wagers
            </button>

            <button
              onClick={() => { setActiveView('p2p'); setSelectedOutcome(null) }}
              className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'p2p' ? 'text-gold-400 border-gold-400' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
            >
              🤝 P2P Board
            </button>

            <div className="w-px h-4 bg-matte-700"></div> 

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveView('markets'); setActiveCategory(cat); setSelectedOutcome(null) }}
                className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 ${activeView === 'markets' && activeCategory === cat ? 'text-gold-400 border-gold-400' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
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
            {activeView === 'wagers' ? 'My Active Portfolio' : activeView === 'p2p' ? 'Peer-to-Peer Markets' : activeCategory === 'All' ? 'All Markets' : `${activeCategory} Markets`}
          </h2>
        </div>

        {/* --- P2P BOARD --- */}
        {activeView === 'p2p' ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-matte-800 border border-gold-500/30 rounded-2xl p-6 shadow-[0_0_15px_rgba(251,191,36,0.1)] gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Peer-to-Peer Exchange</h3>
                <p className="text-gray-400 text-sm">Lock in fixed odds or create custom wagers.</p>
              </div>
              <button 
                onClick={() => setShowCreateOfferModal(true)}
                className="bg-gold-500 hover:bg-gold-400 text-matte-900 font-bold py-2.5 px-5 rounded-xl transition shadow-[0_0_15px_rgba(251,191,36,0.2)] w-full sm:w-auto"
              >
                + Create Offer
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {bets.filter(b => b.status === 'p2p_open').length === 0 ? (
                <div className="col-span-full py-10 text-center text-gray-500 border border-dashed border-matte-700 rounded-2xl">
                  No open market offers. Be the first to create one!
                </div>
              ) : (
                bets.filter(b => b.status === 'p2p_open').map((offer, i) => {
                  const event = events.find(e => e.id === offer.event_id)
                  if (!event) return null
                  const outcomeName = event.outcomes[offer.outcome_index]
                  const liability = Math.round((offer.stake * (offer.odds || 2)) - offer.stake)
                  const isOwnOffer = offer.user_id === session?.user?.id

                  return (
                    <div key={i} className="bg-matte-800 border border-matte-700 rounded-xl p-5 hover:border-gold-500/50 transition relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl group-hover:bg-gold-500/10 transition"></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider bg-gold-400/10 px-2 py-1 rounded-full">{event.category}</span>
                        <span className="text-xs text-gray-500 border border-matte-600 px-2 py-0.5 rounded uppercase">P2P Escrow</span>
                      </div>
                      <h4 className="text-white font-bold mb-2 line-clamp-2 relative z-10">{event.title}</h4>
                      <div className="bg-matte-900 rounded p-3 mb-4 border border-matte-700 relative z-10">
                        <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Their Prediction</div>
                        <div className="text-white font-medium">{outcomeName}</div>
                      </div>
                      
                      <div className="space-y-1.5 mb-4 relative z-10">
                        <div className="flex justify-between text-sm text-gray-400">
                          <span>Maker's Stake:</span><span className="text-white font-bold">{offer.stake.toLocaleString()} KSh</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400">
                          <span>Requested Odds:</span><span className="text-gold-400 font-bold">{offer.odds}x</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-matte-700 mt-2">
                          <span className="text-gray-400 font-semibold">Your Risk (Liability):</span><span className="text-red-400 font-bold">{liability.toLocaleString()} KSh</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => initiateMatch(offer)}
                        disabled={isOwnOffer}
                        className={`w-full font-bold py-3 rounded-xl transition relative z-10 ${isOwnOffer ? 'bg-matte-900 text-gray-600 border border-matte-800 cursor-not-allowed' : 'bg-matte-700 hover:bg-gold-500 hover:text-black text-white border border-matte-600 hover:border-gold-500 hover:shadow-[0_0_15px_rgba(251,191,36,0.3)]'}`}
                      >
                        {isOwnOffer ? 'Waiting for Matcher...' : 'Match Offer'}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        ) : activeView === 'wagers' ? (
          
          /* --- CATEGORIZED MY WAGERS VIEW --- */
          <div className="space-y-10">

            {/* SECTION 1: MY OPEN P2P OFFERS */}
            {myPendingOffers.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse"></span>
                  My Open P2P Offers (Waiting for Match)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {myPendingOffers.reverse().map((bet, i) => {
                    const event = events.find(e => e.id === bet.event_id)
                    if (!event) return null
                    
                    return (
                      <div key={i} className="bg-matte-800 border border-gold-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 opacity-80 hover:opacity-100 transition relative overflow-hidden">
                        <div className="flex items-start justify-between mb-4">
                          <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider bg-gold-400/10 px-2 sm:px-3 py-1 rounded-full">{event.category}</span>
                          <span className="text-xs px-2 py-1 rounded bg-matte-900 border border-gold-500/50 text-gold-400 uppercase tracking-wide">Listed</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-4">{event.title}</h3>
                        <div className="bg-matte-900 rounded-lg p-3 border border-matte-700 mb-4">
                          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Your Prediction</div>
                          <div className="text-white font-medium">{event.outcomes[bet.outcome_index]}</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-gray-400"><span>Your Stake:</span><span className="text-white">{bet.stake.toLocaleString()} KSh</span></div>
                          <div className="flex justify-between text-gray-400"><span>Requested Odds:</span><span className="text-white">{bet.odds}x</span></div>
                          <div className="flex justify-between font-bold pt-3 border-t border-matte-700 mt-3">
                            <span className="text-gray-400">Pot Size:</span><span className="text-white">{(bet.stake * (bet.odds || 2)).toLocaleString()} KSh</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* SECTION 2: ACTIVE WAGERS */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Locked & Active Wagers</h3>
              
              {myActiveWagers.length === 0 ? (
                <div className="py-16 text-center text-gray-500 flex flex-col items-center border border-dashed border-matte-700 rounded-2xl">
                  <div className="w-16 h-16 rounded-full bg-matte-800 flex items-center justify-center mb-4 border border-matte-700">
                    <span className="text-2xl opacity-50">💸</span>
                  </div>
                  <p>No active wagers right now.</p>
                  <button onClick={() => setActiveView('markets')} className="mt-4 text-gold-400 hover:text-gold-300 text-sm font-semibold">Explore Markets →</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {myActiveWagers.reverse().map((bet, i) => {
                    const event = events.find(e => e.id === bet.event_id)
                    if (!event) return null
                    
                    const outcomeName = event.outcomes[bet.outcome_index] || 'Unknown Outcome'
                    const isMatcher = bet.matcher_id === session?.user?.id
                    
                    let currentOddsMultiplier: string | number = bet.odds || 2.0
                    let estNetPayout = 0
                    let displayStake = bet.stake

                    if (bet.status === 'p2p_matched') {
                      const gross = bet.stake * (bet.odds || 2)
                      estNetPayout = Math.round(gross - (gross * (PLATFORM_FEE_PERCENT / 100)))
                      if (isMatcher) displayStake = Math.round(gross - bet.stake) // Matcher liability
                    } else {
                      const currentOddsPercent = getOdds(event.id, bet.outcome_index)
                      const payoutInfo = calculatePayout(currentOddsPercent, bet.stake)
                      currentOddsMultiplier = payoutInfo.odds
                      estNetPayout = payoutInfo.net
                    }

                    return (
                      <div key={i} className={`bg-matte-800 border rounded-xl sm:rounded-2xl p-4 sm:p-6 transition relative overflow-hidden ${bet.status === 'p2p_matched' ? 'border-gold-500/40' : 'border-matte-700 hover:border-gold-500/50'}`}>
                        {bet.status === 'p2p_matched' && <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl"></div>}
                        
                        <div className="flex items-start justify-between mb-4 relative z-10">
                          <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider bg-gold-400/10 px-2 sm:px-3 py-1 rounded-full">{event.category}</span>
                          <span className={`text-xs px-2 py-1 rounded bg-matte-900 border uppercase tracking-wide ${bet.status === 'p2p_matched' ? 'border-gold-500/50 text-gold-400' : 'border-matte-700 text-gray-400'}`}>
                            {isMatcher ? 'P2P Taker' : bet.status === 'p2p_matched' ? 'P2P Maker' : 'Pool Bet'}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-4 relative z-10">{event.title}</h3>
                        
                        <div className="bg-matte-900 rounded-lg p-3 border border-matte-700 mb-4 relative z-10">
                          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                            {isMatcher ? 'You bet AGAINST' : 'Your Prediction'}
                          </div>
                          <div className="text-white font-medium">{outcomeName}</div>
                        </div>

                        <div className="space-y-2 text-sm relative z-10">
                          <div className="flex justify-between text-gray-400">
                            <span>{isMatcher ? 'Your Risk:' : 'Original Stake:'}</span><span className="text-white">{displayStake.toLocaleString()} KSh</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>{bet.status === 'p2p_matched' ? 'Locked Odds:' : 'Market Odds:'}</span><span className="text-white">{currentOddsMultiplier}x</span>
                          </div>
                          <div className="flex justify-between font-bold pt-3 border-t border-matte-700 mt-3">
                            <span className="text-gold-400">Est. Payout:</span><span className="text-gold-400 text-lg">{estNetPayout.toLocaleString()} KSh</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>

        ) : (
          
          /* --- MARKETS VIEW --- */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredEvents.length === 0 ? (
              <div className="col-span-full py-10 text-center text-gray-500">No live markets in this category yet.</div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="bg-matte-800 border border-matte-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-gold-500/50 transition">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider bg-gold-400/10 px-2 sm:px-3 py-1 rounded-full">{event.category}</span>
                    <span className="text-xs text-gray-500">{new Date(event.closes_at).toLocaleDateString()}</span>
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
                            onClick={() => { setSelectedOutcome({eventId: event.id, idx}); setStakeAmount(MIN_STAKE) }}
                            className={`w-full flex items-center justify-between rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 transition border ${isSelected ? 'bg-gold-500/20 border-gold-500' : 'bg-matte-900 border-matte-600 hover:border-gold-500/50'}`}
                          >
                            <span className={`font-medium text-sm sm:text-base ${isSelected ? 'text-gold-400' : 'text-white'}`}>{outcome}</span>
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
                                    <input type="number" value={stakeAmount || ''} onChange={(e) => setStakeAmount(Number(e.target.value))} className="bg-transparent text-gold-400 font-bold text-right w-20 focus:outline-none text-base" min={MIN_STAKE} />
                                    <span className="text-gray-500 ml-1 text-base">KSh</span>
                                  </div>
                                </div>
                                <input type="range" min={MIN_STAKE} max={profile?.wallet_balance ? Math.max(profile.wallet_balance, 1000) : 10000} step="100" value={stakeAmount} onChange={(e) => setStakeAmount(Number(e.target.value))} className="w-full h-1.5 bg-matte-900 rounded-lg appearance-none cursor-pointer accent-gold-500" />
                              </div>
                              <div className="space-y-1.5 px-1">
                                <div className="flex justify-between text-gray-400"><span>Odds:</span><span className="text-white">{payout.odds}x</span></div>
                                <div className="flex justify-between text-gray-400"><span>Gross Payout:</span><span className="text-white">{payout.gross.toLocaleString()}</span></div>
                                <div className="flex justify-between text-red-400"><span>Fee ({PLATFORM_FEE_PERCENT}%):</span><span>-{payout.fee.toLocaleString()}</span></div>
                                <div className="flex justify-between text-gold-400 font-bold pt-2 border-t border-matte-700 mt-2"><span>You Receive:</span><span className="text-lg">{payout.net.toLocaleString()} credits</span></div>
                              </div>
                              <button onClick={placeBet} disabled={!profile || profile.wallet_balance < stakeAmount || stakeAmount < MIN_STAKE} className="w-full mt-4 bg-gold-500 hover:bg-gold-400 disabled:bg-matte-700 disabled:text-gray-500 text-matte-900 font-bold py-3 rounded-xl transition text-sm sm:text-base shadow-[0_0_15px_rgba(251,191,36,0.2)] hover:shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                                {!profile ? 'Loading...' : profile.wallet_balance < stakeAmount ? 'Insufficient Balance' : stakeAmount < MIN_STAKE ? `Min ${MIN_STAKE} KSh` : 'Confirm Bet'}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-matte-700 flex items-center justify-between text-xs text-gray-500">
                    <span>Vol: {bets.filter(b => b.event_id === event.id && !b.status.startsWith('p2p_')).reduce((sum, b) => sum + b.stake, 0).toLocaleString()}</span>
                    <span>{bets.filter(b => b.event_id === event.id && !b.status.startsWith('p2p_')).length} pool bets</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
      
      {/* P2P CREATE OFFER MODAL */}
      {showCreateOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-matte-800 border border-gold-500/30 rounded-2xl p-6 w-full max-w-md shadow-[0_0_50px_rgba(251,191,36,0.1)] relative">
            <button onClick={() => setShowCreateOfferModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            <h3 className="text-2xl font-bold text-white mb-1">Create P2P Offer</h3>
            <p className="text-gray-400 text-sm mb-6">Set your own odds and wait for another user to match your stake.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">1. Select Market</label>
                <select className="w-full bg-matte-900 border border-matte-700 text-white rounded-xl p-3 focus:outline-none focus:border-gold-500" value={p2pSelectedEventId} onChange={(e) => { setP2pSelectedEventId(e.target.value); setP2pSelectedOutcomeIdx(0) }}>
                  <option value="" disabled>Choose an active market...</option>
                  {events.map(e => (<option key={e.id} value={e.id}>{e.title}</option>))}
                </select>
              </div>
              {p2pSelectedEventId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">2. Your Prediction</label>
                  <div className="grid grid-cols-2 gap-2">
                    {events.find(e => e.id === p2pSelectedEventId)?.outcomes.map((outcome, idx) => (
                      <button key={idx} onClick={() => setP2pSelectedOutcomeIdx(idx)} className={`p-2 rounded-lg border text-sm font-medium transition ${p2pSelectedOutcomeIdx === idx ? 'bg-gold-500/20 border-gold-500 text-gold-400' : 'bg-matte-900 border-matte-700 text-gray-400 hover:border-gray-500'}`}>{outcome}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Stake (KSh)</label>
                  <input type="number" min={MIN_STAKE} value={p2pStake || ''} onChange={(e) => setP2pStake(Number(e.target.value))} className="w-full bg-matte-900 border border-matte-700 text-white font-bold rounded-xl p-3 focus:outline-none focus:border-gold-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Requested Odds (x)</label>
                  <input type="number" min="1.01" step="0.01" value={p2pOdds || ''} onChange={(e) => setP2pOdds(Number(e.target.value))} className="w-full bg-matte-900 border border-matte-700 text-gold-400 font-bold rounded-xl p-3 focus:outline-none focus:border-gold-500" />
                </div>
              </div>
              <div className="bg-matte-900 rounded-lg p-3 text-sm space-y-1.5 border border-matte-700 mt-2">
                <div className="flex justify-between text-gray-400"><span>To Win (Gross):</span><span>{Math.round(p2pStake * p2pOdds).toLocaleString()} KSh</span></div>
                <div className="flex justify-between text-gold-400 font-bold pt-1 border-t border-matte-800 mt-1"><span>Net Payout:</span><span>{Math.round((p2pStake * p2pOdds) * (1 - PLATFORM_FEE_PERCENT/100)).toLocaleString()} KSh</span></div>
              </div>
              <button onClick={submitP2POffer} disabled={!p2pSelectedEventId || p2pStake < MIN_STAKE || p2pOdds <= 1} className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-matte-700 disabled:text-gray-500 text-black font-bold py-3.5 rounded-xl transition shadow-[0_0_15px_rgba(251,191,36,0.2)] mt-4">Publish Offer to Board</button>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM MATCH CONFIRMATION MODAL */}
      {offerToMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-matte-800 border border-gold-500/50 rounded-2xl p-6 sm:p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(251,191,36,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-yellow-500/10 border-2 border-yellow-500/50 text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(234,179,8,0.2)]"><AlertTriangle className="w-7 h-7" /></div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Lock Liability</h3>
              <p className="text-gray-400 text-sm mb-6">You are acting as the house for this wager.</p>
              <div className="bg-matte-900 rounded-xl p-4 mb-6 text-left border border-matte-700">
                <div className="flex justify-between items-center text-sm mb-2"><span className="text-gray-400">You Risk:</span><span className="text-red-400 font-bold">{Math.round((offerToMatch.stake * (offerToMatch.odds || 2)) - offerToMatch.stake).toLocaleString()} KSh</span></div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-matte-700"><span className="text-gray-400">To Win:</span><span className="text-gold-400 font-bold text-lg">{offerToMatch.stake.toLocaleString()} KSh</span></div>
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setOfferToMatch(null)} className="w-1/2 bg-matte-700 hover:bg-matte-600 text-white font-semibold py-3 rounded-xl transition">Cancel</button>
                <button onClick={confirmMatch} className="w-1/2 bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded-xl transition shadow-[0_0_15px_rgba(251,191,36,0.2)]">Lock In</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS & LOGOUT MODALS REMAIN THE SAME... */}
      {/* SUCCESS MODAL */}
      {showSuccessModal && lastBetDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-matte-800 border border-gold-500/50 rounded-2xl p-6 sm:p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(251,191,36,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gold-500/20 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gold-500/10 border-2 border-gold-500 text-gold-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-[0_0_15px_rgba(251,191,36,0.3)]">✓</div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Wager Locked</h3>
              <p className="text-gray-400 text-sm mb-6">Your position is secured on the network.</p>
              <div className="bg-matte-900 rounded-xl p-4 mb-6 text-left border border-matte-700">
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Prediction</div>
                <div className="text-white font-medium mb-4 line-clamp-1">{lastBetDetails.outcomeName}</div>
                <div className="flex justify-between items-center text-sm mb-2"><span className="text-gray-400">Stake Placed:</span><span className="text-white font-bold">{lastBetDetails.stake.toLocaleString()} KSh</span></div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-matte-700"><span className="text-gray-400">To Win:</span><span className="text-gold-400 font-bold text-lg">{lastBetDetails.payout.toLocaleString()} KSh</span></div>
              </div>
              <button onClick={() => setShowSuccessModal(false)} className="w-full bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black font-bold py-3.5 rounded-xl transition shadow-[0_0_20px_rgba(251,191,36,0.3)]">Return to Markets</button>
            </div>
          </div>
        </div>
      )}
      
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-matte-800 border border-matte-700 rounded-2xl p-6 sm:p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500/50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]"><LogOut className="w-7 h-7 ml-1" /></div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Leaving so soon?</h3>
              <p className="text-gray-400 text-sm mb-8">Are you sure you want to log out of Parlayz?</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowLogoutModal(false)} className="w-1/2 bg-matte-700 hover:bg-matte-600 text-white font-semibold py-3 rounded-xl transition">Cancel</button>
                <button onClick={handleLogout} className="w-1/2 bg-red-600/10 border border-red-500/50 hover:bg-red-500 text-red-400 hover:text-white font-semibold py-3 rounded-xl transition shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]">Log Out</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
