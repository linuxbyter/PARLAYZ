export interface MarketData {
  id: number
  sport: string
  homeTeam: string
  awayTeam: string
  homeOddsML: number
  awayOddsML: number
  spread: number
  total: number
  status: "live" | "pregame" | "finished"
  startTime: string
  oddsHistory: number[]
}

export function formatOdds(odds: number): string {
  if (odds > 0) return `+${odds}`
  return odds.toString()
}

export function oddsToDecimal(odds: number): number {
  if (odds > 0) return odds / 100 + 1
  return 100 / Math.abs(odds) + 1
}

export const MOCK_MARKETS: MarketData[] = [
  {
    id: 1,
    sport: "NFL",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Buffalo Bills",
    homeOddsML: -150,
    awayOddsML: 130,
    spread: -3.5,
    total: 48.5,
    status: "live",
    startTime: "LIVE",
    oddsHistory: [-150, -148, -152, -145, -150],
  },
  {
    id: 2,
    sport: "NBA",
    homeTeam: "Los Angeles Lakers",
    awayTeam: "Boston Celtics",
    homeOddsML: 110,
    awayOddsML: -130,
    spread: 1.5,
    total: 225.5,
    status: "live",
    startTime: "LIVE",
    oddsHistory: [110, 115, 105, 112, 110],
  },
  {
    id: 3,
    sport: "MLB",
    homeTeam: "New York Yankees",
    awayTeam: "Los Angeles Dodgers",
    homeOddsML: -120,
    awayOddsML: 100,
    spread: -1.5,
    total: 8.5,
    status: "pregame",
    startTime: "7:05 PM ET",
    oddsHistory: [-120, -120, -120, -120, -120],
  },
  {
    id: 4,
    sport: "Soccer",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    homeOddsML: 140,
    awayOddsML: 180,
    spread: 0,
    total: 3.5,
    status: "live",
    startTime: "LIVE",
    oddsHistory: [140, 145, 138, 142, 140],
  },
  {
    id: 5,
    sport: "NFL",
    homeTeam: "Dallas Cowboys",
    awayTeam: "Philadelphia Eagles",
    homeOddsML: -105,
    awayOddsML: -115,
    spread: 0,
    total: 48,
    status: "pregame",
    startTime: "8:20 PM ET",
    oddsHistory: [-105, -105, -105, -105, -105],
  },
  {
    id: 6,
    sport: "NBA",
    homeTeam: "Golden State Warriors",
    awayTeam: "Phoenix Suns",
    homeOddsML: -200,
    awayOddsML: 170,
    spread: -5.5,
    total: 232,
    status: "pregame",
    startTime: "10:30 PM ET",
    oddsHistory: [-200, -200, -200, -200, -200],
  },
]
