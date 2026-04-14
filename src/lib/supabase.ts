import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabaseClient: SupabaseClient | null = null

if (typeof window !== 'undefined' && supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = supabaseClient
export const isSupabaseReady = !!supabaseClient
