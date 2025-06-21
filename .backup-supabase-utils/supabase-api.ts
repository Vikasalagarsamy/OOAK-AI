import { createClient as createSupabaseClient } from "@/lib/postgresql-client-unified"

// Create a Supabase client for API routes
export function createApiClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  return createSupabaseClient(supabaseUrl, supabaseKey)
}

// Export createClient as a named export for compatibility
export { createApiClient as createClient }
