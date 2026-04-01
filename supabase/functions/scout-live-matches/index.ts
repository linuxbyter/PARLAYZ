// supabase/functions/scout-live-matches/index.ts
// Scouts live and upcoming football matches from football-data.org API
// Creates markets for Premier League, La Liga, Champions League, FKF

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FOOTBALL_API_KEY = Deno.env.get('FOOTBALL_DATA_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const COMPETITIONS = [
  { id: 'PL', name: 'Premier League' },
  { id: 'PD', name: 'La Liga' },
  { id: 'CL', name: 'Champions League' },
  { id: 'FKF', name: 'FKF Premier League' },
]

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  try {
    let totalCreated = 0
    let totalSkipped = 0

    for (const comp of COMPETITIONS) {
      try {
        const url = `https://api.football-data.org/v4/competitions/${comp.id}/matches?dateFrom=${new Date().toISOString().split('T')[0]}&dateTo=${new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}`

        const resp = await fetch(url, {
          headers: { 'X-Auth-Token': FOOTBALL_API_KEY || '' },
        })

        if (!resp.ok) {
          console.warn(`Failed to fetch ${comp.name}: ${resp.status}`)
          continue
        }

        const data = await resp.json()
        const matches = data.matches || []

        for (const match of matches) {
          const externalId = `football_${match.id}`

          // Check if market already exists
          const { data: existing } = await supabase
            .from('events')
            .select('id')
            .eq('external_id', externalId)
            .single()

          if (existing) {
            totalSkipped++
            continue
          }

          const homeTeam = match.homeTeam?.name || 'Home'
          const awayTeam = match.awayTeam?.name || 'Away'
          const kickoffTime = new Date(match.utcDate)

          // Lock at kickoff, resolve 2 hours after
          const locksAt = kickoffTime.toISOString()
          const resolvesAt = new Date(kickoffTime.getTime() + 2 * 3600000).toISOString()

          const { error } = await supabase.from('events').insert({
            title: `${homeTeam} vs ${awayTeam} — Match Result (${comp.name})`,
            description: `Will ${homeTeam} beat ${awayTeam}? Market resolves based on the official full-time result. Source: football-data.org. RESOLUTION: Admin manually settles after the final whistle. EDGE CASE: If the match is postponed, the market is voided and all stakes refunded.`,
            category: 'Sports_Football',
            outcomes: [`${homeTeam} Win or Draw`, `${awayTeam} Win`],
            locks_at: locksAt,
            closes_at: resolvesAt,
            resolved: false,
            external_id: externalId,
            settlement_source: 'Admin Manual',
            created_at: new Date().toISOString(),
          })

          if (error) {
            console.error(`Failed to create market for ${homeTeam} vs ${awayTeam}:`, error)
          } else {
            totalCreated++
            console.log(`Created market: ${homeTeam} vs ${awayTeam}`)
          }
        }
      } catch (e) {
        console.error(`Error fetching ${comp.name}:`, e)
      }
    }

    return new Response(
      JSON.stringify({ success: true, created: totalCreated, skipped: totalSkipped }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
