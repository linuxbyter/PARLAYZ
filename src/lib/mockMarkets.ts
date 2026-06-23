export interface MarketData {
  id: number
  sport: string
  homeTeam: string
  awayTeam: string
  homeOdds: number
  awayOdds: number
  league: string
  status: "live" | "pregame" | "finished"
  startTime: string
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
    sport: "World Cup",
    homeTeam: "Brazil",
    awayTeam: "Argentina",
    homeOdds: 120,
    awayOdds: 200,
    league: "Group A",
    status: "live",
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    sport: "World Cup",
    homeTeam: "France",
    awayTeam: "England",
    homeOdds: -130,
    awayOdds: 110,
    league: "Group B",
    status: "live",
    startTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    sport: "World Cup",
    homeTeam: "Germany",
    awayTeam: "Spain",
    homeOdds: 150,
    awayOdds: -120,
    league: "Group C",
    status: "pregame",
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    sport: "World Cup",
    homeTeam: "Portugal",
    awayTeam: "Netherlands",
    homeOdds: -110,
    awayOdds: -110,
    league: "Group D",
    status: "pregame",
    startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    sport: "EPL",
    homeTeam: "Manchester City",
    awayTeam: "Arsenal",
    homeOdds: -200,
    awayOdds: 170,
    league: "Premier League",
    status: "pregame",
    startTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 6,
    sport: "NBA",
    homeTeam: "Boston Celtics",
    awayTeam: "Los Angeles Lakers",
    homeOdds: -250,
    awayOdds: 200,
    league: "NBA Finals",
    status: "live",
    startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  },
]
