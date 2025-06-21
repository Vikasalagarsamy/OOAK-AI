import { createClient as createSupabaseClient } from "@/lib/postgresql-client-unified"
import type { Database } from "@/types/supabase"

// Create a singleton to prevent multiple instances
let supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createBrowserClient() {
  if (supabaseClient) return supabaseClient

  // Determine if we're accessing through the tunnel
  const isUsingTunnel = typeof window !== 'undefined' && 
    (window.location.hostname === 'portal.ooak.photography' || 
     window.location.hostname.includes('.trycloudflare.com'))

  // Choose Supabase URL based on access method
  let supabaseUrl: string
  let supabaseKey: string

  if (isUsingTunnel) {
    // For tunnel access, use our proxy API
    supabaseUrl = `${window.location.origin}/api/supabase-proxy`
    supabaseKey = 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY' // Local Supabase demo key
    console.log('🌉 Using Supabase proxy for tunnel access:', supabaseUrl)
  } else {
    // For local access, use direct connection or environment variables
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
    supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY'
    console.log('🏠 Using direct Supabase connection:', supabaseUrl)
  }

  // Create a new client if one doesn't exist
  supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      storageKey: 'app-supabase-auth',
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  })

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
