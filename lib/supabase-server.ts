import { createClient as supabaseCreateClient } from "@supabase/supabase-js"

// Create a Supabase client for server-side operations with better error handling
export function createServerClient() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    // Log available environment variables for debugging
    console.log("Server client env vars:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
    })

    // Check if we have the required credentials
    if (!supabaseUrl || !supabaseKey) {
      console.warn("Missing Supabase server credentials, using mock client")
      return createMockClient()
    }

    return supabaseCreateClient(supabaseUrl, supabaseKey)
  } catch (error) {
    console.error("Error creating server client:", error)
    return createMockClient()
  }
}

// Create a mock client that won't throw errors
function createMockClient() {
  console.warn("Creating mock Supabase server client")

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
    // Add other methods as needed
  } as any
}

// Export createClient as a named export for compatibility
export function createClient() {
  return createServerClient()
}
