// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import Landing from './Landing'
import { LogOut, X, AlertTriangle, Bell, Wallet, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, History, Trophy, Activity, Eye, EyeOff, Share2, Swords, MessageSquare, Send, ChevronLeft, Search, Globe, Link2 } from 'lucide-react'

// Interfaces
interface Event { id: string; title: string; description: string; category: string; outcomes: string[]; closes_at?: string; locks_at?: string; created_at: string; resolved: boolean; settlement_source?: string; resolution_image_url?: string }
interface Bet { id: string; event_id: string; outcome_index: number; stake: number; status: string; user_id: string; }
interface Profile { id: string; username: string; wallet_balance: number; avatar: string; has_claimed_airdrop: boolean; is_public: boolean; phone_number?: string; is_bot?: boolean }
interface AppNotification { id: string; user_id: string; message: string; type: string; is_read: boolean; created_at: string }

const MIN_STAKE = 200
const PLATFORM_FEE_PERCENT = 3
const AVATARS = ['🦊', '🐯', '🦅', '🦈', '🐍', '🦍', '🐉', '🦂', '🦉', '🐺']

// CATEGORY HIERARCHY MAPPING
const CATEGORIES = {
  'All': [],
  'Sports': [
    { label: 'Football', dbValue: 'Sports_Football' },
    { label: 'F1', dbValue: 'Sports_F1' },
    { label: 'WRC', dbValue: 'Sports_WRC' },
    { label: 'UFC / MMA', dbValue: 'Sports_UFC' },
    { label: 'Basketball', dbValue: 'Sports_Basketball' },
    { label: 'Player Bets', dbValue: 'Sports_PlayerBets' }
  ],
  'Crypto': [
    { label: 'Majors', dbValue: 'Crypto_Majors' },
    { label: 'Altcoins', dbValue: 'Crypto_Altcoins' },
    { label: 'Meme Coins', dbValue: 'Crypto_Meme' }
  ],
  'Finance': [
    { label: 'US Stocks', dbValue: 'Finance_Stocks' },
    { label: 'Global Markets', dbValue: 'Finance_Global' },
    { label: 'Forex', dbValue: 'Finance_Forex' },
    { label: 'Commodities', dbValue: 'Finance_Commodities' }
  ],
  'Culture': [
    { label: 'Music', dbValue: 'Culture_Music' },
    { label: 'TV & Film', dbValue: 'Culture_TVFilm' },
    { label: 'Fashion', dbValue: 'Culture_Fashion' }
  ],
  'Current Affairs': [
    { label: 'Politics (World)', dbValue: 'CurrentAffairs_Politics_Global' },
    { label: 'Politics (Kenya)', dbValue: 'CurrentAffairs_Politics_Kenya' },
    { label: 'War & Conflict', dbValue: 'CurrentAffairs_War' }
  ]
}

// SMART IMAGE ROUTER (Auto-Fallback based on category string)
const getFallbackImage = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('football') || cat.includes('sports')) return 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop';
  if (cat.includes('crypto')) return 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=800&auto=format&fit=crop';
  if (cat.includes('f1') || cat.includes('wrc') || cat.includes('motorsport')) return 'https://images.unsplash.com/photo-1541773319920-190f5f8f81b6?w=800&auto=format&fit=crop'; 
  if (cat.includes('politics') || cat.includes('affairs')) return 'https://images.unsplash.com/photo-1526324965576-905e3f185038?q=80&w=800&auto=format&fit=crop';
  return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop'; // Default Fashion/Dark
}

