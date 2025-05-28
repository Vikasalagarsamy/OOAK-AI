import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create a Supabase client for server-side operations
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  )
}

// Export the direct client for convenience
export const supabase = createClient()
