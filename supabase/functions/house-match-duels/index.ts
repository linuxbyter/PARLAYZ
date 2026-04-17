// supabase/functions/house-match-duels/index.ts
// Run this as an edge function to match unmatched duels at lock time
// Schedule via pg_cron or call manually

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  try {
    const { market_id } = await req.json()

    if (!market_id) {
      return new Response(
        JSON.stringify({ error: 'market_id required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Call the house_match_duels function
    const { data, error } = await supabase.rpc('house_match_duels', {
      p_market_id: market_id,
    })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, matched: data }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
