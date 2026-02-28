import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Landing from './Landing'
import { LogOut, X, AlertTriangle, Bell, Wallet, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, History, PieChart } from 'lucide-react'

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

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOutcome, setSelectedOutcome] = useState<{eventId: string, idx: number} | null>(null)

  const [toast, setToast] = useState<{msg: string, type: 'error' | 'success'} | null>(null)
  const showToast = (msg: string, type: 'error' | 'success' = 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const [stakeAmount, setStakeAmount] = useState<number>(MIN_STAKE)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [lastBetDetails, setLastBetDetails] = useState<{stake: number, payout: number, outcomeName: string} | null>(null)
  
  const [activeCategory, setActiveCategory] = useState<string>('All') 
  const [activeView, setActiveView] = useState<'markets' | 'wagers' | 'p2p' | 'wallet'>('markets')

  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false)
  const [offerToMatch, setOfferToMatch] = useState<Bet | null>(null)
  const [p2pSelectedEventId, setP2pSelectedEventId] = useState<string>('')
  const [p2pSelectedOutcomeIdx, setP2pSelectedOutcomeIdx] = useState<number>(0)
  const [p2pStake, setP2pStake] = useState<number>(MIN_STAKE)
  const [p2pOdds, setP2pOdds] = useState<number>(2.00)

  const [withdrawAmount, setWithdrawAmount] = useState<number>(0)
  const [withdrawPhone, setWithdrawPhone] = useState<string>('')
  
  const [showCashierModal, setShowCashierModal] = useState<{type: 'deposit' | 'withdraw', status: 'processing' | 'success'} | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session?.user) {
      fetchProfile()
      fetchEvents()
      fetchBets()
      fetchNotifications()

      const betsChannel = supabase.channel('bets_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, () => { fetchBets(); fetchProfile() })
        .subscribe()

      const notifsChannel = supabase.channel('notifs_channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, () => fetchNotifications())
        .subscribe()

      return () => { betsChannel.unsubscribe(); notifsChannel.unsubscribe() }
    }
  }, [session])

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) {
      setProfile(data)
      if (!withdrawPhone) setWithdrawPhone('Registered Number')
    }
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

  const fetchNotifications = async () => {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    setNotifications(data || [])
  }

  const markNotificationsAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
  }

  const handleAirdrop = async () => {
    if (!profile) return
    if (profile.wallet_balance >= 10000) return showToast("You already have sufficient testnet liquidity.", "error")

    setShowCashierModal({ type: 'deposit', status: 'processing' })
    setTimeout(async () => {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance + 10000 }).eq('id', session.user.id)
      await supabase.from('notifications').insert({ user_id: session.user.id, message: `Airdrop of 10,000 PTZ claimed.`, type: 'deposit', is_read: false })
      fetchProfile()
      fetchNotifications()
      setShowCashierModal({ type: 'deposit', status: 'success' })
    }, 2000)
  }

  const handleWithdraw = async () => {
    if (withdrawAmount < 100) return showToast("Minimum withdrawal is 100 PTZ.")
    if (profile && withdrawAmount > profile.wallet_balance) return showToast("Insufficient available liquidity.")
    setShowCashierModal({ type: 'withdraw', status: 'processing' })
    setTimeout(async () => {
      if (profile) {
        await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - withdrawAmount }).eq('id', session.user.id)
        await supabase.from('notifications').insert({ user_id: session.user.id, message: `Withdrawal of ${withdrawAmount} PTZ initiated.`, type: 'withdrawal', is_read: false })
        fetchProfile()
        fetchNotifications()
        setShowCashierModal({ type: 'withdraw', status: 'success' })
        setWithdrawAmount(0)
      }
    }, 2500)
  }

  const placeBet = async () => {
    if (!selectedOutcome || !session?.user || !profile) return
    if (profile.wallet_balance < stakeAmount) return showToast('Insufficient balance for this transaction.')
    if (stakeAmount < MIN_STAKE) return showToast(`Minimum accepted stake is ${MIN_STAKE} PTZ.`)

    const event = events.find(e => e.id === selectedOutcome.eventId)
    const outcomeName = event?.outcomes[selectedOutcome.idx] || 'Unknown Outcome'
    const oddsPercent = getOdds(selectedOutcome.eventId, selectedOutcome.idx)
    const payoutInfo = calculatePayout(oddsPercent, stakeAmount)

    const { error } = await supabase.from('bets').insert({
      event_id: selectedOutcome.eventId, outcome_index: selectedOutcome.idx, stake: stakeAmount, odds: payoutInfo.oddsDecimal, status: 'open', user_id: session.user.id
    })

    if (!error) {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - stakeAmount }).eq('id', session.user.id)
      setLastBetDetails({ stake: stakeAmount, payout: payoutInfo.net, outcomeName })
      setShowSuccessModal(true)
      setSelectedOutcome(null)
      setStakeAmount(MIN_STAKE)
      fetchBets()
      fetchProfile()
    } else {
      showToast('Network error placing wager.')
    }
  }

  const submitP2POffer = async () => {
    if (!p2pSelectedEventId || !session?.user || !profile) return
    if (profile.wallet_balance < p2pStake) return showToast('Insufficient balance for this transaction.')
    if (p2pStake < MIN_STAKE) return showToast(`Minimum accepted stake is ${MIN_STAKE} PTZ.`)

    const event = events.find(e => e.id === p2pSelectedEventId)
    const outcomeName = event?.outcomes[p2pSelectedOutcomeIdx] || 'Unknown Outcome'
    const grossPayout = p2pStake * p2pOdds
    const netPayout = Math.round(grossPayout - (grossPayout * (PLATFORM_FEE_PERCENT / 100)))

    const { error } = await supabase.from('bets').insert({
      event_id: p2pSelectedEventId, outcome_index: p2pSelectedOutcomeIdx, stake: p2pStake, odds: p2pOdds, status: 'p2p_open', user_id: session.user.id
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
    } else {
      showToast('Error pushing offer to exchange.')
    }
  }

  const initiateMatch = (offer: Bet) => {
    if (!session?.user || !profile) return
    if (offer.user_id === session.user.id) return showToast("Protocol restricts matching your own liquidity.")
    const liability = Math.round((offer.stake * (offer.odds || 2)) - offer.stake)
    if (profile.wallet_balance < liability) return showToast(`Insufficient funds. You need ${liability.toLocaleString()} PTZ to cover liability.`)
    setOfferToMatch(offer)
  }

  const confirmMatch = async () => {
    if (!offerToMatch || !session?.user || !profile) return
    const liability = Math.round((offerToMatch.stake * (offerToMatch.odds || 2)) - offerToMatch.stake)

    setBets(currentBets => currentBets.map(b => b.id === offerToMatch.id ? { ...b, status: 'p2p_matched', matcher_id: session.user.id } : b))
    setProfile({ ...profile, wallet_balance: profile.wallet_balance - liability })
    setOfferToMatch(null)

    const { error: betError } = await supabase.from('bets').update({ status: 'p2p_matched', matcher_id: session.user.id }).eq('id', offerToMatch.id)
    if (betError) return showToast('Network error securing match.')
    
    await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - liability }).eq('id', session.user.id)

    const event = events.find(e => e.id === offerToMatch.event_id)
    await supabase.from('notifications').insert({
      user_id: offerToMatch.user_id, message: `Someone matched your ${offerToMatch.odds}x offer on ${event?.title || 'a market'}!`, type: 'p2p_matched', is_read: false
    })
    showToast('Match secured successfully.', 'success')
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
  
  const myPendingOffers = bets.filter(b => b.user_id === session?.user?.id && b.status === 'p2p_open')
  const myActiveWagers = bets.filter(b => (b.user_id === session?.user?.id || b.matcher_id === session?.user?.id) && b.status !== 'p2p_open')
  const unreadCount = notifications.filter(n => !n.is_read).length
  const ledgerTransactions = notifications.filter(n => ['deposit', 'withdrawal', 'payout', 'refund'].includes(n.type))

  let totalActiveStake = 0
  let totalEstPayout = 0

  myPendingOffers.forEach(bet => { totalActiveStake += bet.stake })

  myActiveWagers.forEach(bet => {
    const isMatcher = bet.matcher_id === session?.user?.id
    if (bet.status === 'p2p_matched') {
      const gross = bet.stake * (bet.odds || 2)
      totalEstPayout += Math.round(gross - (gross * (PLATFORM_FEE_PERCENT / 100)))
      totalActiveStake += isMatcher ? Math.round(gross - bet.stake) : bet.stake
    } else {
      const payoutInfo = calculatePayout(getOdds(bet.event_id, bet.outcome_index), bet.stake)
      totalActiveStake += bet.stake
      totalEstPayout += payoutInfo.net
    }
  })

  if (!session) return <Landing />
  
  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-trading-grid opacity-10 animate-pan-grid pointer-events-none"></div>
      <div className="w-16 h-16 border-2 border-[#C5A880]/20 border-t-[#C5A880] rounded-full animate-spin mb-6 relative z-10 shadow-[0_0_15px_rgba(197,168,128,0.3)]"></div>
      <p className="text-[#C5A880] font-mono text-xs tracking-[0.3em] uppercase animate-pulse relative z-10">Syncing Ledger...</p>
      <style dangerouslySetInnerHTML={{__html: `
        .bg-trading-grid { background-size: 40px 40px; background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px); }
        @keyframes pan-grid { 0% { transform: translateY(0); } 100% { transform: translateY(40px); } }
        .animate-pan-grid { animation: pan-grid 3s linear infinite; }
      `}} />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#C5A880]/20 font-sans relative pb-20">

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl ${
            toast.type === 'error' ? 'bg-[#f43f5e]/10 border-[#f43f5e]/30 text-[#f43f5e]' : 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]'
          }`}>
            {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="font-semibold text-sm tracking-wide">{toast.msg}</span>
          </div>
        </div>
      )}

      <header className="border-b border-[#ffffff0a] bg-[#0a0a0a]/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight cursor-pointer flex items-center gap-2" onClick={() => setActiveView('markets')}>
            Parlayz<span className="text-[#C5A880]">Market</span>
          </h1>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <button onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) markNotificationsAsRead(); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#111111] border border-[#ffffff10] hover:border-[#C5A880]/50 text-gray-400 hover:text-[#C5A880] transition relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#A3885C] rounded-full animate-pulse shadow-[0_0_5px_rgba(163,136,92,0.8)]"></span>}
              </button>
              
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setShowNotifications(false)}></div>
                  <div className="fixed left-4 right-4 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-80 bg-[#111111] border border-[#ffffff15] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50">
                    <div className="p-4 border-b border-[#ffffff0a] bg-[#0a0a0a] flex justify-between items-center"><h4 className="font-bold text-[#C5A880]">Notifications</h4></div>
                    <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">No new notifications.</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`p-4 border-b border-[#ffffff05] text-sm ${!n.is_read ? 'bg-[#C5A880]/5' : 'bg-transparent'}`}>
                            <p className="text-gray-300">{n.message}</p>
                            <span className="text-xs text-gray-600 mt-2 block">{new Date(n.created_at).toLocaleDateString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button onClick={() => setActiveView('wallet')} className="bg-[#111111] hover:bg-[#1a1a1a] border border-[#ffffff10] hover:border-[#C5A880]/50 rounded-xl px-3 sm:px-4 py-1.5 flex items-center gap-2 shadow-inner transition group">
              <Wallet className="w-4 h-4 text-[#C5A880] group-hover:scale-110 transition" />
              <span className="font-bold text-sm sm:text-base">{profile?.wallet_balance.toLocaleString() || '0'}</span>
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider hidden sm:inline">PTZ</span>
            </button>

            <button onClick={() => setShowLogoutModal(true)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#111111] border border-[#ffffff10] hover:border-red-500/30 hover:text-red-400 text-gray-400 transition" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 mt-1">
          <div className="flex items-center gap-6 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <button onClick={() => { setActiveView('wagers'); setSelectedOutcome(null) }} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'wagers' ? 'text-[#C5A880] border-[#C5A880]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${activeView === 'wagers' ? 'bg-[#C5A880] animate-pulse' : 'bg-gray-600'}`}></span> My Wagers
            </button>
            <button onClick={() => { setActiveView('p2p'); setSelectedOutcome(null) }} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'p2p' ? 'text-[#C5A880] border-[#C5A880]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
              🤝 P2P Board
            </button>
            <div className="w-px h-4 bg-[#ffffff15]"></div> 
            {categories.map((cat) => (
              <button key={cat} onClick={() => { setActiveView('markets'); setActiveCategory(cat); setSelectedOutcome(null) }} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 ${activeView === 'markets' && activeCategory === cat ? 'text-[#C5A880] border-[#C5A880]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
                {cat === 'All' ? 'Trending' : cat}
              </button>
            ))}
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {activeView === 'wallet' ? (
          <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-white mb-6">Cashier & Ledger</h2>
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#ffffff15] rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A880]/5 rounded-full blur-[80px]"></div>
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-2 relative z-10 flex items-center gap-2">Available Liquidity</p>
              <h1 className="text-5xl font-extrabold text-white mb-1 relative z-10 tracking-tight">
                {profile?.wallet_balance.toLocaleString()} <span className="text-2xl text-[#C5A880]">PTZ</span>
              </h1>
              <p className="text-gray-500 text-sm relative z-10 font-light mt-1">Free testnet capital available for wagers.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-10">
              
              <div className="bg-[#111111] border border-[#ffffff10] rounded-2xl p-6 relative overflow-hidden group hover:border-[#10b981]/30 transition">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-3xl group-hover:bg-[#10b981]/10 transition"></div>
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center border border-[#10b981]/20 group-hover:bg-[#10b981]/20 transition"><ArrowDownToLine className="w-5 h-5 text-[#10b981]" /></div>
                  <h3 className="text-lg font-bold">Testnet Faucet</h3>
                </div>
                <div className="space-y-4 relative z-10">
                  <p className="text-sm text-gray-400 font-light mb-4">Claim your starting capital of 10,000 PTZ (Parlayz Testnet Tokens) to trade on the MVP network this weekend.</p>
                  <button onClick={handleAirdrop} className="w-full bg-[#10b981]/10 border border-[#10b981]/30 hover:bg-[#10b981] text-[#10b981] hover:text-[#0a0a0a] font-bold py-3.5 rounded-xl transition shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    Claim 10,000 PTZ Airdrop
                  </button>
                </div>
              </div>

              <div className="bg-[#111111] border border-[#ffffff10] rounded-2xl p-6 relative overflow-hidden group hover:border-[#C5A880]/30 transition">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-[#C5A880]/10 flex items-center justify-center border border-[#C5A880]/20 group-hover:bg-[#C5A880]/20 transition"><ArrowUpFromLine className="w-5 h-5 text-[#C5A880]" /></div>
                  <h3 className="text-lg font-bold">Withdraw</h3>
                </div>
                <div className="space-y-4 relative z-10">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Destination Number</label>
                    <input type="tel" value={withdrawPhone} onChange={e => setWithdrawPhone(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-gray-300 rounded-xl p-3 focus:outline-none focus:border-[#C5A880] transition font-medium" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount (PTZ)</label>
                      <span className="text-xs text-gray-600 font-medium">Available: {profile?.wallet_balance.toLocaleString()}</span>
                    </div>
                    <input type="number" placeholder="0" value={withdrawAmount || ''} onChange={e => setWithdrawAmount(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-xl p-3 focus:outline-none focus:border-[#C5A880] transition font-bold text-white" />
                  </div>
                  <button onClick={handleWithdraw} className="w-full bg-[#C5A880]/10 border border-[#C5A880]/30 hover:bg-[#C5A880] text-[#C5A880] hover:text-[#0a0a0a] font-bold py-3.5 rounded-xl transition shadow-[0_0_15px_rgba(197,168,128,0.1)] hover:shadow-[0_0_20px_rgba(197,168,128,0.3)]">Request Payout</button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-bold text-white">Transaction Ledger</h3>
              </div>
              <div className="bg-[#111111] border border-[#ffffff10] rounded-2xl overflow-hidden">
                {ledgerTransactions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 font-light">No financial transactions recorded yet.</div>
                ) : (
                  <div className="divide-y divide-[#ffffff0a]">
                    {ledgerTransactions.map((tx) => {
                      const isPositive = ['deposit', 'payout', 'refund'].includes(tx.type)
                      return (
                        <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-[#1a1a1a] transition">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isPositive ? 'bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]' : 'bg-[#f43f5e]/10 border-[#f43f5e]/20 text-[#f43f5e]'}`}>
                              {isPositive ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-white font-semibold text-sm sm:text-base">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</p>
                              <p className="text-gray-500 text-xs mt-0.5">{new Date(tx.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${isPositive ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                              {isPositive ? '+' : '-'}{tx.message.match(/\d+/) ? tx.message.match(/\d+/)?.[0] : ''} PTZ
                            </p>
                            <p className="text-gray-600 text-xs font-mono mt-0.5">TxID: {tx.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

        ) : activeView === 'p2p' ? (
          
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111111] border border-[#C5A880]/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(197,168,128,0.05)] gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Peer-to-Peer Exchange</h3>
                <p className="text-gray-400 text-sm font-light">Lock in fixed odds or deploy custom liquidity to the board.</p>
              </div>
              <button onClick={() => setShowCreateOfferModal(true)} className="bg-[#C5A880] hover:bg-[#E8D4B0] text-[#0a0a0a] font-bold py-3 px-6 rounded-xl transition shadow-[0_0_15px_rgba(197,168,128,0.2)] w-full sm:w-auto">
                + Create Offer
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {bets.filter(b => b.status === 'p2p_open').length === 0 ? (
                <div className="col-span-full py-16 text-center text-gray-500 border border-dashed border-[#ffffff10] rounded-2xl">
                  No open market offers. Be the first to provide liquidity!
                </div>
              ) : (
                bets.filter(b => b.status === 'p2p_open').map((offer, i) => {
                  const event = events.find(e => e.id === offer.event_id)
                  if (!event) return null
                  const outcomeName = event.outcomes[offer.outcome_index]
                  const liability = Math.round((offer.stake * (offer.odds || 2)) - offer.stake)
                  const isOwnOffer = offer.user_id === session?.user?.id

                  return (
                    <div key={i} className="bg-[#111111] border border-[#ffffff10] rounded-2xl p-6 hover:border-[#C5A880]/40 transition relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A880]/5 rounded-full blur-3xl group-hover:bg-[#C5A880]/10 transition"></div>
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="text-xs font-semibold text-[#C5A880] uppercase tracking-wider bg-[#C5A880]/10 border border-[#C5A880]/20 px-2 py-1 rounded-md">{event.category}</span>
                        <span className="text-xs text-gray-500 border border-[#ffffff10] px-2 py-1 rounded uppercase">P2P Escrow</span>
                      </div>
                      <h4 className="text-white font-bold mb-3 line-clamp-2 relative z-10">{event.title}</h4>
                      <div className="bg-[#0a0a0a] rounded-lg p-3 mb-5 border border-[#ffffff0a] relative z-10">
                        <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Their Prediction</div>
                        <div className="text-white font-medium">{outcomeName}</div>
                      </div>
                      <div className="space-y-2 mb-5 relative z-10">
                        <div className="flex justify-between text-sm text-gray-400"><span>Maker's Stake:</span><span className="text-white font-bold">{offer.stake.toLocaleString()} PTZ</span></div>
                        <div className="flex justify-between text-sm text-gray-400"><span>Requested Odds:</span><span className="text-[#C5A880] font-bold">{offer.odds}x</span></div>
                        <div className="flex justify-between text-sm pt-2 border-t border-[#ffffff10] mt-2"><span className="text-gray-500 font-semibold">Your Risk (Liability):</span><span className="text-[#f43f5e] font-bold">{liability.toLocaleString()} PTZ</span></div>
                      </div>
                      <button onClick={() => initiateMatch(offer)} disabled={isOwnOffer} className={`w-full font-bold py-3.5 rounded-xl transition relative z-10 ${isOwnOffer ? 'bg-[#0a0a0a] text-gray-600 border border-[#ffffff10] cursor-not-allowed' : 'bg-[#1a1a1a] hover:bg-[#C5A880] hover:text-[#0a0a0a] text-white border border-[#ffffff15] hover:border-[#C5A880] hover:shadow-[0_0_20px_rgba(197,168,128,0.3)]'}`}>
                        {isOwnOffer ? 'Waiting for Taker...' : 'Match Offer'}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        ) : activeView === 'wagers' ? (
          
          <div className="space-y-10 animate-in fade-in duration-300">
            
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
              <div className="bg-[#111111] border border-[#ffffff10] rounded-2xl p-5 sm:p-6 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2 opacity-70">
                  <PieChart className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Total Active Risk</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{totalActiveStake.toLocaleString()} <span className="text-base font-medium text-gray-500">PTZ</span></p>
              </div>
              <div className="bg-[#111111] border border-[#C5A880]/30 rounded-2xl p-5 sm:p-6 relative overflow-hidden flex flex-col justify-center shadow-[0_0_30px_rgba(197,168,128,0.05)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A880]/10 rounded-full blur-2xl"></div>
                <p className="text-[#C5A880] text-xs font-semibold uppercase tracking-widest mb-2 relative z-10 flex items-center gap-2">Max Est. Return</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#C5A880] relative z-10 tracking-tight">{totalEstPayout.toLocaleString()} <span className="text-base font-medium text-[#C5A880]/70">PTZ</span></p>
              </div>
            </div>

            {myPendingOffers.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] animate-pulse"></span> My Open P2P Offers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {myPendingOffers.reverse().map((bet, i) => {
                    const event = events.find(e => e.id === bet.event_id)
                    if (!event) return null
                    return (
                      <div key={i} className="bg-[#111111] border border-[#C5A880]/30 rounded-2xl p-5 opacity-80 hover:opacity-100 transition relative overflow-hidden">
                        <div className="flex items-start justify-between mb-4">
                          <span className="text-xs font-semibold text-[#C5A880] uppercase tracking-wider bg-[#C5A880]/10 border border-[#C5A880]/20 px-2 py-1 rounded-md">{event.category}</span>
                          <span className="text-xs px-2 py-1 rounded bg-[#0a0a0a] border border-[#C5A880]/50 text-[#C5A880] uppercase tracking-wide">Listed</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-4">{event.title}</h3>
                        <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#ffffff0a] mb-4">
                          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Your Prediction</div>
                          <div className="text-white font-medium">{event.outcomes[bet.outcome_index]}</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-gray-400"><span>Your Stake:</span><span className="text-white">{bet.stake.toLocaleString()} PTZ</span></div>
                          <div className="flex justify-between text-gray-400"><span>Requested Odds:</span><span className="text-[#C5A880]">{bet.odds}x</span></div>
                          <div className="flex justify-between font-bold pt-3 border-t border-[#ffffff10] mt-3">
                            <span className="text-gray-500">Total Pot:</span><span className="text-white">{(bet.stake * (bet.odds || 2)).toLocaleString()} PTZ</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Locked Active Wagers</h3>
              {myActiveWagers.length === 0 ? (
                <div className="py-16 text-center text-gray-500 flex flex-col items-center border border-dashed border-[#ffffff10] rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-[#111111] border border-[#ffffff10] flex items-center justify-center mb-4"><span className="text-2xl opacity-50">💸</span></div>
                  <p>No active wagers right now.</p>
                  <button onClick={() => setActiveView('markets')} className="mt-4 text-[#C5A880] hover:text-[#E8D4B0] font-semibold">Explore Markets →</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {myActiveWagers.reverse().map((bet, i) => {
                    const event = events.find(e => e.id === bet.event_id)
                    if (!event) return null
                    const outcomeName = event.outcomes[bet.outcome_index] || 'Unknown'
                    const isMatcher = bet.matcher_id === session?.user?.id
                    
                    let currentOddsMultiplier: string | number = bet.odds || 2.0
                    let estNetPayout = 0
                    let displayStake = bet.stake

                    if (bet.status === 'p2p_matched') {
                      const gross = bet.stake * (bet.odds || 2)
                      estNetPayout = Math.round(gross - (gross * (PLATFORM_FEE_PERCENT / 100)))
                      if (isMatcher) displayStake = Math.round(gross - bet.stake)
                    } else {
                      const payoutInfo = calculatePayout(getOdds(event.id, bet.outcome_index), bet.stake)
                      currentOddsMultiplier = payoutInfo.odds
                      estNetPayout = payoutInfo.net
                    }

                    return (
                      <div key={i} className={`bg-[#111111] border rounded-2xl p-5 transition relative overflow-hidden ${bet.status === 'p2p_matched' ? 'border-[#C5A880]/40' : 'border-[#ffffff10] hover:border-[#C5A880]/50'}`}>
                        {bet.status === 'p2p_matched' && <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A880]/5 rounded-full blur-3xl"></div>}
                        <div className="flex items-start justify-between mb-4 relative z-10">
                          <span className="text-xs font-semibold text-[#C5A880] uppercase tracking-wider bg-[#C5A880]/10 border border-[#C5A880]/20 px-2 py-1 rounded-md">{event.category}</span>
                          <span className={`text-xs px-2 py-1 rounded bg-[#0a0a0a] border uppercase tracking-wide ${bet.status === 'p2p_matched' ? 'border-[#C5A880]/50 text-[#C5A880]' : 'border-[#ffffff10] text-gray-400'}`}>
                            {isMatcher ? 'P2P Taker' : bet.status === 'p2p_matched' ? 'P2P Maker' : 'Pool Bet'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-4 relative z-10">{event.title}</h3>
                        <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#ffffff0a] mb-4 relative z-10">
                          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">{isMatcher ? 'You bet AGAINST' : 'Your Prediction'}</div>
                          <div className="text-white font-medium">{outcomeName}</div>
                        </div>
                        <div className="space-y-2 text-sm relative z-10">
                          <div className="flex justify-between text-gray-400"><span>{isMatcher ? 'Your Risk:' : 'Original Stake:'}</span><span className="text-white">{displayStake.toLocaleString()} PTZ</span></div>
                          <div className="flex justify-between text-gray-400"><span>{bet.status === 'p2p_matched' ? 'Locked Odds:' : 'Market Odds:'}</span><span className="text-[#C5A880] font-medium">{currentOddsMultiplier}x</span></div>
                          <div className="flex justify-between font-bold pt-3 border-t border-[#ffffff10] mt-3"><span className="text-[#C5A880]">Est. Payout:</span><span className="text-[#C5A880] text-lg">{estNetPayout.toLocaleString()} PTZ</span></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        ) : (
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredEvents.length === 0 ? (
              <div className="col-span-full py-10 text-center text-gray-500">No live markets in this category yet.</div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="bg-[#111111] border border-[#ffffff10] rounded-2xl p-5 sm:p-6 hover:border-[#C5A880]/50 transition">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <span className="text-xs font-semibold text-[#C5A880] uppercase tracking-wider bg-[#C5A880]/10 border border-[#C5A880]/20 px-2 py-1 rounded-md">{event.category}</span>
                    <span className="text-xs text-gray-500">{new Date(event.closes_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                  <p className="text-gray-400 text-sm mb-5 line-clamp-2 font-light">{event.description}</p>
                  <div className="space-y-3">
                    {event.outcomes.map((outcome, idx) => {
                      const oddsPercent = getOdds(event.id, idx)
                      const payout = calculatePayout(oddsPercent, stakeAmount)
                      const isSelected = selectedOutcome?.eventId === event.id && selectedOutcome?.idx === idx
                      return (
                        <div key={idx} className="space-y-2">
                          <button onClick={() => { setSelectedOutcome({eventId: event.id, idx}); setStakeAmount(MIN_STAKE) }} className={`w-full flex items-center justify-between rounded-xl px-4 py-3 transition border group ${isSelected ? 'bg-[#C5A880]/10 border-[#C5A880]' : 'bg-[#0a0a0a] border-[#ffffff10] hover:border-[#C5A880]/50'}`}>
                            <span className={`font-medium text-sm sm:text-base ${isSelected ? 'text-[#C5A880]' : 'text-white'}`}>{outcome}</span>
                            <div className="flex items-center gap-3">
                              <div className="hidden sm:block w-12 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden"><div className="h-full bg-[#C5A880]/30" style={{ width: `${oddsPercent}%` }} /></div>
                              <span className={`font-bold text-sm sm:text-base px-3 py-1 rounded-lg border transition ${isSelected ? 'bg-[#C5A880] text-[#0a0a0a] border-[#C5A880] shadow-[0_0_15px_rgba(197,168,128,0.4)]' : 'bg-[#1a1a1a] text-[#C5A880] border-[#ffffff15] group-hover:border-[#C5A880]/50'}`}>
                                {payout.odds}x
                              </span>
                            </div>
                          </button>
                          {isSelected && (
                            <div className="bg-[#0a0a0a] rounded-xl p-4 text-sm space-y-4 border border-[#C5A880]/30 mt-2 shadow-inner">
                              <div className="bg-[#111111] p-3 rounded-xl border border-[#ffffff0a]">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-gray-400">Wager Amount</span>
                                  <div className="flex items-center">
                                    <input type="number" value={stakeAmount || ''} onChange={(e) => setStakeAmount(Number(e.target.value))} className="bg-transparent text-[#C5A880] font-bold text-right w-20 focus:outline-none text-base" min={MIN_STAKE} />
                                    <span className="text-gray-500 ml-1">PTZ</span>
                                  </div>
                                </div>
                                <input type="range" min={MIN_STAKE} max={profile?.wallet_balance ? Math.max(profile.wallet_balance, 1000) : 10000} step="100" value={stakeAmount} onChange={(e) => setStakeAmount(Number(e.target.value))} className="w-full h-1 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-[#C5A880]" />
                              </div>
                              <div className="space-y-1.5 px-1 font-light">
                                <div className="flex justify-between text-gray-400"><span>Pool Odds:</span><span className="text-white">{payout.odds}x</span></div>
                                <div className="flex justify-between text-gray-400"><span>Gross Payout:</span><span className="text-white">{payout.gross.toLocaleString()}</span></div>
                                <div className="flex justify-between text-[#f43f5e]"><span>Fee ({PLATFORM_FEE_PERCENT}%):</span><span>-{payout.fee.toLocaleString()}</span></div>
                                <div className="flex justify-between text-[#C5A880] font-bold pt-2 border-t border-[#ffffff10] mt-2"><span>You Receive:</span><span className="text-lg">{payout.net.toLocaleString()} PTZ</span></div>
                              </div>
                              <button onClick={placeBet} disabled={!profile || profile.wallet_balance < stakeAmount || stakeAmount < MIN_STAKE} className="w-full bg-[#C5A880] hover:bg-[#A3885C] disabled:bg-[#1a1a1a] disabled:text-gray-600 text-[#0a0a0a] font-bold py-3.5 rounded-xl transition shadow-[0_0_15px_rgba(197,168,128,0.2)] mt-2">
                                {!profile ? 'Loading...' : profile.wallet_balance < stakeAmount ? 'Insufficient Balance' : 'Confirm Wager'}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {showCashierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`bg-[#111111] border rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center relative overflow-hidden shadow-2xl ${showCashierModal.type === 'deposit' ? 'border-[#10b981]/30' : 'border-[#C5A880]/30'}`}>
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl pointer-events-none ${showCashierModal.type === 'deposit' ? 'bg-[#10b981]/10' : 'bg-[#C5A880]/10'}`}></div>
            <div className="relative z-10">
              {showCashierModal.status === 'processing' ? (
                <>
                  <div className="w-16 h-16 bg-[#1a1a1a] border border-[#ffffff15] rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${showCashierModal.type === 'deposit' ? 'border-[#10b981]' : 'border-[#C5A880]'}`}></div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{showCashierModal.type === 'deposit' ? 'Awaiting Protocol' : 'Processing Request'}</h3>
                  <p className="text-gray-400 text-sm mb-2 font-light">{showCashierModal.type === 'deposit' ? 'Securing your testnet liquidity from the faucet...' : 'Securing your withdrawal request on the ledger...'}</p>
                </>
              ) : (
                <>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border ${showCashierModal.type === 'deposit' ? 'bg-[#10b981]/10 border-[#10b981]/40 text-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#C5A880]/10 border-[#C5A880]/40 text-[#C5A880] shadow-[0_0_15px_rgba(197,168,128,0.2)]'}`}><CheckCircle2 className="w-8 h-8" /></div>
                  <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Transaction Successful</h3>
                  <p className="text-gray-400 text-sm mb-6 font-light">{showCashierModal.type === 'deposit' ? 'Your testnet liquidity has been added to your wallet.' : 'Your payout request has been queued.'}</p>
                  <button onClick={() => setShowCashierModal(null)} className="w-full bg-[#1a1a1a] hover:bg-[#222222] border border-[#ffffff10] text-white font-bold py-3.5 rounded-xl transition">Return to Ledger</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-[#C5A880]/30 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-[0_0_50px_rgba(197,168,128,0.15)] relative">
            <button onClick={() => setShowCreateOfferModal(false)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-xl bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#ffffff10]"><X className="w-4 h-4" /></button>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Create P2P Offer</h3>
            <p className="text-gray-400 text-sm mb-6 font-light">Dictate your odds. Await market execution.</p>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">1. Select Market</label>
                <select className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-white rounded-xl p-3.5 focus:outline-none focus:border-[#C5A880]" value={p2pSelectedEventId} onChange={(e) => { setP2pSelectedEventId(e.target.value); setP2pSelectedOutcomeIdx(0) }}>
                  <option value="" disabled>Choose active market...</option>
                  {events.map(e => (<option key={e.id} value={e.id}>{e.title}</option>))}
                </select>
              </div>
              {p2pSelectedEventId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">2. Your Position</label>
                  <div className="grid grid-cols-2 gap-2">
                    {events.find(e => e.id === p2pSelectedEventId)?.outcomes.map((outcome, idx) => (
                      <button key={idx} onClick={() => setP2pSelectedOutcomeIdx(idx)} className={`p-2.5 rounded-xl border text-sm font-medium transition ${p2pSelectedOutcomeIdx === idx ? 'bg-[#C5A880]/10 border-[#C5A880] text-[#C5A880]' : 'bg-[#0a0a0a] border-[#ffffff15] text-gray-400 hover:border-gray-500'}`}>{outcome}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Stake (PTZ)</label>
                  <input type="number" min={MIN_STAKE} value={p2pStake || ''} onChange={(e) => setP2pStake(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-white font-bold rounded-xl p-3.5 focus:outline-none focus:border-[#C5A880]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Odds (x)</label>
                  <input type="number" min="1.01" step="0.01" value={p2pOdds || ''} onChange={(e) => setP2pOdds(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-[#C5A880] font-bold rounded-xl p-3.5 focus:outline-none focus:border-[#C5A880]" />
                </div>
              </div>
              <div className="bg-[#0a0a0a] rounded-xl p-4 text-sm space-y-2 border border-[#ffffff0a] mt-2 font-light">
                <div className="flex justify-between text-gray-400"><span>Gross Output:</span><span>{Math.round(p2pStake * p2pOdds).toLocaleString()} PTZ</span></div>
                <div className="flex justify-between text-[#C5A880] font-bold pt-2 border-t border-[#ffffff10] mt-2"><span>Net Profit:</span><span>{Math.round((p2pStake * p2pOdds) * (1 - PLATFORM_FEE_PERCENT/100)).toLocaleString()} PTZ</span></div>
              </div>
              <button onClick={submitP2POffer} disabled={!p2pSelectedEventId || p2pStake < MIN_STAKE || p2pOdds <= 1} className="w-full bg-[#C5A880] hover:bg-[#A3885C] disabled:bg-[#1a1a1a] disabled:text-gray-600 text-[#0a0a0a] font-bold py-4 rounded-xl transition shadow-[0_0_20px_rgba(197,168,128,0.2)] mt-2">Push to Exchange</button>
            </div>
          </div>
        </div>
      )}

      {offerToMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-[#C5A880]/40 rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(197,168,128,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#C5A880]/10 border border-[#C5A880]/30 text-[#C5A880] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_15px_rgba(197,168,128,0.15)]"><AlertTriangle className="w-8 h-8" /></div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Lock Liability</h3>
              <p className="text-gray-400 text-sm mb-6 font-light">You are acting as the counterparty.</p>
              <div className="bg-[#0a0a0a] rounded-xl p-5 mb-6 text-left border border-[#ffffff10]">
                <div className="flex justify-between items-center text-sm mb-3"><span className="text-gray-500">Capital Risked:</span><span className="text-[#f43f5e] font-bold">{Math.round((offerToMatch.stake * (offerToMatch.odds || 2)) - offerToMatch.stake).toLocaleString()} PTZ</span></div>
                <div className="flex justify-between items-center text-sm pt-3 border-t border-[#ffffff10]"><span className="text-gray-500">Max Return:</span><span className="text-[#C5A880] font-bold text-lg">{offerToMatch.stake.toLocaleString()} PTZ</span></div>
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setOfferToMatch(null)} className="w-1/2 bg-[#1a1a1a] hover:bg-[#222222] border border-[#ffffff10] text-white font-semibold py-3.5 rounded-xl transition">Cancel</button>
                <button onClick={confirmMatch} className="w-1/2 bg-[#C5A880] hover:bg-[#A3885C] text-[#0a0a0a] font-bold py-3.5 rounded-xl transition shadow-[0_0_15px_rgba(197,168,128,0.2)]">Execute</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && lastBetDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-[#10b981]/30 rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#10b981]/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#10b981]/10 border border-[#10b981]/40 text-[#10b981] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"><CheckCircle2 className="w-8 h-8" /></div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Contract Secured</h3>
              <p className="text-gray-400 text-sm mb-6 font-light">Your position is locked on the network.</p>
              <div className="bg-[#0a0a0a] rounded-xl p-5 mb-6 text-left border border-[#ffffff10]">
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Prediction</div>
                <div className="text-white font-medium mb-4 line-clamp-1">{lastBetDetails.outcomeName}</div>
                <div className="flex justify-between items-center text-sm mb-3"><span className="text-gray-500">Stake Placed:</span><span className="text-white font-bold">{lastBetDetails.stake.toLocaleString()} PTZ</span></div>
                <div className="flex justify-between items-center text-sm pt-3 border-t border-[#ffffff10]"><span className="text-gray-500">To Win:</span><span className="text-[#10b981] font-bold text-lg">{lastBetDetails.payout.toLocaleString()} PTZ</span></div>
              </div>
              <button onClick={() => setShowSuccessModal(false)} className="w-full bg-[#1a1a1a] hover:bg-[#222222] border border-[#ffffff10] text-white font-bold py-3.5 rounded-xl transition">Return to Terminal</button>
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-[#ffffff15] rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#f43f5e]/10 border border-[#f43f5e]/30 text-[#f43f5e] rounded-2xl flex items-center justify-center mx-auto mb-5"><LogOut className="w-7 h-7 ml-1" /></div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Disconnect?</h3>
              <p className="text-gray-400 text-sm mb-8 font-light">Securely close your terminal session.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowLogoutModal(false)} className="w-1/2 bg-[#1a1a1a] hover:bg-[#222222] border border-[#ffffff10] text-white font-semibold py-3.5 rounded-xl transition">Cancel</button>
                <button onClick={handleLogout} className="w-1/2 bg-[#f43f5e]/10 border border-[#f43f5e]/30 hover:bg-[#f43f5e] text-[#f43f5e] hover:text-white font-bold py-3.5 rounded-xl transition">Disconnect</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
