// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import Landing from './Landing'
import { LogOut, X, Bell, Wallet, History, Trophy, Activity, Search, Globe, Clock, Send, ChevronLeft, ArrowDownToLine, ArrowUpRight } from 'lucide-react'

// --- MILITARY GRADE ERROR BOUNDARY ---
class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, errorMsg: '' }; }
  static getDerivedStateFromError(error) { return { hasError: true, errorMsg: error.message || error.toString() }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0D0D0D] text-[#f43f5e] p-10 flex flex-col items-center justify-center font-mono text-center">
          <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <h1 className="text-2xl font-bold mb-4 uppercase tracking-widest">System Crash Prevented</h1>
          <p className="bg-[#111] p-4 rounded-xl border border-[#f43f5e]/30 w-full max-w-2xl overflow-auto text-sm text-gray-300">{this.state.errorMsg}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface Event { id: string; title: string; description: string; category: string; outcomes: string[]; closes_at?: string; locks_at?: string; created_at: string; resolved: boolean; settlement_source?: string; resolution_image_url?: string; }
interface Bet { id: string; event_id: string; outcome_index: number; stake: number; status: string; user_id: string; }
interface Profile { id: string; username: string; wallet_balance: number; avatar: string; has_claimed_airdrop: boolean; is_public: boolean; phone_number?: string; is_bot?: boolean }
interface AppNotification { id: string; user_id: string; message: string; type: string; is_read: boolean; created_at: string }

const MIN_STAKE = 200
const PLATFORM_FEE_PERCENT = 3
const AVATARS = ['⚡', '🦁', '🦅', '🦈', '🐍', '🦍', '🐉', '🦂', '🦉', '🐺']

const CATEGORIES = {
  'All': [],
  'Crypto Majors': [{ label: 'Bitcoin', dbValue: 'Crypto_Majors' }, { label: 'Ethereum', dbValue: 'Crypto_Majors' }, { label: 'Solana', dbValue: 'Crypto_Majors' }],
  'Sports': [{ label: 'Football', dbValue: 'Sports_Football' }, { label: 'UFC', dbValue: 'Sports_UFC' }],
  'Finance': [{ label: 'Global Markets', dbValue: 'Finance_Global' }]
}

const LiveTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState('')
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    const calculateTime = () => {
      if (!targetDate) { setTimeLeft('TBA'); setIsLocked(false); return; }
      const lockTime = new Date(targetDate).getTime()
      if (isNaN(lockTime)) { setTimeLeft('TBA'); setIsLocked(false); return; }
      
      const distance = lockTime - Date.now()
      if (distance <= 0) { setIsLocked(true); setTimeLeft('LOCKED'); } 
      else {
        setIsLocked(false)
        const days = Math.floor(distance / (1000 * 60 * 60 * 24))
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)
        
        if (days > 0) setTimeLeft(`${days}d ${hours}h ${minutes}m`)
        else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m`)
        else setTimeLeft(`${minutes}m ${seconds}s`)
      }
    }
    calculateTime()
    const timer = setInterval(calculateTime, 1000) 
    return () => clearInterval(timer)
  }, [targetDate])

  if (isLocked) return <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-[#1F1F1F] px-2 py-0.5 rounded shadow-lg">Locked</span>
  return <span className="text-[10px] font-bold text-black bg-[#10b981] border border-[#10b981] px-2 py-0.5 rounded uppercase tracking-widest shadow-lg flex items-center gap-1 font-mono"><span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></span> {timeLeft}</span>
}

// --- NEW LIVE ORACLE TRACKER ---
const LiveOracleTracker = ({ event }: { event: Event }) => {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const strikeMatch = event.description?.match(/STRIKE:([\d.]+)/);
  const strikePrice = strikeMatch ? parseFloat(strikeMatch[1]) : null;
  const symbolMatch = event.title?.match(/Will ([A-Z]+) stay/);
  const coin = symbolMatch ? symbolMatch[1] : null;

  useEffect(() => {
    if (!strikePrice || !coin || event.resolved) return;
    const fetchPrice = async () => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${coin}USDT`);
        const data = await res.json();
        setCurrentPrice(parseFloat(data.price));
      } catch(e) {}
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 3000); 
    return () => clearInterval(interval);
  }, [strikePrice, coin, event.resolved]);

  if (!strikePrice || !coin) return null;
  
  const isWinning = currentPrice !== null && currentPrice > strikePrice;
  const difference = currentPrice !== null ? Math.abs(currentPrice - strikePrice) : 0;

  return (
    <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-5 mb-8 flex justify-between items-center shadow-inner relative overflow-hidden">
      {/* Background glow based on status */}
      {!event.resolved && currentPrice !== null && (
        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-10 pointer-events-none ${isWinning ? 'bg-[#10b981]' : 'bg-[#f43f5e]'}`}></div>
      )}
      
      <div className="relative z-10">
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
          <Activity className="w-3 h-3" /> Strike Line
        </p>
        <p className="text-xl font-mono text-white">${strikePrice.toFixed(4).replace(/\.?0+$/, '')}</p>
      </div>
      
      <div className="text-right relative z-10">
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center justify-end gap-2">
          {!event.resolved && <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isWinning ? 'bg-[#10b981]' : 'bg-[#f43f5e]'}`}></span>}
          {event.resolved ? 'Final Settled Price' : 'Live Oracle (Binance)'}
        </p>
        <div className="flex flex-col items-end">
          <p className={`text-2xl font-black font-mono tracking-tighter transition-colors duration-300 ${event.resolved ? 'text-gray-300' : isWinning ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
            {currentPrice ? `$${currentPrice.toFixed(4).replace(/\.?0+$/, '')}` : 'Syncing...'}
          </p>
          {!event.resolved && currentPrice && (
            <p className={`text-[9px] font-bold font-mono mt-0.5 ${isWinning ? 'text-[#10b981]/70' : 'text-[#f43f5e]/70'}`}>
              {isWinning ? '+' : '-'}${difference.toFixed(4)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
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
  const [marketFeedState, setMarketFeedState] = useState<'live' | 'resolved'>('live')
  const [timeFilter, setTimeFilter] = useState<'4h' | '48h' | '7d' | 'All'>('All')
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('All')
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = useState<number | null>(null)
  const [poolStake, setPoolStake] = useState<number>(MIN_STAKE)
  const [betMode, setBetMode] = useState<'pool' | 'p2p'>('pool')
  const [friendStake, setFriendStake] = useState<number>(MIN_STAKE)
  
  const [lastBet, setLastBet] = useState<{eventId: string, outcomeIdx: number, stake: number} | null>(null)
  
  const [chatEventId, setChatEventId] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [selectedPublicProfile, setSelectedPublicProfile] = useState<Profile | null>(null)

  const [depositPhone, setDepositPhone] = useState<string>('')
  const [depositAmount, setDepositAmount] = useState<number>('')
  const [isDepositing, setIsDepositing] = useState(false)
  
  const [withdrawPhone, setWithdrawPhone] = useState<string>('')
  const [withdrawAmount, setWithdrawAmount] = useState<number>('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const [newUsername, setNewUsername] = useState('')
  const [newAvatar, setNewAvatar] = useState('⚡')

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
    const targetEventId = chatEventId || selectedEventId;
    if (!chatInput.trim() || !targetEventId || !session?.user) return
    const msg = chatInput.trim()
    setChatInput('') 
    await supabase.from('arena_messages').insert({ event_id: targetEventId, user_id: session.user.id, text: msg })
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
    setShowProfileSetup(false); fetchProfile(); fetchAllProfiles(); showToast('Identity updated.', 'success')
  }

  const togglePrivacy = async () => {
    if (!profile) return
    const newStatus = !profile.is_public
    await supabase.from('profiles').update({ is_public: newStatus }).eq('id', session.user.id)
    setProfile({ ...profile, is_public: newStatus })
    showToast(newStatus ? 'Profile Public' : 'Profile Private', 'success')
  }

  const handleKotaniDeposit = async () => {
    if (!depositPhone || depositAmount < 10) return showToast("Enter a valid phone number and at least 10 KSh.", "error");
    setIsDepositing(true);
    showToast("Initiating secure connection...", "success"); 
    try {
      const response = await fetch('/api/kotani-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: depositAmount, phone: depositPhone, userId: session.user.id, username: profile?.username || 'Trader' })
      });
      const data = await response.json();
      if (data.success) { showToast("M-Pesa STK Push sent! Check your phone.", "success"); setDepositAmount(''); } 
      else { showToast(data.message || "Failed to trigger deposit.", "error"); }
    } catch (error) { showToast("Network error contacting payment gateway.", "error"); } 
    finally { setIsDepositing(false); }
  }

  const handleWithdraw = async () => {
    if (!withdrawPhone || withdrawAmount < 100) return showToast("Minimum withdrawal is 100 KSh.", "error");
    if (withdrawAmount > (profile?.wallet_balance || 0)) return showToast("Insufficient balance.", "error");
    
    setIsWithdrawing(true);
    setTimeout(() => {
        showToast("Withdrawal request submitted. Processing via Kotani Pay.", "success");
        setWithdrawAmount('');
        setIsWithdrawing(false);
    }, 1500);
  }

  const submitPoolBet = async (overrideE?: string, overrideO?: number, overrideS?: number) => {
    const eId = overrideE || selectedEventId; const oIdx = overrideO !== undefined ? overrideO : selectedOutcomeIdx; const stake = overrideS || poolStake
    if (!eId || oIdx === null || !session?.user || !profile) return showToast("Select an outcome first.")
    if ((profile?.wallet_balance || 0) < stake) return showToast('Insufficient KSh balance.')
    if (stake < MIN_STAKE) return showToast(`Min stake is ${MIN_STAKE} KSh.`)
    
    const optimisticBet: Bet = { id: `temp-${Date.now()}`, event_id: eId, outcome_index: oIdx, stake: stake, status: 'open', user_id: session.user.id }
    setBets(prev => [...prev, optimisticBet])
    setProfile(prev => prev ? { ...prev, wallet_balance: prev.wallet_balance - stake } : null)

    const { error } = await supabase.from('bets').insert({ event_id: eId, outcome_index: oIdx, stake: stake, status: 'open', user_id: session.user.id })
    if (!error) {
      await supabase.from('profiles').update({ wallet_balance: (profile?.wallet_balance || 0) - stake }).eq('id', session.user.id)
      setLastBet({ eventId: eId, outcomeIdx: oIdx, stake: stake })
      setShowSuccessModal(true); 
      setSelectedOutcomeIdx(null); 
      setPoolStake(MIN_STAKE); 
      // User STAYS on the event detail page to watch the oracle!
    } else { 
      showToast('Network error pushing wager.'); fetchBets(); fetchProfile(); 
    }
  }

  const submitDuel = async () => {
    if (!selectedEventId || selectedOutcomeIdx === null || !session?.user || !profile) return
    if ((profile?.wallet_balance || 0) < poolStake) return showToast('Insufficient balance.')
    if (poolStake < MIN_STAKE || friendStake < MIN_STAKE) return showToast(`Min stake is ${MIN_STAKE} KSh.`)
    
    const optimisticBet: Bet = { id: `temp-${Date.now()}`, event_id: selectedEventId, outcome_index: selectedOutcomeIdx, stake: poolStake, status: 'open', user_id: session.user.id }
    setBets(prev => [...prev, optimisticBet])
    setProfile(prev => prev ? { ...prev, wallet_balance: prev.wallet_balance - poolStake } : null)

    const { error } = await supabase.from('bets').insert({ event_id: selectedEventId, outcome_index: selectedOutcomeIdx, stake: poolStake, status: 'open', user_id: session.user.id })
    if (!error) {
      await supabase.from('profiles').update({ wallet_balance: (profile?.wallet_balance || 0) - poolStake }).eq('id', session.user.id)
      setLastBet({ eventId: selectedEventId, outcomeIdx: selectedOutcomeIdx, stake: friendStake })
      setShowSuccessModal(true); 
      setSelectedOutcomeIdx(null); 
      setPoolStake(MIN_STAKE); 
      setFriendStake(MIN_STAKE); 
    } else { 
      showToast('Error creating 1v1 duel.'); fetchBets(); fetchProfile(); 
    }
  }

  const markNotificationsAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
  }

  const handleLogout = async () => { await supabase.auth.signOut(); setShowLogoutModal(false) }

  const calculateEstPayout = (eventId: string, outcomeIdx: number, userStake: number = 0, isExisting: boolean = false) => {
    const eventBets = bets.filter(b => b.event_id === eventId && b.status === 'open')
    const addedStake = isExisting ? 0 : userStake
    const totalPoolVolume = eventBets.reduce((sum, b) => sum + (b?.stake || 0), 0) + addedStake
    const winningPoolVolume = eventBets.filter(b => b.outcome_index === outcomeIdx).reduce((sum, b) => sum + (b?.stake || 0), 0) + addedStake
    
    if (winningPoolVolume === 0 || totalPoolVolume === winningPoolVolume) return userStake 
    
    const grossPayout = (userStake / winningPoolVolume) * totalPoolVolume
    const profit = grossPayout - userStake
    const fee = profit > 0 ? profit * (PLATFORM_FEE_PERCENT / 100) : 0
    return Math.round(userStake + profit - fee)
  }

  const sanitizeName = (name: string | undefined) => { return name ? (name.includes('@') ? name.split('@')[0] : name) : 'Anonymous' }

  const activeEvents = events.filter(e => {
    if (marketFeedState === 'live' && e.resolved === true) return false;
    if (marketFeedState === 'resolved' && e.resolved !== true) return false;
    
    const searchLower = searchQuery.toLowerCase();
    const safeTitle = e.title || '';
    const matchesSearch = safeTitle.toLowerCase().includes(searchLower);
    
    let matchesCategory = true;
    const safeCat = e.category || 'General';
    if (selectedMainCategory !== 'All') {
      if (selectedSubCategory) { matchesCategory = safeCat === selectedSubCategory; } 
      else { const prefix = selectedMainCategory.replace(/\s+/g, ''); matchesCategory = safeCat.startsWith(`${prefix}_`); }
    }

    let matchesTime = true;
    if (timeFilter !== 'All' && !e.resolved) {
      const closeTime = new Date(e.locks_at || e.closes_at || '').getTime();
      if (!isNaN(closeTime)) {
        const hoursLeft = (closeTime - Date.now()) / (1000 * 60 * 60);
        if (timeFilter === '4h' && hoursLeft > 4) matchesTime = false;
        if (timeFilter === '48h' && hoursLeft > 48) matchesTime = false;
        if (timeFilter === '7d' && hoursLeft > 168) matchesTime = false;
      }
    }

    return matchesCategory && matchesSearch && matchesTime;
  });

  const myActiveWagers = bets.filter(b => b.user_id === session?.user?.id && b.status !== 'won' && b.status !== 'lost' && b.status !== 'refunded')
  const mySettledWagers = bets.filter(b => b.user_id === session?.user?.id && ['won', 'lost', 'refunded'].includes(b.status))
  const sortedLeaderboard = [...allProfiles].filter(p => !p.is_bot).sort((a, b) => (b?.wallet_balance || 0) - (a?.wallet_balance || 0))

  let totalActiveStake = 0; let totalEstPayout = 0;
  myActiveWagers.forEach(bet => { totalActiveStake += (bet?.stake || 0); totalEstPayout += calculateEstPayout(bet.event_id, bet.outcome_index, (bet?.stake || 0), true) })

  if (!session) return <Landing />
  if (loading) return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center relative"><div className="w-16 h-16 border-2 border-[#D9C5A0]/20 border-t-[#D9C5A0] rounded-full animate-spin mb-6"></div><p className="text-[#D9C5A0] font-mono text-xs tracking-[0.3em] uppercase animate-pulse">Syncing Network...</p></div>
  )

  return (
    <AppErrorBoundary>
      <div className="min-h-screen bg-[#0D0D0D] text-white font-sans relative pb-20 selection:bg-[#D9C5A0] selection:text-black">
        
        {/* Toast Notifications */}
        {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-300">
            <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl ${toast.type === 'error' ? 'bg-[#f43f5e]/10 border-[#f43f5e]/30 text-[#f43f5e]' : 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]'}`}>
              {toast.type === 'error' ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              <span className="font-semibold text-sm tracking-wide">{toast.msg}</span>
            </div>
          </div>
        )}

        {/* Profile Setup Modal */}
        {showProfileSetup && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0D0D0D]/95 backdrop-blur-xl p-4">
            <div className="bg-[#151515] border border-[#D9C5A0]/30 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
              <h3 className="text-3xl font-black text-white mb-2 relative z-10">Establish Identity</h3>
              <p className="text-gray-400 text-sm mb-8 font-light relative z-10">Choose how you will be known on the Leaderboard.</p>
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
                  <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} placeholder="e.g. Satoshi_NBO" maxLength={15} className="w-full bg-[#0D0D0D] border border-[#ffffff15] text-white font-bold rounded-xl p-4 focus:outline-none focus:border-[#D9C5A0] text-lg text-center tracking-wide" />
                </div>
                <button onClick={handleUpdateProfile} disabled={newUsername.length < 3} className="w-full bg-[#D9C5A0] hover:bg-[#c4b18f] disabled:opacity-50 text-[#0D0D0D] font-bold py-4 rounded-xl transition shadow-[0_0_20px_rgba(217,197,160,0.2)]">Enter the Exchange</button>
              </div>
            </div>
          </div>
        )}

        {/* Global Header */}
        <header className="border-b border-[#1F1F1F] bg-[#0a0a0a]/90 backdrop-blur-xl sticky top-0 z-30 select-none">
          <div className="max-w-[1400px] mx-auto px-4 pt-4 pb-3 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-wide flex items-center gap-2 cursor-pointer" onClick={() => setActiveView('markets')}>
              <div className="w-8 h-8 rounded-full border border-[#D9C5A0]/30 flex items-center justify-center text-xs"><svg className="w-4 h-4 text-[#D9C5A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
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
                <span className="font-bold text-sm sm:text-base">{profile?.wallet_balance?.toLocaleString() || '0'}</span>
                <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider hidden sm:inline">KSh</span>
              </button>
              <button onClick={() => setShowLogoutModal(true)} className="w-9 h-9 rounded-xl bg-[#111111] border border-[#1F1F1F] flex items-center justify-center text-lg hover:border-red-500/50 transition cursor-pointer" title="Sign Out">{profile?.avatar || '👤'}</button>
            </div>
          </div>
          <div className="max-w-[1400px] mx-auto px-4 mt-1">
            <div className="flex items-center gap-6 overflow-x-auto pb-3 no-scrollbar">
              <button onClick={() => setActiveView('markets')} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'markets' || activeView === 'eventDetail' ? 'text-[#D9C5A0] border-[#D9C5A0]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
                <Activity className="w-4 h-4" /> Markets
              </button>
              <button onClick={() => setActiveView('wagers')} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'wagers' ? 'text-[#D9C5A0] border-[#D9C5A0]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>My Bets</button>
              <button onClick={() => setActiveView('leaderboard')} className={`whitespace-nowrap text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-2 ${activeView === 'leaderboard' ? 'text-[#D9C5A0] border-[#D9C5A0]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
                <Trophy className="w-4 h-4 text-yellow-500" /> Leaderboard
              </button>
            </div>
          </div>
        </header>

        {/* ------------------------------------------------------------- */}
        {/* MAIN ROUTER CONTAINER */}
        {/* ------------------------------------------------------------- */}
        <main className="max-w-[1400px] mx-auto px-4 py-8">
          
          {/* --- VIEW: MARKETS FEED (CLEAN V2) --- */}
          {activeView === 'markets' && (
            <div className="animate-in fade-in duration-300">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#111] border border-[#1F1F1F] text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-[#D9C5A0] text-sm shadow-sm" />
                </div>
                
                <div className="flex bg-[#111] p-1 rounded-xl border border-[#1F1F1F] w-max shrink-0">
                  <button onClick={() => setMarketFeedState('live')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${marketFeedState === 'live' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}>Live Action</button>
                  <button onClick={() => setMarketFeedState('resolved')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${marketFeedState === 'resolved' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}>Settled</button>
                </div>
              </div>

              <div className="mb-8 bg-[#111] border border-[#1F1F1F] p-3 rounded-2xl flex flex-col gap-3">
                {marketFeedState === 'live' && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <Clock className="w-4 h-4 text-gray-500 mx-1 shrink-0" />
                    {['All', '4h', '48h', '7d'].map((tf) => (
                      <button key={tf} onClick={() => setTimeFilter(tf as any)} className={`whitespace-nowrap px-3 py-1 rounded-md text-xs font-bold transition ${timeFilter === tf ? 'bg-[#D9C5A0] text-black' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'}`}>
                        {tf === 'All' ? 'Any Time' : `< ${tf}`}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <Globe className="w-4 h-4 text-gray-500 mx-1 shrink-0" />
                  {Object.keys(CATEGORIES).map((cat) => (
                    <button key={cat} onClick={() => { setSelectedMainCategory(cat); setSelectedSubCategory(null); }} className={`whitespace-nowrap px-3 py-1 rounded-md text-xs font-bold transition ${selectedMainCategory === cat ? 'bg-[#333] text-white' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}>
                      {cat}
                    </button>
                  ))}
                  {selectedMainCategory !== 'All' && CATEGORIES[selectedMainCategory]?.map((subCat: any) => (
                    <button key={subCat.dbValue} onClick={() => setSelectedSubCategory(selectedSubCategory === subCat.dbValue ? null : subCat.dbValue)} className={`whitespace-nowrap px-3 py-1 rounded-md text-xs font-bold transition border ml-1 ${selectedSubCategory === subCat.dbValue ? 'border-[#D9C5A0] text-[#D9C5A0]' : 'border-[#1F1F1F] text-gray-500 hover:text-gray-400'}`}>
                      {subCat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeEvents.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-[#1F1F1F] rounded-2xl bg-[#111]/50">No markets match your filters.</div>
                ) : (
                  activeEvents.map((event) => {
                    const eventBets = bets.filter(b => b.event_id === event.id && b.status === 'open')
                    const totalPoolVolume = eventBets.reduce((sum, b) => sum + (b?.stake || 0), 0)
                    const eventDateStr = event.closes_at || event.locks_at || '';
                    const outcomeVolume0 = eventBets.filter(b => b.outcome_index === 0).reduce((sum, b) => sum + (b?.stake || 0), 0)
                    const percent0 = totalPoolVolume === 0 ? 50 : Math.round((outcomeVolume0 / totalPoolVolume) * 100)
                    const safeOutcomes = Array.isArray(event.outcomes) && event.outcomes.length >= 2 ? event.outcomes : ['Yes', 'No'];
                    const categoryPrefix = (event.category || 'General').split('_')[0];

                    return (
                      <div 
                        key={event.id}
                        onClick={() => { setSelectedEventId(event.id); setSelectedOutcomeIdx(null); setActiveView('eventDetail'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="bg-[#111] border border-[#1F1F1F] hover:border-[#D9C5A0]/40 rounded-2xl p-5 transition-all cursor-pointer flex flex-col group"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-[#D9C5A0] bg-[#D9C5A0]/10 px-2 py-1 rounded uppercase tracking-widest">{categoryPrefix}</span>
                            {!event.resolved && <LiveTimer targetDate={eventDateStr} />}
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pool: {totalPoolVolume.toLocaleString()} KSh</span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-white mb-5 line-clamp-2 leading-tight group-hover:text-[#D9C5A0] transition-colors">{event.title}</h3>
                        
                        <div className="mt-auto flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                              <span>{percent0}% {safeOutcomes[0]}</span>
                              <span>{100 - percent0}% {safeOutcomes[1]}</span>
                            </div>
                            <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                              <div className="h-full bg-[#D9C5A0] transition-all duration-500" style={{ width: `${percent0}%` }} />
                            </div>
                          </div>
                          <button className={`shrink-0 rounded-lg px-5 py-2 text-xs font-black uppercase tracking-widest transition ${event.resolved ? 'bg-[#1F1F1F] text-gray-500' : 'bg-[#D9C5A0] text-black group-hover:bg-[#c4b18f]'}`}>
                            {event.resolved ? 'View' : 'Trade'}
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* --- VIEW: EVENT DETAIL (WITH DYNAMIC GRAPH & ORACLE) --- */}
          {activeView === 'eventDetail' && selectedEventId && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              {(() => {
                const event = events.find(e => e.id === selectedEventId);
                if (!event) return null;
                
                const safeTitle = event.title || 'Untitled Market';
                const safeOutcomes = Array.isArray(event.outcomes) && event.outcomes.length >= 2 ? event.outcomes : ['Yes', 'No'];
                
                const eventDateStr = event.closes_at || event.locks_at || '';
                const lockTime = new Date(eventDateStr).getTime();
                const isLocked = event.resolved || (!isNaN(lockTime) && lockTime <= Date.now());
                
                const eventBets = bets.filter(b => b.event_id === event.id && b.status === 'open');
                const totalPoolVolume = eventBets.reduce((sum, b) => sum + (b?.stake || 0), 0);
                const outcomeVolume0 = eventBets.filter(b => b.outcome_index === 0).reduce((sum, b) => sum + (b?.stake || 0), 0);
                const percent0 = totalPoolVolume === 0 ? 50 : Math.round((outcomeVolume0 / totalPoolVolume) * 100);
                
                const impliedOdds = friendStake > 0 ? ((poolStake + friendStake) / friendStake).toFixed(1) : '1.0';

                return (
                  <div className="mx-auto max-w-[1400px] pt-4">
                    <button onClick={() => setActiveView('markets')} className="mb-6 text-xs font-bold uppercase tracking-widest text-[#666] transition-colors hover:text-white flex items-center gap-2">
                      <ChevronLeft className="w-4 h-4" /> Back to Markets
                    </button>
                    
                    <div className="grid gap-8 lg:grid-cols-3 items-start">
                      <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-[10px] font-black text-[#D9C5A0] bg-[#D9C5A0]/10 px-2 py-1 rounded uppercase tracking-widest">{(event.category || 'General').split('_')[0]}</span>
                          {!isLocked && <LiveTimer targetDate={eventDateStr} />}
                        </div>
                        <h1 className="mb-8 text-2xl sm:text-3xl lg:text-4xl font-black leading-tight text-white">{safeTitle}</h1>
                        
                        {/* DYNAMIC KALSHI GRAPH */}
                        <div className="relative mb-6 h-64 sm:h-80 overflow-hidden border border-[#1F1F1F] rounded-2xl bg-[#0D0D0D]">
                          <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-gray-600 font-mono text-right pr-2 py-2 z-10 pointer-events-none">
                            <span>99¢</span><span>75¢</span><span>50¢</span><span>25¢</span><span>1¢</span>
                          </div>
                          
                          <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-0 w-full h-full z-10 transition-all duration-1000 ease-in-out">
                            <defs>
                              <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.2" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" /></linearGradient>
                            </defs>
                            <path d={`M0,100 H100 V${200 - (percent0 * 2)} H200 V${200 - (percent0 * 1.5)} H300 V${200 - (percent0 * 1.8)} H400 V200 L0,200 Z`} fill="url(#greenGradient)" className="transition-all duration-1000" />
                            <path d={`M0,150 H100 V${200 - ((100 - percent0) * 1.8)} H200 V${200 - ((100 - percent0) * 1.5)} H300 V${200 - ((100 - percent0) * 1.2)} H400`} fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.6" className="transition-all duration-1000" />
                            <path d={`M0,100 H100 V${200 - (percent0 * 2)} H200 V${200 - (percent0 * 1.5)} H300 V${200 - (percent0 * 1.8)} H400`} fill="none" stroke="#10b981" strokeWidth="2.5" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all duration-1000" />
                            {!isLocked && <circle cx="400" cy={200 - (percent0 * 1.8)} r="4" fill="#10b981" className="animate-pulse transition-all duration-1000" />}
                          </svg>
                        </div>
                        
                        <div className="flex justify-between items-end mb-8">
                          <div><span className="text-3xl font-bold text-[#D9C5A0]">{percent0}%</span><br/><span className="text-gray-400 text-sm font-bold uppercase tracking-widest">{safeOutcomes[0]}</span></div>
                          <div className="text-right"><span className="text-3xl font-bold text-[#3b82f6]">{100 - percent0}%</span><br/><span className="text-gray-400 text-sm font-bold uppercase tracking-widest">{safeOutcomes[1]}</span></div>
                        </div>
                        
                        <div className="mb-8 pb-8 border-b border-[#1F1F1F]">
                           <p className="text-sm font-bold uppercase tracking-widest text-[#666]">Current Pool Size</p>
                           <p className="text-4xl font-bold text-white">{totalPoolVolume.toLocaleString()} <span className="text-xl text-[#D9C5A0]">KSh</span></p>
                        </div>

                        {/* LIVE ORACLE TRACKER INJECTED HERE */}
                        <LiveOracleTracker event={event} />

                        <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-6 sm:p-8 mb-8 shadow-inner">
                          <h4 className="text-[#D9C5A0] font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Market Rules & Resolution
                          </h4>
                          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {event.description || 'Standard resolution rules apply based on verifiable public outcome.'}
                          </div>
                        </div>
                        
                        <div className="border border-[#1F1F1F] bg-[#111111] rounded-2xl overflow-hidden mt-8">
                          <div className="bg-[#0a0a0a] border-b border-[#1F1F1F] p-4 flex justify-between items-center">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">Live Warzone Chat</h3>
                            <button onClick={() => setChatEventId(event.id)} className="bg-[#1F1F1F] text-[#D9C5A0] text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider hover:bg-[#333333]">Open Global</button>
                          </div>
                          <div className="max-h-64 overflow-y-auto p-4 space-y-2 no-scrollbar">
                             {[...eventBets].slice(-6).reverse().map((b, i) => {
                               const p = allProfiles.find(prof => prof.id === b.user_id);
                               const outcomeText = safeOutcomes[b?.outcome_index || 0] || 'an outcome';
                               return (
                                 <div key={i} className="rounded-xl bg-[#1a1a1a] border border-[#ffffff0a] px-4 py-2.5 text-sm">
                                    <span className="font-bold text-[#D9C5A0]">{p ? sanitizeName(p.username) : 'Anon'}</span>
                                    <span className="text-gray-400"> matched </span>
                                    <span className="text-white font-mono">{(b?.stake || 0).toLocaleString()} KSh</span>
                                    <span className={`font-bold ml-2 text-xs uppercase tracking-widest ${b.outcome_index === 0 ? 'text-[#10b981]' : 'text-[#3b82f6]'}`}>{outcomeText}</span>
                                 </div>
                               )
                             })}
                             {eventBets.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No liquidity matched yet.</p>}
                          </div>
                          {!isLocked && (
                            <div className="flex border-t border-[#1F1F1F] bg-[#0a0a0a] p-2">
                              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-[#111] rounded-xl px-4 py-3 text-sm text-white placeholder-[#444] border border-[#1F1F1F] focus:border-[#D9C5A0] focus:outline-none"/>
                              <button onClick={() => {setChatEventId(event.id); sendChatMessage()}} className="px-4 text-[#D9C5A0] transition-colors hover:text-white"><Send className="w-5 h-5 ml-1" /></button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="lg:col-span-1">
                        <div className="sticky top-24">
                          <div className={`border border-[#1F1F1F] rounded-3xl overflow-hidden shadow-2xl ${betMode === "p2p" ? "bg-[#1a0a0c]" : "bg-[#151515]"}`}>
                            <div className="flex bg-[#0D0D0D] p-1 m-2 rounded-xl border border-[#1F1F1F]">
                              <button onClick={() => setBetMode("pool")} className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider transition-colors rounded-lg ${betMode === "pool" ? "bg-[#333] text-white shadow-md" : "bg-transparent text-[#666] hover:text-white"}`}>Pool</button>
                              <button onClick={() => setBetMode("p2p")} className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider transition-colors rounded-lg ${betMode === "p2p" ? "bg-[#f43f5e] text-white shadow-md" : "bg-transparent text-[#666] hover:text-white"}`}>Duel</button>
                            </div>
                            
                            <div className="p-6 pt-4">
                              {isLocked ? (
                                <div className="py-12 text-center border border-[#1F1F1F] rounded-2xl bg-[#0a0a0a]">
                                  <h4 className="text-[#D9C5A0] font-black uppercase tracking-widest mb-1 text-xl">Market Settled</h4>
                                  <p className="text-gray-400 text-sm">Trading is closed.</p>
                                </div>
                              ) : betMode === "p2p" ? (
                                <div className="animate-in fade-in duration-200">
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
                                    <div><p className="text-[10px] text-[#666] uppercase font-bold">Total Pot</p><p className="text-sm font-bold text-white font-mono">{(poolStake + friendStake).toLocaleString()}</p></div>
                                    <div><p className="text-[10px] text-[#666] uppercase font-bold">Pot. Profit</p><p className="text-sm font-bold text-[#10b981] font-mono">+{friendStake.toLocaleString()}</p></div>
                                  </div>
                                  <button onClick={submitDuel} disabled={poolStake < MIN_STAKE || friendStake < MIN_STAKE} className="flex w-full rounded-xl items-center justify-center gap-2 bg-[#f43f5e] py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#e11d48] disabled:opacity-50">
                                    Generate Challenge Link
                                  </button>
                                </div>
                              ) : (
                                <div className="animate-in fade-in duration-200">
                                  <div className="mb-6 flex gap-3">
                                    <button onClick={() => setSelectedOutcomeIdx(0)} className={`flex-1 rounded-xl py-3.5 text-sm sm:text-base font-black uppercase tracking-widest transition-all border ${selectedOutcomeIdx === 0 ? 'bg-[#D9C5A0] border-[#D9C5A0] text-[#0D0D0D] shadow-[0_0_20px_rgba(217,197,160,0.2)]' : 'border-[#1F1F1F] bg-[#2A2A2A] text-gray-400'}`}>{safeOutcomes[0]}</button>
                                    <button onClick={() => setSelectedOutcomeIdx(1)} className={`flex-1 rounded-xl py-3.5 text-sm sm:text-base font-black uppercase tracking-widest transition-all border ${selectedOutcomeIdx === 1 ? 'bg-[#3b82f6] border-[#3b82f6] text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'border-[#1F1F1F] bg-[#2A2A2A] text-gray-400'}`}>{safeOutcomes[1]}</button>
                                  </div>
                                  <div className="mb-4">
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#666]">Amount (KSh)</label>
                                    <div className="relative">
                                      <input type="number" value={poolStake || ''} onChange={(e) => setPoolStake(Number(e.target.value))} placeholder="0" className="w-full rounded-xl border border-[#1F1F1F] bg-[#0D0D0D] py-4 pl-4 pr-32 text-xl font-bold text-white focus:border-[#D9C5A0] focus:outline-none" />
                                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                        <button onClick={() => setPoolStake((prev) => prev + 1000)} className="bg-[#2A2A2A] hover:bg-[#333] text-gray-300 text-[10px] font-bold px-2 py-1.5 rounded-md transition">+1K</button>
                                        <button onClick={() => setPoolStake((prev) => prev + 5000)} className="bg-[#2A2A2A] hover:bg-[#333] text-gray-300 text-[10px] font-bold px-2 py-1.5 rounded-md transition">+5K</button>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-between text-xs mb-6 font-semibold">
                                     <span className="text-gray-500 uppercase tracking-widest">Est. Payout: <span className="text-white ml-1 font-mono">{calculateEstPayout(selectedEventId, selectedOutcomeIdx || 0, poolStake, false).toLocaleString()} KSh</span></span>
                                     <span className="text-gray-500 uppercase tracking-widest">Fee: <span className="text-white">3%</span></span>
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

          {/* --- VIEW: WALLET (CASHIER & PAYOUTS ONLY APPEAR HERE) --- */}
          {activeView === 'wallet' && (
            <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-white">Cashier</h2>
                <div className="flex gap-2">
                  <button onClick={() => { setNewUsername(sanitizeName(profile?.username)); setNewAvatar(profile?.avatar || '⚡'); setShowProfileSetup(true); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-[#151515] border-[#1F1F1F] text-gray-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition">Edit Identity</button>
                  <button onClick={togglePrivacy} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition ${profile?.is_public ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-[#151515] border-[#1F1F1F] text-gray-400'}`}>
                    {profile?.is_public ? 'Public' : 'Private'}
                  </button>
                </div>
              </div>
              
              <div className="bg-[#111111] border border-[#1F1F1F] rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl text-center sm:text-left">
                <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-2 relative z-10 flex items-center justify-center sm:justify-start gap-2">Available Balance</p>
                <h1 className="text-5xl font-black text-white mb-1 relative z-10 tracking-tight">{profile?.wallet_balance?.toLocaleString() || '0'} <span className="text-2xl text-[#D9C5A0]">KSh</span></h1>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                
                {/* DEPOSIT CARD */}
                <div className="bg-[#111111] border border-[#10b981]/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-[#10b981]/10 flex items-center justify-center border border-[#10b981]/20">
                      <ArrowUpRight className="w-6 h-6 text-[#10b981]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Deposit via M-Pesa</h3>
                      <p className="text-xs text-gray-400">Instant KSh top-ups.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Phone Number</label>
                      <input type="tel" placeholder="e.g. 0712345678" value={depositPhone} onChange={(e) => setDepositPhone(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#10b981] transition font-mono text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Amount (KSh)</label>
                      <input type="number" placeholder="Min 10 KSh" value={depositAmount || ''} onChange={(e) => setDepositAmount(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#10b981] transition font-mono text-lg" />
                    </div>
                    
                    <button onClick={handleKotaniDeposit} disabled={isDepositing || depositAmount < 10 || !depositPhone} className="w-full mt-2 bg-[#10b981] hover:bg-[#059669] text-black font-black py-3.5 rounded-xl transition uppercase text-xs tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isDepositing ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : 'Send STK Push'}
                    </button>
                  </div>
                </div>

                {/* PAYOUT / WITHDRAW CARD */}
                <div className="bg-[#111111] border border-[#D9C5A0]/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-[0_0_30px_rgba(217,197,160,0.05)]">
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-[#D9C5A0]/10 flex items-center justify-center border border-[#D9C5A0]/20">
                      <ArrowDownToLine className="w-6 h-6 text-[#D9C5A0]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Withdraw Funds</h3>
                      <p className="text-xs text-gray-400">Cash out to M-Pesa.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">M-Pesa Number</label>
                      <input type="tel" placeholder="e.g. 0712345678" value={withdrawPhone} onChange={(e) => setWithdrawPhone(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#D9C5A0] transition font-mono text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Amount to Withdraw</label>
                      <input type="number" placeholder="Min 100 KSh" value={withdrawAmount || ''} onChange={(e) => setWithdrawAmount(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#D9C5A0] transition font-mono text-lg" />
                    </div>
                    
                    <button onClick={handleWithdraw} disabled={isWithdrawing || withdrawAmount < 100 || !withdrawPhone} className="w-full mt-2 bg-[#D9C5A0] hover:bg-[#c4b18f] text-black font-black py-3.5 rounded-xl transition uppercase text-xs tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isWithdrawing ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : 'Cash Out'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* --- VIEW: LEADERBOARD --- */}
          {activeView === 'leaderboard' && (
            <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
              <div className="bg-[#111111] border border-[#1F1F1F] rounded-3xl overflow-hidden shadow-2xl">
                <div className="grid grid-cols-12 gap-4 p-5 border-b border-[#1F1F1F] bg-[#0D0D0D] text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <div className="col-span-2 text-center">Rank</div>
                  <div className="col-span-6">Trader</div>
                  <div className="col-span-4 text-right">Net Value</div>
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
                      <div className="col-span-4 text-right"><span className="font-black text-lg font-mono text-white">{user.wallet_balance?.toLocaleString() || '0'}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- VIEW: WAGERS --- */}
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
                    {[...myActiveWagers].reverse().map((bet, i) => {
                      const event = events.find(e => e.id === bet.event_id); if (!event) return null
                      const estNetPayout = calculateEstPayout(event.id, bet.outcome_index, bet.stake, true) 
                      const safeOutcomes = Array.isArray(event.outcomes) && event.outcomes.length >= 2 ? event.outcomes : ['Yes', 'No'];
                      return (
                        <div key={i} className="bg-[#111111] border border-[#D9C5A0]/40 rounded-3xl p-6 transition relative overflow-hidden shadow-lg">
                          <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#1F1F1F] relative z-10">
                            <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Status</p><p className="font-bold text-[#10b981] text-sm flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span> Live in Pool</p></div>
                          </div>
                          <h3 className="text-lg font-bold text-white mb-4 relative z-10 leading-tight">{event.title || 'Unknown Event'}</h3>
                          <div className="bg-[#0D0D0D] rounded-xl p-4 border border-[#1F1F1F] mb-4 relative z-10 text-center"><div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Your Prediction</div><div className="text-[#D9C5A0] font-bold text-lg uppercase tracking-widest">{safeOutcomes[bet.outcome_index] || 'an outcome'}</div></div>
                          <div className="space-y-2 text-sm relative z-10">
                            <div className="flex justify-between text-gray-400"><span>Your Stake:</span><span className="text-white font-mono">{(bet?.stake || 0).toLocaleString()} KSh</span></div>
                            <div className="flex justify-between font-bold pt-3 border-t border-[#1F1F1F] mt-3"><span className="text-[#10b981] uppercase tracking-wider text-xs flex items-center">Est. Payout:</span><span className="text-[#10b981] text-xl font-mono">{estNetPayout.toLocaleString()} KSh</span></div>
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
                    {[...mySettledWagers].reverse().map((bet, i) => {
                      const event = events.find(e => e.id === bet.event_id); if (!event) return null
                      const isWin = bet.status === 'won'; const isRefund = bet.status === 'refunded'
                      const historicalPayout = isWin ? calculateEstPayout(event.id, bet.outcome_index, bet.stake, true) : isRefund ? bet.stake : 0
                      return (
                        <div key={i} className={`bg-[#111111] border rounded-3xl p-6 relative overflow-hidden transition hover:scale-[1.02] ${isWin ? 'border-[#10b981]/50 shadow-lg' : isRefund ? 'border-gray-600' : 'border-[#f43f5e]/20 opacity-70'}`}>
                          <div className="flex items-start justify-between mb-4 relative z-10"><span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${isWin ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : isRefund ? 'bg-[#1F1F1F] border-gray-600 text-gray-400' : 'bg-[#f43f5e]/10 border-[#f43f5e]/30 text-[#f43f5e]'}`}>{isWin ? 'WINNER 🏆' : isRefund ? 'REFUNDED' : 'LOST ❌'}</span></div>
                          <h3 className={`text-lg font-bold mb-4 relative z-10 ${isWin ? 'text-white' : 'text-gray-400'}`}>{event.title || 'Unknown Event'}</h3>
                          <div className="flex justify-between font-bold pt-3 border-t border-[#1F1F1F] mt-3 relative z-10"><span className="text-gray-500">Payout:</span><span className={`text-lg font-mono ${isWin ? 'text-[#10b981]' : isRefund ? 'text-gray-400' : 'text-[#f43f5e]'}`}>{isWin ? `+ ${historicalPayout.toLocaleString()} KSh` : isRefund ? `${historicalPayout.toLocaleString()} KSh` : '0 KSh'}</span></div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
             </div>
          )}
        </main>
        
        {/* OVERLAYS */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-[#111111] border border-[#10b981]/30 rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#10b981]/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-[#10b981]/10 border border-[#10b981]/40 text-[#10b981] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight uppercase">Position Secured</h3>
                <p className="text-gray-400 text-sm mb-6 font-light">Your capital is locked in the pool.</p>
                <button onClick={() => setShowSuccessModal(false)} className="w-full bg-[#1F1F1F] hover:bg-[#333] border border-[#1F1F1F] text-white font-bold py-3.5 rounded-xl transition uppercase text-[10px] tracking-widest">Acknowledge</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppErrorBoundary>
  )
}