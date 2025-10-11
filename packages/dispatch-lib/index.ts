import { createClient as createSupabaseClient, SupabaseClient, type SupportedStorage } from '@supabase/supabase-js';
import { SupabaseAuthClient } from '@supabase/supabase-js/dist/module/lib/SupabaseAuthClient';

interface SupabaseClientOptions {
	url: string,
	anonymousKey: string,
	storage?: SupportedStorage
}

interface DispatchClientOptions {
	supabaseClientConfig: SupabaseClientOptions,
}

class DispatchAuthClient extends SupabaseAuthClient {

}

export class DispatchClient {

	private supabase: SupabaseClient
	auth: SupabaseAuthClient

	constructor({ supabaseClientConfig }: DispatchClientOptions) {

		this.supabase = createSupabaseClient(
			supabaseClientConfig.url,
			supabaseClientConfig.anonymousKey,
			{
				auth: {
					storage: supabaseClientConfig.storage,
					autoRefreshToken: true,
					persistSession: true,
					detectSessionInUrl: false,
				}
			}
		)

		this.auth = this.supabase.auth as DispatchAuthClient

	}

}

export * from './id.ts'
