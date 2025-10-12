import { initDispatchClient } from 'dispatch-lib'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('Missing Supabase environment variables')
}

export const dipatch = initDispatchClient({
	supabaseClientConfig: {
		url: supabaseUrl,
		anonymousKey: supabaseAnonKey,
		detectSessionInUrl: true
	}
})
