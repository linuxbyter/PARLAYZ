import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://blwczecyysitydcdwghj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2N6ZWN5eXNpdHlkY2R3Z2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjcxMTksImV4cCI6MjA4NzUwMzExOX0.bQfbmkdWEeLz7SSdboKi4SWmSppifuu5Auc9BpnRyUw'

export const supabase = createClient(supabaseUrl, supabaseKey)
