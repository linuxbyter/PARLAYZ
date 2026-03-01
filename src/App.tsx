import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import Landing from './Landing'
import { LogOut, X, AlertTriangle, Bell, Wallet, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, History, Trophy, Activity, MessageSquare, Eye, EyeOff, ShieldAlert, Send, Share2, Sparkles, Filter, ChevronRight } from 'lucide-react'

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

  // AI Support States
  const [showAI, setShowAI] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [aiMessages, setAiMessages] = useState<{role: 'ai' | 'user', text: string}[]>([
    {role: 'ai', text: "Hujambo! I'm the Parlayz Agent. I can help you understand the exchange or request new pools. What's on your mind?"}
  ])
  const aiEndRef = useRef<HTMLDivElement>(null)

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
      const betsChannel = supabase.channel('global_v5').on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, () => fetchData()).subscribe()
      return () => { betsChannel.unsubscribe() }
    }
  }, [session])

  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [aiMessages])

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

  const handleAISend = async () => {
    if (!aiInput.trim()) return
    const userText = aiInput
    setAiInput('')
    setAiMessages(prev => [...prev, {role: 'user', text: userText}])
    setIsTyping(true)

    let response = "I've logged your request. Our admins will review this pool shortly!"
    const input = userText.toLowerCase()
    
    if (input.includes('how') || input.includes('work')) {
        response = "We are a P2P exchange. You set the odds, others match them. No house involved."
    } else if (input.includes('fee')) {
        response = `We charge a small ${PLATFORM_FEE_PERCENT}% commission on winning payouts to keep the servers running!`
    }

    setTimeout(async () => {
        setAiMessages(prev => [...prev, {role: 'ai', text: response}])
        setIsTyping(false)
        await supabase.from('ai_conversations').insert({ user_id: session.user.id, user_message: userText, ai_response: response })
    }, 800)
  }

  const initiateMatch = (offer: Bet) => {
    if (offer.user_id === session?.user?.id) return showToast("You can't bet against yourself!")
    const liability = Math.round((offer.stake * (offer.odds || 2)) - offer.stake)
    if ((profile?.wallet_balance || 0) < liability) return showToast(`Need ${liability.toLocaleString()} KSh to match.`)
    setOfferToMatch(offer)
  }

  const confirmMatch = async () => {
    if (!offerToMatch || !profile) return
    const liability = Math.round((offerToMatch.stake * (offerToMatch.odds || 2)) - offerToMatch.stake)
    const { error } = await supabase.from('bets').update({ status: 'p2p_matched', matcher_id: session.user.id }).eq('id', offerToMatch.id)
    if (!error) {
        await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - liability }).eq('id', session.user.id)
        showToast("Bet matched successfully!", "success")
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
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#C5A880]/30">
      
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-10">
          <div className={`px-6 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl ${toast.type === 'success' ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-[#f43f5e]/10 border-[#f43f5e]/30 text-[#f43f5e]'}`}>
            <AlertTriangle className="w-4 h-4 inline mr-2" /> {toast.msg}
          </div>
        </div>
      )}

      {/* Floating Support AI */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
        {showAI && (
            <div className="w-80 h-[450px] bg-[#111111] border border-[#C5A880]/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
                <div className="p-4 bg-[#1a1a1a] border-b border-[#ffffff10] flex justify-between items-center">
                    <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#C5A880]" /><span className="text-xs font-black uppercase tracking-widest text-[#C5A880]">Agent</span></div>
                    <button onClick={() => setShowAI(false)}><X className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0a0a0a]/50">
                    {aiMessages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${m.role === 'ai' ? 'bg-[#1a1a1a] text-gray-300 border border-[#ffffff05]' : 'bg-[#C5A880] text-[#0a0a0a] font-bold'}`}>{m.text}</div>
                        </div>
                    ))}
                    {isTyping && <div className="text-[10px] text-gray-500 animate-pulse font-bold ml-1 uppercase">Thinking...</div>}
                    <div ref={aiEndRef} />
                </div>
                <div className="p-4 bg-[#111111] border-t border-[#ffffff05] flex gap-2">
                    <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAISend()} placeholder="Ask anything..." className="flex-1 bg-[#0a0a0a] border border-[#ffffff10] rounded-xl px-4 py-3 text-xs focus:border-[#C5A880] outline-none" />
                    <button onClick={handleAISend} className="bg-[#C5A880] text-[#0a0a0a] p-3 rounded-xl"><Send className="w-4 h-4" /></button>
                </div>
            </div>
        )}
        <button onClick={() => setShowAI(!showAI)} className="w-16 h-16 bg-[#C5A880] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all">
            <Sparkles className="w-7 h-7 text-[#0a0a0a]" />
        </button>
      </div>

      {/* Identity Wall */}
      {showProfileSetup && (
        <div className="fixed inset-0 z-[150] bg-[#0a0a0a]/95 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-[#111111] border border-[#C5A880]/30 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl relative">
                <h2 className="text-3xl font-black mb-2 text-white italic">Parlayz</h2>
                <p className="text-gray-500 text-[10px] mb-8 uppercase tracking-[0.3em] font-bold">Pick an Icon to Start</p>
                <div className="flex flex-wrap gap-3 justify-center mb-8">
                    {AVATARS.map(a => (
                        <button key={a} onClick={async () => {
                            const newU = sanitizeName(session?.user?.email) + "_" + Math.floor(Math.random()*99);
                            await supabase.from('profiles').update({ username: newU, avatar: a }).eq('id', session.user.id);
                            setShowProfileSetup(false);
                            fetchData();
                        }} className="text-4xl p-2 hover:scale-125 transition cursor-pointer">{a}</button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#ffffff0a]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <div className="text-2xl font-black text-white tracking-tighter cursor-pointer" onClick={() => setActiveView('orderbook')}>PARLAYZ</div>
                <div className="hidden lg:flex gap-2 items-center bg-[#111111] p-1 rounded-full border border-[#ffffff05]">
                    <Filter className="w-3 h-3 text-gray-600 ml-2" />
                    {CATEGORIES.map(c => (
                        <button key={c} onClick={() => setActiveCategory(c)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all duration-300 ${activeCategory === c ? 'bg-[#C5A880] text-[#0a0a0a]' : 'text-gray-500 hover:text-gray-300'}`}>{c}</button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => setActiveView('wallet')} className="bg-[#111111] border border-[#ffffff10] px-4 py-2 rounded-2xl flex items-center gap-2 hover:border-[#C5A880]/50 transition">
                    <Wallet className="w-4 h-4 text-[#C5A880]" />
                    <span className="font-mono font-black text-sm">{profile?.wallet_balance.toLocaleString()} <span className="text-[10px] text-gray-500">KSH</span></span>
                </button>
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-xl border border-[#ffffff10] relative group">
                    {profile?.avatar}
                    <div className="absolute top-11 right-0 hidden group-hover:block bg-[#111111] border border-[#ffffff10] rounded-xl p-2 z-[60]">
                        <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-[10px] text-red-500 uppercase font-black"><LogOut className="w-3 h-3" /> Exit</button>
                    </div>
                </div>
            </div>
        </div>
      </header>

      {/* Main Tabs */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-10 overflow-x-auto pb-4 no-scrollbar">
            {['orderbook', 'markets', 'wagers', 'leaderboard'].map(v => (
                <button key={v} onClick={() => setActiveView(v as any)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeView === v ? 'bg-white text-black shadow-xl' : 'bg-[#111111] text-gray-600 border border-[#ffffff05] hover:border-gray-500'}`}>
                    {v === 'orderbook' ? 'Exchange' : v}
                </button>
            ))}
        </div>

        {activeView === 'orderbook' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                {bets.filter(b => b.status === 'p2p_open').map(offer => {
                    const maker = allProfiles.find(p => p.id === offer.user_id)
                    const event = events.find(e => e.id === offer.event_id)
                    const stats = getUserStats(offer.user_id)
                    if (!event) return null
                    const liability = Math.round((offer.stake * (offer.odds || 2)) - offer.stake)
                    return (
                        <div key={offer.id} className="bg-[#111111] border border-[#ffffff0a] rounded-[2rem] p-7 relative overflow-hidden group hover:border-[#C5A880]/40 transition-all duration-500 shadow-2xl">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-[#0a0a0a] border border-[#ffffff10] flex items-center justify-center text-2xl shadow-inner">{maker?.avatar || '👤'}</div>
                                    <div>
                                        <p className="text-sm font-black text-white tracking-tight">{sanitizeName(maker?.username)}</p>
                                        <p className="text-[9px] font-black text-[#10b981] uppercase tracking-widest">{stats.winRate}% Win Rate</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <p className="text-xl font-black text-[#C5A880]">{offer.odds}x</p>
                                    <Share2 onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?match=${offer.id}`); showToast("Link Copied!", "success"); }} className="w-4 h-4 text-gray-600 mt-2 cursor-pointer hover:text-white" />
                                </div>
                            </div>
                            <h3 className="text-white font-bold leading-tight mb-6 line-clamp-2 h-10">{event.title}</h3>
                            <div className="bg-[#0a0a0a] rounded-2xl p-5 mb-8 border border-[#ffffff05] text-center">
                                <p className="text-[10px] text-gray-500 uppercase font-black mb-2 tracking-widest">Prediction</p>
                                <p className="text-white font-black text-lg">{event.outcomes[offer.outcome_index]}</p>
                            </div>
                            <div className="flex justify-between items-center mb-8">
                                <div><p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Entry</p><p className="text-xl font-black text-white">{liability.toLocaleString()} KSh</p></div>
                                <div className="text-right"><p className="text-[10px] text-[#10b981] uppercase font-black tracking-widest">Potential</p><p className="text-2xl font-black text-[#10b981]">{(offer.stake + liability).toLocaleString()} KSh</p></div>
                            </div>
                            <button onClick={() => initiateMatch(offer)} className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-[#C5A880] transition-all uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95">Match Wager</button>
                        </div>
                    )
                })}
            </div>
        )}

        {activeView === 'markets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                {filteredEvents.map(event => (
                    <div key={event.id} className="bg-[#111111] border border-[#ffffff0a] rounded-3xl p-6 hover:border-white/20 transition flex flex-col">
                        <div className="flex justify-between mb-4"><span className="text-[9px] font-black bg-white/10 text-white px-2 py-1 rounded-md uppercase tracking-widest">{event.category}</span><ChevronRight className="w-4 h-4 text-gray-700" /></div>
                        <h3 className="text-xl font-bold text-white mb-6 flex-grow">{event.title}</h3>
                        <button onClick={() => { setP2pSelectedEventId(event.id); setShowCreateOfferModal(true); }} className="w-full bg-[#1a1a1a] border border-[#ffffff10] text-white font-black py-4 rounded-xl hover:bg-white hover:text-black transition uppercase text-[10px] tracking-widest">Create Custom Bet</button>
                    </div>
                ))}
            </div>
        )}

        {activeView === 'leaderboard' && (
            <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in">
                <div className="flex justify-between items-end mb-8 px-4">
                    <div><h2 className="text-3xl font-black text-white uppercase tracking-tighter">Leaderboard</h2><p className="text-[#C5A880] text-[10px] font-black uppercase tracking-widest">Nairobi Exchange • Mar 18th Final</p></div>
                    <Trophy className="w-8 h-8 text-yellow-500" />
                </div>
                {sortedLeaderboard.map((user, i) => (
                    <div key={user.id} className={`bg-[#111111] border ${user.id === session?.user?.id ? 'border-[#C5A880]/50 bg-[#C5A880]/5' : 'border-[#ffffff05]'} rounded-3xl p-5 flex items-center justify-between transition-all hover:translate-x-1`}>
                        <div className="flex items-center gap-5">
                            <span className="font-black text-lg w-6 text-center text-gray-700">{i + 1}</span>
                            <div className="text-3xl">{user.avatar}</div>
                            <div>
                                <p className="font-black text-white tracking-tight text-lg">{sanitizeName(user.username)}</p>
                                <span className="text-[10px] text-[#10b981] font-black uppercase tracking-widest flex items-center gap-1">
                                    {user.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-gray-600" />} {getUserStats(user.id).winRate}% Accuracy
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-500 uppercase font-black">Net Worth</p>
                            <p className="text-xl font-black text-white font-mono">{user.wallet_balance.toLocaleString()} KSH</p>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeView === 'wallet' && (
            <div className="max-w-2xl mx-auto animate-in fade-in">
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#ffffff10] rounded-[2.5rem] p-10 mb-10 relative overflow-hidden shadow-2xl">
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Available Liquidity</p>
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-10">{profile?.wallet_balance.toLocaleString()} <span className="text-xl text-[#C5A880]">KSH</span></h1>
                    <div className="flex gap-4">
                        <button onClick={() => { if(!profile?.has_claimed_airdrop) fetchData(); showToast("Airdrop logic processing..."); }} className="flex-1 bg-[#C5A880] text-black font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg"><ArrowDownToLine className="w-4 h-4" /> Claim Drop</button>
                        <button className="flex-1 bg-[#1a1a1a] border border-[#ffffff10] text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><ArrowUpFromLine className="w-4 h-4" /> Withdraw</button>
                    </div>
                </div>
                <div className="flex items-center gap-2 mb-6 text-gray-500"><History className="w-4 h-4" /><h3 className="text-xs font-black uppercase tracking-widest">Transaction History</h3></div>
                <div className="bg-[#111111] border border-[#ffffff05] rounded-3xl p-10 text-center text-gray-700 text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-4 opacity-20" /> No recent ledger activity.
                </div>
            </div>
        )}

        {activeView === 'wagers' && (
            <div className="max-w-4xl mx-auto animate-in fade-in">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-10">My Active Positions</h2>
                <div className="bg-[#111111] border border-[#ffffff0a] rounded-[2.5rem] p-12 text-center border-dashed">
                    <MessageSquare className="w-12 h-12 mx-auto mb-6 text-gray-800" />
                    <p className="text-gray-600 font-black uppercase tracking-[0.3em] text-xs">No Active Matches Found</p>
                    <button onClick={() => setActiveView('markets')} className="mt-8 bg-white/5 border border-white/10 px-8 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 transition">Enter Market</button>
                </div>
                <div className="mt-20 flex items-center gap-4 border-t border-[#ffffff05] pt-10 opacity-30 grayscale">
                    <Bell className="w-6 h-6" /><p className="text-xs font-black uppercase tracking-widest">Settlement notifications will appear here</p>
                </div>
            </div>
        )}
      </main>

      {/* CONFIRM MATCH MODAL */}
      {offerToMatch && (
        <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-[#111111] border border-[#10b981]/30 rounded-[2.5rem] p-10 max-w-md w-full text-center relative shadow-2xl">
                <ShieldAlert className="text-[#10b981] w-16 h-16 mx-auto mb-8 shadow-inner" />
                <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Commit Wager?</h2>
                <p className="text-gray-400 text-sm mb-10 leading-relaxed">Funds will be held by Parlayz Protocol until the match is resulted by admins.</p>
                <div className="flex gap-4">
                    <button onClick={() => setOfferToMatch(null)} className="flex-1 py-5 rounded-2xl bg-[#1a1a1a] text-gray-500 font-black uppercase tracking-widest text-[10px]">Back</button>
                    <button onClick={confirmMatch} className="flex-1 py-5 rounded-2xl bg-[#10b981] text-black font-black uppercase tracking-widest text-[10px]">Execute</button>
                </div>
            </div>
        </div>
      )}

      {/* CREATE OFFER MODAL */}
      {showCreateOfferModal && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#111111] border border-[#C5A880]/30 rounded-[2.5rem] p-10 max-w-md w-full relative">
                <button onClick={() => setShowCreateOfferModal(false)} className="absolute top-10 right-10 text-gray-500 hover:text-white transition"><X /></button>
                <h2 className="text-3xl font-black mb-10 uppercase tracking-tighter">New Offer</h2>
                <div className="space-y-10">
                    <div className="grid grid-cols-2 gap-4">
                        {events.find(e => e.id === p2pSelectedEventId)?.outcomes.map((o, idx) => (
                            <button key={idx} onClick={() => setP2pSelectedOutcomeIdx(idx)} className={`py-5 rounded-[1.5rem] border-2 font-black text-xs uppercase transition-all ${p2pSelectedOutcomeIdx === idx ? 'bg-[#C5A880] text-black border-[#C5A880]' : 'bg-transparent border-[#ffffff10] text-gray-400'}`}>{o}</button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <input type="number" value={p2pStake} onChange={e => setP2pStake(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-2xl p-5 font-mono font-black text-lg focus:border-[#C5A880] outline-none" placeholder="Stake" />
                        <input type="number" step="0.1" value={p2pOdds} onChange={e => setP2pOdds(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-2xl p-5 font-mono font-black text-lg focus:border-[#C5A880] outline-none text-[#C5A880]" placeholder="Odds" />
                    </div>
                    <button onClick={async () => {
                        if (p2pStake < MIN_STAKE) return showToast(`Min stake is ${MIN_STAKE} KSh`);
                        if ((profile?.wallet_balance || 0) < p2pStake) return showToast("Insufficient balance");
                        const { error } = await supabase.from('bets').insert({ event_id: p2pSelectedEventId, outcome_index: p2pSelectedOutcomeIdx, stake: p2pStake, odds: p2pOdds, status: 'p2p_open', user_id: session.user.id });
                        if (!error) {
                            await supabase.from('profiles').update({ wallet_balance: (profile?.wallet_balance || 0) - p2pStake }).eq('id', session.user.id);
                            showToast("Offer published!", "success");
                            setShowCreateOfferModal(false);
                            fetchData();
                        }
                    }} className="w-full bg-white text-black font-black py-6 rounded-2xl uppercase tracking-widest text-xs shadow-2xl hover:bg-[#C5A880] transition-all">Publish Offer</button>
                </div>
            </div>
        </div>
      )}

    </div>
  )
}
