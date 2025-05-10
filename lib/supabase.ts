import { createClient as supabaseCreateClient } from "@supabase/supabase-js"

// Define types for better type safety
type SupabaseClient = ReturnType<typeof supabaseCreateClient>

// Global variable to store the client instance
let clientSingleton: SupabaseClient | null = null

// Function to get the Supabase URL and key with better error handling
function getSupabaseCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  // Log available environment variables for debugging
  console.log("Environment variables check:", {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    nodeEnv: process.env.NODE_ENV,
  })

  // Return what we have, even if empty - we'll handle this later
  return { supabaseUrl, supabaseAnonKey }
}

// Create a mock client that won't throw errors
function createMockClient() {
  console.warn("Creating mock Supabase client due to missing credentials")

  return {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => ({
            then: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
      insert: () => Promise.resolve({ data: null, error: new Error("Mock client - no connection") }),
      update: () => Promise.resolve({ data: null, error: new Error("Mock client - no connection") }),
      delete: () => Promise.resolve({ data: null, error: new Error("Mock client - no connection") }),
    }),
    rpc: () => Promise.resolve({ data: null, error: new Error("Mock client - no connection") }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    },
    // Add other methods as needed
  } as unknown as SupabaseClient
}

// Create the Supabase client singleton with better error handling
function createSupabaseClient(): SupabaseClient {
  if (clientSingleton) {
    return clientSingleton
  }

  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials()

    // Check if we have the required credentials
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Missing Supabase credentials, using mock client")
      return createMockClient()
    }

    // Create a new client with explicit configuration
    clientSingleton = supabaseCreateClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: "app-supabase-auth",
      },
    })

    return clientSingleton
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    return createMockClient()
  }
}

// Export a singleton instance
export const supabase = createSupabaseClient()

// Server-side Supabase client (uses service role key)
export function createServiceClient() {
  try {
    // Use environment variables with fallbacks
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ""

    // Log available keys for debugging
    console.log("Available env vars for service client:", {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
    })

    // Check if we have the required credentials
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Missing Supabase service credentials, using mock client")
      return createMockClient()
    }

    return supabaseCreateClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    })
  } catch (error) {
    console.error("Error creating Supabase service client:", error)
    return createMockClient()
  }
}

// IMPORTANT: Export createClient for backward compatibility
export function createClient() {
  try {
    // For server-side, use the service client
    if (typeof window === "undefined") {
      return createServiceClient()
    }

    // For client-side, use the singleton client
    return createSupabaseClient()
  } catch (error) {
    console.error("Error in createClient:", error)
    return createMockClient()
  }
}

// Also export the original createClient from supabase for maximum compatibility
export const originalCreateClient = supabaseCreateClient
