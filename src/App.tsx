import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Landing from './Landing'
import { LogOut, X, AlertTriangle, Bell, Wallet, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, History, Trophy, Activity, MessageSquare, Eye, EyeOff, ShieldAlert, Share2, Filter, ChevronRight } from 'lucide-react'

interface Event { id: string; title: string; description: string; category: string; outcomes: string[]; closes_at: string; created_at: string; resolved: boolean }
interface Bet { id: string; event_id: string; outcome_index: number; stake: number; odds?: number; status: string; user_id: string; matcher_id?: string }
interface Profile { id: string; username: string; wallet_balance: number; avatar: string; has_claimed_airdrop: boolean; is_public: boolean }

const MIN_STAKE = 200
const PLATFORM_FEE_PERCENT = 3
const AVATARS = ['🦊', '🐯', '🦅', '🦈', '🐍', '🦍', '🐉', '🦂', '🦉', '🐺']
const CATEGORIES = ['All', 'Football', 'Basketball', 'Boxing', 'E-Sports', 'Politics']

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')

  // Navigation & Modals
  const [activeView, setActiveView] = useState<'markets' | 'orderbook' | 'wagers' | 'leaderboard' | 'wallet'>('orderbook')
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false)
  const [offerToMatch, setOfferToMatch] = useState<Bet | null>(null)
  
  // Form States
  const [p2pSelectedEventId, setP2pSelectedEventId] = useState<string>('')
  const [p2pSelectedOutcomeIdx, setP2pSelectedOutcomeIdx] = useState<number>(0)
  const [p2pStake, setP2pStake] = useState<number>(MIN_STAKE)
  const [p2pOdds, setP2pOdds] = useState<number>(2.00)
  const [toast, setToast] = useState<{msg: string, type: 'error' | 'success'} | null>(null)

  const showToast = (msg: string, type: 'error' | 'success' = 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session?.user) {
      fetchData()
      const betsChannel = supabase.channel('global_final').on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, () => fetchData()).subscribe()
      return () => { betsChannel.unsubscribe() }
    }
  }, [session])

  // Deep Link Logic
  useEffect(() => {
    if (session?.user && bets.length > 0) {
      const urlParams = new URLSearchParams(window.location.search)
      const matchId = urlParams.get('match')
      if (matchId) {
        const betToMatch = bets.find(b => b.id === matchId && b.status === 'p2p_open')
        if (betToMatch && betToMatch.user_id !== session.user.id) {
          setOfferToMatch(betToMatch)
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }
    }
  }, [session, bets])

  const fetchData = async () => {
    const [p, ap, ev, bt] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session?.user?.id).single(),
      supabase.from('profiles').select('*'),
      supabase.from('events').select('*').order('created_at', { ascending: false }),
      supabase.from('bets').select('*')
    ])
    if (p.data) {
        setProfile(p.data)
        if (!p.data.username || p.data.username.includes('@')) setShowProfileSetup(true)
    }
    if (ap.data) setAllProfiles(ap.data)
    if (ev.data) setEvents(ev.data)
    if (bt.data) setBets(bt.data)
    setLoading(false)
  }

  const sanitizeName = (name: string | undefined) => {
    if (!name) return 'New Trader'
    return name.includes('@') ? name.split('@')[0] : name
  }

  const initiateMatch = (offer: Bet) => {
    if (offer.user_id === session?.user?.id) return showToast("You can't bet against yourself!")
    const liability = Math.round((offer.stake * (offer.odds || 2)) - offer.stake)
    if ((profile?.wallet_balance || 0) < liability) return showToast(`Insufficient balance. You need ${liability.toLocaleString()} KSh to match this.`)
    setOfferToMatch(offer)
  }

  const confirmMatch = async () => {
    if (!offerToMatch || !profile) return
    const liability = Math.round((offerToMatch.stake * (offerToMatch.odds || 2)) - offerToMatch.stake)
    const { error } = await supabase.from('bets').update({ status: 'p2p_matched', matcher_id: session.user.id }).eq('id', offerToMatch.id)
    if (!error) {
        await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - liability }).eq('id', session.user.id)
        showToast("Match Secured!", "success")
        setOfferToMatch(null)
        fetchData()
    }
  }

  const getUserStats = (userId: string) => {
    const userBets = bets.filter(b => b.user_id === userId || b.matcher_id === userId)
    const settled = userBets.filter(b => ['won', 'lost'].includes(b.status))
    const wins = settled.filter(b => b.status === 'won').length
    const winRate = settled.length > 0 ? Math.round((wins / settled.length) * 100) : 0
    return { trades: userBets.length, winRate }
  }

  const filteredEvents = activeCategory === 'All' ? events.filter(e => !e.resolved) : events.filter(e => e.category === activeCategory && !e.resolved)
  const sortedLeaderboard = [...allProfiles].sort((a, b) => b.wallet_balance - a.wallet_balance)

  if (!session) return <Landing />
  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-12 h-12 border-2 border-t-[#C5A880] rounded-full animate-spin"></div></div>

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#C5A880]/30 overflow-x-hidden">
      
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-10">
          <div className={`px-6 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center gap-3 font-bold text-sm ${toast.type === 'success' ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-[#f43f5e]/10 border-[#f43f5e]/30 text-[#f43f5e]'}`}>
            <AlertTriangle className="w-4 h-4" />
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Identity Wall */}
      {showProfileSetup && (
        <div className="fixed inset-0 z-[150] bg-[#0a0a0a]/98 flex items-center justify-center p-4 backdrop-blur-xl">
            <div className="bg-[#111111] border border-white/5 p-10 rounded-[3.5rem] max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#C5A880]/10 rounded-full blur-[60px]"></div>
                <h2 className="text-3xl font-black mb-2 text-white italic tracking-tighter">PARLAYZ</h2>
                <p className="text-gray-500 text-[10px] mb-10 uppercase tracking-[0.3em] font-bold">Pick an Icon to Enter</p>
                <div className="flex flex-wrap gap-4 justify-center mb-10">
                    {AVATARS.map(a => (
                        <button key={a} onClick={async () => {
                            const newU = sanitizeName(session?.user?.email) + "_" + Math.floor(Math.random()*99);
                            await supabase.from('profiles').update({ username: newU, avatar: a }).eq('id', session.user.id);
                            setShowProfileSetup(false);
                            fetchData();
                        }} className="text-4xl p-3 hover:scale-125 transition grayscale hover:grayscale-0 active:scale-90">{a}</button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#ffffff0a]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-8">
                <div className="text-2xl font-black text-white tracking-tighter cursor-pointer hover:text-[#C5A880] transition" onClick={() => setActiveView('orderbook')}>PARLAYZ</div>
                <div className="hidden lg:flex gap-2 items-center bg-[#111111] p-1 rounded-full border border-[#ffffff05]">
                    <Filter className="w-3 h-3 text-gray-600 ml-2" />
                    {CATEGORIES.map(c => (
                        <button key={c} onClick={() => setActiveCategory(c)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase transition-all duration-300 ${activeCategory === c ? 'bg-[#C5A880] text-[#0a0a0a] shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>{c}</button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => setActiveView('wallet')} className="bg-[#111111] border border-[#ffffff10] px-5 py-2.5 rounded-2xl flex items-center gap-3 hover:border-[#C5A880]/50 transition group shadow-inner">
                    <Wallet className="w-4 h-4 text-[#C5A880] group-hover:rotate-12 transition" />
                    <span className="font-mono font-black text-sm tracking-tight">{profile?.wallet_balance.toLocaleString()} <span className="text-[9px] text-gray-600">KSH</span></span>
                </button>
                <div className="w-10 h-10 rounded-2xl bg-[#1a1a1a] flex items-center justify-center text-xl border border-[#ffffff10] relative group">
                    {profile?.avatar}
                    <div className="absolute top-11 right-0 hidden group-hover:block bg-[#111111] border border-[#ffffff10] rounded-xl p-3 z-[60] shadow-2xl">
                        <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-[10px] text-red-500 uppercase font-black whitespace-nowrap"><LogOut className="w-3 h-3" /> Disconnect</button>
                    </div>
                </div>
            </div>
        </div>
      </header>

      {/* Main View Grid */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        
        <div className="flex gap-2 mb-12 overflow-x-auto pb-4 no-scrollbar">
            {['orderbook', 'markets', 'wagers', 'leaderboard'].map(v => (
                <button key={v} onClick={() => setActiveView(v as any)} className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-500 ${activeView === v ? 'bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.1)]' : 'bg-[#111111] text-gray-600 border border-[#ffffff05] hover:border-gray-500'}`}>
                    {v === 'orderbook' ? 'Exchange' : v}
                </button>
            ))}
        </div>

        {/* ORDERBOOK */}
        {activeView === 'orderbook' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-5">
                {bets.filter(b => b.status === 'p2p_open').length === 0 ? (
                    <div className="col-span-full py-32 text-center bg-[#111111]/50 rounded-[3rem] border border-dashed border-[#ffffff0a]">
                        <Activity className="mx-auto mb-6 text-gray-800 w-16 h-16" />
                        <p className="text-gray-600 font-black uppercase tracking-[0.3em] text-xs">Liquidity Pool Empty</p>
                    </div>
                ) : (
                    bets.filter(b => b.status === 'p2p_open').map(offer => {
                        const maker = allProfiles.find(p => p.id === offer.user_id)
                        const event = events.find(e => e.id === offer.event_id)
                        const stats = getUserStats(offer.user_id)
                        if (!event) return null
                        const liability = Math.round((offer.stake * (offer.odds || 2)) - offer.stake)

                        return (
                            <div key={offer.id} className="bg-[#111111] border border-[#ffffff0a] rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-[#C5A880]/40 transition-all duration-500 shadow-2xl">
                                <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#C5A880]/5 rounded-full blur-3xl group-hover:bg-[#C5A880]/10 transition-all"></div>
                                <div className="flex justify-between items-start mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-[#0a0a0a] border border-[#ffffff0a] flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">{maker?.avatar || '👤'}</div>
                                        <div>
                                            <p className="text-sm font-black text-white tracking-tight">{sanitizeName(maker?.username)}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[8px] font-black text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">{stats.winRate}% Win</span>
                                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter">{stats.trades} Trades</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <p className="text-2xl font-black text-[#C5A880]">{offer.odds}x</p>
                                        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?match=${offer.id}`); showToast("Match link copied!", "success"); }} className="p-2 hover:bg-[#ffffff05] rounded-lg transition mt-2"><Share2 className="w-4 h-4 text-gray-600" /></button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold leading-tight mb-8 line-clamp-2 h-12 text-gray-200">{event.title}</h3>
                                <div className="bg-[#0a0a0a] rounded-3xl p-6 mb-10 border border-[#ffffff05] text-center shadow-inner relative">
                                    <p className="text-[9px] text-gray-600 uppercase font-black mb-3 tracking-[0.2em]">Condition to Match</p>
                                    <p className="text-white font-black text-xl">{event.outcomes[offer.outcome_index]}</p>
                                </div>
                                <div className="flex justify-between items-center mb-10 px-2">
                                    <div><p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Stake</p><p className="text-xl font-black text-white">{liability.toLocaleString()} <span className="text-xs text-gray-700">KSH</span></p></div>
                                    <div className="text-right"><p className="text-[9px] text-[#10b981] font-black uppercase tracking-widest">Est. Payout</p><p className="text-xl font-black text-[#10b981]">{(offer.stake + liability).toLocaleString()} <span className="text-xs text-[#10b981]/50">KSH</span></p></div>
                                </div>
                                <button onClick={() => initiateMatch(offer)} className="w-full bg-white text-black font-black py-5 rounded-3xl hover:bg-[#C5A880] transition-all uppercase tracking-[0.2em] text-[10px] shadow-xl active:scale-95 border-b-4 border-gray-300 hover:border-[#A3885C]">Place Bet</button>
                            </div>
                        )
                    })
                )}
            </div>
        )}

        {/* LEADERBOARD */}
        {activeView === 'leaderboard' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-end mb-10 px-6">
                    <div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Leaderboard</h2>
                        <p className="text-[#C5A880] text-[10px] font-black uppercase tracking-[0.3em] mt-2">The Elite Traders • Nairobi Arena</p>
                    </div>
                    <Trophy className="w-10 h-10 text-yellow-600 opacity-50 shadow-2xl" />
                </div>
                {sortedLeaderboard.map((user, i) => (
                    <div key={user.id} className={`bg-[#111111] border ${user.id === session?.user?.id ? 'border-[#C5A880]/40 bg-[#C5A880]/5' : 'border-[#ffffff05]'} rounded-[2.5rem] p-6 flex items-center justify-between group transition-all duration-500 hover:translate-x-2`}>
                        <div className="flex items-center gap-6">
                            <span className={`font-black text-xl w-8 text-center ${i === 0 ? 'text-yellow-500' : 'text-gray-800'}`}>{i + 1}</span>
                            <div className="text-4xl filter drop-shadow-xl group-hover:scale-110 transition-transform">{user.avatar}</div>
                            <div>
                                <p className="font-black text-white tracking-tight text-xl">{sanitizeName(user.username)}</p>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-[10px] text-[#10b981] font-black uppercase tracking-[0.2em]">{getUserStats(user.id).winRate}% Accuracy</span>
                                    {user.is_public ? <Eye className="w-3 h-3 text-gray-700" /> : <EyeOff className="w-3 h-3 text-gray-700" />}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Net Value</p>
                            <p className="text-2xl font-black text-white font-mono tracking-tighter">{user.wallet_balance.toLocaleString()} <span className="text-xs text-gray-700 font-bold uppercase">KSH</span></p>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* MARKETS */}
        {activeView === 'markets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in">
                {filteredEvents.map(event => (
                    <div key={event.id} className="bg-[#111111] border border-[#ffffff0a] rounded-[2.5rem] p-8 hover:border-white/20 transition-all flex flex-col group relative overflow-hidden shadow-2xl">
                        <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-white/5 rounded-full blur-3xl"></div>
                        <div className="flex justify-between mb-6 relative z-10">
                            <span className="text-[9px] font-black bg-white/10 text-white px-3 py-1 rounded-full uppercase tracking-widest">{event.category}</span>
                            <ChevronRight className="w-4 h-4 text-gray-700 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-6 flex-grow leading-tight tracking-tight relative z-10">{event.title}</h3>
                        <button onClick={() => { setP2pSelectedEventId(event.id); setShowCreateOfferModal(true); }} className="w-full bg-[#1a1a1a] border border-[#ffffff10] text-white font-black py-5 rounded-[1.8rem] hover:bg-white hover:text-black transition-all uppercase text-[10px] tracking-[0.2em] relative z-10">Set My Own Odds</button>
                    </div>
                ))}
            </div>
        )}

        {/* WALLET */}
        {activeView === 'wallet' && (
            <div className="max-w-2xl mx-auto animate-in fade-in">
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#ffffff10] rounded-[3rem] p-10 mb-10 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Secured Liquidity</p>
                    <h1 className="text-6xl font-black text-white tracking-tighter mb-10 italic">{profile?.wallet_balance.toLocaleString()} <span className="text-xl text-[#C5A880] not-italic">KSH</span></h1>
                    <div className="flex gap-4">
                        <button className="flex-1 bg-[#C5A880] text-black font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg"><ArrowDownToLine className="w-4 h-4" /> Deposit</button>
                        <button className="flex-1 bg-[#1a1a1a] border border-[#ffffff10] text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><ArrowUpFromLine className="w-4 h-4" /> Withdraw</button>
                    </div>
                </div>
                <div className="flex items-center gap-2 mb-6 text-gray-500 px-4"><History className="w-4 h-4" /><h3 className="text-xs font-black uppercase tracking-widest">Protocol Ledger</h3></div>
                <div className="bg-[#111111] border border-[#ffffff05] rounded-[2.5rem] p-10 text-center text-gray-700 text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-4 opacity-10" /> Verification Synchronized
                </div>
            </div>
        )}

        {/* WAGERS */}
        {activeView === 'wagers' && (
            <div className="max-w-4xl mx-auto animate-in fade-in">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-10 italic">Wager History</h2>
                <div className="bg-[#111111] border border-[#ffffff0a] rounded-[3rem] p-16 text-center border-dashed">
                    <MessageSquare className="w-14 h-14 mx-auto mb-6 text-gray-800" />
                    <p className="text-gray-600 font-black uppercase tracking-[0.3em] text-[10px] mb-8">No Active Match Identified</p>
                    <button onClick={() => setActiveView('orderbook')} className="bg-white/5 border border-white/10 px-10 py-4 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 transition">Explore Exchange</button>
                </div>
                <div className="mt-20 flex items-center gap-4 border-t border-[#ffffff05] pt-10 px-4 opacity-20 grayscale">
                    <Bell className="w-6 h-6" /><p className="text-[10px] font-black uppercase tracking-widest">Settlement notifications are live on this account</p>
                </div>
            </div>
        )}
      </main>

      {/* CONFIRM MATCH MODAL */}
      {offerToMatch && (
        <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-[#111111] border border-[#C5A880]/30 rounded-[3rem] p-10 max-w-md w-full text-center relative shadow-2xl overflow-hidden">
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#C5A880]/10 rounded-full blur-[80px]"></div>
                <div className="w-24 h-24 bg-[#C5A880]/10 rounded-[2.2rem] flex items-center justify-center mx-auto mb-10 border border-[#C5A880]/20 shadow-inner"><ShieldAlert className="text-[#C5A880] w-12 h-12" /></div>
                <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter italic">Confirm?</h2>
                <p className="text-gray-400 text-sm mb-12 leading-relaxed px-4 tracking-tight">You are staking <span className="text-white font-black">{Math.round((offerToMatch.stake * (offerToMatch.odds || 2)) - offerToMatch.stake).toLocaleString()} KSh</span> in this match. Funds are escrowed until resolution.</p>
                <div className="flex gap-4">
                    <button onClick={() => setOfferToMatch(null)} className="flex-1 py-5 rounded-2xl bg-[#1a1a1a] text-gray-500 font-black uppercase tracking-[0.2em] text-[10px] hover:text-white transition">Decline</button>
                    <button onClick={confirmMatch} className="flex-1 py-5 rounded-2xl bg-[#10b981] text-black font-black uppercase tracking-[0.2em] text-[10px] shadow-lg hover:scale-105 active:scale-95 transition-transform">Accept Match</button>
                </div>
            </div>
        </div>
      )}

      {/* CREATE OFFER MODAL */}
      {showCreateOfferModal && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#111111] border border-[#C5A880]/30 rounded-[3rem] p-10 max-w-md w-full relative shadow-2xl">
                <button onClick={() => setShowCreateOfferModal(false)} className="absolute top-10 right-10 text-gray-600 hover:text-white transition hover:rotate-90"><X /></button>
                <h2 className="text-3xl font-black mb-10 uppercase tracking-tighter italic">Maker</h2>
                <div className="space-y-10">
                    <div>
                        <label className="text-[10px] font-black text-gray-600 uppercase mb-4 block tracking-[0.3em] text-center">Prediction Choice</label>
                        <div className="grid grid-cols-2 gap-4">
                            {events.find(e => e.id === p2pSelectedEventId)?.outcomes.map((o, idx) => (
                                <button key={idx} onClick={() => setP2pSelectedOutcomeIdx(idx)} className={`py-5 rounded-[1.8rem] border-2 font-black text-xs uppercase transition-all duration-500 ${p2pSelectedOutcomeIdx === idx ? 'bg-[#C5A880] text-black border-[#C5A880] shadow-xl' : 'bg-transparent border-[#ffffff05] text-gray-700 hover:border-gray-600'}`}>{o}</button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="text-[9px] font-black text-gray-600 uppercase mb-4 block tracking-[0.2em]">Stake (KSh)</label>
                            <input type="number" value={p2pStake} onChange={e => setP2pStake(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#ffffff0a] rounded-3xl p-6 font-mono font-black text-xl focus:border-[#C5A880] outline-none text-white shadow-inner" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-600 uppercase mb-4 block tracking-[0.2em]">Odds Target</label>
                            <input type="number" step="0.1" value={p2pOdds} onChange={e => setP2pOdds(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#ffffff0a] rounded-3xl p-6 font-mono font-black text-xl focus:border-[#C5A880] outline-none text-[#C5A880] shadow-inner" />
                        </div>
                    </div>
                    <div className="bg-[#0a0a0a] rounded-[2rem] p-8 text-center border border-[#ffffff05] shadow-inner">
                        <p className="text-[9px] text-gray-700 font-black uppercase mb-2 tracking-[0.3em]">Potential Net Win (-{PLATFORM_FEE_PERCENT}%)</p>
                        <p className="text-3xl font-black text-white tracking-tighter">{Math.round((p2pStake * p2pOdds) * (1 - PLATFORM_FEE_PERCENT/100)).toLocaleString()} <span className="text-sm text-gray-700 italic">KSH</span></p>
                    </div>
                    <button onClick={async () => {
                        if (p2pStake < MIN_STAKE) return showToast(`Min stake is ${MIN_STAKE} KSh`);
                        if ((profile?.wallet_balance || 0) < p2pStake) return showToast("Insufficient balance");
                        const { error } = await supabase.from('bets').insert({ event_id: p2pSelectedEventId, outcome_index: p2pSelectedOutcomeIdx, stake: p2pStake, odds: p2pOdds, status: 'p2p_open', user_id: session.user.id });
                        if (!error) {
                            await supabase.from('profiles').update({ wallet_balance: (profile?.wallet_balance || 0) - p2pStake }).eq('id', session.user.id);
                            showToast("Offer Published!", "success");
                            setShowCreateOfferModal(false);
                            fetchData();
                        }
                    }} className="w-full bg-white text-black font-black py-7 rounded-[2.2rem] uppercase tracking-[0.4em] text-[11px] shadow-2xl hover:bg-[#C5A880] transition-all border-b-8 border-gray-300 active:translate-y-1 active:border-b-0">Post Bet</button>
                </div>
            </div>
        </div>
      )}

    </div>
  )
}