// LIVE TIMER COMPONENT
const LiveTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState('')
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    const calculateTime = () => {
      if (!targetDate) {
        setTimeLeft('TBA')
        setIsLocked(false)
        return
      }

      const lockTime = new Date(targetDate).getTime()
      if (isNaN(lockTime)) {
        setTimeLeft('TBA')
        setIsLocked(false)
        return
      }

      const distance = lockTime - Date.now()

      if (distance <= 0) {
        setIsLocked(true)
        setTimeLeft('LOCKED')
      } else {
        setIsLocked(false)
        const days = Math.floor(distance / (1000 * 60 * 60 * 24))
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)

        if (days > 0) setTimeLeft(`${days}d ${hours}h ${minutes}m`)
        else setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      }
    }
    
    calculateTime()
    const timer = setInterval(calculateTime, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  if (isLocked) {
    return <span className="text-[10px] font-bold text-[#0a0a0a] bg-white border border-white px-2 py-1 rounded uppercase tracking-widest shadow-lg">🔒 Closed</span>
  }
  return <span className="text-[10px] font-bold text-black bg-[#C5A880] border border-[#C5A880] px-2 py-1 rounded uppercase tracking-widest animate-pulse shadow-lg flex items-center gap-1"><div className="w-1.5 h-1.5 bg-black rounded-full"></div> Live</span>
}

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  const [toast, setToast] = useState<{msg: string, type: 'error' | 'success'} | null>(null)
  const showToast = (msg: string, type: 'error' | 'success' = 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const [activeView, setActiveView] = useState<'markets' | 'wagers' | 'leaderboard' | 'wallet' | 'eventDetail'>('markets')
  
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('All')
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // Betting States
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = useState<number | null>(null)
  const [poolStake, setPoolStake] = useState<number>(MIN_STAKE)
  const [betMode, setBetMode] = useState<'pool' | 'p2p'>('pool')
  const [friendStake, setFriendStake] = useState<number>(MIN_STAKE)
  
  const [lastBet, setLastBet] = useState<{eventId: string, outcomeIdx: number, stake: number} | null>(null)
  const [duelData, setDuelData] = useState<{eventId: string, side: number, stake: number, challengerId: string} | null>(null)

  const [chatEventId, setChatEventId] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showCashierModal, setShowCashierModal] = useState<{type: 'deposit' | 'withdraw', status: 'processing' | 'success' | 'error'} | null>(null)
  const [selectedPublicProfile, setSelectedPublicProfile] = useState<Profile | null>(null)
  
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0)
  const [withdrawPhone, setWithdrawPhone] = useState<string>('')
  const [depositAmount, setDepositAmount] = useState<number>(0)
  const [depositPhone, setDepositPhone] = useState<string>('')
  const [isDepositing, setIsDepositing] = useState(false)

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
      const eventsChannel = supabase.channel('events_channel').on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => { fetchEvents() }).subscribe()
      return () => { betsChannel.unsubscribe(); notifsChannel.unsubscribe(); profilesChannel.unsubscribe(); eventsChannel.unsubscribe(); }
    }
  }, [session])

  useEffect(() => {
    if (session?.user && events.length > 0) {
      const urlParams = new URLSearchParams(window.location.search)
      const dEv = urlParams.get('duel'); const dSd = urlParams.get('side'); const dSt = urlParams.get('stake'); const cId = urlParams.get('challenger')
      if (dEv && dSd && dSt) {
        if (cId !== session.user.id) setDuelData({ eventId: dEv, side: Number(dSd), stake: Number(dSt), challengerId: cId || '' })
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [session, events])

  useEffect(() => {
    if (!chatEventId) return;
    const fetchChat = async () => {
      const { data } = await supabase.from('arena_messages').select('*').eq('event_id', chatEventId).order('created_at', { ascending: true })
      if (data) setChatMessages(data)
    }
    fetchChat()
    const chatSub = supabase.channel('chat_channel').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'arena_messages', filter: `event_id=eq.${chatEventId}` }, (payload) => {
        setChatMessages(prev => [...prev, payload.new])
    }).subscribe()
    return () => { chatSub.unsubscribe() }
  }, [chatEventId])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [chatMessages, chatEventId])

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !chatEventId || !session?.user) return
    const msg = chatInput.trim()
    setChatInput('') 
    await supabase.from('arena_messages').insert({ event_id: chatEventId, user_id: session.user.id, text: msg })
  }

  const fetchData = async () => {
    await Promise.all([fetchProfile(), fetchAllProfiles(), fetchEvents(), fetchBets(), fetchNotifications()])
    setLoading(false)
  }

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) {
      setProfile(data)
      if (data.username === session.user.email || !data.username) setShowProfileSetup(true)
    }
  }

  const fetchAllProfiles = async () => { const { data } = await supabase.from('profiles').select('*'); if (data) setAllProfiles(data) }
  const fetchEvents = async () => { const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false }); if (data) setEvents(data) }
  const fetchBets = async () => { const { data } = await supabase.from('bets').select('*'); if (data) setBets(data) }
  const fetchNotifications = async () => { const { data } = await supabase.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }); if (data) setNotifications(data) }

  const handleUpdateProfile = async () => {
    if (newUsername.length < 3) return showToast('Username must be at least 3 characters.')
    await supabase.from('profiles').update({ username: newUsername, avatar: newAvatar }).eq('id', session.user.id)
    setShowProfileSetup(false); fetchProfile(); fetchAllProfiles();
    showToast('Identity updated successfully.', 'success')
  }

  const togglePrivacy = async () => {
    if (!profile) return
    const newStatus = !profile.is_public
    await supabase.from('profiles').update({ is_public: newStatus }).eq('id', session.user.id)
    setProfile({ ...profile, is_public: newStatus })
    showToast(newStatus ? 'Profile is now Public' : 'Profile is now Private', 'success')
  }

  const handleDeposit = async () => {
    if (depositAmount < 10) return showToast("Minimum deposit is 10 KSh.")
    const phoneRegex = /^(07|01)\d{8}$/
    if (!phoneRegex.test(depositPhone)) return showToast("Invalid format. Use 07... or 01...")
    setIsDepositing(true)
    try {
      const response = await fetch('/api/stkpush', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: depositAmount, phone: depositPhone, email: session.user.email }),
      })
      const data = await response.json()
      if (response.ok) {
        showToast("STK Push Sent! Enter PIN on your phone.", "success")
        if (!profile?.phone_number) await supabase.from('profiles').update({ phone_number: depositPhone }).eq('id', session.user.id)
      } else { showToast(data.message || "M-Pesa trigger failed.") }
    } catch (err) { showToast("Network error. Try again.") } finally { setIsDepositing(false) }
  }

  const handleAirdrop = async () => {
    if (!profile) return
    if (profile.has_claimed_airdrop) return showToast("Airdrop already claimed.")
    setShowCashierModal({ type: 'deposit', status: 'processing' })
    setTimeout(async () => {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance + 10000, has_claimed_airdrop: true }).eq('id', session.user.id)
      await supabase.from('notifications').insert({ user_id: session.user.id, message: `One-Time Airdrop of 10,000 KSh secured. Welcome to the Arena.`, type: 'deposit', is_read: false })
      fetchProfile(); fetchAllProfiles(); fetchNotifications(); setShowCashierModal({ type: 'deposit', status: 'success' })
    }, 2000)
  }

  const handleWithdraw = async () => {
    if (withdrawAmount < 100) return showToast("Minimum withdrawal is 100 KSh.")
    if (profile && withdrawAmount > profile.wallet_balance) return showToast("Insufficient available funds.")
    const phoneRegex = /^(07|01)\d{8}$/
    if (!phoneRegex.test(withdrawPhone)) return showToast("Invalid format.")
    setShowCashierModal({ type: 'withdraw', status: 'processing' })
    setTimeout(async () => {
      if (profile) {
        await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - withdrawAmount }).eq('id', session.user.id)
        await supabase.from('notifications').insert({ user_id: session.user.id, message: `Withdrawal of ${withdrawAmount} KSh to ${withdrawPhone} initiated.`, type: 'withdrawal', is_read: false })
        fetchProfile(); fetchAllProfiles(); fetchNotifications(); setShowCashierModal({ type: 'withdraw', status: 'success' }); setWithdrawAmount(0); setWithdrawPhone('')
      }
    }, 2500)
  }

  const submitDuel = async () => {
    if (!selectedEventId || selectedOutcomeIdx === null || !session?.user || !profile) return
    if (profile.wallet_balance < poolStake) return showToast('Insufficient balance for your stake.')
    if (poolStake < MIN_STAKE || friendStake < MIN_STAKE) return showToast(`Min stake is ${MIN_STAKE} KSh.`)
    const { error } = await supabase.from('bets').insert({ event_id: selectedEventId, outcome_index: selectedOutcomeIdx, stake: poolStake, status: 'open', user_id: session.user.id })
    if (!error) {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - poolStake }).eq('id', session.user.id)
      setLastBet({ eventId: selectedEventId, outcomeIdx: selectedOutcomeIdx, stake: friendStake })
      setDuelData(null); setShowSuccessModal(true); setSelectedEventId(''); setSelectedOutcomeIdx(null); setPoolStake(MIN_STAKE); setFriendStake(MIN_STAKE); setActiveView('markets');
    } else { showToast('Error creating 1v1 duel.') }
  }

  const submitPoolBet = async (overrideE?: string, overrideO?: number, overrideS?: number) => {
    const eId = overrideE || selectedEventId; const oIdx = overrideO !== undefined ? overrideO : selectedOutcomeIdx; const stake = overrideS || poolStake
    if (!eId || oIdx === null || !session?.user || !profile) return showToast("Select an outcome first.")
    if (profile.wallet_balance < stake) return showToast('Insufficient KSh balance for this wager.')
    if (stake < MIN_STAKE) return showToast(`Minimum accepted stake is ${MIN_STAKE} KSh.`)
    const { error } = await supabase.from('bets').insert({ event_id: eId, outcome_index: oIdx, stake: stake, status: 'open', user_id: session.user.id })
    if (!error) {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - stake }).eq('id', session.user.id)
      setLastBet({ eventId: eId, outcomeIdx: oIdx, stake: stake })
      setDuelData(null); setShowSuccessModal(true); setSelectedEventId(''); setSelectedOutcomeIdx(null); setPoolStake(MIN_STAKE); setActiveView('markets');
    } else { showToast('Network error pushing wager to the pool.') }
  }

  const markNotificationsAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
  }

  const handleLogout = async () => { await supabase.auth.signOut(); setShowLogoutModal(false) }

  const copyChallengeLink = () => {
    if (!lastBet || !session?.user) return
    const url = `${window.location.origin}/?duel=${lastBet.eventId}&side=${lastBet.outcomeIdx}&stake=${lastBet.stake}&challenger=${session.user.id}`
    navigator.clipboard.writeText(url); showToast('Challenge link copied!', 'success')
  }

  const calculateEstPayout = (eventId: string, outcomeIdx: number, userStake: number = 0, isExisting: boolean = false) => {
    const eventBets = bets.filter(b => b.event_id === eventId && b.status === 'open')
    const addedStake = isExisting ? 0 : userStake
    const totalPoolVolume = eventBets.reduce((sum, b) => sum + b.stake, 0) + addedStake
    const winningPoolVolume = eventBets.filter(b => b.outcome_index === outcomeIdx).reduce((sum, b) => sum + b.stake, 0) + addedStake
    if (winningPoolVolume === 0 || totalPoolVolume === winningPoolVolume) return userStake 
    const grossPayout = (userStake / winningPoolVolume) * totalPoolVolume
    return Math.round(grossPayout * (1 - PLATFORM_FEE_PERCENT / 100))
  }

  const getUserStats = (userId: string) => {
    const userBets = bets.filter(b => b.user_id === userId)
    const settled = userBets.filter(b => ['won', 'lost'].includes(b.status))
    const wins = settled.filter(b => b.status === 'won').length
    const winRate = settled.length > 0 ? Math.round((wins / settled.length) * 100) : 0
    const activeRisk = userBets.filter(b => b.status === 'open').reduce((sum, b) => sum + b.stake, 0)
    return { trades: userBets.length, winRate, activeRisk }
  }

  const sanitizeName = (name: string | undefined) => {
    if (!name) return 'Anonymous'
    return name.includes('@') ? name.split('@')[0] : name
  }

  const activeEvents = events.filter(e => {
    if (e.resolved) return false;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = e.title.toLowerCase().includes(searchLower) || e.description.toLowerCase().includes(searchLower);
    let matchesCategory = true;
    if (selectedMainCategory !== 'All') {
      if (selectedSubCategory) matchesCategory = e.category === selectedSubCategory;
      else { const prefix = selectedMainCategory.replace(/\s+/g, ''); matchesCategory = e.category.startsWith(`${prefix}_`); }
    }
    return matchesCategory && matchesSearch;
  });

  const myActiveWagers = bets.filter(b => b.user_id === session?.user?.id && b.status === 'open')
  const mySettledWagers = bets.filter(b => b.user_id === session?.user?.id && ['won', 'lost', 'refunded'].includes(b.status))
  const sortedLeaderboard = [...allProfiles].filter(p => !p.is_bot).sort((a, b) => b.wallet_balance - a.wallet_balance)
  const ledgerTransactions = notifications.filter(n => ['deposit', 'withdrawal', 'payout', 'refund'].includes(n.type))

  let totalActiveStake = 0; let totalEstPayout = 0;
  myActiveWagers.forEach(bet => { totalActiveStake += bet.stake; totalEstPayout += calculateEstPayout(bet.event_id, bet.outcome_index, bet.stake, true) })

  if (!session) return <Landing />
  if (loading) return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center relative"><div className="w-16 h-16 border-2 border-[#D9C5A0]/20 border-t-[#D9C5A0] rounded-full animate-spin mb-6"></div><p className="text-[#D9C5A0] font-mono text-xs tracking-[0.3em] uppercase animate-pulse">Syncing Network...</p></div>
  )

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-sans relative pb-20 selection:bg-[#D9C5A0] selection:text-black">
      
      {/* Toast Notifications */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl ${toast.type === 'error' ? 'bg-[#f43f5e]/10 border-[#f43f5e]/30 text-[#f43f5e]' : 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]'}`}>
            {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="font-semibold text-sm tracking-wide">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Profile Setup */}
      {showProfileSetup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0D0D0D]/95 backdrop-blur-xl p-4">
          <div className="bg-[#151515] border border-[#D9C5A0]/30 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <h3 className="text-3xl font-black text-white mb-2 relative z-10">Establish Identity</h3>
            <p className="text-gray-400 text-sm mb-8 font-light relative z-10">You are entering a social exchange. Choose how you will be known on the Leaderboard.</p>
            <div className="space-y-6 relative z-10">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Choose Your Avatar</label>
                <div className="flex flex-wrap gap-2 justify-center">
                  {AVATARS.map(emoji => (
                    <button key={emoji} onClick={() => setNewAvatar(emoji)} className={`w-12 h-12 text-2xl rounded-xl border flex items-center justify-center transition hover:scale-110 ${newAvatar === emoji ? 'bg-[#D9C5A0]/20 border-[#D9C5A0]' : 'bg-[#1a1a1a] border-[#ffffff10] opacity-50'}`}>{emoji}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Trader Alias</label>
                <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} placeholder="e.g. Paperboy_BTC" maxLength={15} className="w-full bg-[#0D0D0D] border border-[#ffffff15] text-white font-bold rounded-xl p-4 focus:outline-none focus:border-[#D9C5A0] text-lg text-center tracking-wide" />
              </div>
              <button onClick={handleUpdateProfile} disabled={newUsername.length < 3} className="w-full bg-[#D9C5A0] hover:bg-[#c4b18f] disabled:opacity-50 text-[#0D0D0D] font-bold py-4 rounded-xl transition shadow-[0_0_20px_rgba(217,197,160,0.2)]">Enter the Exchange</button>
            </div>
          </div>
        </div>
      )}

      {/* App Header */}
      <header className="border-b border-[#1F1F1F] bg-[#0a0a0a]/90 backdrop-blur-xl sticky top-0 z-30 select-none">
        <div className="max-w-[1400px] mx-auto px-4 pt-4 pb-3 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-wide flex items-center gap-2 cursor-pointer" onClick={() => setActiveView('markets')}>
            <div className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center text-xs"><Zap className="w-4 h-4 text-[#D9C5A0]" /></div>
            PARLAYZ
          </h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <button onClick={() => { if (!showNotifications) markNotificationsAsRead(); setShowNotifications(!showNotifications); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#111111] border border-[#1F1F1F] text-gray-400 hover:text-[#D9C5A0] transition relative">
                <Bell className="w-4 h-4" />
                {notifications.filter(n => !n.is_read).length > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#D9C5A0] rounded-full animate-pulse shadow-[0_0_5px_rgba(217,197,160,0.8)]"></span>}
              </button>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setShowNotifications(false)}></div>
                  <div className="fixed left-4 right-4 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-80 bg-[#111111] border border-[#1F1F1F] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50">
                    <div className="p-4 border-b border-[#1F1F1F] bg-[#0D0D0D] flex justify-between items-center"><h4 className="font-bold text-[#D9C5A0]">Notifications</h4></div>
                    <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? <div className="p-6 text-center text-gray-500 text-sm">No new notifications.</div> : notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-[#1F1F1F] text-sm ${!n.is_read ? 'bg-[#D9C5A0]/5' : 'bg-transparent'}`}>
                          <p className="text-gray-300">{n.message}</p>
                          <span className="text-xs text-gray-600 mt-2 block">{new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => setActiveView('wallet')} className="bg-[#111111] border border-[#1F1F1F] hover:border-[#D9C5A0]/50 rounded-xl px-3 sm:px-4 py-1.5 flex items-center gap-2 transition group">
              <Wallet className="w-4 h-4 text-[#D9C5A0]" />
              <span className="font-bold text-sm sm:text-base">{profile?.wallet_balance.toLocaleString() || '0'}</span>
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider hidden sm:inline">KSh</span>
            </button>
            <button onClick={() => setShowLogoutModal(true)} className="w-9 h-9 rounded-xl bg-[#111111] border border-[#1F1F1F] flex items-center justify-center text-lg hover:border-red-500/50 transition cursor-pointer" title="Sign Out">{profile?.avatar || '👤'}</button>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-4 mt-1">
          <div className="flex items-center gap-6 overflow-x-auto pb-3 no-scrollbar">
            <button onClick={() => setActiveView('markets')} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'markets' || activeView === 'eventDetail' ? 'text-[#D9C5A0] border-[#D9C5A0]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}><Activity className="w-4 h-4" /> Markets</button>
            <button onClick={() => setActiveView('wagers')} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'wagers' ? 'text-[#D9C5A0] border-[#D9C5A0]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>My Bets</button>
            <button onClick={() => setActiveView('leaderboard')} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'leaderboard' ? 'text-[#D9C5A0] border-[#D9C5A0]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}><Trophy className="w-4 h-4 text-yellow-500" /> Leaderboard</button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-8">
        
        {/* --- MARKETS FEED (v0 Redesign) --- */}
        {activeView === 'markets' && (
          <div className="animate-in fade-in duration-300">
            
            <div className="mb-6 relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search events, players, teams..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111111] border border-[#1F1F1F] text-white rounded-2xl pl-11 pr-4 py-4 focus:outline-none focus:border-[#D9C5A0] text-sm shadow-sm"
              />
            </div>

            <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar mb-4 select-none">
              {Object.keys(CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedMainCategory(cat); setSelectedSubCategory(null); }}
                  className={`whitespace-nowrap rounded-xl px-6 py-2.5 text-sm font-semibold transition border flex items-center gap-2 ${
                    selectedMainCategory === cat 
                      ? 'bg-[#D9C5A0] text-[#0a0a0a] border-[#D9C5A0] shadow-[0_0_15px_rgba(217,197,160,0.2)]' 
                      : 'bg-transparent text-gray-400 border-[#ffffff20] hover:border-[#ffffff40] hover:text-white'
                  }`}
                >
                  {cat === 'Current Affairs' && <Globe className="w-3.5 h-3.5" />}
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeEvents.length === 0 ? <div className="col-span-full py-16 text-center text-gray-500 border border-dashed border-[#1F1F1F] rounded-3xl bg-[#111111]/30">No active markets found.</div> : (
                activeEvents.map((event) => {
                  const eventBets = bets.filter(b => b.event_id === event.id && b.status === 'open')
                  const totalPoolVolume = eventBets.reduce((sum, b) => sum + b.stake, 0)
                  
                  const eventDateStr = event.closes_at || event.locks_at || '';
                  const outcomeVolume0 = eventBets.filter(b => b.outcome_index === 0).reduce((sum, b) => sum + b.stake, 0)
                  const percent0 = totalPoolVolume === 0 ? 50 : Math.round((outcomeVolume0 / totalPoolVolume) * 100)

                  return (
                    <div 
                      key={event.id}
                      onClick={() => {
                        setSelectedEventId(event.id); 
                        setSelectedOutcomeIdx(null); 
                        setActiveView('eventDetail'); 
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex flex-col overflow-hidden rounded-3xl border border-[#ffffff15] bg-[#111111] cursor-pointer group transition-all duration-300 hover:border-[#D9C5A0]/50 hover:-translate-y-1 shadow-lg"
                    >
                      <div className="relative h-56 transition duration-500 group-hover:scale-105">
                        <img
                          src={event.resolution_image_url || getFallbackImage(event.category)}
                          alt={event.title}
                          className="absolute inset-0 h-full w-full object-cover"
                          crossOrigin="anonymous"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/40 to-transparent" />
                        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                          <span className="bg-[#0a0a0a]/80 backdrop-blur-md border border-[#ffffff10] text-[#D9C5A0] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm">
                            {event.category.split('_')[0]}
                          </span>
                          <LiveTimer targetDate={eventDateStr} />
                        </div>
                      </div>

                      <div className="flex-grow flex flex-col p-6 bg-[#111111] relative z-20">
                        <h3 className="mb-6 text-xl font-bold leading-tight text-white group-hover:text-[#D9C5A0] transition-colors line-clamp-2">
                          {event.title}
                        </h3>
                        
                        <div className="mt-auto">
                          <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            <span>Market sentiment</span>
                            <span className="text-white">{percent0}% {event.outcomes[0] || 'Yes'}</span>
                          </div>
                          
                          <div className="mb-6 flex h-1.5 w-full overflow-hidden rounded-full bg-[#1a1a1a] border border-[#ffffff05]">
                            <div className="bg-[#D9C5A0] transition-all duration-500" style={{ width: `${percent0}%` }} />
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-[#ffffff10]">
                            <div>
                               <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Pool Size</p>
                               <p className="text-lg font-bold tracking-tight text-white">{totalPoolVolume.toLocaleString()} KSh</p>
                            </div>
                            <button className="rounded-lg bg-[#C5A880] px-6 py-2.5 text-xs font-black uppercase tracking-widest text-[#0a0a0a] transition hover:bg-[#a3885c] shadow-md">
                              Trade Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* --- EVENT DETAIL VIEW (v0 Kalshi Layout) --- */}
        {activeView === 'eventDetail' && selectedEventId && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {(() => {
              const event = events.find(e => e.id === selectedEventId);
              if (!event) return null;
              
              const eventDateStr = event.closes_at || event.locks_at || '';
              const lockTime = new Date(eventDateStr).getTime();
              const isLocked = !isNaN(lockTime) && lockTime <= Date.now();
              
              const eventBets = bets.filter(b => b.event_id === event.id && b.status === 'open');
              const totalPoolVolume = eventBets.reduce((sum, b) => sum + b.stake, 0);
              const outcomeVolume0 = eventBets.filter(b => b.outcome_index === 0).reduce((sum, b) => sum + b.stake, 0);
              const percent0 = totalPoolVolume === 0 ? 50 : Math.round((outcomeVolume0 / totalPoolVolume) * 100);
              
              const impliedOdds = friendStake > 0 ? ((poolStake + friendStake) / friendStake).toFixed(1) : '1.0';

              return (
                <div className="mx-auto max-w-[1400px]">
                  <button 
                    onClick={() => setActiveView('markets')}
                    className="mb-8 text-xs font-bold uppercase tracking-widest text-[#666] transition-colors hover:text-white flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to Markets
                  </button>
                  
                  <div className="grid gap-12 lg:grid-cols-3 items-start">
                    
                    {/* LEFT COLUMN: GRAPH & CHAT */}
                    <div className="lg:col-span-2">
                      <h1 className="mb-8 text-4xl font-black leading-tight text-white lg:text-5xl">
                        {event.title}
                      </h1>
                      
                      {/* Kalshi Step Graph */}
                      <div className="relative mb-6 h-80 overflow-hidden border-b border-[#1F1F1F] bg-[#0D0D0D]">
                        <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-gray-600 font-mono text-right pr-2 py-2 z-10 pointer-events-none">
                          <span>14¢</span><span>12¢</span><span>10¢</span><span>8¢</span><span>6¢</span>
                        </div>
                        
                        <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="w-full h-full">
                          <defs>
                            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M0,130 H20 V140 H40 V110 H60 V110 H80 V120 H100 V120 H120 V80 H150 V80 H180 V100 H200 V100 H220 V50 H260 V50 H280 V70 H300 V70 H320 V40 H360 V60 H400 V200 L0,200 Z" fill="url(#greenGradient)" />
                          <path d="M0,160 H20 V150 H40 V180 H60 V180 H80 V170 H100 V170 H120 V190 H150 V190 H180 V170 H200 V170 H220 V195 H260 V195 H280 V180 H300 V180 H320 V190 H360 V170 H400" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
                          <path d="M0,130 H20 V140 H40 V110 H60 V110 H80 V120 H100 V120 H120 V80 H150 V80 H180 V100 H200 V100 H220 V50 H260 V50 H280 V70 H300 V70 H320 V40 H360 V60 H400" fill="none" stroke="#10b981" strokeWidth="2.5" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                          <circle cx="400" cy="60" r="4" fill="#10b981" className="animate-pulse" />
                        </svg>

                        {/* Animated Liquidity Popups */}
                        <div className="absolute top-[30%] left-[40%] text-[#10b981] px-2 py-0.5 font-mono text-[11px] font-bold animate-liquidity-pop">+ 375 KSh</div>
                        <div className="absolute top-[10%] left-[80%] text-[#10b981] px-2 py-0.5 font-mono text-[11px] font-bold animate-liquidity-pop" style={{animationDelay: '1s'}}>+ 1,068 KSh</div>
                        <div className="absolute top-[40%] left-[20%] text-[#10b981] px-2 py-0.5 font-mono text-[11px] font-bold animate-liquidity-pop" style={{animationDelay: '2.5s'}}>+ 500 KSh</div>
                      </div>
                      
                      <div className="flex justify-between items-end mb-8">
                        <div>
                          <span className="text-3xl font-bold text-[#D9C5A0]">{percent0}%</span><br/>
                          <span className="text-gray-400 text-sm">{event.outcomes[0] || 'Yes'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-bold text-[#3b82f6]">{100 - percent0}%</span><br/>
                          <span className="text-gray-400 text-sm">{event.outcomes[1] || 'No'}</span>
                        </div>
                      </div>
                      
                      <div className="mb-8">
                        <p className="text-sm font-bold uppercase tracking-widest text-[#666]">Current Pool Size</p>
                        <p className="text-4xl font-bold text-[#D9C5A0]">{totalPoolVolume.toLocaleString()} <span className="text-xl">KSh</span></p>
                      </div>
                      
                      {/* Live Warzone Chat */}
                      <div className="border border-[#1F1F1F] bg-[#111111] rounded-2xl overflow-hidden mt-8">
                        <div className="bg-[#0a0a0a] border-b border-[#1F1F1F] p-4 flex justify-between items-center">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">Live Warzone Chat</h3>
                          <button onClick={() => setChatEventId(event.id)} className="bg-[#1F1F1F] text-[#D9C5A0] text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider hover:bg-[#333333]">Open Global</button>
                        </div>
                        <div className="max-h-64 overflow-y-auto p-4 space-y-2 no-scrollbar">
                           {eventBets.slice(-6).reverse().map((b, i) => {
                             const p = allProfiles.find(prof => prof.id === b.user_id);
                             return (
                               <div key={i} className="rounded-xl bg-[#1a1a1a] border border-[#ffffff0a] px-4 py-2.5 text-sm">
                                  <span className="font-bold text-[#D9C5A0]">{p ? sanitizeName(p.username) : 'Anon'}</span>
                                  <span className="text-gray-400"> matched </span>
                                  <span className="text-white">{b.stake.toLocaleString()} KSh</span>
                                  <span className={`font-bold ml-1 ${b.outcome_index === 0 ? 'text-[#10b981]' : 'text-[#3b82f6]'}`}>
                                    {event.outcomes[b.outcome_index]}
                                  </span>
                               </div>
                             )
                           })}
                           {eventBets.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No liquidity matched yet.</p>}
                        </div>
                        <div className="flex border-t border-[#1F1F1F] bg-[#0a0a0a] p-2">
                          <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-[#111] rounded-xl px-4 py-3 text-sm text-white placeholder-[#444] border border-[#1F1F1F] focus:border-[#D9C5A0] focus:outline-none"/>
                          <button onClick={() => {setChatEventId(event.id); sendChatMessage()}} className="px-4 text-[#D9C5A0] transition-colors hover:text-white"><Send className="h-5 w-5" /></button>
                        </div>
                      </div>
                    </div>
                    
                    {/* RIGHT COLUMN: TRADE SLIP */}
                    <div className="lg:col-span-1">
                      <div className="sticky top-24">
                        <div className={`border border-[#1F1F1F] rounded-3xl overflow-hidden shadow-2xl ${betMode === "p2p" ? "bg-[#1a0a0c]" : "bg-[#151515]"}`}>
                          
                          <div className="flex bg-[#0D0D0D] p-1 m-2 rounded-xl border border-[#1F1F1F]">
                            <button onClick={() => setBetMode("pool")} className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider transition-colors rounded-lg ${betMode === "pool" ? "bg-[#333] text-white shadow-md" : "bg-transparent text-[#666] hover:text-white"}`}>Pool</button>
                            <button onClick={() => setBetMode("p2p")} className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider transition-colors rounded-lg ${betMode === "p2p" ? "bg-[#f43f5e] text-white shadow-md" : "bg-transparent text-[#666] hover:text-white"}`}>Duel</button>
                          </div>
                          
                          <div className="p-6 pt-4">
                            {isLocked ? (
                              <div className="py-8 text-center border border-dashed border-red-500/30 rounded-2xl bg-red-500/5">
                                <h4 className="text-red-500 font-black uppercase tracking-widest mb-1">Market Locked</h4>
                                <p className="text-gray-400 text-xs">Awaiting final resolution.</p>
                              </div>
                            ) : betMode === "p2p" ? (
                              <div className="animate-in fade-in duration-200">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Swords className="w-5 h-5 text-[#f43f5e]" /> Duel</h3>
                                <div className="mb-4">
                                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f43f5e]/70">You Risk (KSh)</label>
                                  <input type="number" value={poolStake || ''} onChange={(e) => setPoolStake(Number(e.target.value))} placeholder="5000" className="w-full rounded-xl border border-[#f43f5e]/30 bg-[#0D0D0D] py-4 px-4 text-xl font-bold text-white focus:border-[#f43f5e] focus:outline-none" />
                                </div>
                                <div className="mb-6">
                                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f43f5e]/70">Opponent Pays (KSh)</label>
                                  <input type="number" value={friendStake || ''} onChange={(e) => setFriendStake(Number(e.target.value))} placeholder="5000" className="w-full rounded-xl border border-[#f43f5e]/30 bg-[#0D0D0D] py-4 px-4 text-xl font-bold text-[#f43f5e] focus:border-[#f43f5e] focus:outline-none" />
                                </div>
                                <div className="mb-6 border-t border-[#1F1F1F] pt-4 grid grid-cols-3 gap-2 text-center">
                                  <div><p className="text-[10px] text-[#666] uppercase font-bold">Implied Odds</p><p className="text-sm font-bold text-[#f43f5e]">{impliedOdds}x</p></div>
                                  <div><p className="text-[10px] text-[#666] uppercase font-bold">Total Pot</p><p className="text-sm font-bold text-white">{(poolStake + friendStake).toLocaleString()}</p></div>
                                  <div><p className="text-[10px] text-[#666] uppercase font-bold">Pot. Profit</p><p className="text-sm font-bold text-[#10b981]">+{friendStake.toLocaleString()}</p></div>
                                </div>
                                <button onClick={submitDuel} disabled={poolStake < MIN_STAKE || friendStake < MIN_STAKE} className="flex w-full rounded-xl items-center justify-center gap-2 bg-[#f43f5e] py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#e11d48] disabled:opacity-50">
                                  <Link2 className="h-4 w-4" /> Generate Challenge Link
                                </button>
                              </div>
                            ) : (
                              <div className="animate-in fade-in duration-200">
                                <div className="mb-6 flex gap-3">
                                  <button onClick={() => setSelectedOutcomeIdx(0)} className={`flex-1 rounded-xl py-3.5 text-lg font-bold transition-all border ${selectedOutcomeIdx === 0 ? 'bg-[#D9C5A0] border-[#D9C5A0] text-[#0D0D0D] shadow-[0_0_20px_rgba(217,197,160,0.2)]' : 'border-[#1F1F1F] bg-[#2A2A2A] text-gray-400'}`}>Buy YES</button>
                                  <button onClick={() => setSelectedOutcomeIdx(1)} className={`flex-1 rounded-xl py-3.5 text-lg font-bold transition-all border ${selectedOutcomeIdx === 1 ? 'bg-[#3b82f6] border-[#3b82f6] text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'border-[#1F1F1F] bg-[#2A2A2A] text-gray-400'}`}>Buy NO</button>
                                </div>
                                <div className="mb-4">
                                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#666]">Amount (KSh)</label>
                                  <div className="relative">
                                    <input type="number" value={poolStake || ''} onChange={(e) => setPoolStake(Number(e.target.value))} placeholder="0" className="w-full rounded-xl border border-[#1F1F1F] bg-[#0D0D0D] py-4 pl-4 pr-32 text-xl font-bold text-white focus:border-[#D9C5A0] focus:outline-none" />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                      <button onClick={() => setPoolStake((prev) => prev + 1000)} className="bg-[#2A2A2A] hover:bg-[#333] text-gray-300 text-[10px] font-bold px-2 py-1.5 rounded-md transition">+1K</button>
                                      <button onClick={() => setPoolStake((prev) => prev + 5000)} className="bg-[#2A2A2A] hover:bg-[#333] text-gray-300 text-[10px] font-bold px-2 py-1.5 rounded-md transition">+5K</button>
                                      <button onClick={() => setPoolStake((prev) => prev + 10000)} className="bg-[#2A2A2A] hover:bg-[#333] text-gray-300 text-[10px] font-bold px-2 py-1.5 rounded-md transition">+10K</button>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-between text-sm mb-6">
                                   <span className="text-gray-500">Est. Payout: <span className="text-white font-bold ml-1">{calculateEstPayout(selectedEventId, selectedOutcomeIdx || 0, poolStake, false).toLocaleString()} KSh</span></span>
                                   <span className="text-gray-500">Protocol Fee: <span className="text-white">3%</span></span>
                                </div>
                                <button onClick={() => submitPoolBet()} disabled={poolStake < MIN_STAKE || selectedOutcomeIdx === null} className="w-full rounded-xl bg-[#D9C5A0] py-4 text-sm font-bold uppercase tracking-wider text-[#0D0D0D] transition-colors hover:bg-[#c9b590] disabled:opacity-50">
                                  Submit Pool Order
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* --- WALLET, WAGERS, LEADERBOARD (Keeping original logic, restyling slightly) --- */}
        {/* ... Rest of your views are intact below ... */}

        {activeView === 'wallet' && (
          <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-white">Cashier & Profile</h2>
              <div className="flex gap-2">
                <button onClick={() => { setNewUsername(sanitizeName(profile?.username)); setNewAvatar(profile?.avatar || '🦊'); setShowProfileSetup(true); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-[#151515] border-[#1F1F1F] text-gray-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition">Edit Identity</button>
                <button onClick={togglePrivacy} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition ${profile?.is_public ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-[#151515] border-[#1F1F1F] text-gray-400'}`}>
                  {profile?.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} {profile?.is_public ? 'Public' : 'Private'}
                </button>
              </div>
            </div>
            <div className="bg-[#111111] border border-[#1F1F1F] rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl">
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-2 relative z-10 flex items-center gap-2">Available Balance</p>
              <h1 className="text-5xl font-extrabold text-white mb-1 relative z-10 tracking-tight">{profile?.wallet_balance.toLocaleString()} <span className="text-2xl text-[#D9C5A0]">KSh</span></h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
              <div className="bg-[#111111] border border-[#1F1F1F] rounded-2xl p-6 relative overflow-hidden group hover:border-[#D9C5A0]/30 transition">
                <div className="flex items-center gap-3 mb-6 relative z-10"><div className="w-10 h-10 rounded-lg bg-[#D9C5A0]/10 flex items-center justify-center border border-[#D9C5A0]/20"><ArrowDownToLine className="w-5 h-5 text-[#D9C5A0]" /></div><h3 className="text-lg font-bold">Deposit</h3></div>
                <div className="space-y-4 relative z-10">
                  <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">M-Pesa Number</label><input type="tel" placeholder="07XXXXXXXX" value={depositPhone} onChange={e => setDepositPhone(e.target.value.replace(/\D/g, '').substring(0,10))} className="w-full bg-[#0D0D0D] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#D9C5A0] font-mono tracking-wider" /></div>
                  <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Amount (KSh)</label><input type="number" value={depositAmount || ''} onChange={e => setDepositAmount(Number(e.target.value))} className="w-full bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-3 focus:outline-none focus:border-[#D9C5A0] font-bold text-white" /></div>
                  <button onClick={handleDeposit} disabled={isDepositing} className="w-full bg-[#D9C5A0]/10 border border-[#D9C5A0]/30 hover:bg-[#D9C5A0] text-[#D9C5A0] hover:text-[#0D0D0D] font-bold py-3.5 rounded-xl transition">{isDepositing ? 'Requesting...' : 'Send STK Push'}</button>
                </div>
              </div>
              <div className="bg-[#111111] border border-[#1F1F1F] rounded-2xl p-6 relative overflow-hidden group hover:border-[#10b981]/30 transition">
                <div className="flex items-center gap-3 mb-6 relative z-10"><div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center border border-[#10b981]/20"><ArrowUpFromLine className="w-5 h-5 text-[#10b981]" /></div><h3 className="text-lg font-bold">Withdraw</h3></div>
                <div className="space-y-4 relative z-10">
                  <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">M-Pesa Number</label><input type="tel" placeholder="07XXXXXXXX" value={withdrawPhone} onChange={e => setWithdrawPhone(e.target.value.replace(/\D/g, '').substring(0,10))} className="w-full bg-[#0D0D0D] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#10b981] font-mono tracking-wider" /></div>
                  <div><div className="flex justify-between items-center mb-1"><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount (KSh)</label></div><input type="number" value={withdrawAmount || ''} onChange={e => setWithdrawAmount(Number(e.target.value))} className="w-full bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-3 focus:outline-none focus:border-[#10b981] font-bold text-white" /></div>
                  <button onClick={handleWithdraw} className="w-full bg-[#10b981]/10 border border-[#10b981]/30 hover:bg-[#10b981] text-[#10b981] hover:text-[#0D0D0D] font-bold py-3.5 rounded-xl transition">Request Payout</button>
                </div>
              </div>
              <div className={`bg-[#111111] border border-[#1F1F1F] rounded-2xl p-6 relative overflow-hidden transition md:col-span-2 lg:col-span-1 ${profile?.has_claimed_airdrop ? 'opacity-60 grayscale' : 'hover:border-[#D9C5A0]/30'}`}>
                <div className="flex items-center gap-3 mb-4 relative z-10"><div className="w-10 h-10 rounded-lg bg-[#D9C5A0]/10 flex items-center justify-center border border-[#D9C5A0]/20"><ArrowDownToLine className="w-5 h-5 text-[#D9C5A0]" /></div><h3 className="text-lg font-bold">Initial Airdrop</h3></div>
                <div className="space-y-4 relative z-10">
                  <p className="text-sm text-gray-400 font-light mb-4">Claim your starting capital of 10,000 KSh. <span className="text-white font-semibold">This can only be claimed once.</span></p>
                  <button onClick={handleAirdrop} disabled={profile?.has_claimed_airdrop} className={`w-full font-bold py-3.5 rounded-xl transition ${profile?.has_claimed_airdrop ? 'bg-[#0D0D0D] border border-[#1F1F1F] text-gray-600' : 'bg-[#D9C5A0]/10 border border-[#D9C5A0]/30 text-[#D9C5A0] hover:bg-[#D9C5A0] hover:text-[#0D0D0D]'}`}>
                    {profile?.has_claimed_airdrop ? 'Airdrop Claimed' : 'Claim 10,000 KSh'}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4"><History className="w-5 h-5 text-gray-500" /><h3 className="text-lg font-bold text-white">Transaction Ledger</h3></div>
              <div className="bg-[#111111] border border-[#1F1F1F] rounded-2xl overflow-hidden">
                {ledgerTransactions.length === 0 ? <div className="p-8 text-center text-gray-500 font-light">No financial transactions recorded yet.</div> : (
                  <div className="divide-y divide-[#1F1F1F]">
                    {ledgerTransactions.map((tx) => {
                      const isPositive = ['deposit', 'payout', 'refund'].includes(tx.type)
                      return (
                        <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-[#1a1a1a] transition">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isPositive ? 'bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]' : 'bg-[#f43f5e]/10 border-[#f43f5e]/20 text-[#f43f5e]'}`}>{isPositive ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}</div>
                            <div><p className="text-white font-semibold text-sm sm:text-base capitalize">{tx.type}</p><p className="text-gray-500 text-xs mt-0.5">{new Date(tx.created_at).toLocaleString()}</p></div>
                          </div>
                          <div className="text-right"><p className={`font-bold ${isPositive ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>{isPositive ? '+' : '-'}{tx.message.match(/\d+/) ? tx.message.match(/\d+/)?.[0] : ''} KSh</p><p className="text-gray-600 text-xs font-mono mt-0.5">TxID: {tx.id.substring(0, 8)}</p></div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'leaderboard' && (
          <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
            <div className="bg-[#111111] border border-[#1F1F1F] rounded-3xl overflow-hidden shadow-2xl">
              <div className="grid grid-cols-12 gap-4 p-5 border-b border-[#1F1F1F] bg-[#0D0D0D] text-xs font-bold text-gray-500 uppercase tracking-widest">
                <div className="col-span-2 text-center">Rank</div>
                <div className="col-span-6">Trader Identity</div>
                <div className="col-span-4 text-right">Net Value (KSh)</div>
              </div>
              <div className="divide-y divide-[#1F1F1F]">
                {sortedLeaderboard.map((user, index) => (
                  <div key={user.id} onClick={() => setSelectedPublicProfile(user)} className={`grid grid-cols-12 gap-4 p-5 items-center transition cursor-pointer hover:bg-[#1a1a1a] ${session?.user?.id === user.id ? 'bg-[#D9C5A0]/5' : ''}`}>
                    <div className="col-span-2 flex justify-center text-gray-500 font-bold">{index + 1}</div>
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0D0D0D] border border-[#1F1F1F] flex items-center justify-center text-xl shadow-inner">{user.avatar || '👤'}</div>
                      <div>
                        <span className={`font-bold block ${session?.user?.id === user.id ? 'text-[#D9C5A0]' : 'text-white'}`}>
                          {sanitizeName(user.username)} {session?.user?.id === user.id && '(You)'}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-4 text-right"><span className="font-black text-lg font-mono text-white">{user.wallet_balance.toLocaleString()}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'wagers' && (
           <div className="space-y-10 animate-in fade-in duration-300">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#111111] border border-[#1F1F1F] rounded-2xl p-5 flex flex-col justify-center">
                <p className="text-[#D9C5A0] text-sm font-semibold uppercase tracking-widest mb-2">Total Active Stake</p>
                <p className="text-3xl font-black text-white">{totalActiveStake.toLocaleString()} KSh</p>
              </div>
              <div className="bg-[#111111] border border-[#1F1F1F] rounded-2xl p-5 flex flex-col justify-center">
                <p className="text-[#10b981] text-sm font-semibold uppercase tracking-widest mb-2">Total Est. Payout</p>
                <p className="text-3xl font-black text-white">{totalEstPayout.toLocaleString()} KSh</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Open Predictions</h3>
              {myActiveWagers.length === 0 ? <div className="py-16 text-center text-gray-500 border border-dashed border-[#1F1F1F] rounded-2xl">No active predictions in the market.</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {myActiveWagers.reverse().map((bet, i) => {
                    const event = events.find(e => e.id === bet.event_id); if (!event) return null
                    const estNetPayout = calculateEstPayout(event.id, bet.outcome_index, bet.stake, true) 
                    return (
                      <div key={i} className="bg-[#111111] border border-[#D9C5A0]/40 rounded-3xl p-6 transition relative overflow-hidden shadow-lg">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#1F1F1F] relative z-10">
                          <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Status</p><p className="font-bold text-[#10b981] text-sm flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span> Live in Pool</p></div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-4 relative z-10 leading-tight">{event.title}</h3>
                        <div className="bg-[#0D0D0D] rounded-xl p-4 border border-[#1F1F1F] mb-4 relative z-10 text-center"><div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Your Prediction</div><div className="text-[#D9C5A0] font-bold text-lg">{event.outcomes[bet.outcome_index]}</div></div>
                        <div className="space-y-2 text-sm relative z-10">
                          <div className="flex justify-between text-gray-400"><span>Your Stake:</span><span className="text-white">{bet.stake.toLocaleString()} KSh</span></div>
                          <div className="flex justify-between font-bold pt-3 border-t border-[#1F1F1F] mt-3"><span className="text-[#10b981] uppercase tracking-wider text-xs flex items-center">Est. Payout:</span><span className="text-[#10b981] text-xl">{estNetPayout.toLocaleString()} KSh</span></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><History className="w-4 h-4" /> Settled History</h3>
              {mySettledWagers.length === 0 ? <div className="py-10 text-center text-gray-500 border border-dashed border-[#1F1F1F] rounded-2xl">No settled history yet.</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {mySettledWagers.reverse().map((bet, i) => {
                    const event = events.find(e => e.id === bet.event_id); if (!event) return null
                    const isWin = bet.status === 'won'; const isRefund = bet.status === 'refunded'
                    const historicalPayout = isWin ? calculateEstPayout(event.id, bet.outcome_index, bet.stake, true) : isRefund ? bet.stake : 0
                    return (
                      <div key={i} className={`bg-[#111111] border rounded-3xl p-6 relative overflow-hidden transition hover:scale-[1.02] ${isWin ? 'border-[#10b981]/50 shadow-lg' : isRefund ? 'border-gray-600' : 'border-[#f43f5e]/20 opacity-70'}`}>
                        <div className="flex items-start justify-between mb-4 relative z-10"><span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${isWin ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : isRefund ? 'bg-[#1F1F1F] border-gray-600 text-gray-400' : 'bg-[#f43f5e]/10 border-[#f43f5e]/30 text-[#f43f5e]'}`}>{isWin ? 'WINNER 🏆' : isRefund ? 'REFUNDED' : 'LOST ❌'}</span></div>
                        <h3 className={`text-lg font-bold mb-4 relative z-10 ${isWin ? 'text-white' : 'text-gray-400'}`}>{event.title}</h3>
                        <div className="flex justify-between font-bold pt-3 border-t border-[#1F1F1F] mt-3 relative z-10"><span className="text-gray-500">Payout:</span><span className={`text-lg ${isWin ? 'text-[#10b981]' : isRefund ? 'text-gray-400' : 'text-[#f43f5e]'}`}>{isWin ? `+ ${historicalPayout.toLocaleString()} KSh` : isRefund ? `${historicalPayout.toLocaleString()} KSh` : '0 KSh'}</span></div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
           </div>
        )}
      </main>

      {/* --- CHAT AND OVERLAY MODALS --- */}
      {chatEventId && activeView !== 'eventDetail' && (
        <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm sm:p-4 animate-in slide-in-from-bottom-full duration-300">
          <div className="bg-[#111111] sm:border border-[#1F1F1F] sm:rounded-3xl w-full max-w-md h-[80vh] sm:h-[600px] flex flex-col relative rounded-t-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#1F1F1F] flex justify-between items-center bg-[#0D0D0D]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#f43f5e]" />
                  <h3 className="font-bold text-white text-sm uppercase tracking-widest">Global Warzone</h3>
                </div>
                <button onClick={() => setChatEventId(null)} className="text-gray-500 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4 no-scrollbar">
              {chatMessages.length === 0 ? <div className="text-center text-gray-500 text-xs uppercase tracking-widest mt-10">No trash talk yet. Be the first.</div> : chatMessages.map(msg => {
                  const isMe = msg.user_id === session?.user?.id
                  const msgProfile = allProfiles.find(p => p.id === msg.user_id)
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">{msgProfile?.avatar || '👤'} {sanitizeName(msgProfile?.username)}</span>
                      <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${isMe ? 'bg-[#f43f5e]/20 border border-[#f43f5e]/30 text-white rounded-tr-sm' : 'bg-[#1F1F1F] border border-[#1F1F1F] text-gray-300 rounded-tl-sm'}`}>{msg.text}</div>
                    </div>
                  )
              })}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-[#1F1F1F] bg-[#0D0D0D] flex gap-2">
               <input type="text" placeholder="Talk your talk..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage()} className="flex-grow bg-[#151515] border border-[#1F1F1F] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#f43f5e] text-sm" />
               <button onClick={sendChatMessage} className="w-12 flex items-center justify-center bg-[#f43f5e] hover:bg-[#e11d48] text-white rounded-xl transition shadow-lg"><Send className="w-4 h-4 ml-1" /></button>
            </div>
          </div>
        </div>
      )}

      {selectedPublicProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={() => setSelectedPublicProfile(null)}>
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-3xl p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPublicProfile(null)} className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#1F1F1F] flex items-center justify-center text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            <div className="w-24 h-24 rounded-full bg-[#0D0D0D] border-2 border-[#D9C5A0]/30 flex items-center justify-center text-5xl mx-auto mb-4 shadow-inner">{selectedPublicProfile.avatar}</div>
            <h3 className="text-2xl font-black text-white mb-1">{sanitizeName(selectedPublicProfile.username)}</h3>
            {!selectedPublicProfile.is_public && selectedPublicProfile.id !== session?.user?.id ? (
              <div className="mt-8 py-8 bg-[#0D0D0D] rounded-2xl border border-[#1F1F1F]"><EyeOff className="w-8 h-8 text-gray-600 mx-auto mb-3" /><p className="text-gray-500 font-semibold text-sm">This trader's stats are private.</p></div>
            ) : (
              <div className="mt-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl p-4"><p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Win Rate</p><p className="text-2xl font-black text-white">{getUserStats(selectedPublicProfile.id).winRate}%</p></div>
                  <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl p-4"><p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Trades</p><p className="text-2xl font-black text-white">{getUserStats(selectedPublicProfile.id).trades}</p></div>
                </div>
                <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl p-4 flex justify-between items-center"><p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Active Risk</p><p className="text-lg font-bold text-[#f43f5e]">{getUserStats(selectedPublicProfile.id).activeRisk.toLocaleString()} KSh</p></div>
              </div>
            )}
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-[#10b981]/30 rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#10b981]/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#10b981]/10 border border-[#10b981]/40 text-[#10b981] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"><CheckCircle2 className="w-8 h-8" /></div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight uppercase">Position Secured</h3>
              <p className="text-gray-400 text-sm mb-6 font-light">Your capital is locked in the pool.</p>
              <div className="space-y-2">
                <button onClick={copyChallengeLink} className="w-full bg-[#D9C5A0] text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-all uppercase text-xs tracking-widest shadow-xl">
                  <Share2 className="w-4 h-4"/> Share Challenge Link
                </button>
                <button onClick={() => setShowSuccessModal(false)} className="w-full bg-[#1F1F1F] hover:bg-[#333] border border-[#1F1F1F] text-white font-bold py-3.5 rounded-xl transition uppercase text-[10px] tracking-widest">Return to Exchange</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-3xl p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#f43f5e]/10 border border-[#f43f5e]/30 text-[#f43f5e] rounded-2xl flex items-center justify-center mx-auto mb-5"><LogOut className="w-7 h-7 ml-1" /></div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Disconnect?</h3>
              <div className="flex gap-3 justify-center mt-6">
                <button onClick={() => setShowLogoutModal(false)} className="w-1/2 bg-[#1F1F1F] hover:bg-[#333] border border-[#1F1F1F] text-white font-semibold py-3.5 rounded-xl transition">Cancel</button>
                <button onClick={handleLogout} className="w-1/2 bg-[#f43f5e]/10 border border-[#f43f5e]/30 hover:bg-[#f43f5e] text-[#f43f5e] hover:text-white font-bold py-3.5 rounded-xl transition">Disconnect</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-up-fade {
          0% { opacity: 0; transform: translateY(10px) scale(0.9); }
          20% { opacity: 1; transform: translateY(0px) scale(1); }
          80% { opacity: 1; transform: translateY(-15px) scale(1); }
          100% { opacity: 0; transform: translateY(-25px) scale(0.9); }
        }
        .animate-liquidity-pop { animation: float-up-fade 2.5s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  )
}
