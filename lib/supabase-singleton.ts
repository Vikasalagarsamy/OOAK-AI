import { createClient } from "@supabase/supabase-js"

// Check if we're running on the client side
const isClient = typeof window !== "undefined"

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  if (isClient) {
    console.error("Missing Supabase environment variables. Check your .env file.")
  } else {
    throw new Error("Missing Supabase environment variables. Check your .env file.")
  }
}

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "")
