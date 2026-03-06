import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Landing from './Landing'
import { LogOut, X, AlertTriangle, Bell, Wallet, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, History, Trophy, Activity, Eye, EyeOff, PieChart } from 'lucide-react'

// V2 Interfaces: P2P baggage removed.
interface Event { id: string; title: string; description: string; category: string; outcomes: string[]; closes_at: string; created_at: string; resolved: boolean }
interface Bet { id: string; event_id: string; outcome_index: number; stake: number; status: string; user_id: string; }
interface Profile { id: string; username: string; wallet_balance: number; avatar: string; has_claimed_airdrop: boolean; is_public: boolean }
interface AppNotification { id: string; user_id: string; message: string; type: string; is_read: boolean; created_at: string }

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

  const [toast, setToast] = useState<{msg: string, type: 'error' | 'success'} | null>(null)
  const showToast = (msg: string, type: 'error' | 'success' = 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const [activeView, setActiveView] = useState<'markets' | 'wagers' | 'leaderboard' | 'wallet'>('markets')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // AMM Pool Betting States
  const [showBetModal, setShowBetModal] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = useState<number | null>(null)
  const [poolStake, setPoolStake] = useState<number>(MIN_STAKE)

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showCashierModal, setShowCashierModal] = useState<{type: 'deposit' | 'withdraw', status: 'processing' | 'success' | 'error'} | null>(null)

  const [selectedPublicProfile, setSelectedPublicProfile] = useState<Profile | null>(null)
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0)
  const [withdrawPhone, setWithdrawPhone] = useState<string>('')

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
    setShowProfileSetup(false)
    fetchProfile()
    fetchAllProfiles()
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

  // --- THE NEW POOL BETTING ENGINE ---
  const submitPoolBet = async () => {
    if (!selectedEventId || selectedOutcomeIdx === null || !session?.user || !profile) return
    if (profile.wallet_balance < poolStake) return showToast('Insufficient KSh balance for this wager.')
    if (poolStake < MIN_STAKE) return showToast(`Minimum accepted stake is ${MIN_STAKE} KSh.`)

    const { error } = await supabase.from('bets').insert({ 
      event_id: selectedEventId, 
      outcome_index: selectedOutcomeIdx, 
      stake: poolStake, 
      status: 'open', 
      user_id: session.user.id 
    })

    if (!error) {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - poolStake }).eq('id', session.user.id)
      setShowBetModal(false); 
      setShowSuccessModal(true); 
      setSelectedEventId(''); 
      setSelectedOutcomeIdx(null); 
      setPoolStake(MIN_STAKE);
    } else { 
      showToast('Network error pushing wager to the pool.') 
    }
  }

  const markNotificationsAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setShowLogoutModal(false)
  }

 // Dynamic Payout Calculator for Parimutuel Math
  const calculateEstPayout = (eventId: string, outcomeIdx: number, newStake: number = 0) => {
    const eventBets = bets.filter(b => b.event_id === eventId && b.status === 'open')
    const totalPoolVolume = eventBets.reduce((sum, b) => sum + b.stake, 0) + newStake
    const winningPoolVolume = eventBets.filter(b => b.outcome_index === outcomeIdx).reduce((sum, b) => sum + b.stake, 0) + newStake
    
    // NEW LOGIC: If the pool is completely one-sided, just return their exact stake (no fees applied)
    if (winningPoolVolume === 0 || totalPoolVolume === winningPoolVolume) {
      return newStake 
    }

    const grossPayout = (newStake / winningPoolVolume) * totalPoolVolume
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

  // View Filtering
  const activeEvents = events.filter(e => !e.resolved && (selectedCategory === 'All' || e.category.toLowerCase() === selectedCategory.toLowerCase()))
  const myActiveWagers = bets.filter(b => b.user_id === session?.user?.id && b.status === 'open')
  const mySettledWagers = bets.filter(b => b.user_id === session?.user?.id && ['won', 'lost', 'refunded'].includes(b.status))
  const sortedLeaderboard = [...allProfiles].sort((a, b) => b.wallet_balance - a.wallet_balance)
  const ledgerTransactions = notifications.filter(n => ['deposit', 'withdrawal', 'payout', 'refund'].includes(n.type))

  let totalActiveStake = 0
  myActiveWagers.forEach(bet => { totalActiveStake += bet.stake })

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

      <header className="border-b border-[#ffffff0a] bg-[#0a0a0a]/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-3 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight cursor-pointer flex items-center gap-2" onClick={() => setActiveView('markets')}>
            PARLAYZ
          </h1>
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
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider hidden sm:inline">KSh</span>
            </button>
            <button onClick={() => setShowLogoutModal(true)} className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-[#ffffff20] flex items-center justify-center text-lg hover:border-red-500/50 transition cursor-pointer" title="Sign Out">{profile?.avatar || '👤'}</button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-1">
          <div className="flex items-center gap-6 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <button onClick={() => setActiveView('markets')} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'markets' ? 'text-[#C5A880] border-[#C5A880]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}><Activity className="w-4 h-4" /> Markets</button>
            <button onClick={() => setActiveView('wagers')} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'wagers' ? 'text-[#C5A880] border-[#C5A880]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>My Bets</button>
            <button onClick={() => setActiveView('leaderboard')} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'leaderboard' ? 'text-[#C5A880] border-[#C5A880]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}><Trophy className="w-4 h-4 text-yellow-500" /> Leaderboard</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {activeView === 'wallet' && (
          <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-white">Cashier & Profile</h2>
              <div className="flex gap-2">
                <button onClick={() => { setNewUsername(sanitizeName(profile?.username)); setNewAvatar(profile?.avatar || '🦊'); setShowProfileSetup(true); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-[#1a1a1a] border-[#ffffff20] text-gray-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition">
                  Edit Identity
                </button>
                <button onClick={togglePrivacy} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition ${profile?.is_public ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
                  {profile?.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} {profile?.is_public ? 'Public' : 'Private'}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#ffffff15] rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A880]/5 rounded-full blur-[80px]"></div>
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-2 relative z-10 flex items-center gap-2">Available Balance</p>
              <h1 className="text-5xl font-extrabold text-white mb-1 relative z-10 tracking-tight">{profile?.wallet_balance.toLocaleString()} <span className="text-2xl text-[#C5A880]">KSh</span></h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-10">
              <div className={`bg-[#111111] border border-[#ffffff10] rounded-2xl p-6 relative overflow-hidden transition ${profile?.has_claimed_airdrop ? 'opacity-60 grayscale' : 'hover:border-[#C5A880]/30'}`}>
                <div className="flex items-center gap-3 mb-4 relative z-10"><div className="w-10 h-10 rounded-lg bg-[#C5A880]/10 flex items-center justify-center border border-[#C5A880]/20"><ArrowDownToLine className="w-5 h-5 text-[#C5A880]" /></div><h3 className="text-lg font-bold">Initial Airdrop</h3></div>
                <div className="space-y-4 relative z-10">
                  <p className="text-sm text-gray-400 font-light mb-4">Claim your starting capital of 10,000 KSh. <span className="text-white font-semibold">This can only be claimed once.</span></p>
                  <button onClick={handleAirdrop} disabled={profile?.has_claimed_airdrop} className={`w-full font-bold py-3.5 rounded-xl transition ${profile?.has_claimed_airdrop ? 'bg-[#0a0a0a] border border-[#ffffff10] text-gray-600' : 'bg-[#C5A880]/10 border border-[#C5A880]/30 text-[#C5A880] hover:bg-[#C5A880] hover:text-[#0a0a0a] shadow-[0_0_15px_rgba(197,168,128,0.1)]'}`}>
                    {profile?.has_claimed_airdrop ? 'Airdrop Claimed' : 'Claim 10,000 KSh'}
                  </button>
                </div>
              </div>
              <div className="bg-[#111111] border border-[#ffffff10] rounded-2xl p-6 relative overflow-hidden group hover:border-[#10b981]/30 transition">
                <div className="flex items-center gap-3 mb-6 relative z-10"><div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center border border-[#10b981]/20"><ArrowUpFromLine className="w-5 h-5 text-[#10b981]" /></div><h3 className="text-lg font-bold">Withdraw</h3></div>
                <div className="space-y-4 relative z-10">
                  <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">M-Pesa Number</label><input type="tel" placeholder="07XXXXXXXX" value={withdrawPhone} onChange={e => setWithdrawPhone(e.target.value.replace(/\D/g, '').substring(0,10))} className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-white rounded-xl p-3 focus:outline-none focus:border-[#10b981] font-mono tracking-wider" /></div>
                  <div><div className="flex justify-between items-center mb-1"><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount (KSh)</label></div><input type="number" value={withdrawAmount || ''} onChange={e => setWithdrawAmount(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-xl p-3 focus:outline-none focus:border-[#10b981] font-bold text-white" /></div>
                  <button onClick={handleWithdraw} className="w-full bg-[#10b981]/10 border border-[#10b981]/30 hover:bg-[#10b981] text-[#10b981] hover:text-[#0a0a0a] font-bold py-3.5 rounded-xl transition">Request Payout</button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4"><History className="w-5 h-5 text-gray-500" /><h3 className="text-lg font-bold text-white">Transaction Ledger</h3></div>
              <div className="bg-[#111111] border border-[#ffffff10] rounded-2xl overflow-hidden">
                {ledgerTransactions.length === 0 ? <div className="p-8 text-center text-gray-500 font-light">No financial transactions recorded yet.</div> : (
                  <div className="divide-y divide-[#ffffff0a]">
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
            <div className="bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent border border-yellow-500/30 rounded-2xl p-4 sm:p-6 mb-8 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <h3 className="text-lg font-black text-white uppercase tracking-wider">March Madness Event</h3>
                <p className="text-yellow-500/80 text-sm font-semibold">Ends March 31st, 2026 at Midnight. Top traders win 1500 KSh every sunday.</p>
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
                        <span className={`font-bold block ${session?.user?.id === user.id ? 'text-[#C5A880]' : 'text-white'}`}>
                          {sanitizeName(user.username)} {session?.user?.id === user.id && '(You)'}
                        </span>
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

        {activeView === 'wagers' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 mb-8">
              <div className="bg-[#111111] border border-[#C5A880]/30 rounded-2xl p-5 sm:p-6 flex flex-col justify-center relative overflow-hidden shadow-[0_0_30px_rgba(197,168,128,0.05)]">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A880]/10 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-2 mb-2 relative z-10"><PieChart className="w-5 h-5 text-[#C5A880]" /><p className="text-[#C5A880] text-sm font-semibold uppercase tracking-widest">Total Active Stake in Pools</p></div>
                <p className="text-3xl sm:text-4xl font-black text-white tracking-tight relative z-10">{totalActiveStake.toLocaleString()} <span className="text-lg font-medium text-gray-500">KSh</span></p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Open Predictions</h3>
              {myActiveWagers.length === 0 ? <div className="py-16 text-center text-gray-500 border border-dashed border-[#ffffff10] rounded-2xl">No active predictions in the market.</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {myActiveWagers.reverse().map((bet, i) => {
                    const event = events.find(e => e.id === bet.event_id); if (!event) return null
                    const estNetPayout = calculateEstPayout(event.id, bet.outcome_index, 0) // dynamic payout calculation

                    return (
                      <div key={i} className="bg-[#111111] border border-[#C5A880]/40 rounded-3xl p-6 transition relative overflow-hidden shadow-[0_0_30px_rgba(197,168,128,0.05)]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A880]/5 rounded-full blur-3xl"></div>
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#ffffff10] relative z-10">
                          <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Status</p><p className="font-bold text-[#10b981] text-sm flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span> Live in Pool</p></div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-4 relative z-10 leading-tight">{event.title}</h3>
                        <div className="bg-[#0a0a0a] rounded-xl p-4 border border-[#ffffff0a] mb-4 relative z-10 text-center"><div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Your Prediction</div><div className="text-[#C5A880] font-bold text-lg">{event.outcomes[bet.outcome_index]}</div></div>
                        <div className="space-y-2 text-sm relative z-10">
                          <div className="flex justify-between text-gray-400"><span>Your Stake:</span><span className="text-white">{bet.stake.toLocaleString()} KSh</span></div>
                          <div className="flex justify-between font-bold pt-3 border-t border-[#ffffff10] mt-3"><span className="text-[#10b981] uppercase tracking-wider text-xs flex items-center">Current Est. Payout:</span><span className="text-[#10b981] text-xl">{estNetPayout.toLocaleString()} KSh</span></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><History className="w-4 h-4" /> Settled History</h3>
              {mySettledWagers.length === 0 ? <div className="py-10 text-center text-gray-500 border border-dashed border-[#ffffff10] rounded-2xl">No settled history yet.</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {mySettledWagers.reverse().map((bet, i) => {
                    const event = events.find(e => e.id === bet.event_id); if (!event) return null
                    const isWin = bet.status === 'won'; const isRefund = bet.status === 'refunded'
                    // We calculate historical parimutuel payout if won. For simplicity here, we assume if the bet is 'won', the user's balance was already updated. We can just show the dynamic est payout at time of resolution.
                    const historicalPayout = isWin ? calculateEstPayout(event.id, bet.outcome_index, 0) : isRefund ? bet.stake : 0

                    return (
                      <div key={i} className={`bg-[#111111] border rounded-3xl p-6 relative overflow-hidden transition hover:scale-[1.02] ${isWin ? 'border-[#10b981]/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : isRefund ? 'border-gray-600' : 'border-[#f43f5e]/20 opacity-70'}`}>
                        {isWin && <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/15 rounded-full blur-3xl pointer-events-none"></div>}
                        <div className="flex items-start justify-between mb-4 relative z-10"><span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${isWin ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : isRefund ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-[#f43f5e]/10 border-[#f43f5e]/30 text-[#f43f5e]'}`}>{isWin ? 'WINNER 🏆' : isRefund ? 'REFUNDED' : 'LOST ❌'}</span></div>
                        <h3 className={`text-lg font-bold mb-4 relative z-10 ${isWin ? 'text-white' : 'text-gray-400'}`}>{event.title}</h3>
                        <div className="flex justify-between font-bold pt-3 border-t border-[#ffffff10] mt-3 relative z-10"><span className="text-gray-500">Payout:</span><span className={`text-lg ${isWin ? 'text-[#10b981]' : isRefund ? 'text-gray-400' : 'text-[#f43f5e]'}`}>{isWin ? `+ ${historicalPayout.toLocaleString()} KSh` : isRefund ? `${historicalPayout.toLocaleString()} KSh` : '0 KSh'}</span></div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- THE KALSHI STYLE POOL MARKETS --- */}
        {activeView === 'markets' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar mb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              {['All', 'Sports', 'Crypto', 'Culture', 'Politics', 'Finance'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition border whitespace-nowrap ${
                    selectedCategory === cat 
                      ? 'bg-[#C5A880] text-[#0a0a0a] border-[#C5A880] shadow-[0_0_15px_rgba(197,168,128,0.3)]' 
                      : 'bg-[#111111] text-gray-400 border-[#ffffff10] hover:border-[#C5A880]/50 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeEvents.length === 0 ? <div className="col-span-full py-16 text-center text-gray-500 border border-dashed border-[#ffffff10] rounded-3xl bg-[#111111]/30">No active markets in this category.</div> : (
                activeEvents.map((event) => {
                  const eventPoolSize = bets.filter(b => b.event_id === event.id && b.status === 'open').reduce((sum, b) => sum + b.stake, 0)
                  
                  return (
                    <div key={event.id} className="bg-[#111111] border border-[#ffffff10] rounded-3xl p-6 hover:border-[#C5A880]/50 transition flex flex-col group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A880]/5 rounded-full blur-[50px] group-hover:bg-[#C5A880]/15 transition pointer-events-none"></div>
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <span className="text-xs font-bold text-[#C5A880] uppercase tracking-wider bg-[#C5A880]/10 border border-[#C5A880]/20 px-3 py-1.5 rounded-lg shadow-sm">{event.category}</span>
                        <span className="text-xs font-semibold text-gray-500 bg-[#0a0a0a] border border-[#ffffff0a] px-2.5 py-1 rounded-md">Closes {new Date(event.closes_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3 relative z-10 leading-snug group-hover:text-[#C5A880] transition-colors">{event.title}</h3>
                      <p className="text-gray-400 text-sm mb-6 font-light flex-grow relative z-10 leading-relaxed">{event.description}</p>
                      
                      <div className="flex justify-between items-center text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 border-t border-[#ffffff10] pt-4">
                         <span>Pool Volume:</span>
                         <span className="text-white">{eventPoolSize.toLocaleString()} KSh</span>
                      </div>

                      <button onClick={() => { setSelectedEventId(event.id); setSelectedOutcomeIdx(null); setShowBetModal(true) }} className="w-full bg-[#1a1a1a] hover:bg-[#C5A880] hover:text-[#0a0a0a] border border-[#ffffff15] hover:border-[#C5A880] text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 group/btn relative z-10 shadow-sm hover:shadow-[0_0_20px_rgba(197,168,128,0.2)] uppercase tracking-widest text-sm">
                         Predict & Trade
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS OVERLAYS --- */}
      
      {selectedPublicProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={() => setSelectedPublicProfile(null)}>
          <div className="bg-[#111111] border border-[#ffffff15] rounded-3xl p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPublicProfile(null)} className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            <div className="w-24 h-24 rounded-full bg-[#0a0a0a] border-2 border-[#C5A880]/30 flex items-center justify-center text-5xl mx-auto mb-4 shadow-inner">{selectedPublicProfile.avatar}</div>
            <h3 className="text-2xl font-black text-white mb-1">{sanitizeName(selectedPublicProfile.username)}</h3>
            {!selectedPublicProfile.is_public && selectedPublicProfile.id !== session?.user?.id ? (
              <div className="mt-8 py-8 bg-[#0a0a0a] rounded-2xl border border-[#ffffff05]"><EyeOff className="w-8 h-8 text-gray-600 mx-auto mb-3" /><p className="text-gray-500 font-semibold text-sm">This trader's stats are private.</p></div>
            ) : (
              <div className="mt-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0a0a0a] border border-[#ffffff10] rounded-2xl p-4"><p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Win Rate</p><p className="text-2xl font-black text-white">{getUserStats(selectedPublicProfile.id).winRate}%</p></div>
                  <div className="bg-[#0a0a0a] border border-[#ffffff10] rounded-2xl p-4"><p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Trades</p><p className="text-2xl font-black text-white">{getUserStats(selectedPublicProfile.id).trades}</p></div>
                </div>
                <div className="bg-[#0a0a0a] border border-[#ffffff10] rounded-2xl p-4 flex justify-between items-center"><p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Active Risk in Pools</p><p className="text-lg font-bold text-[#f43f5e]">{getUserStats(selectedPublicProfile.id).activeRisk.toLocaleString()} KSh</p></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW POOL BETTING MODAL */}
      {showBetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-[#C5A880]/30 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-[0_0_50px_rgba(197,168,128,0.15)] relative">
            <button onClick={() => setShowBetModal(false)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-xl bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#ffffff10]"><X className="w-4 h-4" /></button>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Lock Prediction</h3>
            <p className="text-gray-400 text-sm mb-6 font-light">Your bet enters the parimutuel pool. Payouts adjust dynamically based on total volume.</p>
            <div className="space-y-5">
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">1. Your Stance</label>
                <div className="grid grid-cols-2 gap-2">
                  {activeEvents.find(e => e.id === selectedEventId)?.outcomes.map((outcome, idx) => (
                    <button key={idx} onClick={() => setSelectedOutcomeIdx(idx)} className={`p-3 rounded-xl border text-sm font-bold transition ${selectedOutcomeIdx === idx ? 'bg-[#C5A880]/10 border-[#C5A880] text-[#C5A880] shadow-[0_0_15px_rgba(197,168,128,0.2)]' : 'bg-[#0a0a0a] border-[#ffffff15] text-gray-400 hover:border-gray-500'}`}>{outcome}</button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">2. Stake Amount (KSh)</label>
                <input type="number" min={MIN_STAKE} value={poolStake || ''} onChange={(e) => setPoolStake(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-white font-bold rounded-xl p-4 focus:outline-none focus:border-[#C5A880] text-lg" />
              </div>
              
              <div className="bg-[#0a0a0a] rounded-xl p-4 text-sm space-y-2 border border-[#ffffff0a] mt-2 font-light">
                <div className="flex justify-between items-center"><span className="text-[#10b981] font-bold uppercase tracking-wider text-xs">Current Est. Payout:</span><span className="text-[#10b981] font-black text-2xl drop-shadow-md">
                   {selectedOutcomeIdx !== null ? calculateEstPayout(selectedEventId, selectedOutcomeIdx, poolStake).toLocaleString() : '0'} KSh
                </span></div>
              </div>
              
              <button onClick={submitPoolBet} disabled={selectedOutcomeIdx === null || poolStake < MIN_STAKE} className="w-full bg-[#C5A880] hover:bg-[#A3885C] disabled:bg-[#1a1a1a] disabled:text-gray-600 text-[#0a0a0a] font-black py-4 rounded-xl transition shadow-[0_0_20px_rgba(197,168,128,0.2)] mt-2 uppercase tracking-wider text-sm">Confirm Wager</button>
            </div>
          </div>
        </div>
      )}

      {showCashierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`bg-[#111111] border rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center relative overflow-hidden shadow-2xl ${showCashierModal.type === 'deposit' ? 'border-[#10b981]/30' : 'border-[#C5A880]/30'}`}>
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl pointer-events-none ${showCashierModal.type === 'deposit' ? 'bg-[#10b981]/10' : 'bg-[#C5A880]/10'}`}></div>
            <div className="relative z-10">
              {showCashierModal.status === 'processing' ? (
                <>
                  <div className="w-16 h-16 bg-[#1a1a1a] border border-[#ffffff15] rounded-2xl flex items-center justify-center mx-auto mb-5"><div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${showCashierModal.type === 'deposit' ? 'border-[#10b981]' : 'border-[#C5A880]'}`}></div></div>
                  <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Processing Transfer</h3>
                  <p className="text-gray-400 text-sm mb-2 font-light">Securing protocol confirmation...</p>
                </>
              ) : (
                <>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border ${showCashierModal.type === 'deposit' ? 'bg-[#10b981]/10 border-[#10b981]/40 text-[#10b981]' : 'bg-[#C5A880]/10 border-[#C5A880]/40 text-[#C5A880]'}`}><CheckCircle2 className="w-8 h-8" /></div>
                  <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Success</h3>
                  <p className="text-gray-400 text-sm mb-6 font-light">Transaction finalized.</p>
                  <button onClick={() => setShowCashierModal(null)} className="w-full bg-[#1a1a1a] hover:bg-[#222222] border border-[#ffffff10] text-white font-bold py-3.5 rounded-xl transition">Return</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-[#10b981]/30 rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#10b981]/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#10b981]/10 border border-[#10b981]/40 text-[#10b981] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"><CheckCircle2 className="w-8 h-8" /></div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Bet Pushed to Pool</h3>
              <p className="text-gray-400 text-sm mb-6 font-light">Your capital is locked in the parimutuel pool.</p>
              <button onClick={() => setShowSuccessModal(false)} className="w-full bg-[#1a1a1a] hover:bg-[#222222] border border-[#ffffff10] text-white font-bold py-3.5 rounded-xl transition">Return to Exchange</button>
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
              <div className="flex gap-3 justify-center mt-6">
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
