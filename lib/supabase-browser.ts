import { createClient } from "@supabase/supabase-js"

let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowser() {
  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables. Check your .env file.")
    // Return a dummy client that won't throw errors when methods are called
    return {
      from: () => ({
        select: () => ({
          order: () => ({
            then: () => Promise.resolve({ data: [], error: null }),
          }),
          eq: () => ({
            then: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    } as any
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  return supabaseInstance
}

export const supabase = getSupabaseBrowser()
