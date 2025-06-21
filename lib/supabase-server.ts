import { createClient } from '@/lib/postgresql-client-unified'
import type { Database } from "@/types/database"

// Server-side Supabase client with service role key
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Export the direct client for convenience
export const supabase = createServerSupabaseClient()

// Export createClient as alias to fix import errors
export { createServerSupabaseClient as createClient }
