import { initDispatchClient } from 'dispatch-lib'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const dispatch = initDispatchClient({
  supabaseClientConfig: {
    url: supabaseUrl,
    anonymousKey: supabaseAnonKey,
    detectSessionInUrl: true,
  },
})
