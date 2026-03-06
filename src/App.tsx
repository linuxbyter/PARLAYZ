import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Landing from './Landing'
import { X, Bell, Wallet, CheckCircle2, Share2, Swords } from 'lucide-react'

// V2 Interfaces
interface Event { id: string; title: string; description: string; category: string; outcomes: string[]; closes_at: string; created_at: string; resolved: boolean }
interface Bet { id: string; event_id: string; outcome_index: number; stake: number; status: string; user_id: string; }
interface Profile { id: string; username: string; wallet_balance: number; avatar: string; has_claimed_airdrop: boolean; is_public: boolean }
interface AppNotification { id: string; user_id: string; message: string; type: string; is_read: boolean; created_at: string }

const MIN_STAKE = 200
const PLATFORM_FEE_PERCENT = 3

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

  // Betting States
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
    if (session?.user && events.length > 0) {
      const urlParams = new URLSearchParams(window.location.search)
      const dEv = urlParams.get('duel'); const dSd = urlParams.get('side'); const dSt = urlParams.get('stake'); const cId = urlParams.get('challenger')
      if (dEv && dSd && dSt) {
        if (cId !== session.user.id) setDuelData({ eventId: dEv, side: Number(dSd), stake: Number(dSt), challengerId: cId || '' })
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [session, events])

  const fetchData = async () => { await Promise.all([fetchProfile(), fetchAllProfiles(), fetchEvents(), fetchBets(), fetchNotifications()]); setLoading(false) }
  const fetchProfile = async () => { const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single(); if (data) { setProfile(data); if (!data.username || data.username === session.user.email) setShowProfileSetup(true) } }
  const fetchAllProfiles = async () => { const { data } = await supabase.from('profiles').select('*'); if (data) setAllProfiles(data) }
  const fetchEvents = async () => { const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false }); if (data) setEvents(data) }
  const fetchBets = async () => { const { data } = await supabase.from('bets').select('*'); if (data) setBets(data) }
  const fetchNotifications = async () => { const { data } = await supabase.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }); if (data) setNotifications(data) }

  const handleUpdateProfile = async () => {
    if (newUsername.length < 3) return showToast('Alias too short.')
    await supabase.from('profiles').update({ username: newUsername }).eq('id', session.user.id)
    setShowProfileSetup(false); fetchProfile(); fetchAllProfiles(); showToast('Identity locked.', 'success')
  }

  const handleAirdrop = async () => {
    if (!profile || profile.has_claimed_airdrop) return showToast("Claimed.")
    setShowCashierModal({ type: 'deposit', status: 'processing' })
    setTimeout(async () => {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance + 10000, has_claimed_airdrop: true }).eq('id', session.user.id)
      await supabase.from('notifications').insert({ user_id: session.user.id, message: `10,000 KSh airdrop secured.`, type: 'deposit', is_read: false })
      fetchProfile(); fetchAllProfiles(); fetchNotifications(); setShowCashierModal({ type: 'deposit', status: 'success' })
    }, 2000)
  }

  const handleWithdraw = async () => {
    if (withdrawAmount < 100 || (profile && withdrawAmount > profile.wallet_balance)) return showToast("Error.")
    setShowCashierModal({ type: 'withdraw', status: 'processing' })
    setTimeout(async () => {
      if (profile) {
        await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - withdrawAmount }).eq('id', session.user.id)
        await supabase.from('notifications').insert({ user_id: session.user.id, message: `Withdrawal of ${withdrawAmount} KSh initiated.`, type: 'withdrawal', is_read: false })
        fetchProfile(); fetchAllProfiles(); fetchNotifications(); setShowCashierModal({ type: 'withdraw', status: 'success' }); setWithdrawAmount(0); setWithdrawPhone('')
      }
    }, 2500)
  }

  const markNotificationsAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
  }

  const submitPoolBet = async (overrideE?: string, overrideO?: number, overrideS?: number) => {
    const eId = overrideE || selectedEventId; const oIdx = overrideO !== undefined ? overrideO : selectedOutcomeIdx; const stake = overrideS || poolStake
    if (!eId || oIdx === null || !session?.user || !profile || profile.wallet_balance < stake) return showToast('Check balance.')
    const { error } = await supabase.from('bets').insert({ event_id: eId, outcome_index: oIdx, stake, status: 'open', user_id: session.user.id })
    if (!error) {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - stake }).eq('id', session.user.id)
      setLastBet({ eventId: eId, outcomeIdx: oIdx, stake }); setDuelData(null); setShowBetModal(false); setShowSuccessModal(true); setSelectedEventId(''); setSelectedOutcomeIdx(null); setPoolStake(MIN_STAKE)
    } else { showToast('Fail.') }
  }

  const calculateEstPayout = (eventId: string, outcomeIdx: number, newStake: number = 0) => {
    const eventBets = bets.filter(b => b.event_id === eventId && b.status === 'open')
    const totalV = eventBets.reduce((sum, b) => sum + b.stake, 0) + newStake
    const winV = eventBets.filter(b => b.outcome_index === outcomeIdx).reduce((sum, b) => sum + b.stake, 0) + newStake
    if (winV === 0 || totalV === winV) return newStake
    return Math.round(((newStake / winV) * totalV) * (1 - PLATFORM_FEE_PERCENT / 100))
  }

  const copyChallengeLink = () => {
    if (!lastBet || !session?.user) return
    const url = `${window.location.origin}/?duel=${lastBet.eventId}&side=${lastBet.outcomeIdx}&stake=${lastBet.stake}&challenger=${session.user.id}`
    navigator.clipboard.writeText(url); showToast('Copied!', 'success')
  }

  const sanitizeName = (n: string | undefined) => n?.includes('@') ? n.split('@')[0] : n || 'Anonymous'
  const activeEvents = events.filter(e => !e.resolved && (selectedCategory === 'All' || e.category.toLowerCase() === selectedCategory.toLowerCase()))
  const sortedLeaderboard = [...allProfiles].sort((a, b) => b.wallet_balance - a.wallet_balance)

  if (!session) return <Landing />
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white select-none pb-20">
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100]"><div className={`px-5 py-3 rounded-2xl border backdrop-blur-xl ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>{toast.msg}</div></div>}

      {showProfileSetup && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 p-4"><div className="bg-[#111111] border border-[#C5A880]/30 rounded-3xl p-8 w-full max-w-md"><h3>Identity</h3><input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Alias" className="w-full bg-black p-4 mt-4 rounded-xl border border-white/10"/><button onClick={handleUpdateProfile} className="w-full bg-[#C5A880] p-4 mt-4 rounded-xl font-bold text-black uppercase">Enter</button></div></div>}

      <header className="border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black cursor-pointer" onClick={() => setActiveView('markets')}>PARLAYZ</h1>
          <div className="flex gap-4 items-center">
             <button onClick={() => { if (!showNotifications) markNotificationsAsRead(); setShowNotifications(!showNotifications); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#111111] border border-white/10 relative">
               <Bell className="w-4 h-4 text-gray-400" />
               {notifications.filter(n => !n.is_read).length > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#A3885C] rounded-full animate-pulse"></span>}
             </button>
             <button onClick={() => setActiveView('wallet')} className="bg-[#111111] border border-white/10 px-4 py-2 rounded-xl flex gap-2"><Wallet className="text-[#C5A880]"/>{profile?.wallet_balance.toLocaleString()} KSh</button>
             <button onClick={() => setShowLogoutModal(true)} className="text-xl">{profile?.avatar || '👤'}</button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 flex gap-6 pb-2 text-sm font-bold">
          <button onClick={() => setActiveView('markets')} className={activeView === 'markets' ? 'text-[#C5A880] border-b-2 border-[#C5A880]' : 'text-gray-500'}>Markets</button>
          <button onClick={() => setActiveView('wagers')} className={activeView === 'wagers' ? 'text-[#C5A880] border-b-2 border-[#C5A880]' : 'text-gray-500'}>My Bets</button>
          <button onClick={() => setActiveView('leaderboard')} className={activeView === 'leaderboard' ? 'text-[#C5A880] border-b-2 border-[#C5A880]' : 'text-gray-500'}>Leaderboard</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeView === 'markets' && (
          <div className="animate-in fade-in">
            <div className="flex gap-2 overflow-x-auto pb-4">
              {['All', 'Sports', 'Crypto', 'Politics'].map(c => <button key={c} onClick={() => setSelectedCategory(c)} className={`px-4 py-2 rounded-xl text-xs font-bold border ${selectedCategory === c ? 'bg-[#C5A880] text-black' : 'bg-[#111111] text-gray-400'}`}>{c}</button>)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {activeEvents.map(event => {
                const eBets = bets.filter(b => b.event_id === event.id && b.status === 'open')
                const totalV = eBets.reduce((sum, b) => sum + b.stake, 0)
                const COLORS = ['197, 168, 128', '16, 185, 129', '244, 63, 94', '59, 130, 246']
                return (
                  <div key={event.id} className="bg-[#111111] border border-white/10 rounded-3xl p-5 flex flex-col relative overflow-hidden">
                    <div className="flex justify-between text-[10px] mb-2 font-bold uppercase text-[#C5A880]"><span>{event.category}</span><span className="text-gray-500">Closes {new Date(event.closes_at).toLocaleDateString()}</span></div>
                    <h3 className="text-lg font-bold mb-1 truncate">{event.title}</h3>
                    <div className="grid grid-cols-2 gap-2 mb-4 mt-3">
                      {event.outcomes.map((o, idx) => {
                        const oV = eBets.filter(b => b.outcome_index === idx).reduce((s, b) => s + b.stake, 0)
                        const p = totalV === 0 ? 0 : Math.round((oV/totalV)*100); const rgb = COLORS[idx % COLORS.length]
                        return (
                          <div key={idx} className="p-3 rounded-xl bg-black border flex flex-col items-center justify-center"
                               style={{ borderColor: `rgba(${rgb}, ${totalV === 0 ? 0.1 : 0.2 + (p/100)})`, boxShadow: `0 0 10px rgba(${rgb}, 0.05)` }}>
                            <span className="text-[10px] font-bold truncate w-full text-center">{o}</span>
                            <span className="text-lg font-black" style={{ color: `rgb(${rgb})` }}>{p}%</span>
                          </div>
                        )
                      })}
                    </div>
                    <button onClick={() => { setSelectedEventId(event.id); setShowBetModal(true) }} className="w-full bg-[#1a1a1a] p-3 rounded-xl font-bold hover:bg-[#C5A880] hover:text-black transition uppercase">Trade Pool 💸</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeView === 'leaderboard' && (
          <div className="max-w-2xl mx-auto bg-[#111111] border border-white/10 rounded-3xl overflow-hidden">
            {sortedLeaderboard.map((u, i) => (
              <div key={u.id} className="p-5 flex justify-between items-center border-b border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => setSelectedPublicProfile(u)}>
                <div className="flex gap-4 items-center">
                  <span className="font-bold text-gray-500 w-4">{i+1}</span>
                  <span className="text-xl">{u.avatar}</span>
                  <span className="font-bold">{sanitizeName(u.username)}</span>
                </div>
                <span className="font-mono font-bold text-[#C5A880]">{u.wallet_balance.toLocaleString()} KSh</span>
              </div>
            ))}
          </div>
        )}

        {activeView === 'wagers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bets.filter(b => b.user_id === session?.user?.id && b.status === 'open').map((b, i) => {
               const ev = events.find(e => e.id === b.event_id)
               return (
                 <div key={i} className="bg-[#111111] border border-[#C5A880]/30 p-6 rounded-3xl">
                   <p className="text-xs text-emerald-500 font-bold mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Active</p>
                   <h3 className="font-bold text-lg mb-4">{ev?.title}</h3>
                   <div className="flex justify-between text-sm"><span>Stake:</span><span className="font-bold">{b.stake} KSh</span></div>
                   <div className="flex justify-between text-emerald-500 font-bold mt-2"><span>Est. Payout:</span><span>{calculateEstPayout(b.event_id, b.outcome_index, 0)} KSh</span></div>
                 </div>
               )
            })}
          </div>
        )}

        {activeView === 'wallet' && (
           <div className="max-w-xl mx-auto space-y-6 text-center">
             <div className="bg-gradient-to-br from-[#C5A880]/20 to-black border border-[#C5A880]/30 p-10 rounded-3xl">
               <p className="text-gray-500 text-xs font-bold uppercase">Bankroll</p>
               <h2 className="text-5xl font-black mt-2">{profile?.wallet_balance.toLocaleString()} <span className="text-lg">KSh</span></h2>
             </div>
             {!profile?.has_claimed_airdrop && <button onClick={handleAirdrop} className="w-full bg-[#C5A880] p-5 rounded-2xl text-black font-black uppercase shadow-xl transition-all hover:scale-[1.02]">Claim Airdrop</button>}
             <div className="bg-[#111111] p-6 rounded-3xl border border-white/5 text-left">
                <h4 className="font-bold mb-4 uppercase text-xs text-gray-400">Cash Out</h4>
                <input type="number" placeholder="Phone" value={withdrawPhone} onChange={e => setWithdrawPhone(e.target.value)} className="w-full bg-black p-4 rounded-xl border border-white/10 mb-4"/>
                <input type="number" placeholder="Amount" value={withdrawAmount || ''} onChange={e => setWithdrawAmount(Number(e.target.value))} className="w-full bg-black p-4 rounded-xl border border-white/10 mb-4"/>
                <button onClick={handleWithdraw} className="w-full bg-white/5 p-4 rounded-xl font-bold hover:bg-[#C5A880] hover:text-black uppercase">Request Transfer</button>
             </div>
           </div>
        )}
      </main>

      {/* Duel Modal */}
      {duelData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 p-4">
          <div className="bg-[#111111] border-2 border-red-500/50 rounded-3xl p-8 w-full max-w-md text-center">
            <Swords className="w-16 h-16 text-red-500 mx-auto mb-4"/>
            <h2 className="text-2xl font-black italic uppercase">Challenge</h2>
            <p className="text-gray-400 text-sm mt-2 mb-6">Opponent Stance: <span className="text-white font-bold">{events.find(e => e.id === duelData.eventId)?.outcomes[duelData.side]}</span></p>
            <div className="grid gap-2">
              {events.find(e => e.id === duelData.eventId)?.outcomes.map((o, i) => {
                if (i === duelData.side) return null
                return <button key={i} onClick={() => submitPoolBet(duelData.eventId, i, duelData.stake)} className="bg-white/10 p-4 rounded-xl font-bold hover:bg-emerald-500 hover:text-black uppercase">Bet on {o}</button>
              })}
              <button onClick={() => setDuelData(null)} className="text-gray-500 text-xs mt-4 font-bold uppercase">Decline</button>
            </div>
          </div>
        </div>
      )}

      {/* Bet Modal */}
      {showBetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-[#111111] border border-white/20 rounded-3xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">Wager Prediction</h3>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {events.find(e => e.id === selectedEventId)?.outcomes.map((o, i) => (
                <button key={i} onClick={() => setSelectedOutcomeIdx(i)} className={`p-3 rounded-xl border font-bold transition ${selectedOutcomeIdx === i ? 'bg-[#C5A880] text-black border-[#C5A880]' : 'bg-black border-white/10 text-gray-500'}`}>{o}</button>
              ))}
            </div>
            <input type="number" value={poolStake} onChange={e => setPoolStake(Number(e.target.value))} className="w-full bg-black p-4 rounded-xl border border-white/10 font-black text-xl text-center"/>
            <div className="flex justify-between my-6 text-emerald-500 font-bold"><span>Est. Payout:</span><span>{selectedOutcomeIdx !== null ? calculateEstPayout(selectedEventId, selectedOutcomeIdx, poolStake) : 0} KSh</span></div>
            <button onClick={() => submitPoolBet()} className="w-full bg-[#C5A880] p-4 rounded-xl text-black font-black uppercase shadow-xl">Confirm Wager</button>
            <button onClick={() => setShowBetModal(false)} className="w-full text-gray-500 mt-4 text-[10px] font-bold uppercase">Cancel</button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 text-center">
          <div className="bg-[#111111] border border-emerald-500/30 rounded-3xl p-8 w-full max-w-sm">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4"/>
            <h3 className="text-xl font-bold uppercase">Locked In</h3>
            <button onClick={copyChallengeLink} className="w-full bg-[#C5A880] p-4 rounded-xl text-black font-black mt-6 flex justify-center gap-2 uppercase text-xs"><Share2 className="w-4 h-4"/> Challenge Friend</button>
            <button onClick={() => setShowSuccessModal(false)} className="w-full text-gray-500 mt-4 text-[10px] font-bold uppercase">Close</button>
          </div>
        </div>
      )}

      {/* Modals for Leaderboard Profile & Cashier Feedback */}
      {selectedPublicProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={() => setSelectedPublicProfile(null)}>
           <div className="bg-[#111111] border border-white/10 p-10 rounded-3xl text-center relative" onClick={e => e.stopPropagation()}>
             <span className="text-6xl mb-4 block">{selectedPublicProfile.avatar}</span>
             <h3 className="text-2xl font-black uppercase">{sanitizeName(selectedPublicProfile.username)}</h3>
             <p className="text-emerald-500 font-mono font-bold mt-2">{selectedPublicProfile.wallet_balance.toLocaleString()} KSh</p>
             <button onClick={() => setSelectedPublicProfile(null)} className="absolute top-4 right-4"><X className="w-5 h-5"/></button>
           </div>
        </div>
      )}

      {showCashierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
           <div className="bg-[#111111] border border-white/20 p-8 rounded-3xl text-center">
             {showCashierModal.status === 'processing' ? <div className="w-10 h-10 border-2 border-t-[#C5A880] rounded-full animate-spin mx-auto"></div> : <div><CheckCircle2 className="text-emerald-500 mx-auto w-12 h-12 mb-4"/><h3>Finalized</h3><button onClick={() => setShowCashierModal(null)} className="bg-white/10 px-8 py-2 mt-6 rounded-lg font-bold uppercase text-[10px]">Close</button></div>}
           </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 text-center">
          <div className="bg-[#111111] border border-white/20 p-8 rounded-3xl">
            <h3 className="font-bold uppercase text-sm">Disconnect?</h3>
            <div className="flex gap-4 mt-6"><button onClick={() => setShowLogoutModal(false)} className="px-6 py-2 bg-white/5 rounded-lg uppercase text-[10px] font-bold">No</button><button onClick={() => supabase.auth.signOut()} className="px-6 py-2 bg-red-500 rounded-lg font-bold uppercase text-[10px]">Yes</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
