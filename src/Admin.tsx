import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ShieldAlert, CheckCircle2, Plus, Trash2, X, Calendar, Tag, Type, FileText } from 'lucide-react'

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

  // --- NEW MARKET FORM STATES ---
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newClosesAt, setNewClosesAt] = useState('')
  const [newOutcomes, setNewOutcomes] = useState<string[]>(['', '']) // Start with 2 empty outcomes

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

  // --- DYNAMIC OUTCOME HANDLERS ---
  const handleOutcomeChange = (index: number, value: string) => {
    const updatedOutcomes = [...newOutcomes]
    updatedOutcomes[index] = value
    setNewOutcomes(updatedOutcomes)
  }

  const addOutcomeField = () => {
    setNewOutcomes([...newOutcomes, ''])
  }

  const removeOutcomeField = (index: number) => {
    if (newOutcomes.length <= 2) return // Keep at least 2
    const updatedOutcomes = newOutcomes.filter((_, i) => i !== index)
    setNewOutcomes(updatedOutcomes)
  }

  // --- LAUNCH NEW MARKET FUNCTION ---
  const handleCreateMarket = async () => {
    if (!newTitle || !newCategory || !newClosesAt) {
      alert("Please fill in all required fields.")
      return
    }

    const validOutcomes = newOutcomes.map(o => o.trim()).filter(o => o !== '')
    if (validOutcomes.length < 2) {
      alert("A market must have at least 2 valid outcomes.")
      return
    }

    setIsCreating(true)

    const { error } = await supabase.from('events').insert({
      title: newTitle,
      description: newDescription,
      category: newCategory,
      closes_at: new Date(newClosesAt).toISOString(),
      outcomes: validOutcomes,
      resolved: false
    })

    if (error) {
      alert("Error creating market: " + error.message)
    } else {
      alert("Market successfully launched to the board!")
      setShowCreateModal(false)
      // Reset form
      setNewTitle('')
      setNewDescription('')
      setNewCategory('')
      setNewClosesAt('')
      setNewOutcomes(['', ''])
      fetchUnresolvedEvents()
    }
    
    setIsCreating(false)
  }

  const resolveEvent = async (eventId: string, winningOutcomeIdx: number, winningOutcomeName: string) => {
    if (!window.confirm(`Are you 100% sure "${winningOutcomeName}" won? This will distribute real money and cannot be undone.`)) return
    
    setResolvingId(eventId)

    const { data: bets } = await supabase.from('bets').select('*').eq('event_id', eventId)
    if (!bets) {
      alert("Error fetching bets.")
      setResolvingId(null)
      return
    }

    const poolBets = bets.filter(b => b.status === 'open')
    const totalPoolVolume = poolBets.reduce((sum, b) => sum + b.stake, 0)
    const winningPoolVolume = poolBets.filter(b => b.outcome_index === winningOutcomeIdx).reduce((sum, b) => sum + b.stake, 0)
    
    for (const bet of bets) {
      let netPayout = 0
      let winnerId = null
      let statusUpdate = 'lost'

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
      } else if (bet.status === 'p2p_matched') {
        const grossPot = bet.stake * (bet.odds || 2)
        netPayout = Math.round(grossPot * (1 - PLATFORM_FEE_PERCENT / 100))
        
        if (bet.outcome_index === winningOutcomeIdx) {
          winnerId = bet.user_id
          statusUpdate = 'won'
        } else {
          winnerId = bet.matcher_id
          statusUpdate = 'won'
        }
      } else if (bet.status === 'p2p_open') {
        netPayout = bet.stake
        winnerId = bet.user_id
        statusUpdate = 'refunded'
      }

      if (winnerId && netPayout > 0) {
        const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', winnerId).single()
        if (profile) {
          await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance + netPayout }).eq('id', winnerId)
        }
        const notifMessage = statusUpdate === 'refunded' 
          ? `Your ${bet.stake} KSh stake for an unresolved/unmatched wager was refunded.`
          : `You WON ${netPayout.toLocaleString()} KSh on ${winningOutcomeName}!`
          
        await supabase.from('notifications').insert({ user_id: winnerId, message: notifMessage, type: 'payout', is_read: false })
      }
      await supabase.from('bets').update({ status: statusUpdate }).eq('id', bet.id)
    }

    await supabase.from('events').update({ resolved: true }).eq('id', eventId)
    alert('Event resolved and all payouts distributed successfully!')
    setResolvingId(null)
    fetchUnresolvedEvents()
  }

  if (!session) return <div className="min-h-screen bg-matte-900 flex items-center justify-center p-10 text-white text-center">Please log in to access the Admin Panel.</div>
  
  if (!ADMIN_UUIDS.includes(session.user.id)) return <div className="min-h-screen bg-matte-900 flex items-center justify-center p-10 text-white text-center font-bold text-xl">Unauthorized Access.</div>

  if (loading) return <div className="min-h-screen bg-matte-900 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div className="min-h-screen bg-matte-900 relative p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* PREMIUM HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-matte-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gold-500/10 border border-gold-500/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.15)]">
              <ShieldAlert className="w-6 h-6 text-gold-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Executive <span className="text-gold-400">Dashboard</span></h1>
              <p className="text-gray-400 text-sm mt-1">Manage markets, resolve wagers, and distribute payouts.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-black font-bold py-2.5 px-5 rounded-xl transition shadow-[0_0_15px_rgba(251,191,36,0.2)]"
          >
            <Plus className="w-5 h-5" />
            Launch Market
          </button>
        </div>

        <h2 className="text-xl font-bold text-white mb-4">Active Markets Pending Resolution</h2>
        
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="py-16 text-center text-gray-500 border border-dashed border-matte-700 rounded-2xl flex flex-col items-center">
               <div className="w-16 h-16 rounded-full bg-matte-800 flex items-center justify-center mb-4 border border-matte-700">
                  <span className="text-2xl opacity-50">📋</span>
                </div>
              <p>No active markets right now.</p>
              <button onClick={() => setShowCreateModal(true)} className="mt-4 text-gold-400 font-semibold hover:text-gold-300">Create one now →</button>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="bg-matte-800 border border-matte-700 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider bg-gold-400/10 px-3 py-1 rounded-full">{event.category}</span>
                  <span className="text-xs text-gray-400 font-semibold border border-matte-600 px-2 py-1 rounded">Closes: {new Date(event.closes_at).toLocaleDateString()}</span>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-6 relative z-10">{event.title}</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                  {event.outcomes.map((outcome, idx) => (
                    <button
                      key={idx}
                      onClick={() => resolveEvent(event.id, idx, outcome)}
                      disabled={resolvingId === event.id}
                      className="flex items-center justify-between w-full bg-matte-900 hover:bg-gold-500/10 border border-matte-700 hover:border-gold-500 text-white font-bold py-4 px-5 rounded-xl transition group disabled:opacity-50"
                    >
                      <span>{outcome}</span>
                      {resolvingId === event.id ? (
                        <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-matte-700 group-hover:text-gold-500 transition" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- PREMIUM CREATE MARKET MODAL --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-matte-800 border border-gold-500/30 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-[0_0_50px_rgba(251,191,36,0.1)] relative my-8">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-matte-900 text-gray-400 hover:text-white border border-matte-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white tracking-tight mb-1">Launch New Market</h3>
              <p className="text-gray-400 text-sm">Deploy a new wager to the Parlayz exchange.</p>
            </div>

            <div className="space-y-5">
              
              {/* TITLE */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Type className="w-3 h-3"/> Market Question</label>
                <input 
                  type="text"
                  placeholder="e.g. Who will win the 2026 World Cup?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-matte-900 border border-matte-700 text-white rounded-xl p-3.5 focus:outline-none focus:border-gold-500 transition"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><FileText className="w-3 h-3"/> Description (Rules)</label>
                <textarea 
                  placeholder="Define exactly how this wager is graded..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-matte-900 border border-matte-700 text-white rounded-xl p-3.5 focus:outline-none focus:border-gold-500 transition min-h-[80px]"
                />
              </div>

              {/* CATEGORY & CLOSES AT */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Tag className="w-3 h-3"/> Category</label>
                  <input 
                    type="text"
                    placeholder="e.g. Sports, Crypto"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-matte-900 border border-matte-700 text-white rounded-xl p-3.5 focus:outline-none focus:border-gold-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Calendar className="w-3 h-3"/> Closes At</label>
                  <input 
                    type="datetime-local"
                    value={newClosesAt}
                    onChange={(e) => setNewClosesAt(e.target.value)}
                    className="w-full bg-matte-900 border border-matte-700 text-white rounded-xl p-3.5 focus:outline-none focus:border-gold-500 transition [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* OUTCOMES BUILDER */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Betting Outcomes</label>
                <div className="space-y-3 bg-matte-900/50 p-4 rounded-xl border border-matte-700/50">
                  {newOutcomes.map((outcome, index) => (
                    <div key={index} className="flex gap-2">
                      <input 
                        type="text"
                        placeholder={`Outcome ${index + 1}`}
                        value={outcome}
                        onChange={(e) => handleOutcomeChange(index, e.target.value)}
                        className="w-full bg-matte-900 border border-matte-700 text-white rounded-lg p-3 focus:outline-none focus:border-gold-500 transition"
                      />
                      <button 
                        onClick={() => removeOutcomeField(index)}
                        disabled={newOutcomes.length <= 2}
                        className="w-12 flex items-center justify-center bg-matte-900 border border-matte-700 rounded-lg text-gray-500 hover:text-red-400 hover:border-red-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    onClick={addOutcomeField}
                    className="w-full flex items-center justify-center gap-2 bg-matte-800 hover:bg-matte-700 border border-dashed border-matte-600 text-gold-400 font-semibold py-2.5 rounded-lg transition mt-2"
                  >
                    <Plus className="w-4 h-4" /> Add Another Outcome
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleCreateMarket}
                  disabled={isCreating}
                  className="w-full bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black font-bold py-4 rounded-xl transition shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>Deploy Market <CheckCircle2 className="w-5 h-5"/></>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
