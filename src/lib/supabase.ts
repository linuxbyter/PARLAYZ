import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const hasKeys = supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20

export const supabase = hasKeys
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseReady = hasKeys
