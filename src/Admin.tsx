import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ShieldAlert, CheckCircle2 } from 'lucide-react'

// --- IMPORTANT: Put your Supabase UUID here so ONLY YOU can use this page ---
const ADMIN_UUIDS = ['e801546a-d868-47fd-a5a6-69cdae8ecb80'] 

const PLATFORM_FEE_PERCENT = 3

interface Event {
  id: string
  title: string
  outcomes: string[]
  closes_at: string
  category: string
}

export default function Admin() {
  const [session, setSession] = useState<any>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchUnresolvedEvents()
    })
  }, [])

  const fetchUnresolvedEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
    
    setEvents(data || [])
    setLoading(false)
  }

  const resolveEvent = async (eventId: string, winningOutcomeIdx: number, winningOutcomeName: string) => {
    if (!window.confirm(`Are you 100% sure "${winningOutcomeName}" won? This will distribute real money and cannot be undone.`)) return
    
    setResolvingId(eventId)

    // 1. Fetch all bets for this event
    const { data: bets } = await supabase.from('bets').select('*').eq('event_id', eventId)
    if (!bets) {
      alert("Error fetching bets.")
      setResolvingId(null)
      return
    }

    // 2. Separate pool bets and calculate pool totals
    const poolBets = bets.filter(b => b.status === 'open')
    const totalPoolVolume = poolBets.reduce((sum, b) => sum + b.stake, 0)
    const winningPoolVolume = poolBets.filter(b => b.outcome_index === winningOutcomeIdx).reduce((sum, b) => sum + b.stake, 0)
    
    // 3. Process every bet
    for (const bet of bets) {
      let netPayout = 0
      let winnerId = null
      let statusUpdate = 'lost'

      // --- HANDLE POOL BETS ---
      if (bet.status === 'open') {
        if (bet.outcome_index === winningOutcomeIdx) {
          const grossPayout = winningPoolVolume === 0 ? bet.stake : (bet.stake / winningPoolVolume) * totalPoolVolume
          netPayout = Math.round(grossPayout * (1 - PLATFORM_FEE_PERCENT / 100))
          winnerId = bet.user_id
          statusUpdate = 'won'
        } else if (winningPoolVolume === 0) {
          netPayout = bet.stake
          winnerId = bet.user_id
          statusUpdate = 'refunded'
        }
      } 
      
      // --- HANDLE MATCHED P2P BETS ---
      else if (bet.status === 'p2p_matched') {
        const grossPot = bet.stake * (bet.odds || 2)
        netPayout = Math.round(grossPot * (1 - PLATFORM_FEE_PERCENT / 100))
        
        if (bet.outcome_index === winningOutcomeIdx) {
          winnerId = bet.user_id
          statusUpdate = 'won'
        } else {
          winnerId = bet.matcher_id
          statusUpdate = 'won'
        }
      } 
      
      // --- HANDLE UNMATCHED P2P OFFERS ---
      else if (bet.status === 'p2p_open') {
        netPayout = bet.stake
        winnerId = bet.user_id
        statusUpdate = 'refunded'
      }

      // --- PAYOUT & NOTIFY ---
      if (winnerId && netPayout > 0) {
        const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', winnerId).single()
        
        if (profile) {
          await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance + netPayout }).eq('id', winnerId)
        }

        const notifMessage = statusUpdate === 'refunded' 
          ? `Your ${bet.stake} KSh stake for an unresolved/unmatched wager was refunded.`
          : `You WON ${netPayout.toLocaleString()} KSh on ${winningOutcomeName}!`
          
        await supabase.from('notifications').insert({
          user_id: winnerId,
          message: notifMessage,
          type: 'payout',
          is_read: false
        })
      }

      // Update bet status
      await supabase.from('bets').update({ status: statusUpdate }).eq('id', bet.id)
    }

    // Mark Event as Resolved
    await supabase.from('events').update({ resolved: true }).eq('id', eventId)

    alert('Event resolved and all payouts distributed successfully!')
    setResolvingId(null)
    fetchUnresolvedEvents()
  }

  if (!session) return <div className="min-h-screen bg-matte-900 flex items-center justify-center p-10 text-white text-center">Please log in to access the Admin Panel.</div>
  
  // Security Check - This is now active, so ADMIN_UUIDS is being read!
  if (!ADMIN_UUIDS.includes(session.user.id)) return <div className="min-h-screen bg-matte-900 flex items-center justify-center p-10 text-white text-center font-bold text-xl">Unauthorized Access.</div>

  if (loading) return <div className="min-h-screen bg-matte-900 flex items-center justify-center"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div className="min-h-screen bg-matte-900 relative p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8 border-b border-matte-800 pb-4">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          <h1 className="text-3xl font-bold text-white tracking-tight">Parlayz <span className="text-red-500">Admin</span></h1>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8">
          <p className="text-red-400 text-sm font-semibold">⚠️ Warning: Resolving an event immediately distributes funds to user wallets. Double-check real-world results before clicking.</p>
        </div>

        <h2 className="text-xl font-bold text-white mb-4">Active Markets Pending Resolution</h2>
        
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="p-10 text-center text-gray-500 border border-dashed border-matte-700 rounded-xl">No active markets to resolve.</div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="bg-matte-800 border border-matte-700 rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider bg-matte-900 px-3 py-1 rounded-full border border-matte-700">{event.category}</span>
                  <span className="text-xs text-gray-500">Closes: {new Date(event.closes_at).toLocaleDateString()}</span>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-6">{event.title}</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.outcomes.map((outcome, idx) => (
                    <button
                      key={idx}
                      onClick={() => resolveEvent(event.id, idx, outcome)}
                      disabled={resolvingId === event.id}
                      className="flex items-center justify-between w-full bg-matte-900 hover:bg-green-500/10 border border-matte-700 hover:border-green-500 text-white font-bold py-4 px-5 rounded-xl transition group disabled:opacity-50"
                    >
                      <span>{outcome}</span>
                      {resolvingId === event.id ? (
                        <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-matte-700 group-hover:text-green-500 transition" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
