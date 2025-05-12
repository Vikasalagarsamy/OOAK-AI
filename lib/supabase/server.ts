import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create a Supabase client for server-side operations
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  return createSupabaseClient(supabaseUrl, supabaseKey)
}

// Export createClient as a named export for compatibility
export { createServerClient as createClient }
