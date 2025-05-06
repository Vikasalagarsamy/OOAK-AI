import { createBrowserClient } from "@supabase/ssr"

// Create a singleton to prevent multiple instances
let supabaseClient: any = null

export function createClient() {
  if (supabaseClient) return supabaseClient

  // Create a new client if one doesn't exist
  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  return supabaseClient
}

// Keep the original function for backward compatibility
export function getSupabaseBrowser() {
  return createClient()
}
