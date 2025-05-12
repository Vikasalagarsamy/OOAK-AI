import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Define types for better type safety
type SupabaseClient = ReturnType<typeof createSupabaseClient>

// Global variables to store client instances
let browserClient: SupabaseClient | null = null
const serverClient: SupabaseClient | null = null

// Create a singleton instance
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

// Function to get and validate Supabase credentials
function getSupabaseCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase credentials:", { supabaseUrl, supabaseAnonKey })
    throw new Error("Supabase URL or anonymous key is missing from environment variables")
  }

  return { supabaseUrl, supabaseAnonKey }
}

// Get server-side credentials
function getServerCredentials() {
  // For server-side, prefer service role key but fall back to anon key if not available
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing server Supabase credentials:", { supabaseUrl, hasServiceKey: !!supabaseServiceKey })
    throw new Error("Supabase URL or key is missing from environment variables")
  }

  return { supabaseUrl, supabaseServiceKey }
}

// Create browser client (for client-side use)
export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient

  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials()
    console.log("Creating browser Supabase client with URL:", supabaseUrl)

    // Use the imported supabaseCreateClient directly
    browserClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })

    return browserClient
  } catch (error) {
    console.error("Error creating browser Supabase client:", error)
    throw error
  }
}

// Create server client (for server-side use with service role)
export function getSupabaseServer(): SupabaseClient {
  try {
    // Always create a new instance on the server to avoid sharing state between requests
    if (typeof window === "undefined") {
      const { supabaseUrl, supabaseServiceKey } = getServerCredentials()
      console.log("Creating server Supabase client with URL:", supabaseUrl)

      // Use the imported supabaseCreateClient directly
      return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    }

    // If called from the client, use the browser client
    return getSupabaseBrowser()
  } catch (error) {
    console.error("Error creating server Supabase client:", error)
    throw error
  }
}

// Create a basic client without authentication overrides
export function createBasicClient(): SupabaseClient {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials()
    console.log("Creating basic Supabase client with URL:", supabaseUrl)

    // Create a simple client without auth overrides
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  } catch (error) {
    console.error("Error creating basic Supabase client:", error)
    throw error
  }
}

// Export a default client for backward compatibility
export const supabase = typeof window === "undefined" ? getSupabaseServer() : getSupabaseBrowser()

// Legacy function for backward compatibility
export function createClient() {
  // For server-side use a basic client without auth overrides to avoid JWT issues
  if (typeof window === "undefined") {
    return createBasicClient()
  }

  // For client-side use the browser client
  return getSupabaseBrowser()
}

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  supabaseClient = createSupabaseClient(supabaseUrl, supabaseKey)
  return supabaseClient
}
