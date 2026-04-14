'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { SignedIn } from '@clerk/nextjs'

interface Notification {
  id: string
  type: 'resolution' | 'new_market' | 'price_alert' | 'system'
  title: string
  message: string
  timeAgo: string
  read: boolean
}

const mockNotifications: Notification[] = [
  { id: '1', type: 'resolution', title: 'Bet Resolved', message: 'Bitcoin hit $85,000 - You won KSh 500!', timeAgo: '2h ago', read: false },
  { id: '2', type: 'new_market', title: 'New Market', message: 'Premier League: Who wins this weekend?', timeAgo: '5h ago', read: false },
  { id: '3', type: 'price_alert', title: 'Price Alert', message: 'ETH crossed 70% probability', timeAgo: '1d ago', read: true },
]

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications] = useState<Notification[]>(mockNotifications)
  const unreadCount = notifications.filter(n => !n.read).length

  // Prevent closing on scroll
  useEffect(() => {
    const handleScroll = () => {
      // Don't close on scroll
    }
    if (isOpen) {
      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [isOpen])

  const getIcon = (type: string) => {
    switch (type) {
      case 'resolution': return '🎯'
      case 'new_market': return '📊'
      case 'price_alert': return '📈'
      case 'system': return '🔔'
      default: return '🔔'
    }
  }

  return (
    <SignedIn>
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-[#8B8B8B] hover:text-[#C9A84C] transition relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#E05252] rounded-full" />
          )}
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-[150]" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#141414] border border-[#222222] rounded-xl shadow-2xl z-[200] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[#222222]">
                <h3 className="font-bold text-white">Notifications</h3>
                <button onClick={() => setIsOpen(false)} className="text-[#8B8B8B] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-4 border-b border-[#222222] hover:bg-[#1a1a1a] cursor-pointer transition ${!n.read ? 'bg-[#1E1A0F]/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{getIcon(n.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm">{n.title}</p>
                        <p className="text-[#8B8B8B] text-xs mt-1 truncate">{n.message}</p>
                        <p className="text-[#555555] text-xs mt-1">{n.timeAgo}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 bg-[#C9A84C] rounded-full mt-2" />}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 text-center">
                <button className="text-[#C9A84C] text-sm font-medium hover:underline">
                  View All Notifications
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </SignedIn>
  )
}