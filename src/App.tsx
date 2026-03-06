import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import Landing from './Landing'
import { LogOut, X, AlertTriangle, Bell, Wallet, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, History, Trophy, Activity, Eye, EyeOff, PieChart, Share2, Swords, MessageSquare, Send, ShieldAlert } from 'lucide-react'

// V2 Interfaces
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
  const [lastBet, setLastBet] = useState<{eventId: string, outcomeIdx: number, stake: number} | null>(null)

  // Duel State
  const [duelData, setDuelData] = useState<{eventId: string, side: number, stake: number, challengerId: string} | null>(null)

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

  // Duel Deep Link Listener
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
    setShowProfileSetup(false); fetchProfile(); fetchAllProfiles(); showToast('Identity locked.', 'success')
  }

  const togglePrivacy = async () => {
    if (!profile) return
    const newStatus = !profile.is_public
    await supabase.from('profiles').update({ is_public: newStatus }).eq('id', session.user.id)
    setProfile({ ...profile, is_public: newStatus }); showToast(newStatus ? 'Profile is now Public' : 'Profile is now Private', 'success')
  }

  const handleAirdrop = async () => {
    if (!profile || profile.has_claimed_airdrop) return showToast("Airdrop already claimed.")
    setShowCashierModal({ type: 'deposit', status: 'processing' })
    setTimeout(async () => {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance + 10000, has_claimed_airdrop: true }).eq('id', session.user.id)
      await supabase.from('notifications').insert({ user_id: session.user.id, message: `10,000 KSh airdrop secured. Welcome to the Arena.`, type: 'deposit', is_read: false })
      fetchProfile(); fetchAllProfiles(); fetchNotifications(); setShowCashierModal({ type: 'deposit', status: 'success' })
    }, 2000)
  }

  const handleWithdraw = async () => {
    if (withdrawAmount < 100 || (profile && withdrawAmount > profile.wallet_balance)) return showToast("Invalid amount.")
    const phoneRegex = /^(07|01)\d{8}$/
    if (!phoneRegex.test(withdrawPhone)) return showToast("Invalid M-Pesa format.")

    setShowCashierModal({ type: 'withdraw', status: 'processing' })
    setTimeout(async () => {
      if (profile) {
        await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - withdrawAmount }).eq('id', session.user.id)
        await supabase.from('notifications').insert({ user_id: session.user.id, message: `Withdrawal of ${withdrawAmount} KSh to ${withdrawPhone} initiated.`, type: 'withdrawal', is_read: false })
        fetchProfile(); fetchAllProfiles(); fetchNotifications(); setShowCashierModal({ type: 'withdraw', status: 'success' }); setWithdrawAmount(0); setWithdrawPhone('')
      }
    }, 2500)
  }

  const submitPoolBet = async (overrideE?: string, overrideO?: number, overrideS?: number) => {
    const eId = overrideE || selectedEventId
    const oIdx = overrideO !== undefined ? overrideO : selectedOutcomeIdx
    const stakeToUse = overrideS || poolStake

    if (!eId || oIdx === null || !session?.user || !profile) return
    if (profile.wallet_balance < stakeToUse) return showToast('Insufficient KSh balance.')
    
    const { error } = await supabase.from('bets').insert({ event_id: eId, outcome_index: oIdx, stake: stakeToUse, status: 'open', user_id: session.user.id })
    if (!error) {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - stakeToUse }).eq('id', session.user.id)
      setLastBet({ eventId: eId, outcomeIdx: oIdx, stake: stakeToUse })
      setDuelData(null); setShowBetModal(false); setShowSuccessModal(true); setSelectedEventId(''); setSelectedOutcomeIdx(null); setPoolStake(MIN_STAKE)
    } else { showToast('Network error.') }
  }

  const calculateEstPayout = (eventId: string, outcomeIdx: number, newStake: number = 0) => {
    const eventBets = bets.filter(b => b.event_id === eventId && b.status === 'open')
    const totalPoolVolume = eventBets.reduce((sum, b) => sum + b.stake, 0) + newStake
    const winningPoolVolume = eventBets.filter(b => b.outcome_index === outcomeIdx).reduce((sum, b) => sum + b.stake, 0) + newStake
    if (winningPoolVolume === 0 || totalPoolVolume === winningPoolVolume) return newStake 
    const grossPayout = (newStake / winningPoolVolume) * totalPoolVolume
    return Math.round(grossPayout * (1 - PLATFORM_FEE_PERCENT / 100))
  }

  const copyChallengeLink = () => {
    if (!lastBet || !session?.user) return
    const shareUrl = `${window.location.origin}/?duel=${lastBet.eventId}&side=${lastBet.outcomeIdx}&stake=${lastBet.stake}&challenger=${session.user.id}`
    navigator.clipboard.writeText(shareUrl); showToast('Challenge link copied! Drop it in WhatsApp.', 'success')
  }

  const getUserStats = (userId: string) => {
    const userBets = bets.filter(b => b.user_id === userId)
    const settled = userBets.filter(b => ['won', 'lost'].includes(b.status))
    const wins = settled.filter(b => b.status === 'won').length
    const activeRisk = userBets.filter(b => b.status === 'open').reduce((sum, b) => sum + b.stake, 0)
    return { trades: userBets.length, winRate: settled.length > 0 ? Math.round((wins / settled.length) * 100) : 0, activeRisk }
  }

  const sanitizeName = (name: string | undefined) => name?.includes('@') ? name.split('@')[0] : name || 'Anonymous'
  const activeEvents = events.filter(e => !e.resolved && (selectedCategory === 'All' || e.category.toLowerCase() === selectedCategory.toLowerCase()))
  const myActiveWagers = bets.filter(b => b.user_id === session?.user?.id && b.status === 'open')
  const mySettledWagers = bets.filter(b => b.user_id === session?.user?.id && ['won', 'lost', 'refunded'].includes(b.status))
  const sortedLeaderboard = [...allProfiles].sort((a, b) => b.wallet_balance - a.wallet_balance)

  if (!session) return <Landing />
  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center relative"><div className="w-16 h-16 border-2 border-t-[#C5A880] rounded-full animate-spin mb-6"></div><p className="text-[#C5A880] font-mono text-xs tracking-[0.3em] uppercase animate-pulse">Syncing Arena...</p></div>

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white select-none pb-20 overflow-x-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl ${toast.type === 'error' ? 'bg-[#f43f5e]/10 border-[#f43f5e]/30 text-[#f43f5e]' : 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]'}`}>
            {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="font-semibold text-sm">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Profile Setup */}
      {showProfileSetup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 p-4">
          <div className="bg-[#111111] border border-[#C5A880]/30 rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
            <h3 className="text-3xl font-black mb-2">Establish Identity</h3>
            <p className="text-gray-400 text-sm mb-8 font-light">Choose your persona for the leaderboard.</p>
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 justify-center">
                {AVATARS.map(emoji => (
                  <button key={emoji} onClick={() => setNewAvatar(emoji)} className={`w-12 h-12 text-2xl rounded-xl border transition ${newAvatar === emoji ? 'bg-[#C5A880]/20 border-[#C5A880]' : 'bg-[#1a1a1a] border-white/5 opacity-50'}`}>{emoji}</button>
                ))}
              </div>
              <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Trader Alias" className="w-full bg-black border border-white/10 text-white rounded-xl p-4 focus:border-[#C5A880] text-center" />
              <button onClick={handleUpdateProfile} disabled={newUsername.length < 3} className="w-full bg-[#C5A880] text-black font-black py-4 rounded-xl shadow-xl uppercase">Enter Exchange</button>
            </div>
          </div>
        </div>
      )}

      <header className="border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-3 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight cursor-pointer flex items-center gap-2" onClick={() => setActiveView('markets')}>PARLAYZ</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => { markNotificationsAsRead(); setShowNotifications(!showNotifications); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#111111] border border-white/10 text-gray-400 relative">
              <Bell className="w-4 h-4" />
              {notifications.filter(n => !n.is_read).length > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#A3885C] rounded-full animate-pulse"></span>}
            </button>
            <button onClick={() => setActiveView('wallet')} className="bg-[#111111] border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2 transition group">
              <Wallet className="w-4 h-4 text-[#C5A880]" />
              <span className="font-bold text-sm">{profile?.wallet_balance.toLocaleString()} KSh</span>
            </button>
            <button onClick={() => setShowLogoutModal(true)} className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-lg">{profile?.avatar || '👤'}</button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 flex gap-6 pb-2">
          <button onClick={() => setActiveView('markets')} className={`text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'markets' ? 'text-[#C5A880] border-[#C5A880]' : 'text-gray-500 border-transparent'}`}>Markets</button>
          <button onClick={() => setActiveView('wagers')} className={`text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'wagers' ? 'text-[#C5A880] border-[#C5A880]' : 'text-gray-500 border-transparent'}`}>My Bets</button>
          <button onClick={() => setActiveView('leaderboard')} className={`text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'leaderboard' ? 'text-[#C5A880] border-[#C5A880]' : 'text-gray-500 border-transparent'}`}><Trophy className="w-4 h-4" /> Leaderboard</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeView === 'markets' && (
          <div className="animate-in fade-in">
            <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar">
              {['All', 'Sports', 'Crypto', 'Culture', 'Politics'].map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border whitespace-nowrap ${selectedCategory === cat ? 'bg-[#C5A880] text-black' : 'bg-[#111111] text-gray-400 border-white/10'}`}>{cat}</button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {activeEvents.map((event) => {
                const eBets = bets.filter(b => b.event_id === event.id && b.status === 'open')
                const totalV = eBets.reduce((sum, b) => sum + b.stake, 0)
                const ORB_COLORS = ['197, 168, 128', '16, 185, 129', '244, 63, 94', '59, 130, 246'] 

                return (
                  <div key={event.id} className="bg-[#111111] border border-white/10 rounded-3xl p-5 hover:border-[#C5A880]/50 transition flex flex-col group relative overflow-hidden">
                    <div className="flex items-start justify-between mb-3 relative z-10">
                      <span className="text-[10px] font-bold text-[#C5A880] uppercase tracking-wider bg-[#C5A880]/10 border border-[#C5A880]/20 px-2 py-1 rounded-lg">{event.category}</span>
                      <span className="text-[10px] font-semibold text-gray-500 bg-[#0a0a0a] border border-white/5 px-2 py-1 rounded-md">Closes {new Date(event.closes_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1.5 relative z-10 leading-snug group-hover:text-[#C5A880] line-clamp-2">{event.title}</h3>
                    <p className="text-gray-400 text-xs mb-4 font-light relative z-10 line-clamp-1">{event.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4 relative z-10 flex-grow">
                      {event.outcomes.map((outcome, idx) => {
                        const oVolume = eBets.filter(b => b.outcome_index === idx).reduce((sum, b) => sum + b.stake, 0)
                        const p = totalV === 0 ? 0 : Math.round((oVolume / totalV) * 100)
                        const rgb = ORB_COLORS[idx % ORB_COLORS.length]
                        const isOddLast = event.outcomes.length % 2 !== 0 && idx === event.outcomes.length - 1

                        return (
                          <div key={idx} className={`flex ${isOddLast ? 'flex-row gap-4 items-center justify-between col-span-2 py-2 px-4' : 'flex-col items-center justify-center p-3'} rounded-xl bg-[#0a0a0a]/80 border transition-all duration-700 relative overflow-hidden`}
                               style={{ borderColor: `rgba(${rgb}, ${totalV === 0 ? 0.1 : 0.2 + (p/100)})`, boxShadow: `0 0 ${15 + (p/2)}px rgba(${rgb}, ${totalV === 0 ? 0.02 : (p/100)*0.5}) inset` }}>
                            <span className="text-xs font-bold text-white drop-shadow-md truncate">{outcome}</span>
                            <div className={`flex ${isOddLast ? 'items-center gap-3' : 'flex-col items-center'}`}>
                              <span className="text-lg font-black" style={{ color: `rgb(${rgb})` }}>{p}%</span>
                              <span className="text-[9px] text-gray-500 uppercase tracking-widest">{oVolume.toLocaleString()} KSh</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3 pt-3 border-t border-white/5 relative z-10">
                       <span>Liquidity:</span><span className="text-white">{totalV.toLocaleString()} KSh</span>
                    </div>
                    <button onClick={() => { setSelectedEventId(event.id); setSelectedOutcomeIdx(null); setShowBetModal(true) }} className="w-full mt-auto bg-[#1a1a1a] hover:bg-[#C5A880] hover:text-black border border-white/10 text-white font-bold py-2.5 rounded-xl transition uppercase tracking-widest text-xs">Predict & Trade 💸</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeView === 'wagers' && (
          <div className="space-y-6">
            <div className="bg-[#111111] border border-[#C5A880]/30 rounded-2xl p-6 relative overflow-hidden">
              <PieChart className="w-5 h-5 text-[#C5A880] mb-2" />
              <p className="text-[#C5A880] text-xs font-bold uppercase tracking-widest">Active Stake in Pools</p>
              <p className="text-3xl font-black text-white">{myActiveWagers.reduce((s,b)=>s+b.stake,0).toLocaleString()} KSh</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myActiveWagers.map((bet, i) => {
                const ev = events.find(e => e.id === bet.event_id)
                const estPayout = calculateEstPayout(bet.event_id, bet.outcome_index, 0)
                return (
                  <div key={i} className="bg-[#111111] border border-white/10 p-6 rounded-3xl relative overflow-hidden shadow-xl">
                    <p className="text-xs text-emerald-500 font-bold mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Active</p>
                    <h3 className="font-bold text-lg mb-4">{ev?.title}</h3>
                    <div className="bg-black/50 p-4 rounded-xl border border-white/5 mb-4 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Your Stance</p>
                      <p className="text-[#C5A880] font-black text-lg uppercase">{ev?.outcomes[bet.outcome_index]}</p>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Stake:</span><span>{bet.stake.toLocaleString()} KSh</span></div>
                    <div className="flex justify-between font-black text-emerald-500"><span>Est. Payout:</span><span>{estPayout.toLocaleString()} KSh</span></div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeView === 'leaderboard' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-yellow-500/10 via-transparent to-transparent border border-yellow-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-black uppercase tracking-wider">March Madness</h3>
              <p className="text-yellow-500 text-sm">Top traders win cash prizes every Sunday.</p>
            </div>
            <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="grid grid-cols-12 gap-4 p-5 bg-black text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">
                <div className="col-span-2 text-center">Rank</div><div className="col-span-6">Identity</div><div className="col-span-4 text-right">Balance</div>
              </div>
              <div className="divide-y divide-white/5">
                {sortedLeaderboard.map((u, i) => (
                  <div key={u.id} className={`grid grid-cols-12 gap-4 p-5 items-center hover:bg-white/5 cursor-pointer transition ${session.user.id === u.id ? 'bg-[#C5A880]/5' : ''}`} onClick={() => setSelectedPublicProfile(u)}>
                    <div className="col-span-2 text-center font-black text-gray-500">{i+1}</div>
                    <div className="col-span-6 flex items-center gap-3">
                      <span className="text-2xl">{u.avatar}</span>
                      <span className={`font-bold ${session.user.id === u.id ? 'text-[#C5A880]' : 'text-white'}`}>{sanitizeName(u.username)}</span>
                    </div>
                    <div className="col-span-4 text-right font-mono font-black text-[#C5A880]">{u.wallet_balance.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'wallet' && (
          <div className="max-w-xl mx-auto space-y-8">
            <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A880]/5 rounded-full blur-3xl"></div>
               <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Available Bankroll</p>
               <h2 className="text-5xl font-black text-white">{profile?.wallet_balance.toLocaleString()} <span className="text-xl text-[#C5A880]">KSh</span></h2>
            </div>
            {!profile?.has_claimed_airdrop && <button onClick={handleAirdrop} className="w-full bg-[#C5A880] p-5 rounded-2xl text-black font-black uppercase shadow-xl transform active:scale-95 transition">Claim 10,000 KSh Airdrop</button>}
            <div className="bg-[#111111] p-8 rounded-3xl border border-white/10">
              <div className="flex items-center gap-3 mb-6"><ArrowUpFromLine className="text-emerald-500"/><h3 className="text-lg font-bold">M-Pesa Withdrawal</h3></div>
              <div className="space-y-4">
                <input type="tel" placeholder="07XXXXXXXX" value={withdrawPhone} onChange={e => setWithdrawPhone(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-xl font-mono text-center focus:border-emerald-500" />
                <input type="number" placeholder="Amount (KSh)" value={withdrawAmount || ''} onChange={e => setWithdrawAmount(Number(e.target.value))} className="w-full bg-black border border-white/10 p-4 rounded-xl font-black text-xl text-center focus:border-emerald-500" />
                <button onClick={handleWithdraw} className="w-full bg-emerald-600/10 border border-emerald-600/30 text-emerald-500 font-black py-4 rounded-xl hover:bg-emerald-600 hover:text-black transition uppercase">Request Transfer</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DUEL MODAL */}
      {duelData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl animate-in fade-in zoom-in-95">
          <div className="bg-[#111111] border-2 border-[#f43f5e]/50 rounded-3xl p-8 w-full max-w-md text-center shadow-2xl relative overflow-hidden">
            <Swords className="w-16 h-16 text-[#f43f5e] mx-auto mb-6 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
            <h2 className="text-2xl font-black italic uppercase">Challenge Received</h2>
            <p className="text-gray-400 text-sm mt-2 mb-6">Opponent Stance: <span className="text-white font-bold">{events.find(e => e.id === duelData.eventId)?.outcomes[duelData.side]}</span></p>
            <div className="grid gap-3">
              {events.find(e => e.id === duelData.eventId)?.outcomes.map((o, i) => {
                if (i === duelData.side) return null
                return (
                  <button key={i} onClick={() => submitPoolBet(duelData.eventId, i, duelData.stake)} className="bg-emerald-600/10 border border-emerald-600/30 text-emerald-500 hover:bg-emerald-600 hover:text-black font-black py-4 rounded-xl transition uppercase tracking-widest text-sm">
                    Accept & Bet on {o}
                  </button>
                )
              })}
              <button onClick={() => setDuelData(null)} className="text-gray-500 font-bold py-2 text-xs uppercase hover:text-white">Decline Duel</button>
            </div>
          </div>
        </div>
      )}

      {/* BET MODAL */}
      {showBetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="bg-[#111111] border border-white/15 rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowBetModal(false)} className="absolute top-5 right-5 text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
            <h3 className="text-2xl font-black mb-6">Lock Prediction</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-2">
                {events.find(e => e.id === selectedEventId)?.outcomes.map((o, i) => (
                  <button key={i} onClick={() => setSelectedOutcomeIdx(i)} className={`p-4 rounded-xl border font-black transition-all ${selectedOutcomeIdx === i ? 'bg-[#C5A880] border-[#C5A880] text-black shadow-lg shadow-[#C5A880]/20' : 'bg-black/50 border-white/5 text-gray-400'}`}>{o}</button>
                ))}
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Stake Amount (KSh)</p>
                <input type="number" min={MIN_STAKE} value={poolStake} onChange={e => setPoolStake(Number(e.target.value))} className="w-full bg-black border border-white/10 p-5 rounded-2xl font-black text-2xl text-center focus:border-[#C5A880]" />
              </div>
              <div className="flex justify-between items-center py-4 border-t border-white/5 font-black">
                <span className="text-emerald-500 uppercase text-xs tracking-widest">Est. Payout:</span>
                <span className="text-emerald-500 text-3xl drop-shadow-md">{selectedOutcomeIdx !== null ? calculateEstPayout(selectedEventId, selectedOutcomeIdx, poolStake).toLocaleString() : 0} KSh</span>
              </div>
              <button onClick={() => submitPoolBet()} disabled={selectedOutcomeIdx === null || poolStake < MIN_STAKE} className="w-full bg-[#C5A880] text-black font-black py-5 rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition uppercase tracking-widest">Confirm Wager</button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl">
          <div className="bg-[#111111] border border-emerald-500/30 rounded-[40px] p-10 w-full max-w-sm text-center shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-bounce"><CheckCircle2 className="w-10 h-10" /></div>
            <h3 className="text-2xl font-black mb-2 uppercase">Position Locked</h3>
            <p className="text-gray-400 text-sm mb-8">Your capital is active. Now, defend your stance.</p>
            <div className="space-y-3">
              <button onClick={copyChallengeLink} className="w-full bg-[#C5A880] text-black font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:scale-105 transition uppercase tracking-widest text-xs"><Share2 className="w-4 h-4"/> Challenge a Friend</button>
              <button onClick={() => setShowSuccessModal(false)} className="w-full bg-white/5 text-gray-500 font-bold py-3 rounded-xl hover:text-white transition uppercase text-[10px] tracking-[0.2em]">Return to Market</button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
            <LogOut className="w-12 h-12 text-[#f43f5e] mx-auto mb-4"/>
            <h3 className="text-xl font-bold mb-6">Disconnect Session?</h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowLogoutModal(false)} className="bg-white/5 py-4 rounded-xl font-bold uppercase text-xs">Cancel</button>
              <button onClick={() => supabase.auth.signOut()} className="bg-[#f43f5e] py-4 rounded-xl font-black uppercase text-xs">Disconnect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
