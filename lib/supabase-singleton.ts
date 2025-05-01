import { createClient } from "@supabase/supabase-js"

// Define types for better type safety
type SupabaseClient = ReturnType<typeof createClient>

// Global variable to store the client instance (browser-only)
let browserClientSingleton: SupabaseClient | null = null

// Get environment variables with validation
function getSupabaseCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or anonymous key is missing from environment variables")
  }

  return { supabaseUrl, supabaseAnonKey }
}

// Create the Supabase client singleton for browser
export function getSupabaseClient(): SupabaseClient {
  // For server-side rendering, always create a new client
  // This is safe because server context doesn't persist between requests
  if (typeof window === "undefined") {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials()
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  }

  // For client-side, maintain a singleton
  if (browserClientSingleton) {
    return browserClientSingleton
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials()

  // Create a new client if one doesn't exist
  browserClientSingleton = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      // Use a consistent storage key to avoid the warning
      storageKey: "supabase-auth-token",
    },
  })

  return browserClientSingleton
}

// Export a singleton instance
export const supabase = getSupabaseClient()
