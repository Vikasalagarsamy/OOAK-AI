import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/types/database.types"

// Create a singleton Supabase client
let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createClient() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    supabaseInstance = createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    })
  }

  return supabaseInstance
}

// Define types for better type safety
type SupabaseClient = ReturnType<typeof createSupabaseClient<Database>>

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
function createSupabaseClientOld(): SupabaseClient {
  if (clientSingleton) {
    return clientSingleton
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials()

  // Create a new client with explicit configuration
  clientSingleton = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: "app-supabase-auth",
    },
  })

  return clientSingleton
}

// Export a singleton instance
export const supabase = createClient()

// Server-side Supabase client (uses service role key)
export function createServiceClient() {
  // Use environment variables with fallbacks
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Log available keys for debugging (remove in production)
  console.log("Available env vars:", {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
  })

  // Use anon key as fallback if service key is not available
  if (!supabaseUrl) {
    console.error("Supabase URL is missing from environment variables")
    // Return a mock client that won't throw errors but won't work either
    return createMockClient()
  }

  if (!supabaseServiceKey) {
    console.warn("Supabase service role key is missing, falling back to anon key")
    // Continue with anon key as fallback
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey || "", {
    auth: {
      persistSession: false,
    },
  })
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
  } as unknown as SupabaseClient
}

// IMPORTANT: Export createClient for backward compatibility
// This is the function used by employee-actions.ts and other services
export function createClientOld() {
  try {
    return createServiceClient()
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    return createMockClient()
  }
}

// Also export the original createClient from supabase for maximum compatibility
export const originalCreateClient = createSupabaseClient
