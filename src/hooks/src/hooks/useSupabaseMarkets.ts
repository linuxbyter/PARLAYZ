'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface SupabaseMarket {
  id: string
  title: string
  category: string
  status: string
  yes_probability: number
  no_probability: number
  resolution_criteria: string
  resolution_source: string
  total_volume: number
  locks_at: string
  resolves_at: string
  resolved_outcome: string | null
  is_featured: boolean
  created_at: string
}

export function useSupabaseMarkets(category?: string) {
  const [markets, setMarkets] = useState<SupabaseMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMarkets()
  }, [category])

  const fetchMarkets = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('markets')
        .select('*')
        .in('status', ['open', 'locked'])
        .order('created_at', { ascending: false })

      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error
      setMarkets(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Supabase markets error:', err)
    } finally {
      setLoading(false)
    }
  }

  return { markets, loading, error, refetch: fetchMarkets }
}
