'use client'

import { useState, useEffect } from 'react'
import { MarketCard } from './MarketCard'

interface Sport {
  id: string
  label: string
}

interface SportsMarketSectionProps {
  category?: Sport | 'all'
}

const SPORTS: Sport[] = [
  { id: 'football', label: 'Football' },
  { id: 'basketball', label: 'Basketball' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'boxing', label: 'Boxing' },
  { id: 'motorsport', label: 'Motorsport' },
]

const SPORT_CATEGORIES: Sport[] = [
  { id: 'all', label: 'All Sports' },
  { id: 'football', label: 'Football' },
  { id: 'basketball', label: 'Basketball' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'boxing', label: 'Boxing' },
  { id: 'motorsport', label: 'Motorsport' },
]

export const SportsMarketSection: React.FC<SportsMarketSectionProps> = ({ category = 'all' }) => {
  const [markets, setMarkets] = useState<Array<any>>([])
  const [activeTab, setActiveTab] = useState<string>(category === 'all' ? 'all' : category.label)
  const [loading, setLoading] = useState<boolean>(true)

  // Mock sports data - in a real app, this would come from Supabase
  const MOCK_SPORTS_MARKETS = [
    {
      id: 1,
      sport: 'Football',
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      league: 'Premier League',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      homeOdds: 150, // +150
      awayOdds: -180, // -180
    },
    {
      id: 2,
      sport: 'Basketball',
      homeTeam: 'Los Angeles Lakers',
      awayTeam: 'Golden State Warriors',
      league: 'NBA',
      startTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
      homeOdds: -120, // -120
      awayOdds: 100, // +100
    },
    {
      id: 3,
      sport: 'Tennis',
      homeTeam: 'Novak Djokovic',
      awayTeam: 'Carlos Alcaraz',
      league: 'Wimbledon',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      homeOdds: -150, // -150
      awayOdds: 130, // +130
    },
    {
      id: 4,
      sport: 'Boxing',
      homeTeam: 'Tyson Fury',
      awayTeam: 'Oleksandr Usyk',
      league: 'Heavyweight Championship',
      startTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours from now
      homeOdds: 200, // +200
      awayOdds: -250, // -250
    },
    {
      id: 5,
      sport: 'Motorsport',
      homeTeam: 'Max Verstappen',
      awayTeam: 'Sergio Pérez',
      league: 'Monaco Grand Prix',
      startTime: new Date(Date.now() + 168 * 60 * 60 * 1000).toISOString(), // 168 hours (1 week) from now
      homeOdds: -110, // -110
      awayOdds: -110, // -110
    },
  ]

  useEffect(() => {
    // Filter markets by sport category if not 'all'
    const filteredMarkets = category === 'all' 
      ? MOCK_SPORTS_MARKETS 
      : MOCK_SPORTS_MARKETS.filter(m => m.sport.toLowerCase() === category.label.toLowerCase())
    
    setMarkets(filteredMarkets)
    setLoading(false)
  }, [category])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {SPORT_CATEGORIES.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition whitespace-nowrap ${
                activeTab === tab.label
                  ? 'bg-[#1E3A8A] text-white'
                  : 'bg-[#111] border border-[#2D2D2D] text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="text-center py-12">
          <p className="text-gray-500">Loading sports markets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {SPORT_CATEGORIES.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.label)}
            className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition whitespace-nowrap ${
              activeTab === tab.label
                ? 'bg-[#1E3A8A] text-white'
                : 'bg-[#111] border border-[#2D2D2D] text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {markets.map((market) => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>
    </div>
  )
}
