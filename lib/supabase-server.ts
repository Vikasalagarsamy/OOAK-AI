import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Create a Supabase client for server-side operations
export function createClient() {
  const cookieStore = cookies()

  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "", {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })

  return client
}

// Export a singleton instance as 'supabase' to fix the missing export error
export const supabase = createClient()
