export interface MarketData {
  id: number;
  sport: "NFL" | "NBA" | "MLB" | "Soccer";
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  homeOddsML: number;
  awayOddsML: number;
  homeOddsSpread: number;
  awayOddsSpread: number;
  spreadLine: number;
  overOdds: number;
  underOdds: number;
  totalLine: number;
  homePublicPct: number;
  status: "open" | "live" | "closed";
  // Simulated line movement history (last 8 ticks)
  oddsHistory: number[];
}

export const MOCK_MARKETS: MarketData[] = [
  {
    id: 1,
    sport: "NFL",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Baltimore Ravens",
    commenceTime: new Date(Date.now() + 3600000 * 2).toISOString(),
    homeOddsML: -145,
    awayOddsML: +125,
    homeOddsSpread: -110,
    awayOddsSpread: -110,
    spreadLine: -3.5,
    overOdds: -112,
    underOdds: -108,
    totalLine: 47.5,
    homePublicPct: 62,
    status: "open",
    oddsHistory: [-130, -135, -138, -140, -142, -145, -143, -145],
  },
  {
    id: 2,
    sport: "NBA",
    homeTeam: "Boston Celtics",
    awayTeam: "Golden State Warriors",
    commenceTime: new Date(Date.now() + 3600000 * 4).toISOString(),
    homeOddsML: -180,
    awayOddsML: +155,
    homeOddsSpread: -110,
    awayOddsSpread: -110,
    spreadLine: -5.5,
    overOdds: -108,
    underOdds: -112,
    totalLine: 224.5,
    homePublicPct: 71,
    status: "live",
    oddsHistory: [-160, -165, -170, -168, -175, -178, -180, -180],
  },
  {
    id: 3,
    sport: "MLB",
    homeTeam: "New York Yankees",
    awayTeam: "Los Angeles Dodgers",
    commenceTime: new Date(Date.now() + 3600000 * 6).toISOString(),
    homeOddsML: +110,
    awayOddsML: -130,
    homeOddsSpread: -110,
    awayOddsSpread: -110,
    spreadLine: 1.5,
    overOdds: -115,
    underOdds: -105,
    totalLine: 8.5,
    homePublicPct: 44,
    status: "open",
    oddsHistory: [+120, +118, +115, +113, +112, +110, +111, +110],
  },
  {
    id: 4,
    sport: "Soccer",
    homeTeam: "Manchester City",
    awayTeam: "Arsenal",
    commenceTime: new Date(Date.now() + 3600000 * 8).toISOString(),
    homeOddsML: -120,
    awayOddsML: +280,
    homeOddsSpread: -110,
    awayOddsSpread: -110,
    spreadLine: -0.5,
    overOdds: -118,
    underOdds: -102,
    totalLine: 2.5,
    homePublicPct: 58,
    status: "open",
    oddsHistory: [-110, -112, -115, -118, -120, -119, -121, -120],
  },
  {
    id: 5,
    sport: "NFL",
    homeTeam: "San Francisco 49ers",
    awayTeam: "Dallas Cowboys",
    commenceTime: new Date(Date.now() + 3600000 * 10).toISOString(),
    homeOddsML: -165,
    awayOddsML: +140,
    homeOddsSpread: -110,
    awayOddsSpread: -110,
    spreadLine: -4.0,
    overOdds: -110,
    underOdds: -110,
    totalLine: 44.5,
    homePublicPct: 67,
    status: "open",
    oddsHistory: [-150, -155, -158, -160, -162, -163, -165, -165],
  },
  {
    id: 6,
    sport: "NBA",
    homeTeam: "Miami Heat",
    awayTeam: "Denver Nuggets",
    commenceTime: new Date(Date.now() + 3600000 * 12).toISOString(),
    homeOddsML: +135,
    awayOddsML: -155,
    homeOddsSpread: -110,
    awayOddsSpread: -110,
    spreadLine: 3.5,
    overOdds: -110,
    underOdds: -110,
    totalLine: 218.5,
    homePublicPct: 39,
    status: "open",
    oddsHistory: [+120, +122, +125, +128, +130, +133, +135, +135],
  },
  {
    id: 7,
    sport: "Soccer",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    commenceTime: new Date(Date.now() + 3600000 * 14).toISOString(),
    homeOddsML: -105,
    awayOddsML: +260,
    homeOddsSpread: -110,
    awayOddsSpread: -110,
    spreadLine: -0.5,
    overOdds: -120,
    underOdds: +100,
    totalLine: 2.5,
    homePublicPct: 52,
    status: "open",
    oddsHistory: [-95, -98, -100, -102, -104, -105, -105, -105],
  },
  {
    id: 8,
    sport: "MLB",
    homeTeam: "Houston Astros",
    awayTeam: "Atlanta Braves",
    commenceTime: new Date(Date.now() + 3600000 * 16).toISOString(),
    homeOddsML: -140,
    awayOddsML: +120,
    homeOddsSpread: -110,
    awayOddsSpread: -110,
    spreadLine: -1.5,
    overOdds: -108,
    underOdds: -112,
    totalLine: 9.0,
    homePublicPct: 55,
    status: "open",
    oddsHistory: [-130, -132, -135, -137, -138, -140, -139, -140],
  },
];

export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export function oddsToImpliedProb(odds: number): number {
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}
