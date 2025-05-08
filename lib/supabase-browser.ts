import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create a singleton to prevent multiple instances
let supabaseClient: any = null

export function createBrowserClient() {
  if (supabaseClient) return supabaseClient

  // Create a new client if one doesn't exist
  supabaseClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  return supabaseClient
}

// Keep the original function for backward compatibility
export function getSupabaseBrowser() {
  return createBrowserClient()
}

// Export createClient as a named export for compatibility
export function createClient() {
  return createBrowserClient()
}
