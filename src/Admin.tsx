import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ShieldAlert, CheckCircle2, Plus, Trash2, X, Calendar, Tag, Type, FileText, Lock, Link as LinkIcon, UploadCloud, AlertTriangle, Info } from 'lucide-react'

// --- IMPORTANT: Put your Supabase UUID here so ONLY YOU can use this page ---
const ADMIN_UUIDS = ['e801546a-d868-47fd-a5a6-69cdae8ecb80'] 

interface Event {
  id: string
  title: string
  outcomes: string[]
  closes_at?: string
  locks_at?: string
  category: string
}

export default function Admin() {
  const [session, setSession] = useState<any>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  
  // Custom Modals State
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type: 'error' | 'success' | 'warning' | 'info' | 'confirm', onConfirm?: () => void }>({ isOpen: false, title: '', message: '', type: 'info' })
  
  // Create Market State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newLocksAt, setNewLocksAt] = useState('')
  const [newOutcomes, setNewOutcomes] = useState<string[]>(['', ''])

  // Resolve Market State
  const [resolveConfig, setResolveConfig] = useState<{ event: Event | null, outcomeIdx: number, outcomeName: string } | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [proofLink, setProofLink] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)

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

  // --- PREMIUM ALERTS ---
  const showAlert = (title: string, message: string, type: 'error' | 'success' | 'info') => {
    setAlertConfig({ isOpen: true, title, message, type })
  }

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setAlertConfig({ isOpen: true, title, message, type: 'confirm', onConfirm })
  }

  const closeAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }))

  // --- MARKET CREATION ---
  const handleOutcomeChange = (index: number, value: string) => {
    const updatedOutcomes = [...newOutcomes]
    updatedOutcomes[index] = value
    setNewOutcomes(updatedOutcomes)
  }

  const addOutcomeField = () => setNewOutcomes([...newOutcomes, ''])
  const removeOutcomeField = (index: number) => {
    if (newOutcomes.length <= 2) return
    setNewOutcomes(newOutcomes.filter((_, i) => i !== index))
  }

  const handleCreateMarket = async () => {
    if (!newTitle || !newCategory || !newLocksAt) {
      return showAlert("Missing Data", "Please fill in all required fields to launch a market.", "error")
    }

    const validOutcomes = newOutcomes.map(o => o.trim()).filter(o => o !== '')
    if (validOutcomes.length < 2) {
      return showAlert("Invalid Outcomes", "A market must have at least 2 valid outcomes.", "error")
    }

    setIsCreating(true)

    const { error } = await supabase.from('events').insert({
      title: newTitle,
      description: newDescription,
      category: newCategory,
      locks_at: new Date(newLocksAt).toISOString(),
      outcomes: validOutcomes,
      resolved: false
    })

    setIsCreating(false)

    if (error) {
      showAlert("Launch Failed", error.message, "error")
    } else {
      showAlert("Market Live", "Market successfully launched to the board!", "success")
      setShowCreateModal(false)
      setNewTitle('')
      setNewDescription('')
      setNewCategory('')
      setNewLocksAt('')
      setNewOutcomes(['', ''])
      fetchUnresolvedEvents()
    }
  }

  // --- MARKET MANAGEMENT ---
  const handleDeleteMarket = (eventId: string) => {
    showConfirm(
      "Delete Market?", 
      "This will automatically refund all users who placed bets and wipe the market from the board forever.",
      async () => {
        setAlertConfig(prev => ({...prev, isOpen: false})) // close confirm
        
        const { data: bets } = await supabase.from('bets').select('*').eq('event_id', eventId)

        if (bets && bets.length > 0) {
          for (const bet of bets) {
            const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', bet.user_id).single()
            if (profile) {
              await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance + bet.stake }).eq('id', bet.user_id)
              await supabase.from('notifications').insert({ 
                user_id: bet.user_id, 
                message: `A market was cancelled. Your ${bet.stake} KSh stake has been fully refunded.`, 
                type: 'payout', 
                is_read: false 
              })
            }
          }
          await supabase.from('bets').delete().eq('event_id', eventId)
        }

        const { error } = await supabase.from('events').delete().eq('id', eventId)

        if (error) {
          showAlert("Delete Failed", error.message, "error")
        } else {
          showAlert("Market Deleted", "All affected users have been fully refunded.", "success")
          fetchUnresolvedEvents() 
        }
      }
    )
  }

  const handleCloseMarket = (eventId: string) => {
    showConfirm(
      "Lock Market?", 
      "Users will immediately be blocked from placing new bets on this market.",
      async () => {
        setAlertConfig(prev => ({...prev, isOpen: false}))
        const rightNow = new Date(Date.now() - 1000).toISOString()
        const { error } = await supabase.from('events').update({ locks_at: rightNow }).eq('id', eventId)

        if (error) {
          showAlert("Lock Failed", error.message, "error")
        } else {
          showAlert("Market Locked", "No new bets can be placed on this event.", "success")
          fetchUnresolvedEvents() 
        }
      }
    )
  }

  // --- THE ORACLE ENGINE (SETTLEMENT) ---
  const executeResolution = async () => {
    if (!resolveConfig) return
    setIsResolving(true)

    let uploadedImageUrl = null

    // 1. Upload Proof Image if attached
    if (proofFile) {
      const fileExt = proofFile.name.split('.').pop()
      const fileName = `${resolveConfig.event?.id}-${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(fileName, proofFile)

      if (uploadError) {
        setIsResolving(false)
        return showAlert("Upload Failed", "Could not upload the proof image. " + uploadError.message, "error")
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from('proofs').getPublicUrl(fileName)
      uploadedImageUrl = publicUrl
    }

    // 2. Lock the Proof into the Event Database
    const { error: dbError } = await supabase.from('events').update({
      winning_outcome_index: resolveConfig.outcomeIdx,
      resolution_link: proofLink || null,
      resolution_image_url: uploadedImageUrl
    }).eq('id', resolveConfig.event!.id)

    if (dbError) {
      setIsResolving(false)
      return showAlert("Database Error", "Failed to save proof data: " + dbError.message, "error")
    }

    // 3. Trigger the Payout Payout Engine
    const { error: rpcError } = await supabase.rpc('resolve_market_payout', { 
      target_event_id: resolveConfig.event!.id, 
      winning_index: resolveConfig.outcomeIdx 
    })

    setIsResolving(false)
    setResolveConfig(null)
    setProofLink('')
    setProofFile(null)

    if (rpcError) {
      showAlert("Payout Engine Error", rpcError.message, "error")
    } else {
      showAlert("Settlement Complete", `Market resolved as "${resolveConfig.outcomeName}". Payouts have been distributed.`, "success")
      fetchUnresolvedEvents()
    }
  }

  // --- RENDER CHECKS ---
  if (!session) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-10 text-white font-sans">Please log in to access the Admin Panel.</div>
  if (!ADMIN_UUIDS.includes(session.user.id)) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-10 text-white font-bold text-xl font-sans">Unauthorized Access.</div>
  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#C5A880] border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#C5A880]/20 font-sans relative p-4 sm:p-8 overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBWMGgtMXYzOWgtMzl6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9zdmc+')] opacity-20 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-[#ffffff0a] pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#C5A880]/10 border border-[#C5A880]/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(197,168,128,0.15)]">
              <ShieldAlert className="w-6 h-6 text-[#C5A880]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Executive <span className="text-[#C5A880]">Dashboard</span></h1>
              <p className="text-gray-400 text-sm mt-1 font-light">Manage markets, resolve wagers, and distribute payouts.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#C5A880] hover:bg-[#A3885C] text-[#0a0a0a] font-bold py-2.5 px-5 rounded-xl transition shadow-[0_0_15px_rgba(197,168,128,0.2)]"
          >
            <Plus className="w-5 h-5" /> Launch Market
          </button>
        </div>

        <h2 className="text-xl font-bold text-white mb-4">Active Markets Pending Resolution</h2>

        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="py-16 text-center text-gray-500 border border-dashed border-[#ffffff10] rounded-2xl flex flex-col items-center">
               <div className="w-16 h-16 rounded-full bg-[#111111] flex items-center justify-center mb-4 border border-[#ffffff10]">
                  <span className="text-2xl opacity-50">📋</span>
                </div>
              <p>No active markets right now.</p>
              <button onClick={() => setShowCreateModal(true)} className="mt-4 text-[#C5A880] font-semibold hover:text-[#A3885C]">Create one now →</button>
            </div>
          ) : (
            events.map((event) => {
              const lockDate = event.locks_at || event.closes_at || '';
              return (
              <div key={event.id} className="bg-[#111111] border border-[#ffffff10] rounded-2xl p-6 shadow-lg relative overflow-hidden hover:border-[#C5A880]/30 transition group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A880]/5 rounded-full blur-3xl"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 relative z-10 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[#C5A880] uppercase tracking-wider bg-[#C5A880]/10 border border-[#C5A880]/20 px-3 py-1 rounded-full">{event.category}</span>
                    <span className="text-xs text-gray-400 font-semibold border border-[#ffffff10] px-2 py-1 rounded">
                      Locks: {lockDate ? `${new Date(lockDate).toLocaleDateString()} ${new Date(lockDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'TBA'}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleCloseMarket(event.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ffffff05] border border-[#ffffff10] hover:border-[#C5A880]/50 hover:text-[#C5A880] rounded-lg transition text-xs font-bold text-gray-400"
                    >
                      <Lock className="w-3 h-3" /> Lock Betting
                    </button>
                    <button 
                      onClick={() => handleDeleteMarket(event.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg transition text-xs font-bold text-red-500"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-6 relative z-10">{event.title}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                  {event.outcomes.map((outcome, idx) => (
                    <button
                      key={idx}
                      onClick={() => setResolveConfig({ event, outcomeIdx: idx, outcomeName: outcome })}
                      className="flex items-center justify-between w-full bg-[#0a0a0a] hover:bg-[#C5A880]/10 border border-[#ffffff10] hover:border-[#C5A880] text-white font-bold py-4 px-5 rounded-xl transition"
                    >
                      <span>Settle as "{outcome}"</span>
                      <CheckCircle2 className="w-5 h-5 text-gray-600 group-hover:text-[#C5A880] transition" />
                    </button>
                  ))}
                </div>
              </div>
            )})
          )}
        </div>
      </div>

      {/* --- PREMIUM CREATE MODAL --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-[#111111] border border-[#C5A880]/30 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-[0_0_50px_rgba(197,168,128,0.1)] relative my-8">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-xl bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#ffffff10] transition"><X className="w-4 h-4" /></button>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white tracking-tight mb-1">Launch New Market</h3>
              <p className="text-gray-400 text-sm font-light">Deploy a new wager to the Parlayz exchange.</p>
            </div>
            {/* Same form as before, just kept inside the premium shell */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Type className="w-3 h-3"/> Market Question</label>
                <input type="text" placeholder="e.g. Who will win the 2026 World Cup?" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-white rounded-xl p-3.5 focus:outline-none focus:border-[#C5A880] transition"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><FileText className="w-3 h-3"/> Description (Rules)</label>
                <textarea placeholder="Define exactly how this wager is graded..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-white rounded-xl p-3.5 focus:outline-none focus:border-[#C5A880] transition min-h-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Tag className="w-3 h-3"/> Category</label>
                  <input type="text" placeholder="e.g. Sports, Crypto" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-white rounded-xl p-3.5 focus:outline-none focus:border-[#C5A880] transition"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Calendar className="w-3 h-3"/> Closes At</label>
                  <input type="datetime-local" value={newLocksAt} onChange={(e) => setNewLocksAt(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-white rounded-xl p-3.5 focus:outline-none focus:border-[#C5A880] transition [color-scheme:dark]"/>
                </div>
              </div>
              <div className="pt-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Betting Outcomes</label>
                <div className="space-y-3 bg-[#0a0a0a] p-4 rounded-xl border border-[#ffffff10]">
                  {newOutcomes.map((outcome, index) => (
                    <div key={index} className="flex gap-2">
                      <input type="text" placeholder={`Outcome ${index + 1}`} value={outcome} onChange={(e) => handleOutcomeChange(index, e.target.value)} className="w-full bg-[#111111] border border-[#ffffff15] text-white rounded-lg p-3 focus:outline-none focus:border-[#C5A880] transition" />
                      <button onClick={() => removeOutcomeField(index)} disabled={newOutcomes.length <= 2} className="w-12 flex items-center justify-center bg-[#111111] border border-[#ffffff10] rounded-lg text-gray-500 hover:text-red-400 hover:border-red-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={addOutcomeField} className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#222222] border border-dashed border-[#ffffff20] text-[#C5A880] font-semibold py-2.5 rounded-lg transition mt-2"><Plus className="w-4 h-4" /> Add Another Outcome</button>
                </div>
              </div>
              <div className="pt-4">
                <button onClick={handleCreateMarket} disabled={isCreating} className="w-full bg-gradient-to-r from-[#8E7651] to-[#A3885C] hover:from-[#C5A880] hover:to-[#E8D4B0] text-[#0a0a0a] font-bold py-4 rounded-xl transition shadow-[0_0_20px_rgba(197,168,128,0.2)] flex items-center justify-center gap-2">
                  {isCreating ? <div className="w-5 h-5 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin"></div> : <>Deploy Market <CheckCircle2 className="w-5 h-5"/></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- THE ORACLE MODAL (RESOLUTION) --- */}
      {resolveConfig && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-[#C5A880]/30 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-[0_0_50px_rgba(197,168,128,0.15)] relative">
             <button onClick={() => setResolveConfig(null)} disabled={isResolving} className="absolute top-5 right-5 text-gray-400 hover:text-white transition disabled:opacity-50"><X className="w-5 h-5" /></button>
             
             <div className="flex items-center gap-3 mb-2">
               <ShieldAlert className="w-6 h-6 text-[#C5A880]" />
               <h3 className="text-xl font-bold text-white">Declare Official Result</h3>
             </div>
             <p className="text-gray-400 text-sm mb-6 border-b border-[#ffffff10] pb-4">
               You are about to permanently grade <span className="text-white font-bold">"{resolveConfig.event?.title}"</span> as <span className="text-[#C5A880] font-bold text-base">"{resolveConfig.outcomeName}"</span>. Provide proof to maintain user trust.
             </p>

             <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><LinkIcon className="w-3 h-3"/> Proof Source URL</label>
                  <input type="text" placeholder="e.g. https://twitter.com/..." value={proofLink} onChange={(e) => setProofLink(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-white rounded-xl p-3 focus:outline-none focus:border-[#C5A880] transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><UploadCloud className="w-3 h-3"/> Screenshot / Image Proof</label>
                  <label className="w-full flex flex-col items-center justify-center h-24 border-2 border-dashed border-[#ffffff20] hover:border-[#C5A880]/50 bg-[#0a0a0a] rounded-xl cursor-pointer transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {proofFile ? <p className="text-sm text-[#C5A880] font-semibold">{proofFile.name}</p> : <><UploadCloud className="w-6 h-6 text-gray-500 mb-2"/><p className="text-xs text-gray-400">Click to attach image</p></>}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => { if(e.target.files && e.target.files[0]) setProofFile(e.target.files[0]) }} />
                  </label>
                </div>
             </div>

             <div className="flex gap-3">
               <button onClick={() => setResolveConfig(null)} disabled={isResolving} className="flex-1 py-3.5 rounded-xl font-bold bg-[#1a1a1a] text-white hover:bg-[#222222] transition disabled:opacity-50">Cancel</button>
               <button onClick={executeResolution} disabled={isResolving} className="flex-1 py-3.5 rounded-xl font-bold bg-[#C5A880] text-[#0a0a0a] hover:bg-[#A3885C] transition flex items-center justify-center gap-2 disabled:opacity-50">
                 {isResolving ? <div className="w-5 h-5 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin"></div> : <>Lock & Settle <CheckCircle2 className="w-4 h-4"/></>}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* --- PREMIUM GLOBAL ALERTS MODAL --- */}
      {alertConfig.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-[#ffffff10] rounded-2xl p-6 sm:p-8 w-full max-w-sm shadow-2xl relative">
            <div className="flex flex-col items-center text-center">
              {alertConfig.type === 'error' && <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-8 h-8" /></div>}
              {alertConfig.type === 'success' && <div className="w-16 h-16 bg-[#C5A880]/10 text-[#C5A880] rounded-full flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8" /></div>}
              {alertConfig.type === 'info' && <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-4"><Info className="w-8 h-8" /></div>}
              {alertConfig.type === 'confirm' && <div className="w-16 h-16 bg-orange-500/10 text-orange-400 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-8 h-8" /></div>}
              
              <h3 className="text-xl font-bold text-white mb-2">{alertConfig.title}</h3>
              <p className="text-gray-400 text-sm mb-6">{alertConfig.message}</p>
              
              {alertConfig.type === 'confirm' ? (
                <div className="flex gap-3 w-full">
                  <button onClick={closeAlert} className="flex-1 py-3 rounded-xl font-bold bg-[#1a1a1a] text-white hover:bg-[#222222] transition">Cancel</button>
                  <button onClick={alertConfig.onConfirm} className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition">Confirm</button>
                </div>
              ) : (
                <button onClick={closeAlert} className="w-full py-3 rounded-xl font-bold bg-[#1a1a1a] border border-[#ffffff10] text-white hover:bg-[#222222] transition">Acknowledge</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
