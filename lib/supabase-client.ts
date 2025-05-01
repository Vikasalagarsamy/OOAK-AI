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

  // Override auth methods to always return a mock authenticated user
  const originalGetUser = browserClient.auth.getUser
  browserClient.auth.getUser = async () => {
    // Return a mock authenticated user
    return {
      data: {
        user: {
          id: "00000000-0000-0000-0000-000000000000",
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
          role: "authenticated",
          email: "admin@example.com",
        },
      },
      error: null,
    }
  }

  // Override getSession to always return a mock session
  const originalGetSession = browserClient.auth.getSession
  browserClient.auth.getSession = async () => {
    // Return a mock session
    return {
      data: {
        session: {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_in: 3600,
          expires_at: new Date().getTime() + 3600000,
          token_type: "bearer",
          user: {
            id: "00000000-0000-0000-0000-000000000000",
            app_metadata: {},
            user_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
            role: "authenticated",
            email: "admin@example.com",
          },
        },
      },
      error: null,
    }
  }

  return browserClient
}

// Create server client (for server-side use with service role)
export function getSupabaseServer(): SupabaseClient {
  // Always create a new instance on the server to avoid sharing state between requests
  if (typeof window === "undefined") {
    const { supabaseUrl, supabaseServiceKey } = getServerCredentials()

    const client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    })

    // No need to override auth methods for server client as we're bypassing auth checks at the middleware level

    return client
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
