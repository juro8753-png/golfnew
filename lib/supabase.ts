import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const noStoreOptions = {
  global: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, { ...init, cache: 'no-store' }),
  },
}

export const supabase = createClient(url, anon, noStoreOptions)

export const supabaseAdmin = createClient(
  url,
  process.env.SUPABASE_SERVICE_ROLE_KEY || anon,
  noStoreOptions
)
