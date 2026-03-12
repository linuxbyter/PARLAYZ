import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import Landing from './Landing'
import { LogOut, X, AlertTriangle, Bell, Wallet, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, History, Trophy, Activity, Eye, EyeOff, PieChart, Share2, Swords, MessageSquare, Send, ChevronLeft, HelpCircle } from 'lucide-react'

// V2 Interfaces - Bulletproofed
interface Event { id: string; title: string; description: string; category: string; outcomes: string[]; closes_at?: string; locks_at?: string; created_at: string; resolved: boolean }
interface Bet { id: string; event_id: string; outcome_index: number; stake: number; status: string; user_id: string; }
interface Profile { id: string; username: string; wallet_balance: number; avatar: string; has_claimed_airdrop: boolean; is_public: boolean; phone_number?: string }
interface AppNotification { id: string; user_id: string; message: string; type: string; is_read: boolean; created_at: string }

const MIN_STAKE = 200
const PLATFORM_FEE_PERCENT = 3
const AVATARS = ['🦊', '🐯', '🦅', '🦈', '🐍', '🦍', '🐉', '🦂', '🦉', '🐺']
const ORB_COLORS = ['197, 168, 128', '16, 185, 129', '244, 63, 94', '59, 130, 246'] 

// --- BULLETPROOF LIVE TIMER COMPONENT ---
const LiveTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState('')
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    const calculateTime = () => {
      if (!targetDate) { setTimeLeft('TBA'); setIsLocked(false); return }
      const lockTime = new Date(targetDate).getTime()
      if (isNaN(lockTime)) { setTimeLeft('TBA'); setIsLocked(false); return }
      const distance = lockTime - Date.now()
      if (distance <= 0) {
        setIsLocked(true); setTimeLeft('LOCKED')
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

  if (isLocked) return <span className="text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md">🔒 CLOSED</span>
  return <span className="text-[10px] font-bold text-[#C5A880] bg-[#C5A880]/10 border border-[#C5A880]/20 px-2 py-1 rounded-md animate-pulse">⏳ {timeLeft}</span>
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // Betting States
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = useState<number | null>(null)
  const [poolStake, setPoolStake] = useState<number>(MIN_STAKE)
  const [betMode, setBetMode] = useState<'pool' | 'p2p'>('pool')
  const [friendStake, setFriendStake] = useState<number>(MIN_STAKE)
  
  // --- DEEP LINK & CHAT & MODALS ---
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
  
  // Cashier States
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
      const bCh = supabase.channel('bets_channel').on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, () => { fetchBets(); fetchProfile(); fetchAllProfiles() }).subscribe()
      const pCh = supabase.channel('profiles_channel').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { fetchAllProfiles() }).subscribe()
      const nCh = supabase.channel('notifs_channel').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, () => fetchNotifications()).subscribe()
      const eCh = supabase.channel('events_channel').on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => { fetchEvents() }).subscribe()
      return () => { bCh.unsubscribe(); nCh.unsubscribe(); pCh.unsubscribe(); eCh.unsubscribe() }
    }
  }, [session])

  useEffect(() => {
    if (session?.user && events.length > 0) {
      const urlParams = new URLSearchParams(window.location.search)
      const dEv = urlParams.get('duel'); const dSd = urlParams.get('side'); const dSt = urlParams.get('stake'); const cId = urlParams.get('challenger')
      if (dEv && dSd && dSt && cId !== session.user.id) {
        setDuelData({ eventId: dEv, side: Number(dSd), stake: Number(dSt), challengerId: cId || '' })
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
    const cSub = supabase.channel('chat_channel').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'arena_messages', filter: `event_id=eq.${chatEventId}` }, (payload) => {
        setChatMessages(prev => [...prev, payload.new])
    }).subscribe()
    return () => { cSub.unsubscribe() }
  }, [chatEventId])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [chatMessages, chatEventId])

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !chatEventId || !session?.user) return
    const msg = chatInput.trim(); setChatInput('') 
    await supabase.from('arena_messages').insert({ event_id: chatEventId, user_id: session.user.id, text: msg })
  }

  const fetchData = async () => {
    await Promise.all([fetchProfile(), fetchAllProfiles(), fetchEvents(), fetchBets(), fetchNotifications()])
    setLoading(false)
  }

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) { setProfile(data); if (data.username === session.user.email || !data.username) setShowProfileSetup(true) }
  }

  const fetchAllProfiles = async () => { const { data } = await supabase.from('profiles').select('*'); if (data) setAllProfiles(data) }
  const fetchEvents = async () => { const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false }); if (data) setEvents(data) }
  const fetchBets = async () => { const { data } = await supabase.from('bets').select('*'); if (data) setBets(data) }
  const fetchNotifications = async () => { const { data } = await supabase.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }); if (data) setNotifications(data) }

  const handleUpdateProfile = async () => {
    if (newUsername.length < 3) return showToast('Username must be at least 3 characters.')
    await supabase.from('profiles').update({ username: newUsername, avatar: newAvatar }).eq('id', session.user.id)
    setShowProfileSetup(false); fetchProfile(); fetchAllProfiles()
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
    if (!/^(07|01)\d{8}$/.test(depositPhone)) return showToast("Invalid format. Use 07... or 01...")
    setIsDepositing(true)
    try {
      const res = await fetch('/api/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: depositAmount, phone: depositPhone, email: session.user.email }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast("STK Push Sent! Enter PIN on your phone.", "success")
        if (!profile?.phone_number) await supabase.from('profiles').update({ phone_number: depositPhone }).eq('id', session.user.id)
      } else showToast(data.message || "M-Pesa trigger failed.")
    } catch (err) { showToast("Network error. Try again.") } finally { setIsDepositing(false) }
  }

  const handleAirdrop = async () => {
    if (!profile || profile.has_claimed_airdrop) return showToast("Airdrop already claimed.")
    setShowCashierModal({ type: 'deposit', status: 'processing' })
    setTimeout(async () => {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance + 10000, has_claimed_airdrop: true }).eq('id', session.user.id)
      await supabase.from('notifications').insert({ user_id: session.user.id, message: `Airdrop of 10,000 KSh secured.`, type: 'deposit', is_read: false })
      fetchData(); setShowCashierModal({ type: 'deposit', status: 'success' })
    }, 2000)
  }

  const handleWithdraw = async () => {
    if (withdrawAmount < 100) return showToast("Min withdraw 100 KSh.")
    if (profile && withdrawAmount > profile.wallet_balance) return showToast("Insufficient funds.")
    if (!/^(07|01)\d{8}$/.test(withdrawPhone)) return showToast("Invalid phone format.")
    setShowCashierModal({ type: 'withdraw', status: 'processing' })
    setTimeout(async () => {
      if (profile) {
        await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - withdrawAmount }).eq('id', session.user.id)
        await supabase.from('notifications').insert({ user_id: session.user.id, message: `Withdrawal of ${withdrawAmount} KSh to ${withdrawPhone} initiated.`, type: 'withdrawal', is_read: false })
        fetchData(); setShowCashierModal({ type: 'withdraw', status: 'success' }); setWithdrawAmount(0); setWithdrawPhone('')
      }
    }, 2500)
  }

  const submitDuel = async () => {
    if (!selectedEventId || selectedOutcomeIdx === null || !session?.user || !profile) return
    if (profile.wallet_balance < poolStake) return showToast('Insufficient balance.')
    if (poolStake < MIN_STAKE || friendStake < MIN_STAKE) return showToast(`Min stake is ${MIN_STAKE} KSh.`)
    const { error } = await supabase.from('duels').insert({
      event_id: selectedEventId, creator_id: session.user.id, creator_outcome_index: selectedOutcomeIdx,
      creator_stake: poolStake, required_challenger_stake: friendStake, status: 'open'
    })
    if (!error) {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - poolStake }).eq('id', session.user.id)
      setLastBet({ eventId: selectedEventId, outcomeIdx: selectedOutcomeIdx, stake: poolStake })
      setDuelData(null); setShowSuccessModal(true); setSelectedEventId(''); setSelectedOutcomeIdx(null); setPoolStake(MIN_STAKE); setActiveView('markets');
    } else showToast('Duel creation failed.')
  }

  const submitPoolBet = async (overrideE?: string, overrideO?: number, overrideS?: number) => {
    const eId = overrideE || selectedEventId; const oIdx = overrideO !== undefined ? overrideO : selectedOutcomeIdx; const stake = overrideS || poolStake
    if (!eId || oIdx === null || !session?.user || !profile) return
    if (profile.wallet_balance < stake) return showToast('Insufficient balance.')
    if (stake < MIN_STAKE) return showToast(`Min stake ${MIN_STAKE} KSh.`)
    const { error } = await supabase.from('bets').insert({ event_id: eId, outcome_index: oIdx, stake: stake, status: 'open', user_id: session.user.id })
    if (!error) {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - stake }).eq('id', session.user.id)
      setLastBet({ eventId: eId, outcomeIdx: oIdx, stake: stake })
      setDuelData(null); setShowSuccessModal(true); setSelectedEventId(''); setSelectedOutcomeIdx(null); setPoolStake(MIN_STAKE); setActiveView('markets');
    } else showToast('Wager failed.')
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
    const eBets = bets.filter(b => b.event_id === eventId && b.status === 'open')
    const addedStake = isExisting ? 0 : userStake
    const totalV = eBets.reduce((sum, b) => sum + b.stake, 0) + addedStake
    const winV = eBets.filter(b => b.outcome_index === outcomeIdx).reduce((sum, b) => sum + b.stake, 0) + addedStake
    if (winV === 0 || totalV === winV) return userStake 
    return Math.round(((userStake / winV) * totalV) * (1 - PLATFORM_FEE_PERCENT / 100))
  }

  const getUserStats = (uid: string) => {
    const ub = bets.filter(b => b.user_id === uid); const set = ub.filter(b => ['won', 'lost'].includes(b.status))
    const winR = set.length > 0 ? Math.round((set.filter(b => b.status === 'won').length / set.length) * 100) : 0
    return { trades: ub.length, winRate: winR, activeRisk: ub.filter(b => b.status === 'open').reduce((s, b) => s + b.stake, 0) }
  }

  const sanitizeName = (n: string | undefined) => !n ? 'Anonymous' : n.includes('@') ? n.split('@')[0] : n
  const activeEvents = events.filter(e => !e.resolved && (selectedCategory === 'All' || e.category.toLowerCase() === selectedCategory.toLowerCase()))
  const myActiveWagers = bets.filter(b => b.user_id === session?.user?.id && b.status === 'open')
  const mySettledWagers = bets.filter(b => b.user_id === session?.user?.id && ['won', 'lost', 'refunded'].includes(b.status))
  const sortedLeaderboard = [...allProfiles].sort((a, b) => b.wallet_balance - a.wallet_balance)
  const ledgerTransactions = notifications.filter(n => ['deposit', 'withdrawal', 'payout', 'refund'].includes(n.type))

  let totalActiveStake = 0; let totalEstPayout = 0
  myActiveWagers.forEach(b => { totalActiveStake += b.stake; totalEstPayout += calculateEstPayout(b.event_id, b.outcome_index, b.stake, true) })

  if (!session) return <Landing />
  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center relative"><div className="w-16 h-16 border-2 border-[#C5A880]/20 border-t-[#C5A880] rounded-full animate-spin mb-6"></div><p className="text-[#C5A880] font-mono text-xs tracking-[0.3em] uppercase animate-pulse">Syncing Network...</p></div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans relative pb-20">
      
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl ${toast.type === 'error' ? 'bg-[#f43f5e]/10 border-[#f43f5e]/30 text-[#f43f5e]' : 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]'}`}>
            {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="font-semibold text-sm tracking-wide">{toast.msg}</span>
          </div>
        </div>
      )}

      {showProfileSetup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-xl p-4">
          <div className="bg-[#111111] border border-[#C5A880]/30 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A880]/10 rounded-full blur-[80px] pointer-events-none"></div>
            <h3 className="text-3xl font-black text-white mb-2 relative z-10">Establish Identity</h3>
            <p className="text-gray-400 text-sm mb-8 font-light relative z-10">Choose how you will be known on the Leaderboard.</p>
            <div className="space-y-6 relative z-10">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">Avatar</label>
                <div className="flex flex-wrap gap-2 justify-center">
                  {AVATARS.map(emoji => (
                    <button key={emoji} onClick={() => setNewAvatar(emoji)} className={`w-12 h-12 text-2xl rounded-xl border flex items-center justify-center transition hover:scale-110 ${newAvatar === emoji ? 'bg-[#C5A880]/20 border-[#C5A880]' : 'bg-[#1a1a1a] border-[#ffffff10] opacity-50'}`}>{emoji}</button>
                  ))}
                </div>
              </div>
              <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} placeholder="Trader Alias" maxLength={15} className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-white font-bold rounded-xl p-4 focus:outline-none focus:border-[#C5A880] text-lg text-center tracking-wide" />
              <button onClick={handleUpdateProfile} disabled={newUsername.length < 3} className="w-full bg-[#C5A880] hover:bg-[#A3885C] disabled:opacity-50 text-[#0a0a0a] font-bold py-4 rounded-xl transition shadow-[0_0_20px_rgba(197,168,128,0.2)]">Enter the Exchange</button>
            </div>
          </div>
        </div>
      )}

      <header className="border-b border-[#ffffff0a] bg-[#0a0a0a]/90 backdrop-blur-xl sticky top-0 z-30 select-none">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-3 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight cursor-pointer" onClick={() => setActiveView('markets')}>PARLAYZ</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <button onClick={() => { if (!showNotifications) markNotificationsAsRead(); setShowNotifications(!showNotifications); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#111111] border border-[#ffffff10] text-gray-400 hover:text-[#C5A880] transition relative">
                <Bell className="w-4 h-4" />
                {notifications.filter(n => !n.is_read).length > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#A3885C] rounded-full animate-pulse shadow-[0_0_5px_rgba(163,136,92,0.8)]"></span>}
              </button>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setShowNotifications(false)}></div>
                  <div className="fixed left-4 right-4 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-80 bg-[#111111] border border-[#ffffff15] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50">
                    <div className="p-4 border-b border-[#ffffff0a] bg-[#0a0a0a] flex justify-between items-center"><h4 className="font-bold text-[#C5A880]">Notifications</h4></div>
                    <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? <div className="p-6 text-center text-gray-500 text-sm">No new notifications.</div> : notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-[#ffffff05] text-sm ${!n.is_read ? 'bg-[#C5A880]/5' : 'bg-transparent'}`}>
                          <p className="text-gray-300">{n.message}</p>
                          <span className="text-xs text-gray-600 mt-2 block">{new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => setActiveView('wallet')} className="bg-[#111111] border border-[#ffffff10] hover:border-[#C5A880]/50 rounded-xl px-3 sm:px-4 py-1.5 flex items-center gap-2 transition group">
              <Wallet className="w-4 h-4 text-[#C5A880]" />
              <span className="font-bold text-sm sm:text-base">{profile?.wallet_balance.toLocaleString() || '0'}</span>
            </button>
            <button onClick={() => setShowLogoutModal(true)} className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-[#ffffff20] flex items-center justify-center text-lg hover:border-red-500/50 transition cursor-pointer" title="Sign Out">{profile?.avatar || '👤'}</button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-1">
          <div className="flex items-center gap-6 overflow-x-auto pb-3 no-scrollbar">
            <button onClick={() => setActiveView('markets')} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'markets' || activeView === 'eventDetail' ? 'text-[#C5A880] border-[#C5A880]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}><Activity className="w-4 h-4" /> Markets</button>
            <button onClick={() => setActiveView('wagers')} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'wagers' ? 'text-[#C5A880] border-[#C5A880]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>My Bets</button>
            <button onClick={() => setActiveView('leaderboard')} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'leaderboard' ? 'text-[#C5A880] border-[#C5A880]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}><Trophy className="w-4 h-4 text-yellow-500" /> Leaderboard</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* --- EVENT DETAILS & INTEGRATED DUEL SLIP --- */}
        {activeView === 'eventDetail' && selectedEventId && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {(() => {
              const event = events.find(e => e.id === selectedEventId); if (!event) return null
              const eDateStr = event.closes_at || event.locks_at || ''
              const lockT = new Date(eDateStr).getTime(); const isLocked = !isNaN(lockT) && lockT <= Date.now()
              const eBets = bets.filter(b => b.event_id === event.id && b.status === 'open')
              const totalV = eBets.reduce((s, b) => s + b.stake, 0)

              return (
                <div className="max-w-5xl mx-auto">
                  <button onClick={() => setActiveView('markets')} className="flex items-center gap-2 text-gray-500 hover:text-[#C5A880] transition mb-6 font-bold text-xs uppercase tracking-widest bg-[#111111] border border-[#ffffff10] px-4 py-2 rounded-xl"><ChevronLeft className="w-4 h-4" /> Return to Markets</button>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <span className="text-xs font-bold text-[#C5A880] uppercase tracking-wider bg-[#C5A880]/10 border border-[#C5A880]/20 px-3 py-1.5 rounded-lg shadow-sm">{event.category}</span>
                          <LiveTimer targetDate={eDateStr} />
                          <button onClick={() => setChatEventId(event.id)} className="flex items-center gap-2 text-xs font-bold text-[#f43f5e] uppercase bg-[#f43f5e]/10 border border-[#f43f5e]/20 px-3 py-1.5 rounded-lg hover:bg-[#f43f5e]/20 transition"><MessageSquare className="w-3.5 h-3.5" /> Warzone Chat</button>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">{event.title}</h1>
                      </div>
                      <div className="bg-[#111111] border border-[#ffffff10] rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A880]/5 rounded-full blur-[80px] pointer-events-none"></div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10"><Activity className="w-4 h-4"/> Rules & Details</h3>
                        <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap relative z-10 font-light">{event.description}</p>
                      </div>
                      <div className="bg-[#111111] border border-[#ffffff10] rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2"><PieChart className="w-4 h-4"/> Market Sentiment</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {event.outcomes.map((outcome, idx) => {
                            const oV = eBets.filter(b => b.outcome_index === idx).reduce((s, b) => s + b.stake, 0)
                            const p = totalV === 0 ? 0 : Math.round((oV / totalV) * 100)
                            const rgb = ORB_COLORS[idx % ORB_COLORS.length]
                            return (
                              <div key={idx} className="flex flex-col p-5 rounded-2xl bg-[#0a0a0a] border border-[#ffffff0a] relative overflow-hidden">
                                <div className="absolute top-0 right-0 bottom-0 opacity-10" style={{ width: `${p}%`, backgroundColor: `rgb(${rgb})` }}></div>
                                <span className="text-sm font-bold text-white mb-2 relative z-10">{outcome}</span>
                                <div className="flex justify-between items-end relative z-10">
                                  <span className="text-3xl font-black tracking-tighter" style={{ color: `rgb(${rgb})` }}>{p}%</span>
                                  <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">{oV.toLocaleString()} KSh</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* --- INTEGRATED TRADE SLIP (POOL & P2P) --- */}
                    <div className="space-y-6">
                      <div className="bg-[#111111] border-2 border-[#C5A880]/20 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(197,168,128,0.05)] sticky top-24">
                        <div className="flex gap-2 mb-6 border-b border-[#ffffff10] pb-4">
                          <button onClick={() => setBetMode('pool')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition ${betMode === 'pool' ? 'bg-[#C5A880] text-black' : 'bg-transparent text-gray-500 hover:text-white'}`}>Pool</button>
                          <button onClick={() => setBetMode('p2p')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition flex items-center justify-center gap-1 ${betMode === 'p2p' ? 'bg-[#f43f5e] text-white' : 'bg-transparent text-gray-500 hover:text-white'}`}><Swords className="w-3 h-3" /> Duel</button>
                        </div>

                        {isLocked ? (
                          <div className="py-12 text-center border border-dashed border-red-500/30 rounded-2xl bg-red-500/5">
                            <span className="text-4xl mb-2 block">🔒</span><h4 className="text-red-500 font-black uppercase tracking-widest mb-1">Market Locked</h4><p className="text-gray-400 text-xs">Action complete.</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">1. Select Outcome</label>
                              <div className="grid gap-2">
                                {event.outcomes.map((o, idx) => (
                                  <button key={idx} onClick={() => setSelectedOutcomeIdx(idx)} className={`p-4 rounded-xl border text-sm font-bold transition text-left ${selectedOutcomeIdx === idx ? 'bg-[#C5A880]/10 border-[#C5A880] text-[#C5A880]' : 'bg-[#0a0a0a] border-[#ffffff10] text-gray-300 hover:bg-[#1a1a1a]'}`}>
                                    <div className="flex justify-between items-center"><span>{o}</span>{selectedOutcomeIdx === idx && <CheckCircle2 className="w-4 h-4" />}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {betMode === 'p2p' ? (
                              <div className="space-y-4 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">Custom Odds Setup
                                    <button onClick={() => alert("Custom Odds let YOU set the price. If you risk more than you ask from a friend, you are giving them 2:1 odds to lure them in. If no friend joins, the House matches you 1:1.")}><HelpCircle className="w-3 h-3 text-[#C5A880]" /></button>
                                  </label>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1"><span className="text-[9px] text-gray-500 uppercase font-bold px-1">You Risk</span><input type="number" value={poolStake} onChange={e => setPoolStake(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-white font-bold rounded-xl p-3 focus:border-[#C5A880] outline-none" /></div>
                                  <div className="space-y-1"><span className="text-[9px] text-[#C5A880] uppercase font-bold px-1">Friend Pays</span><input type="number" value={friendStake} onChange={e => setFriendStake(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#C5A880]/30 text-[#C5A880] font-bold rounded-xl p-3 focus:border-[#C5A880] outline-none" /></div>
                                </div>
                                <div className="bg-[#0a0a0a] rounded-xl p-4 border border-[#ffffff0a] space-y-2">
                                  <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500"><span>Opponent Payout:</span><span className="text-white">{(poolStake + friendStake).toLocaleString()} KSh</span></div>
                                  <div className="flex justify-between text-[10px] uppercase font-bold text-[#10b981]"><span>Your Pot. Win:</span><span>{friendStake.toLocaleString()} KSh</span></div>
                                  <div className="pt-2 border-t border-[#ffffff0a] text-[9px] text-gray-600 italic">🛡️ Safety Net: If no friend joins, Parlayz matches your {poolStake.toLocaleString()} KSh at 1:1.</div>
                                </div>
                                <button onClick={submitDuel} disabled={selectedOutcomeIdx === null || poolStake < MIN_STAKE} className="w-full bg-[#f43f5e] text-white font-black py-5 rounded-xl uppercase tracking-widest text-sm shadow-lg shadow-red-900/20 hover:scale-[1.02] transition">Create 1v1 Duel</button>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                <div><label className="block text-xs font-semibold text-gray-400 uppercase mb-3">2. Stake Amount (KSh)</label><input type="number" min={MIN_STAKE} value={poolStake || ''} onChange={e => setPoolStake(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-white font-black rounded-xl p-4 text-center text-2xl outline-none focus:border-[#C5A880]" /></div>
                                <div className="bg-[#0a0a0a] rounded-xl p-5 border border-[#ffffff0a]">
                                  <span className="text-[#10b981] font-bold uppercase text-xs">Est. Pool Payout:</span><br/>
                                  <span className="text-[#10b981] font-black text-3xl tracking-tighter">{selectedOutcomeIdx !== null ? calculateEstPayout(selectedEventId, selectedOutcomeIdx, poolStake, false).toLocaleString() : '0'} <span className="text-lg">KSh</span></span>
                                </div>
                                <button onClick={() => submitPoolBet()} disabled={selectedOutcomeIdx === null || poolStake < MIN_STAKE} className="w-full bg-[#C5A880] text-[#0a0a0a] font-black py-5 rounded-xl uppercase tracking-widest text-sm hover:scale-[1.02] transition">Join Pool</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* --- RESTORED HIGH-STYLE WALLET VIEW --- */}
        {activeView === 'wallet' && (
          <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-white">Cashier & Profile</h2>
              <div className="flex gap-2">
                <button onClick={() => { setNewUsername(sanitizeName(profile?.username)); setNewAvatar(profile?.avatar || '🦊'); setShowProfileSetup(true); }} className="px-3 py-1.5 rounded-lg border bg-[#1a1a1a] border-[#ffffff20] text-gray-300 hover:text-white text-xs font-semibold uppercase transition">Edit Profile</button>
                <button onClick={togglePrivacy} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase transition ${profile?.is_public ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
                  {profile?.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} {profile?.is_public ? 'Public' : 'Private'}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#ffffff15] rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A880]/5 rounded-full blur-[80px]"></div>
              <p className="text-gray-400 text-sm font-semibold uppercase mb-2 relative z-10">Available Balance</p>
              <h1 className="text-5xl font-extrabold text-white mb-1 relative z-10 tracking-tight">{profile?.wallet_balance.toLocaleString()} <span className="text-2xl text-[#C5A880]">KSh</span></h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
              <div className="bg-[#111111] border border-[#ffffff10] rounded-2xl p-6 hover:border-[#C5A880]/30 transition group">
                <div className="flex items-center gap-3 mb-6"><ArrowDownToLine className="w-5 h-5 text-[#C5A880]" /><h3 className="font-bold">Deposit</h3></div>
                <div className="space-y-3">
                  <input type="tel" placeholder="07XXXXXXXX" value={depositPhone} onChange={e => setDepositPhone(e.target.value.replace(/\D/g, '').substring(0,10))} className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-xl p-3 text-sm" />
                  <input type="number" placeholder="Amount (KSh)" value={depositAmount || ''} onChange={e => setDepositAmount(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-xl p-3 text-sm" />
                  <button onClick={handleDeposit} disabled={isDepositing} className="w-full bg-[#C5A880] text-black font-bold py-3.5 rounded-xl transition hover:brightness-110">{isDepositing ? '...' : 'STK Push'}</button>
                </div>
              </div>
              <div className="bg-[#111111] border border-[#ffffff10] rounded-2xl p-6 hover:border-[#10b981]/30 transition group">
                <div className="flex items-center gap-3 mb-6"><ArrowUpFromLine className="w-5 h-5 text-[#10b981]" /><h3 className="font-bold">Withdraw</h3></div>
                <div className="space-y-3">
                  <input type="tel" placeholder="07XXXXXXXX" value={withdrawPhone} onChange={e => setWithdrawPhone(e.target.value.replace(/\D/g, '').substring(0,10))} className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-xl p-3 text-sm" />
                  <input type="number" placeholder="Amount" value={withdrawAmount || ''} onChange={e => setWithdrawAmount(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-xl p-3 text-sm" />
                  <button onClick={handleWithdraw} className="w-full bg-[#10b981] text-black font-bold py-3.5 rounded-xl transition hover:brightness-110">Withdraw</button>
                </div>
              </div>
              <div className={`bg-[#111111] border border-[#ffffff10] rounded-2xl p-6 ${profile?.has_claimed_airdrop ? 'opacity-60 grayscale' : 'hover:border-[#C5A880]/30'} transition`}>
                <h3 className="font-bold mb-3 flex items-center gap-2">💰 Airdrop</h3>
                <p className="text-xs text-gray-500 mb-6 font-light">Secure your one-time 10,000 KSh capital.</p>
                <button onClick={handleAirdrop} disabled={profile?.has_claimed_airdrop} className="w-full bg-white text-black font-bold py-3.5 rounded-xl transition">{profile?.has_claimed_airdrop ? 'Claimed' : 'Secure Airdrop'}</button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4"><History className="w-5 h-5 text-gray-500" /><h3 className="text-lg font-bold">Ledger</h3></div>
              <div className="bg-[#111111] border border-[#ffffff10] rounded-2xl overflow-hidden shadow-xl">
                {ledgerTransactions.length === 0 ? <div className="p-8 text-center text-gray-500 font-light">No records.</div> : (
                  <div className="divide-y divide-[#ffffff0a]">
                    {ledgerTransactions.map((tx) => {
                      const isPositive = ['deposit', 'payout', 'refund'].includes(tx.type)
                      return (
                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-[#1a1a1a] transition">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isPositive ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#f43f5e]/10 text-[#f43f5e]'}`}>{isPositive ? '+' : '-'}</div>
                            <div><p className="text-white font-semibold text-sm capitalize">{tx.type}</p><p className="text-gray-500 text-[10px]">{new Date(tx.created_at).toLocaleString()}</p></div>
                          </div>
                          <div className="text-right"><p className={`font-bold ${isPositive ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>{isPositive ? '+' : '-'}{tx.message.match(/\d+/)} KSh</p></div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- RESTORED MARKETS FEED --- */}
        {activeView === 'markets' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar mb-2">
              {['All', 'Player Props', 'Sports', 'Crypto', 'Culture', 'Politics', 'Finance'].map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-xl text-xs font-bold uppercase transition border whitespace-nowrap ${selectedCategory === cat ? 'bg-[#C5A880] text-[#0a0a0a] border-[#C5A880] shadow-lg' : 'bg-[#111111] text-gray-400 border-[#ffffff10] hover:text-white'}`}>{cat}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {activeEvents.map((event) => {
                const eb = bets.filter(b => b.event_id === event.id && b.status === 'open'); const tV = eb.reduce((s, b) => s + b.stake, 0)
                const isL = !isNaN(new Date(event.closes_at || event.locks_at || '').getTime()) && new Date(event.closes_at || event.locks_at || '').getTime() <= Date.now()
                return (
                  <div key={event.id} onClick={() => { setSelectedEventId(event.id); setSelectedOutcomeIdx(null); setActiveView('eventDetail'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="bg-[#111111] border border-[#ffffff10] rounded-3xl p-5 transition flex flex-col group relative overflow-hidden cursor-pointer hover:border-[#C5A880]/50 hover:-translate-y-1 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A880]/5 rounded-full blur-[50px] group-hover:bg-[#C5A880]/10 transition pointer-events-none"></div>
                    <div className="flex items-start justify-between mb-3 relative z-10 pointer-events-none">
                      <span className="text-[10px] font-bold text-[#C5A880] uppercase bg-[#C5A880]/10 border border-[#C5A880]/20 px-2 py-1 rounded-lg">{event.category}</span>
                      <LiveTimer targetDate={event.closes_at || event.locks_at || ''} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-4 leading-snug group-hover:text-[#C5A880] transition-colors line-clamp-2 pointer-events-none">{event.title}</h3>
                    <div className="grid grid-cols-2 gap-2 mb-4 relative z-10 flex-grow pointer-events-none">
                      {event.outcomes.slice(0, 2).map((outcome, idx) => {
                        const oV = eb.filter(b => b.outcome_index === idx).reduce((s, b) => s + b.stake, 0)
                        const p = tV === 0 ? 0 : Math.round((oV / tV) * 100)
                        const rgb = ORB_COLORS[idx % 4]
                        return (
                          <div key={idx} className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#0a0a0a]/80 border border-[#ffffff0a] transition-all" style={{ borderColor: `rgba(${rgb}, ${tV === 0 ? 0.1 : 0.6})` }}>
                            <span className="text-[10px] font-bold text-gray-400 mb-1 uppercase line-clamp-1">{outcome}</span>
                            <span className="text-lg font-black tracking-tight" style={{ color: `rgb(${rgb})` }}>{p}%</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase pt-3 border-t border-[#ffffff0a] relative z-10 pointer-events-none">
                       <span>Volume: <span className="text-white">{tV.toLocaleString()} KSh</span></span>
                       <div className="flex items-center gap-1 text-white bg-[#1a1a1a] px-2 py-1 rounded-md border border-[#ffffff10]">Duel ⚔️</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* --- RESTORED LEADERBOARD & WAGERS VIEWS --- */}
        {activeView === 'leaderboard' && (
          <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
            <div className="bg-[#111111] border border-[#ffffff10] rounded-3xl overflow-hidden shadow-2xl">
              <div className="grid grid-cols-12 gap-4 p-5 bg-[#0a0a0a] text-xs font-bold text-gray-500 uppercase tracking-widest">
                <div className="col-span-2 text-center">Rank</div><div className="col-span-6">Trader Identity</div><div className="col-span-4 text-right">Net Value (KSh)</div>
              </div>
              <div className="divide-y divide-[#ffffff0a]">
                {sortedLeaderboard.map((user, index) => (
                  <div key={user.id} onClick={() => setSelectedPublicProfile(user)} className="grid grid-cols-12 gap-4 p-5 items-center transition cursor-pointer hover:bg-[#1a1a1a]">
                    <div className="col-span-2 text-center font-bold text-gray-500">{index + 1}</div>
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-[#ffffff15] flex items-center justify-center text-xl shadow-inner">{user.avatar}</div>
                      <span className="font-bold text-white">{sanitizeName(user.username)}</span>
                    </div>
                    <div className="col-span-4 text-right font-black font-mono text-white">{user.wallet_balance.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'wagers' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-[#111111] border border-[#C5A880]/30 rounded-2xl p-6"><p className="text-[#C5A880] text-xs font-bold uppercase mb-1">Total Risk</p><p className="text-3xl font-black text-white">{totalActiveStake.toLocaleString()} <span className="text-sm font-medium text-gray-500">KSh</span></p></div>
              <div className="bg-[#111111] border border-[#10b981]/30 rounded-2xl p-6"><p className="text-[#10b981] text-xs font-bold uppercase mb-1">Est. Payout</p><p className="text-3xl font-black text-white">{totalEstPayout.toLocaleString()} <span className="text-sm font-medium text-gray-500">KSh</span></p></div>
            </div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Open Predictions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {myActiveWagers.map((bet, i) => {
                const event = events.find(e => e.id === bet.event_id); if (!event) return null
                return (
                  <div key={i} className="bg-[#111111] border border-[#C5A880]/40 rounded-3xl p-6 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4 border-b border-[#ffffff10] pb-4"><div><p className="text-[10px] text-gray-500 uppercase font-bold">Status</p><p className="font-bold text-[#10b981] text-sm flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span> Live</p></div></div>
                    <h3 className="text-lg font-bold mb-4 line-clamp-2">{event.title}</h3>
                    <div className="bg-[#0a0a0a] rounded-xl p-4 border border-[#ffffff0a] mb-4 text-center"><p className="text-[10px] text-gray-500 uppercase font-bold">Prediction</p><p className="text-[#C5A880] font-bold">{event.outcomes[bet.outcome_index]}</p></div>
                    <div className="flex justify-between pt-3 border-t border-[#ffffff10]"><span className="text-[#10b981] font-bold text-lg">{calculateEstPayout(event.id, bet.outcome_index, bet.stake, true).toLocaleString()} KSh</span></div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* --- RESTORED FULL-SIZE MODALS (WARZONE, CHALLENGE, SUCCESS) --- */}
      {chatEventId && (
        <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center bg-black/90 p-4 animate-in slide-in-from-bottom-full duration-300">
          <div className="bg-[#111111] border border-[#ffffff15] rounded-3xl w-full max-w-md h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#ffffff10] flex justify-between items-center bg-[#0a0a0a]"><h3 className="font-bold text-[#f43f5e] uppercase tracking-widest text-sm">Warzone</h3><button onClick={() => setChatEventId(null)}><X className="w-5 h-5 text-gray-500" /></button></div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatMessages.map(msg => {
                const isMe = msg.user_id === session?.user?.id; const p = allProfiles.find(x => x.id === msg.user_id)
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-gray-500 mb-1">{p?.avatar} {sanitizeName(p?.username)}</span>
                    <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-[#f43f5e]/20 border border-[#f43f5e]/30' : 'bg-[#1a1a1a] border border-[#ffffff10]'}`}>{msg.text}</div>
                  </div>
                )
              })}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 bg-[#0a0a0a] border-t border-[#ffffff0a] flex gap-2">
               <input type="text" placeholder="Talk your talk..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage()} className="flex-grow bg-[#111111] border border-[#ffffff15] text-white rounded-xl px-4 py-3 outline-none" />
               <button onClick={sendChatMessage} className="w-12 flex items-center justify-center bg-[#f43f5e] text-white rounded-xl transition shadow-lg"><Send className="w-4 h-4 ml-1" /></button>
            </div>
          </div>
        </div>
      )}

      {duelData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-[#111111] border-2 border-[#f43f5e]/50 rounded-3xl p-8 w-full max-w-md text-center shadow-2xl relative">
            <Swords className="w-12 h-12 text-[#f43f5e] mx-auto mb-4 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
            <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">Challenge Received</h2>
            <p className="text-gray-400 text-xs mb-6">Stake: <span className="text-white font-bold">{duelData.stake.toLocaleString()} KSh</span></p>
            <div className="grid gap-2">
              {events.find(e => e.id === duelData.eventId)?.outcomes.map((o, idx) => {
                if (idx === duelData.side) return null
                return <button key={idx} onClick={() => submitPoolBet(duelData.eventId, idx, duelData.stake)} className="w-full bg-[#1a1a1a] hover:bg-[#10b981] border border-[#ffffff10] text-white font-bold py-3 rounded-xl transition">Accept Bet on {o}</button>
              })}
              <button onClick={() => setDuelData(null)} className="w-full text-gray-600 font-bold py-2 text-xs hover:text-white transition mt-2">Decline Challenge</button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-[#10b981]/30 rounded-3xl p-8 w-full max-w-sm text-center relative overflow-hidden shadow-2xl">
            <div className="w-16 h-16 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#10b981]/20"><CheckCircle2 className="w-8 h-8" /></div>
            <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">Position Secured</h3>
            <p className="text-gray-400 text-sm mb-8 font-light leading-relaxed">Your capital is officially locked in the trade vault.</p>
            <div className="space-y-3">
              <button onClick={copyChallengeLink} className="w-full bg-[#C5A880] text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.03] transition-all uppercase text-xs tracking-widest shadow-xl shadow-yellow-900/10"><Share2 className="w-4 h-4"/> Share Challenge Link</button>
              <button onClick={() => setShowSuccessModal(false)} className="w-full bg-[#1a1a1a] text-gray-500 hover:text-white font-bold py-3 rounded-xl transition uppercase text-[10px] tracking-widest">Return to Arena</button>
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-[#ffffff15] rounded-3xl p-8 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-[#f43f5e]/10 text-[#f43f5e] rounded-2xl flex items-center justify-center mx-auto mb-5"><LogOut className="w-8 h-8 ml-1" /></div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Disconnect Wallet?</h3>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-xl transition hover:bg-gray-700">Cancel</button>
              <button onClick={handleLogout} className="flex-1 bg-[#f43f5e] text-white font-bold py-3 rounded-xl transition hover:brightness-110">Log Out</button>
            </div>
          </div>
        </div>
      )}

      {selectedPublicProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={() => setSelectedPublicProfile(null)}>
          <div className="bg-[#111111] border border-[#ffffff15] rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPublicProfile(null)} className="absolute top-5 right-5 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="w-24 h-24 rounded-full bg-[#0a0a0a] border-2 border-[#C5A880]/30 flex items-center justify-center text-5xl mx-auto mb-4 shadow-inner">{selectedPublicProfile.avatar}</div>
            <h3 className="text-2xl font-black text-white mb-1">{sanitizeName(selectedPublicProfile.username)}</h3>
            {!selectedPublicProfile.is_public && selectedPublicProfile.id !== session?.user?.id ? (
              <div className="mt-8 py-8 bg-[#0a0a0a] rounded-2xl border border-[#ffffff05]"><EyeOff className="w-8 h-8 text-gray-600 mx-auto mb-3" /><p className="text-gray-500 font-semibold text-sm">Profile is Private.</p></div>
            ) : (
              <div className="mt-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0a0a0a] border border-[#ffffff10] rounded-2xl p-4"><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Win Rate</p><p className="text-2xl font-black text-white">{getUserStats(selectedPublicProfile.id).winRate}%</p></div>
                  <div className="bg-[#0a0a0a] border border-[#ffffff10] rounded-2xl p-4"><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Trades</p><p className="text-2xl font-black text-white">{getUserStats(selectedPublicProfile.id).trades}</p></div>
                </div>
                <div className="bg-[#0a0a0a] border border-[#ffffff10] rounded-2xl p-4 flex justify-between items-center"><p className="text-xs text-gray-500 uppercase font-semibold">Active Risk</p><p className="text-lg font-bold text-[#f43f5e]">{getUserStats(selectedPublicProfile.id).activeRisk.toLocaleString()} KSh</p></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
