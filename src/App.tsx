import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

interface Event {
  id: string
  title: string
  description: string
  category: string
  outcomes: string[]
  closes_at: string
  created_at: string
}

function App() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error:', error)
    } else {
      setEvents(data || [])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-matte-900 flex items-center justify-center">
        <div className="text-gold-400 text-2xl font-bold">Loading markets...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-matte-900">
      {/* Header */}
      <header className="border-b border-matte-700 bg-matte-800/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gold-400 tracking-tight">PARLAYZ</h1>
          <button className="bg-gold-500 hover:bg-gold-400 text-matte-900 font-bold px-6 py-2 rounded-lg transition">
            Connect Wallet
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-white">Live Markets</h2>
          <button className="bg-gold-500 hover:bg-gold-400 text-matte-900 font-bold px-4 py-2 rounded-lg transition">
            + Create Market
          </button>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl text-gray-400">No active markets</h3>
            <p className="text-gray-500 mt-2">Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function EventCard({ event }: { event: Event }) {
  return (
    <div className="bg-matte-800 border border-matte-700 rounded-2xl p-6 hover:border-gold-500/50 transition cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider bg-gold-400/10 px-3 py-1 rounded-full">
          {event.category || 'General'}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(event.closes_at).toLocaleDateString()}
        </span>
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gold-400 transition">
        {event.title}
      </h3>
      
      <p className="text-gray-400 text-sm mb-6 line-clamp-2">
        {event.description}
      </p>

      <div className="space-y-2">
        {event.outcomes.map((outcome, idx) => (
          <button
            key={idx}
            className="w-full flex items-center justify-between bg-matte-900 hover:bg-matte-700 border border-matte-600 hover:border-gold-500/30 rounded-xl px-4 py-3 transition group/btn"
          >
            <span className="text-white font-medium">{outcome}</span>
            <span className="text-gold-400 font-bold text-sm">
              50% {/* Placeholder odds */}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-matte-700 flex items-center justify-between text-xs text-gray-500">
        <span>Volume: $0</span>
        <span>Closes {new Date(event.closes_at).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

export default App
