import { createClient as createSupabaseClient } from "@/lib/postgresql-client-unified"
import { type Database } from "@/types/database"
import { cookies } from "next/headers"

// Get environment variables with fallbacks
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  
  console.log('🔧 Supabase config check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING',
    keyPreview: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING'
  })
  
  if (!supabaseUrl) {
    throw new Error('❌ NEXT_PUBLIC_SUPABASE_URL is missing from environment variables')
  }
  
  if (!supabaseAnonKey) {
    throw new Error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing from environment variables')
  }
  
  return { supabaseUrl, supabaseAnonKey }
}

// Create a singleton Supabase client
let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createClient() {
  if (!supabaseInstance) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase environment variables")
      }

      supabaseInstance = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          storageKey: 'app-supabase-auth',
          storage: typeof window !== "undefined" ? window.localStorage : undefined,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
        },
      })

      console.log("✅ Supabase client created successfully")
    } catch (error) {
      console.error("❌ Failed to create Supabase client:", error)
      throw error
    }
  }

  return supabaseInstance
}

// Server-side Supabase client (uses service role key when available)
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
  })
}

// Export a singleton instance
export const supabase = createClient()

// IMPORTANT: Export createClient for backward compatibility
export function createClientOld() {
  try {
    return createServiceClient()
  } catch (error) {
    console.error("Error creating Supabase service client:", error)
    // Fallback to regular client
    return createClient()
  }
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
  clientSingleton = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: "app-supabase-auth",
    },
  })

  return clientSingleton
}

// Also export the original createClient from database client for maximum compatibility
export const originalCreateClient = createSupabaseClient
