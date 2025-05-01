import { createClient as supabaseCreateClient } from "@supabase/supabase-js"

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
    },
  })

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

  return supabaseCreateClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  })
}

// IMPORTANT: Export createClient for backward compatibility
// This is the function used by dashboard-service.ts and other services
export function createClient() {
  return createServiceClient()
}

// Also export the original createClient from supabase for maximum compatibility
export const originalCreateClient = supabaseCreateClient
