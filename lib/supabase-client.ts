import { createClient } from "@supabase/supabase-js"

// Define types for better type safety
type SupabaseClient = ReturnType<typeof createClient>

// Global variables to store client instances
let browserClient: SupabaseClient | null = null
const serverClient: SupabaseClient | null = null

// Function to get and validate Supabase credentials
function getSupabaseCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or anonymous key is missing from environment variables")
  }

  return { supabaseUrl, supabaseAnonKey }
}

// Get server-side credentials
function getServerCredentials() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL or service role key is missing from environment variables")
  }

  return { supabaseUrl, supabaseServiceKey }
}

// Create browser client (for client-side use)
export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient

  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials()

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: "supabase-auth", // Consistent storage key
    },
  })

  return browserClient
}

// Create server client (for server-side use with service role)
export function getSupabaseServer(): SupabaseClient {
  // Always create a new instance on the server to avoid sharing state between requests
  if (typeof window === "undefined") {
    const { supabaseUrl, supabaseServiceKey } = getServerCredentials()

    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    })
  }

  // If called from the client, use the browser client
  return getSupabaseBrowser()
}

// Export a default client for backward compatibility
export const supabase = typeof window === "undefined" ? getSupabaseServer() : getSupabaseBrowser()

// Legacy function for backward compatibility
export function createSupabaseClient() {
  return typeof window === "undefined" ? getSupabaseServer() : getSupabaseBrowser()
}
