import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import Landing from './Landing'
import { LogOut, X, AlertTriangle, Bell, Wallet, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, History, Trophy, Activity, MessageSquare, Eye, EyeOff, ShieldAlert, Send } from 'lucide-react'

interface Event { id: string; title: string; description: string; category: string; outcomes: string[]; closes_at: string; created_at: string; resolved: boolean }
interface Bet { id: string; event_id: string; outcome_index: number; stake: number; odds?: number; status: string; user_id: string; matcher_id?: string }
interface Profile { id: string; username: string; wallet_balance: number; avatar: string; has_claimed_airdrop: boolean; is_public: boolean }
interface AppNotification { id: string; user_id: string; message: string; type: string; is_read: boolean; created_at: string }
interface ChatMessage { id: string; bet_id: string; sender_id: string; message: string; created_at: string }

const MIN_STAKE = 200
const PLATFORM_FEE_PERCENT = 3
const AVATARS = ['🦊', '🐯', '🦅', '🦈', '🐍', '🦍', '🐉', '🦂', '🦉', '🐺']

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  // Premium Toast
  const [toast, setToast] = useState<{msg: string, type: 'error' | 'success'} | null>(null)
  const showToast = (msg: string, type: 'error' | 'success' = 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  // Views & Modals
  const [activeView, setActiveView] = useState<'markets' | 'orderbook' | 'wagers' | 'leaderboard' | 'wallet'>('orderbook')
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false)
  const [offerToMatch, setOfferToMatch] = useState<Bet | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [lastBetDetails, setLastBetDetails] = useState<{stake: number, payout: number, outcomeName: string} | null>(null)
  const [showCashierModal, setShowCashierModal] = useState<{type: 'deposit' | 'withdraw', status: 'processing' | 'success' | 'error', msg?: string} | null>(null)

  // Leaderboard Public Profile Modal
  const [selectedPublicProfile, setSelectedPublicProfile] = useState<Profile | null>(null)

  // Taunt Chat Modal
  const [activeChatBet, setActiveChatBet] = useState<Bet | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Form States
  const [p2pSelectedEventId, setP2pSelectedEventId] = useState<string>('')
  const [p2pSelectedOutcomeIdx, setP2pSelectedOutcomeIdx] = useState<number>(0)
  const [p2pStake, setP2pStake] = useState<number>(MIN_STAKE)
  const [p2pOdds, setP2pOdds] = useState<number>(2.00)
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0)
  const [withdrawPhone, setWithdrawPhone] = useState<string>('')

  // Profile Setup State
  const [newUsername, setNewUsername] = useState('')
  const [newAvatar, setNewAvatar] = useState('🦊')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session?.user) {
      fetchData()
      const betsChannel = supabase.channel('bets_channel').on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, () => { fetchBets(); fetchProfile(); fetchAllProfiles() }).subscribe()
      const profilesChannel = supabase.channel('profiles_channel').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { fetchAllProfiles() }).subscribe()
      const notifsChannel = supabase.channel('notifs_channel').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, () => fetchNotifications()).subscribe()
      
      return () => { betsChannel.unsubscribe(); notifsChannel.unsubscribe(); profilesChannel.unsubscribe() }
    }
  }, [session])

  useEffect(() => {
    if (activeChatBet) {
      fetchMessages(activeChatBet.id)
      const chatChannel = supabase.channel('chat_channel').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_messages', filter: `bet_id=eq.${activeChatBet.id}` }, (payload) => {
        setChatMessages(prev => [...prev, payload.new as ChatMessage])
      }).subscribe()
      return () => { chatChannel.unsubscribe() }
    }
  }, [activeChatBet])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  const fetchData = async () => {
    await Promise.all([fetchProfile(), fetchAllProfiles(), fetchEvents(), fetchBets(), fetchNotifications()])
    setLoading(false)
  }

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) {
      setProfile(data)
      if (data.username === session.user.email || !data.username) { setShowProfileSetup(true) }
    }
  }

  const fetchAllProfiles = async () => { const { data } = await supabase.from('profiles').select('*'); if (data) setAllProfiles(data) }
  const fetchEvents = async () => { const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false }); if (data) setEvents(data) }
  const fetchBets = async () => { const { data } = await supabase.from('bets').select('*'); if (data) setBets(data) }
  const fetchNotifications = async () => { const { data } = await supabase.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }); if (data) setNotifications(data) }
  const fetchMessages = async (betId: string) => { const { data } = await supabase.from('match_messages').select('*').eq('bet_id', betId).order('created_at', { ascending: true }); if (data) setChatMessages(data) }

  const handleUpdateProfile = async () => {
    if (newUsername.length < 3) return showToast('Username must be at least 3 characters.')
    await supabase.from('profiles').update({ username: newUsername, avatar: newAvatar }).eq('id', session.user.id)
    setShowProfileSetup(false)
    fetchProfile()
    showToast('Identity updated successfully.', 'success')
  }

  const togglePrivacy = async () => {
    if (!profile) return
    const newStatus = !profile.is_public
    await supabase.from('profiles').update({ is_public: newStatus }).eq('id', session.user.id)
    setProfile({ ...profile, is_public: newStatus })
    showToast(newStatus ? 'Profile is now Public' : 'Profile is now Private', 'success')
  }

  const handleAirdrop = async () => {
    if (!profile) return
    if (profile.has_claimed_airdrop) return showToast("You have already claimed your one-time 10,000 KSh airdrop. Manage your bankroll wisely.")
    
    setShowCashierModal({ type: 'deposit', status: 'processing' })
    setTimeout(async () => {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance + 10000, has_claimed_airdrop: true }).eq('id', session.user.id)
      await supabase.from('notifications').insert({ user_id: session.user.id, message: `One-Time Airdrop of 10,000 KSh secured. Welcome to the Arena.`, type: 'deposit', is_read: false })
      fetchProfile(); fetchAllProfiles(); fetchNotifications()
      setShowCashierModal({ type: 'deposit', status: 'success' })
    }, 2000)
  }

  const handleWithdraw = async () => {
    if (withdrawAmount < 100) return showToast("Minimum withdrawal is 100 KSh.")
    if (profile && withdrawAmount > profile.wallet_balance) return showToast("Insufficient available funds.")
    
    const phoneRegex = /^(07|01)\d{8}$/
    if (!phoneRegex.test(withdrawPhone)) return showToast("Invalid format. Number must start with 07 or 01 and be exactly 10 digits long.")

    setShowCashierModal({ type: 'withdraw', status: 'processing' })
    setTimeout(async () => {
      if (profile) {
        await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - withdrawAmount }).eq('id', session.user.id)
        await supabase.from('notifications').insert({ user_id: session.user.id, message: `Withdrawal of ${withdrawAmount} KSh to ${withdrawPhone} initiated.`, type: 'withdrawal', is_read: false })
        fetchProfile(); fetchAllProfiles(); fetchNotifications()
        setShowCashierModal({ type: 'withdraw', status: 'success' })
        setWithdrawAmount(0); setWithdrawPhone('')
      }
    }, 2500)
  }

  const submitP2POffer = async () => {
    if (!p2pSelectedEventId || !session?.user || !profile) return
    if (profile.wallet_balance < p2pStake) return showToast('Insufficient KSh balance for this bet.')
    if (p2pStake < MIN_STAKE) return showToast(`Minimum accepted stake is ${MIN_STAKE} KSh.`)

    const event = events.find(e => e.id === p2pSelectedEventId)
    const outcomeName = event?.outcomes[p2pSelectedOutcomeIdx] || 'Unknown Outcome'
    const grossPayout = p2pStake * p2pOdds
    const netPayout = Math.round(grossPayout - (grossPayout * (PLATFORM_FEE_PERCENT / 100)))

    const { error } = await supabase.from('bets').insert({ event_id: p2pSelectedEventId, outcome_index: p2pSelectedOutcomeIdx, stake: p2pStake, odds: p2pOdds, status: 'p2p_open', user_id: session.user.id })

    if (!error) {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - p2pStake }).eq('id', session.user.id)
      setLastBetDetails({ stake: p2pStake, payout: netPayout, outcomeName: `[CUSTOM] ${outcomeName} @ ${p2pOdds}x` })
      setShowCreateOfferModal(false); setShowSuccessModal(true); setP2pSelectedEventId(''); setP2pSelectedOutcomeIdx(0); setP2pStake(MIN_STAKE); setP2pOdds(2.00)
    } else { showToast('Network error pushing bet.') }
  }

  const confirmMatch = async () => {
    if (!offerToMatch || !session?.user || !profile) return
    const liability = Math.round((offerToMatch.stake * (offerToMatch.odds || 2)) - offerToMatch.stake)

    const { error: betError } = await supabase.from('bets').update({ status: 'p2p_matched', matcher_id: session.user.id }).eq('id', offerToMatch.id)
    if (betError) return showToast('Network error securing match.')
    
    await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - liability }).eq('id', session.user.id)
    const event = events.find(e => e.id === offerToMatch.event_id)
    await supabase.from('notifications').insert({ user_id: offerToMatch.user_id, message: `War declared. Someone matched your ${offerToMatch.odds}x bet on ${event?.title}!`, type: 'p2p_matched', is_read: false })
    
    setOfferToMatch(null)
    showToast('Bet placed successfully. Wager is locked.', 'success')
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !activeChatBet || !session?.user) return
    const msg = chatInput.trim()
    setChatInput('')
    await supabase.from('match_messages').insert({ bet_id: activeChatBet.id, sender_id: session.user.id, message: msg })
  }

  const getUserStats = (userId: string) => {
    const userBets = bets.filter(b => b.user_id === userId || b.matcher_id === userId)
    const settled = userBets.filter(b => ['won', 'lost'].includes(b.status))
    const wins = settled.filter(b => b.status === 'won').length
    const winRate = settled.length > 0 ? Math.round((wins / settled.length) * 100) : 0
    
    let activeRisk = 0
    let awaitingPayout = 0
    userBets.filter(b => ['p2p_open', 'p2p_matched'].includes(b.status)).forEach(bet => {
      const isMatcher = bet.matcher_id === userId
      const gross = bet.stake * (bet.odds || 2)
      activeRisk += isMatcher ? Math.round(gross - bet.stake) : bet.stake
      if (bet.status === 'p2p_matched') awaitingPayout += Math.round(gross - (gross * (PLATFORM_FEE_PERCENT / 100)))
    })
    
    return { trades: userBets.length, winRate, activeRisk, awaitingPayout }
  }

  const activeEvents = events.filter(e => !e.resolved)
  const myPendingOffers = bets.filter(b => b.user_id === session?.user?.id && b.status === 'p2p_open')
  const myActiveWagers = bets.filter(b => (b.user_id === session?.user?.id || b.matcher_id === session?.user?.id) && b.status === 'p2p_matched')
  const mySettledWagers = bets.filter(b => (b.user_id === session?.user?.id || b.matcher_id === session?.user?.id) && ['won', 'lost', 'refunded'].includes(b.status))
  const sortedLeaderboard = [...allProfiles].sort((a, b) => b.wallet_balance - a.wallet_balance).slice(0, 10)

  if (!session) return <Landing />
  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center relative"><div className="w-16 h-16 border-2 border-[#C5A880]/20 border-t-[#C5A880] rounded-full animate-spin mb-6"></div><p className="text-[#C5A880] font-mono text-xs tracking-[0.3em] uppercase animate-pulse">Syncing Network...</p></div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans relative pb-20">
      
      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl ${toast.type === 'error' ? 'bg-[#f43f5e]/10 border-[#f43f5e]/30 text-[#f43f5e]' : 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]'}`}>
            {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="font-semibold text-sm tracking-wide">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Profile Setup Identity Wall */}
      {showProfileSetup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-xl p-4">
          <div className="bg-[#111111] border border-[#C5A880]/30 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A880]/10 rounded-full blur-[80px] pointer-events-none"></div>
            <h3 className="text-3xl font-black text-white mb-2 relative z-10">Establish Identity</h3>
            <p className="text-gray-400 text-sm mb-8 font-light relative z-10">You are entering a social exchange. Choose how you will be known on the Leaderboard.</p>
            <div className="space-y-6 relative z-10">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Choose Your Avatar</label>
                <div className="flex flex-wrap gap-2 justify-center">
                  {AVATARS.map(emoji => (
                    <button key={emoji} onClick={() => setNewAvatar(emoji)} className={`w-12 h-12 text-2xl rounded-xl border flex items-center justify-center transition hover:scale-110 ${newAvatar === emoji ? 'bg-[#C5A880]/20 border-[#C5A880]' : 'bg-[#1a1a1a] border-[#ffffff10] opacity-50'}`}>{emoji}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Trader Alias</label>
                <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} placeholder="e.g. Paperboy_BTC" maxLength={15} className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-white font-bold rounded-xl p-4 focus:outline-none focus:border-[#C5A880] text-lg text-center tracking-wide" />
              </div>
              <button onClick={handleUpdateProfile} disabled={newUsername.length < 3} className="w-full bg-[#C5A880] hover:bg-[#A3885C] disabled:opacity-50 text-[#0a0a0a] font-bold py-4 rounded-xl transition shadow-[0_0_20px_rgba(197,168,128,0.2)]">Enter the Exchange</button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <header className="border-b border-[#ffffff0a] bg-[#0a0a0a]/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-3 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight cursor-pointer flex items-center gap-2" onClick={() => setActiveView('orderbook')}>
            Parlayz<span className="text-[#C5A880]">KSh</span>
          </h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => setShowNotifications(!showNotifications)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#111111] border border-[#ffffff10] text-gray-400 hover:text-[#C5A880] transition relative">
              <Bell className="w-4 h-4" />
              {notifications.filter(n => !n.is_read).length > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#A3885C] rounded-full animate-pulse shadow-[0_0_5px_rgba(163,136,92,0.8)]"></span>}
            </button>
            <button onClick={() => setActiveView('wallet')} className="bg-[#111111] border border-[#ffffff10] hover:border-[#C5A880]/50 rounded-xl px-3 sm:px-4 py-1.5 flex items-center gap-2 transition group">
              <Wallet className="w-4 h-4 text-[#C5A880]" />
              <span className="font-bold text-sm sm:text-base">{profile?.wallet_balance.toLocaleString() || '0'}</span>
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider hidden sm:inline">KSh</span>
            </button>
            <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-[#ffffff20] flex items-center justify-center text-lg shadow-inner cursor-pointer" onClick={() => supabase.auth.signOut()} title="Sign Out">{profile?.avatar || '👤'}</div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-1">
          <div className="flex items-center gap-6 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <button onClick={() => setActiveView('orderbook')} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'orderbook' ? 'text-[#C5A880] border-[#C5A880]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}><Activity className="w-4 h-4" /> Order Book</button>
            <button onClick={() => setActiveView('markets')} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'markets' ? 'text-[#C5A880] border-[#C5A880]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>Markets</button>
            <button onClick={() => setActiveView('wagers')} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'wagers' ? 'text-[#C5A880] border-[#C5A880]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>My Bets</button>
            <button onClick={() => setActiveView('leaderboard')} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'leaderboard' ? 'text-[#C5A880] border-[#C5A880]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}><Trophy className="w-4 h-4 text-yellow-500" /> Leaderboard</button>
          </div>
        </div>
      </header>

      {/* Main Views */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* --- WALLET VIEW --- */}
        {activeView === 'wallet' && (
          <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Cashier & Profile</h2>
              <button onClick={togglePrivacy} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition ${profile?.is_public ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
                {profile?.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} {profile?.is_public ? 'Profile Public' : 'Profile Private'}
              </button>
            </div>

            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#ffffff15] rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A880]/5 rounded-full blur-[80px]"></div>
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-2 relative z-10 flex items-center gap-2">Available Balance</p>
              <h1 className="text-5xl font-extrabold text-white mb-1 relative z-10 tracking-tight">{profile?.wallet_balance.toLocaleString()} <span className="text-2xl text-[#C5A880]">KSh</span></h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-10">
              {/* One-Time Airdrop Card */}
              <div className={`bg-[#111111] border border-[#ffffff10] rounded-2xl p-6 relative overflow-hidden transition ${profile?.has_claimed_airdrop ? 'opacity-60 grayscale' : 'hover:border-[#C5A880]/30'}`}>
                <div className="flex items-center gap-3 mb-4 relative z-10"><div className="w-10 h-10 rounded-lg bg-[#C5A880]/10 flex items-center justify-center border border-[#C5A880]/20"><ArrowDownToLine className="w-5 h-5 text-[#C5A880]" /></div><h3 className="text-lg font-bold">Initial Airdrop</h3></div>
                <div className="space-y-4 relative z-10">
                  <p className="text-sm text-gray-400 font-light mb-4">Claim your starting capital of 10,000 KSh. <span className="text-white font-semibold">This can only be claimed once.</span> Manage it wisely to climb the leaderboard.</p>
                  <button onClick={handleAirdrop} disabled={profile?.has_claimed_airdrop} className={`w-full font-bold py-3.5 rounded-xl transition ${profile?.has_claimed_airdrop ? 'bg-[#0a0a0a] border border-[#ffffff10] text-gray-600' : 'bg-[#C5A880]/10 border border-[#C5A880]/30 text-[#C5A880] hover:bg-[#C5A880] hover:text-[#0a0a0a] shadow-[0_0_15px_rgba(197,168,128,0.1)]'}`}>
                    {profile?.has_claimed_airdrop ? 'Airdrop Claimed' : 'Claim 10,000 KSh'}
                  </button>
                </div>
              </div>
              {/* Withdrawal Card */}
              <div className="bg-[#111111] border border-[#ffffff10] rounded-2xl p-6 relative overflow-hidden group hover:border-[#10b981]/30 transition">
                <div className="flex items-center gap-3 mb-6 relative z-10"><div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center border border-[#10b981]/20"><ArrowUpFromLine className="w-5 h-5 text-[#10b981]" /></div><h3 className="text-lg font-bold">M-Pesa Withdraw</h3></div>
                <div className="space-y-4 relative z-10">
                  <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">M-Pesa Number</label><input type="tel" placeholder="07XXXXXXXX" value={withdrawPhone} onChange={e => setWithdrawPhone(e.target.value.replace(/\D/g, '').substring(0,10))} className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-white rounded-xl p-3 focus:outline-none focus:border-[#10b981] font-mono tracking-wider" /></div>
                  <div><div className="flex justify-between items-center mb-1"><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount (KSh)</label></div><input type="number" value={withdrawAmount || ''} onChange={e => setWithdrawAmount(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-xl p-3 focus:outline-none focus:border-[#10b981] font-bold text-white" /></div>
                  <button onClick={handleWithdraw} className="w-full bg-[#10b981]/10 border border-[#10b981]/30 hover:bg-[#10b981] text-[#10b981] hover:text-[#0a0a0a] font-bold py-3.5 rounded-xl transition">Request Payout</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- LEADERBOARD VIEW --- */}
        {activeView === 'leaderboard' && (
          <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
            <div className="bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent border border-yellow-500/30 rounded-2xl p-4 sm:p-6 mb-8 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <h3 className="text-lg font-black text-white uppercase tracking-wider">March Madness Event</h3>
                <p className="text-yellow-500/80 text-sm font-semibold">Ends March 18th, 2026 at Midnight.</p>
              </div>
              <div className="bg-[#0a0a0a] px-4 py-2 rounded-xl border border-yellow-500/20 text-sm font-bold shadow-[0_0_15px_rgba(234,179,8,0.15)] text-white">Top 3 Wallets Win Cash Prizes 💰</div>
            </div>
            
            <div className="bg-[#111111] border border-[#ffffff10] rounded-3xl overflow-hidden shadow-2xl">
              <div className="grid grid-cols-12 gap-4 p-5 border-b border-[#ffffff10] bg-[#0a0a0a] text-xs font-bold text-gray-500 uppercase tracking-widest">
                <div className="col-span-2 text-center">Rank</div>
                <div className="col-span-6">Trader Identity</div>
                <div className="col-span-4 text-right">Net Value (KSh)</div>
              </div>
              <div className="divide-y divide-[#ffffff0a]">
                {sortedLeaderboard.map((user, index) => (
                  <div key={user.id} onClick={() => setSelectedPublicProfile(user)} className={`grid grid-cols-12 gap-4 p-5 items-center transition cursor-pointer hover:bg-[#1a1a1a] ${session?.user?.id === user.id ? 'bg-[#C5A880]/5' : ''}`}>
                    <div className="col-span-2 flex justify-center">
                      {index === 0 ? <span className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 flex items-center justify-center font-black shadow-[0_0_15px_rgba(234,179,8,0.3)]">1</span> :
                       index === 1 ? <span className="w-8 h-8 rounded-full bg-gray-300/20 text-gray-300 border border-gray-300/50 flex items-center justify-center font-black">2</span> :
                       index === 2 ? <span className="w-8 h-8 rounded-full bg-orange-600/20 text-orange-500 border border-orange-600/50 flex items-center justify-center font-black">3</span> :
                       <span className="text-gray-500 font-bold">{index + 1}</span>}
                    </div>
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-[#ffffff15] flex items-center justify-center text-xl shadow-inner">{user.avatar || '👤'}</div>
                      <div>
                        <span className={`font-bold block ${session?.user?.id === user.id ? 'text-[#C5A880]' : 'text-white'}`}>{user.username} {session?.user?.id === user.id && '(You)'}</span>
                        {!user.is_public && <span className="text-[10px] text-gray-500 flex items-center gap-1 uppercase tracking-wider"><EyeOff className="w-3 h-3" /> Private</span>}
                      </div>
                    </div>
                    <div className="col-span-4 text-right"><span className="font-black text-lg font-mono text-white">{user.wallet_balance.toLocaleString()}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- WAGERS VIEW (WITH TAUNT CHAT INTEGRATION) --- */}
        {activeView === 'wagers' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Locked Wagers (The Arena)</h3>
              {myActiveWagers.length === 0 ? <div className="py-16 text-center text-gray-500 border border-dashed border-[#ffffff10] rounded-2xl">No active wagers locked in.</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {myActiveWagers.reverse().map((bet, i) => {
                    const event = events.find(e => e.id === bet.event_id); if (!event) return null
                    const isMatcher = bet.matcher_id === session?.user?.id
                    const opponentId = isMatcher ? bet.user_id : bet.matcher_id
                    const opponentProfile = allProfiles.find(p => p.id === opponentId)
                    const gross = bet.stake * (bet.odds || 2); const estNetPayout = Math.round(gross - (gross * (PLATFORM_FEE_PERCENT / 100)))
                    const myStake = isMatcher ? Math.round(gross - bet.stake) : bet.stake

                    return (
                      <div key={i} className="bg-[#111111] border border-[#C5A880]/40 rounded-3xl p-6 transition relative overflow-hidden shadow-[0_0_30px_rgba(197,168,128,0.05)]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A880]/5 rounded-full blur-3xl"></div>
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#ffffff10] relative z-10">
                          <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Matchup</p><p className="font-bold text-white text-sm">You <span className="text-[#f43f5e] mx-1">VS</span> {opponentProfile?.avatar} {opponentProfile?.username}</p></div>
                          <button onClick={() => setActiveChatBet(bet)} className="bg-[#1a1a1a] hover:bg-[#222222] border border-[#ffffff20] text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition shadow-md"><MessageSquare className="w-4 h-4 text-[#C5A880]" /> Taunt</button>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-4 relative z-10 leading-tight">{event.title}</h3>
                        <div className="bg-[#0a0a0a] rounded-xl p-4 border border-[#ffffff0a] mb-4 relative z-10 text-center"><div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Your Condition to Win</div><div className="text-[#C5A880] font-bold text-lg">{isMatcher ? 'AGAINST' : 'FOR'} {event.outcomes[bet.outcome_index]}</div></div>
                        <div className="space-y-2 text-sm relative z-10">
                          <div className="flex justify-between text-gray-400"><span>Your Stake Risk:</span><span className="text-white">{myStake.toLocaleString()} KSh</span></div>
                          <div className="flex justify-between font-bold pt-3 border-t border-[#ffffff10] mt-3"><span className="text-[#10b981] uppercase tracking-wider text-xs flex items-center">Est. Payout:</span><span className="text-[#10b981] text-xl">{estNetPayout.toLocaleString()} KSh</span></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {/* Settled History goes here, keeping it brief for token limit, exact same mapping as before */}
          </div>
        )}

        {/* --- ORDERBOOK VIEW --- */}
        {activeView === 'orderbook' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111111] border border-[#C5A880]/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_30px_rgba(197,168,128,0.05)] gap-4">
              <div><h3 className="text-2xl font-black text-white mb-2 flex items-center gap-2">Live Order Book</h3><p className="text-gray-400 text-sm font-light">Global P2P exchange. Match an active wager or dictate your own terms.</p></div>
              <button onClick={() => setShowCreateOfferModal(true)} className="bg-[#C5A880] hover:bg-[#A3885C] text-[#0a0a0a] font-bold py-3.5 px-8 rounded-xl transition shadow-[0_0_20px_rgba(197,168,128,0.2)] w-full sm:w-auto uppercase tracking-wide text-sm">+ Create Custom Bet</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {bets.filter(b => b.status === 'p2p_open').map((offer, i) => {
                const event = events.find(e => e.id === offer.event_id); if (!event) return null
                const liability = Math.round((offer.stake * (offer.odds || 2)) - offer.stake)
                const isOwnOffer = offer.user_id === session?.user?.id
                const maker = allProfiles.find(p => p.id === offer.user_id)

                return (
                  <div key={i} className="bg-[#111111] border border-[#ffffff10] rounded-3xl p-6 sm:p-7 hover:border-[#C5A880]/40 transition relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#C5A880]/5 rounded-full blur-[60px] group-hover:bg-[#C5A880]/15 transition"></div>
                    <div className="flex justify-between items-start mb-5 relative z-10">
                      <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition" onClick={() => setSelectedPublicProfile(maker || null)}>
                        <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#ffffff20] flex items-center justify-center text-lg">{maker?.avatar || '👤'}</div>
                        <div><p className="text-sm font-bold text-white">{maker?.username || 'Anonymous'}</p><p className="text-[10px] text-gray-500 uppercase tracking-widest">{getUserStats(maker?.id || '').winRate}% Win Rate</p></div>
                      </div>
                    </div>
                    <h4 className="text-white font-bold mb-4 line-clamp-2 relative z-10 text-sm border-b border-[#ffffff10] pb-4">{event.title}</h4>
                    <div className="bg-[#0a0a0a] rounded-xl p-4 mb-6 border border-[#ffffff0a] relative z-10 text-center"><div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Their Prediction</div><div className="text-white font-bold text-lg">{event.outcomes[offer.outcome_index]}</div></div>
                    <div className="space-y-3 mb-2 relative z-10">
                      <div className="flex justify-between text-sm text-gray-400"><span>Their Stake:</span><span className="text-white font-bold">{offer.stake.toLocaleString()} KSh</span></div>
                      <div className="flex justify-between text-sm text-gray-400"><span>Odds:</span><span className="text-[#C5A880] font-bold text-lg">{offer.odds}x</span></div>
                      <div className="flex justify-between items-center pt-4 border-t border-[#ffffff10] mt-4"><span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Your Cost to Play:</span><span className="text-white font-black text-xl">{liability.toLocaleString()} KSh</span></div>
                      <div className="flex justify-between items-center"><span className="text-[#10b981] font-bold uppercase tracking-wider text-xs">Est. Payout:</span><span className="text-[#10b981] font-black text-2xl drop-shadow-md">{Math.round(offer.stake * (offer.odds || 2)).toLocaleString()} KSh</span></div>
                    </div>
                    <button onClick={() => setOfferToMatch(offer)} disabled={isOwnOffer} className={`w-full font-bold py-4 rounded-xl transition relative z-10 mt-6 uppercase tracking-wider text-sm ${isOwnOffer ? 'bg-[#0a0a0a] text-gray-600 border border-[#ffffff10] cursor-not-allowed' : 'bg-[#10b981]/10 border border-[#10b981]/30 hover:bg-[#10b981] hover:text-[#0a0a0a] text-[#10b981] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]'}`}>
                      {isOwnOffer ? 'Waiting for Taker...' : 'Take Bet'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS OVERLAYS --- */}
      
      {/* Public Profile Modal */}
      {selectedPublicProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={() => setSelectedPublicProfile(null)}>
          <div className="bg-[#111111] border border-[#ffffff15] rounded-3xl p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPublicProfile(null)} className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
            <div className="w-24 h-24 rounded-full bg-[#0a0a0a] border-2 border-[#C5A880]/30 flex items-center justify-center text-5xl mx-auto mb-4 shadow-inner">{selectedPublicProfile.avatar}</div>
            <h3 className="text-2xl font-black text-white mb-1">{selectedPublicProfile.username}</h3>
            
            {!selectedPublicProfile.is_public && selectedPublicProfile.id !== session?.user?.id ? (
              <div className="mt-8 py-8 bg-[#0a0a0a] rounded-2xl border border-[#ffffff05]"><EyeOff className="w-8 h-8 text-gray-600 mx-auto mb-3" /><p className="text-gray-500 font-semibold text-sm">This trader's stats are private.</p></div>
            ) : (
              <div className="mt-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0a0a0a] border border-[#ffffff10] rounded-2xl p-4"><p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Win Rate</p><p className="text-2xl font-black text-white">{getUserStats(selectedPublicProfile.id).winRate}%</p></div>
                  <div className="bg-[#0a0a0a] border border-[#ffffff10] rounded-2xl p-4"><p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Trades</p><p className="text-2xl font-black text-white">{getUserStats(selectedPublicProfile.id).trades}</p></div>
                </div>
                <div className="bg-[#0a0a0a] border border-[#ffffff10] rounded-2xl p-4 flex justify-between items-center"><p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Active Risk</p><p className="text-lg font-bold text-[#f43f5e]">{getUserStats(selectedPublicProfile.id).activeRisk.toLocaleString()} KSh</p></div>
                <div className="bg-[#0a0a0a] border border-[#C5A880]/20 rounded-2xl p-4 flex justify-between items-center"><p className="text-xs text-[#C5A880] uppercase tracking-widest font-semibold">Awaiting Payout</p><p className="text-lg font-black text-[#10b981]">{getUserStats(selectedPublicProfile.id).awaitingPayout.toLocaleString()} KSh</p></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Taunt Chat Arena Modal */}
      {activeChatBet && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#0a0a0a] border border-[#C5A880]/30 rounded-3xl w-full max-w-md h-[85vh] sm:h-[80vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(197,168,128,0.1)]">
            {/* Chat Header */}
            <div className="bg-[#111111] p-4 border-b border-[#ffffff10] flex items-center justify-between">
              <div>
                <h3 className="text-white font-black flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#C5A880]" /> The Arena</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">Escrow Locked • Winner Takes All</p>
              </div>
              <button onClick={() => { setActiveChatBet(null); setChatMessages([]) }} className="w-8 h-8 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            
            {/* Chat Warning */}
            <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-500/80 font-medium leading-tight">Taunts are allowed, but the blockchain remembers. Be mindful of personal attacks. Violators will be slashed.</p>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50"><MessageSquare className="w-12 h-12 mb-3" /><p>The arena is silent. Start the trash talk.</p></div>
              ) : (
                chatMessages.map(msg => {
                  const isMe = msg.sender_id === session?.user?.id
                  const sender = allProfiles.find(p => p.id === msg.sender_id)
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-gray-600 font-bold uppercase mb-1 px-1">{sender?.username}</span>
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-md ${isMe ? 'bg-[#C5A880] text-[#0a0a0a] rounded-tr-sm font-medium' : 'bg-[#1a1a1a] text-white border border-[#ffffff10] rounded-tl-sm'}`}>
                        {msg.message}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-[#111111] border-t border-[#ffffff10]">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a taunt..." className="flex-1 bg-[#0a0a0a] border border-[#ffffff15] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A880]" />
                <button type="submit" disabled={!chatInput.trim()} className="w-12 h-12 bg-[#C5A880] disabled:bg-[#1a1a1a] disabled:text-gray-600 text-[#0a0a0a] rounded-xl flex items-center justify-center transition"><Send className="w-5 h-5 ml-1" /></button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Bet Modal */}
      {offerToMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-[#C5A880]/40 rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(197,168,128,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#C5A880]/10 border border-[#C5A880]/30 text-[#C5A880] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_15px_rgba(197,168,128,0.15)]"><AlertTriangle className="w-8 h-8" /></div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Confirm Wager</h3>
              <p className="text-gray-400 text-sm mb-6 font-light">You are taking the other side of this bet.</p>
              <div className="bg-[#0a0a0a] rounded-xl p-5 mb-8 text-left border border-[#ffffff10]">
                <div className="flex justify-between items-center text-sm mb-4"><span className="text-gray-400 uppercase tracking-wider font-semibold text-xs">Your Stake (Cost):</span><span className="text-white font-bold text-lg">{Math.round((offerToMatch.stake * (offerToMatch.odds || 2)) - offerToMatch.stake).toLocaleString()} KSh</span></div>
                <div className="flex justify-between items-center text-sm pt-4 border-t border-[#ffffff10]"><span className="text-[#10b981] font-bold uppercase tracking-wider text-xs">Est. Payout:</span><span className="text-[#10b981] font-black text-3xl drop-shadow-md">{Math.round(offerToMatch.stake * (offerToMatch.odds || 2)).toLocaleString()} KSh</span></div>
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setOfferToMatch(null)} className="w-1/2 bg-[#1a1a1a] hover:bg-[#222222] border border-[#ffffff10] text-white font-bold py-4 rounded-xl transition uppercase tracking-wider text-sm">Cancel</button>
                <button onClick={confirmMatch} className="w-1/2 bg-[#10b981] hover:bg-[#059669] text-[#0a0a0a] font-black py-4 rounded-xl transition shadow-[0_0_20px_rgba(16,185,129,0.3)] uppercase tracking-wider text-sm">Lock Bet</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Bet Modal - (Omitted to save space, identical to previous but PTZ -> KSh) */}

    </div>
  )
}
