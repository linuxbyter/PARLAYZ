'use client'

import Header from '@/src/components/Header'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Swords, CheckCircle, Copy, Clock, Users, Send, MessageCircle, Share2, Crown } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

interface Participant {
  id: string
  username: string
  stake: number
}

interface ChatMessage {
  id: string
  userId: string
  username: string
  message: string
  timestamp: number
}

interface Duel {
  id: string
  instrumentId: string
  creator: string
  stake: number
  side: 'UP' | 'DOWN'
  participants: string[]
  status: 'open' | 'filled' | 'resolved'
  type: 'duel' | 'minipool'
  maxParticipants: number
}

interface MiniPool {
  id: string
  duelId: string
  participants: Participant[]
  chat: ChatMessage[]
  status: 'open' | 'active' | 'resolved'
}

export default function DuelPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const duelId = params?.id as string
  const poolId = searchParams?.get('pool')

  const [duel, setDuel] = useState<Duel | null>(null)
  const [miniPool, setMiniPool] = useState<MiniPool | null>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [stakeAmount, setStakeAmount] = useState('5')
  const [chatMessage, setChatMessage] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [isMiniPool, setIsMiniPool] = useState(false)
  const [loading, setLoading] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const parts = duelId?.split('-') || []
  const instrumentId = parts[0] || 'BTC'
  const userId = user?.id || ''
  const username = user?.username || user?.firstName || 'Anon'

  const fetchDuel = useCallback(async () => {
    try {
      const res = await fetch(`/api/duel?id=${duelId}`)
      const data = await res.json()
      if (data.duel) {
        setDuel(data.duel)
        setIsMiniPool(data.duel.type === 'minipool' || data.duel.maxParticipants > 2)
      }
    } catch (error) {
      console.error('Failed to fetch duel:', error)
    }
  }, [duelId])

  const fetchMiniPool = useCallback(async () => {
    if (!poolId) return
    try {
      const res = await fetch(`/api/minipool?id=${poolId}`)
      const data = await res.json()
      if (data.miniPool) {
        setMiniPool(data.miniPool)
        if (data.miniPool.chat.length > 0) {
          setShowChat(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch mini-pool:', error)
    }
  }, [poolId])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchDuel()
      await fetchMiniPool()
      setLoading(false)
    }
    init()
  }, [fetchDuel, fetchMiniPool])

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [miniPool?.chat])

  useEffect(() => {
    if (!duel || !userId) return
    setHasJoined(duel.participants.includes(userId))
  }, [duel, userId])

  const handleCreateMiniPool = async () => {
    try {
      const res = await fetch('/api/minipool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duelId,
          instrumentId,
          creator: userId,
          creatorUsername: username,
          stake: parseFloat(stakeAmount),
          side: 'UP',
        }),
      })
      const data = await res.json()
      if (data.miniPool) {
        setMiniPool(data.miniPool)
        setIsMiniPool(true)
        router.replace(`/duel/${duelId}?pool=${data.miniPool.id}`)
      }
    } catch (error) {
      console.error('Failed to create mini-pool:', error)
    }
  }

  const handleJoinMiniPool = async () => {
    if (!poolId || !miniPool) return
    try {
      const res = await fetch('/api/minipool', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: poolId,
          action: 'join',
          participant: userId,
          username,
          stake: parseFloat(stakeAmount),
        }),
      })
      const data = await res.json()
      if (data.miniPool) {
        setMiniPool(data.miniPool)
        setHasJoined(true)
      }
    } catch (error) {
      console.error('Failed to join mini-pool:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!poolId || !chatMessage.trim()) return

    try {
      const res = await fetch('/api/minipool', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: poolId,
          action: 'sendMessage',
          participant: userId,
          username,
          message: chatMessage.trim(),
        }),
      })
      const data = await res.json()
      if (data.miniPool) {
        setMiniPool(data.miniPool)
        setChatMessage('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const copyInviteLink = () => {
    const link = `${window.location.origin}/duel/${duelId}${isMiniPool ? `?pool=${poolId}` : ''}`
    navigator.clipboard.writeText(link)
  }

  const shareInvite = async () => {
    const link = `${window.location.origin}/duel/${duelId}${isMiniPool ? `?pool=${poolId}` : ''}`
    if (navigator.share) {
      await navigator.share({
        title: `Join my ${instrumentId} ${isMiniPool ? 'Mini-Pool' : 'Duel'}!`,
        text: `Stake ${stakeAmount} USDT on ${instrumentId} - Winner takes all!`,
        url: link,
      })
    } else {
      copyInviteLink()
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="w-12 h-12 border-2 border-[#C5A059]/20 border-t-[#C5A059] rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-bold">Back to Markets</span>
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-[#111] border border-[#C5A059]/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#C5A059]/20 flex items-center justify-center">
                    <Swords className="w-6 h-6 text-[#C5A059]" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-white">
                      {isMiniPool ? 'Mini-Pool Challenge' : 'Duel Challenge'}
                    </h1>
                    <p className="text-sm text-gray-400">{instrumentId}</p>
                  </div>
                </div>
                <button onClick={shareInvite} className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222] transition">
                  <Share2 className="w-5 h-5 text-[#C5A059]" />
                </button>
              </div>

              {miniPool && (
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">
                    {miniPool.participants.length} / 10 players
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    miniPool.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    miniPool.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {miniPool.status}
                  </span>
                </div>
              )}

              {!hasJoined ? (
                <div className="space-y-4">
                  <div className="bg-[#0a0a0a] rounded-xl p-4">
                    <p className="text-[10px] text-gray-600 uppercase font-bold mb-2">Your Stake (USDT)</p>
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={e => setStakeAmount(e.target.value)}
                      className="w-full bg-[#111] border border-[#1F1F1F] text-white rounded-xl p-3 text-center text-xl font-black font-mono focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {!isMiniPool ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleCreateMiniPool}
                          className="py-3 rounded-xl text-sm font-bold uppercase tracking-wider bg-[#C5A059] text-black hover:bg-[#b89a49] transition flex items-center justify-center gap-2"
                        >
                          <Users className="w-4 h-4" /> Create Mini-Pool
                        </button>
                        <button
                          onClick={() => setIsMiniPool(true)}
                          className="py-3 rounded-xl text-sm font-bold uppercase tracking-wider border border-[#C5A059]/50 text-[#C5A059] hover:bg-[#C5A059]/10 transition"
                        >
                          1v1 Duel
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-600 text-center">
                        Mini-pools allow up to 10 players. Share the link to invite friends!
                      </p>
                    </>
                  ) : poolId ? (
                    <button
                      onClick={handleJoinMiniPool}
                      className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider bg-[#C5A059] text-black hover:bg-[#b89a49] transition flex items-center justify-center gap-2"
                    >
                      Join Mini-Pool ({stakeAmount} USDT)
                    </button>
                  ) : (
                    <button
                      onClick={handleCreateMiniPool}
                      className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider bg-[#C5A059] text-black hover:bg-[#b89a49] transition flex items-center justify-center gap-2"
                    >
                      Create Mini-Pool ({stakeAmount} USDT)
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-center text-sm font-bold text-green-400">
                      {isMiniPool ? 'Joined Mini-Pool!' : 'Duel Accepted!'}
                    </p>
                    <p className="text-center text-xs text-gray-400 mt-1">
                      {stakeAmount} USDT locked. Winner takes all!
                    </p>
                  </div>

                  {miniPool && miniPool.participants.length > 0 && (
                    <div className="bg-[#0a0a0a] rounded-xl p-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                        <Crown className="w-4 h-4 text-[#C5A059]" /> Players
                      </h3>
                      <div className="space-y-2">
                        {miniPool.participants.map((p, i) => (
                          <div key={p.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                i === 0 ? 'bg-[#C5A059]/20 text-[#C5A059]' : 'bg-[#1a1a1a] text-gray-400'
                              }`}>
                                {i + 1}
                              </span>
                              <span className="text-sm font-medium text-white">{p.username}</span>
                            </div>
                            <span className="text-sm font-mono text-gray-400">{p.stake} USDT</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {miniPool && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-[#111] border border-[#1F1F1F] rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition"
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-[#C5A059]" />
                    <span className="text-sm font-bold">Pool Chat</span>
                    {miniPool.chat.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-[#C5A059]/20 text-[10px] font-bold text-[#C5A059]">
                        {miniPool.chat.length}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{showChat ? 'Hide' : 'Show'}</span>
                </button>

                <AnimatePresence>
                  {showChat && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 300 }}
                      exit={{ height: 0 }}
                      className="border-t border-[#1F1F1F]"
                    >
                      <div className="h-[240px] overflow-y-auto p-4 space-y-3">
                        {miniPool.chat.length === 0 ? (
                          <p className="text-center text-xs text-gray-500 py-8">
                            No messages yet. Say something!
                          </p>
                        ) : (
                          miniPool.chat.map(msg => (
                            <div key={msg.id} className={`flex flex-col ${msg.userId === userId ? 'items-end' : 'items-start'}`}>
                              <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                                msg.userId === userId
                                  ? 'bg-[#C5A059]/20 text-[#C5A059]'
                                  : 'bg-[#1a1a1a] text-gray-300'
                              }`}>
                                <p className="text-[10px] font-bold mb-0.5 opacity-70">{msg.username}</p>
                                <p className="text-sm">{msg.message}</p>
                              </div>
                              <span className="text-[9px] text-gray-600 mt-0.5">{formatTime(msg.timestamp)}</span>
                            </div>
                          ))
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      <form onSubmit={handleSendMessage} className="p-3 border-t border-[#1F1F1F] flex gap-2">
                        <input
                          type="text"
                          value={chatMessage}
                          onChange={e => setChatMessage(e.target.value)}
                          placeholder="Send a message..."
                          className="flex-1 bg-[#0a0a0a] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C5A059]"
                        />
                        <button
                          type="submit"
                          className="p-2 rounded-lg bg-[#C5A059] text-black hover:bg-[#b89a49] transition"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            <div className="bg-[#C5A059]/5 border border-[#C5A059]/20 rounded-2xl p-5">
              <p className="text-sm text-[#C5A059] font-bold flex items-center gap-2">
                <Clock className="w-4 h-4" /> {isMiniPool ? 'Mini-Pool' : 'Duel'} Rules
              </p>
              <ul className="text-xs text-gray-400 mt-3 space-y-1.5">
                <li>All players lock equal stakes</li>
                <li>Winner determined by {instrumentId} market resolution</li>
                <li>3% platform fee on winnings</li>
                {isMiniPool && <li>Up to 10 players can join the pool</li>}
                <li>Share the link to invite more players</li>
              </ul>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyInviteLink}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1a1a1a] border border-[#1F1F1F] text-sm font-bold text-gray-300 hover:text-white hover:border-[#C5A059]/50 transition"
              >
                <Copy className="w-4 h-4" /> Copy Invite Link
              </button>
              <button
                onClick={shareInvite}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#C5A059] text-black text-sm font-bold hover:bg-[#b89a49] transition"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
