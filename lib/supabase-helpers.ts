import { createClient } from "./supabase-server"

// Use this in API routes and server actions to get a client with cookie support
export function getSupabaseServerClient() {
  try {
    return createClient()
  } catch (error) {
    console.error("Error creating Supabase client with cookies:", error)
    // Fallback to a client without cookie support
    return createSupabaseClientWithoutCookies()
  }
}

// Create a client without cookies for fallback
function createSupabaseClientWithoutCookies() {
  const { createClient } = require("@supabase/supabase-js")
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "")
}

// Helper to safely get a server client in any context
export function safeGetSupabaseClient() {
  try {
    return getSupabaseServerClient()
  } catch (error) {
    return createSupabaseClientWithoutCookies()
  }
}
