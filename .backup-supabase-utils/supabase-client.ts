import { createClient as createSupabaseClient } from "@/lib/postgresql-client-unified"
import type { Database } from "@/types/supabase"

// Global variables to store client instances
let browserClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

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

// Function to get server credentials
function getServerCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL or service role key is missing from environment variables")
  }

  return { supabaseUrl, supabaseServiceKey }
}

// Create browser client (for client-side use)
export function getSupabaseBrowser(): ReturnType<typeof createSupabaseClient<Database>> {
  if (browserClient) return browserClient

  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials()
    console.log("Creating browser Supabase client with URL:", supabaseUrl)

    browserClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'app-supabase-auth',
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })

    return browserClient
  } catch (error) {
    console.error("Error creating browser Supabase client:", error)
    throw error
  }
}

// Create server client (for server-side use with service role)
export function getSupabaseServer(): ReturnType<typeof createSupabaseClient<Database>> {
  try {
    // Always create a new instance on the server to avoid sharing state between requests
    if (typeof window === "undefined") {
      const { supabaseUrl, supabaseServiceKey } = getServerCredentials()
      console.log("Creating server Supabase client with URL:", supabaseUrl)

      return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
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
export function createBasicClient(): ReturnType<typeof createSupabaseClient<Database>> {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials()
    console.log("Creating basic Supabase client with URL:", supabaseUrl)

    // Create a simple client without auth overrides
    return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
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

// Create a mock client that won't throw errors
function createMockClient() {
  return {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => ({
            then: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
    insert: () => Promise.resolve({ data: null, error: new Error("Mock client - no connection") }),
    update: () => Promise.resolve({ data: null, error: new Error("Mock client - no connection") }),
    delete: () => Promise.resolve({ data: null, error: new Error("Mock client - no connection") }),
  } as unknown as ReturnType<typeof createSupabaseClient<Database>>
}

// Export a default client instance
export const supabase = getSupabaseBrowser()

// IMPORTANT: Export createClient for backward compatibility
// This is the function used by dashboard-service.ts and other services
export function createClient() {
  // For server-side use a basic client without auth overrides to avoid JWT issues
  if (typeof window === "undefined") {
    return createBasicClient()
  }

  // For client-side use the browser client
  return getSupabaseBrowser()
}

// Also export the original createClient from supabase for maximum compatibility
export const originalCreateClient = createSupabaseClient

// Create a singleton Supabase client for client-side usage
let supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

export const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}
