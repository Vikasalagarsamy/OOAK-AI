import { createClient as supabaseCreateClient } from "@/lib/postgresql-client-unified"

// Define types for better type safety
type SupabaseClient = ReturnType<typeof supabaseCreateClient>

// Global variable to store the client instance
let clientSingleton: SupabaseClient | null = null

// Function to get the Supabase URL and key
function getSupabaseCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or anonymous key is missing from environment variables")
  }

  return { supabaseUrl, supabaseAnonKey }
}

// Create the Supabase client singleton
function createSupabaseClient(): SupabaseClient {
  if (clientSingleton) {
    return clientSingleton
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials()

  // Create a new client with explicit configuration
  clientSingleton = supabaseCreateClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: "app-supabase-auth",
      // Override auth methods to simulate an authenticated user
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  // Override auth methods to always return a mock authenticated user
  const originalGetUser = clientSingleton.auth.getUser
  clientSingleton.auth.getUser = async () => {
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
  const originalGetSession = clientSingleton.auth.getSession
  clientSingleton.auth.getSession = async () => {
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

  return clientSingleton
}

// Export a singleton instance
export const supabase = createSupabaseClient()

// Server-side Supabase client (uses service role key)
export function createServiceClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL or service role key is missing from environment variables")
  }

  const client = supabaseCreateClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  })

  return client
}

// IMPORTANT: Export createClient for backward compatibility
// This is the function used by dashboard-service.ts and other services
// Create a singleton Supabase client
let supabaseClient: ReturnType<typeof supabaseCreateClient> | null = null

export function createClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL and anon key must be provided")
    }

    supabaseClient = supabaseCreateClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }

  return supabaseClient
}

// Also export the original createClient from database client for maximum compatibility
export const originalCreateClient = supabaseCreateClient

// Create a singleton to prevent multiple instances
let supabaseClientOld: any = null

export function createSingletonClient() {
  if (supabaseClientOld) return supabaseClientOld

  // Create a new client if one doesn't exist
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  supabaseClientOld = supabaseCreateClient(supabaseUrl, supabaseKey)

  return supabaseClientOld
}
