import { createBrowserClient } from "@supabase/ssr"

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowser() {
  if (browserClient) {
    return browserClient
  }

  browserClient = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Override auth methods to always return a mock authenticated user
  const originalGetUser = browserClient.auth.getUser
  browserClient.auth.getUser = async () => {
    // Return a mock authenticated user
    return {
      data: {
        user: {
          id: "00000000-0000-0000-0000-000000000000",
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
          role: "authenticated",
          email: "admin@example.com",
        },
      },
      error: null,
    }
  }

  // Override getSession to always return a mock session
  const originalGetSession = browserClient.auth.getSession
  browserClient.auth.getSession = async () => {
    // Return a mock session
    return {
      data: {
        session: {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_in: 3600,
          expires_at: new Date().getTime() + 3600000,
          token_type: "bearer",
          user: {
            id: "00000000-0000-0000-0000-000000000000",
            app_metadata: {},
            user_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
            role: "authenticated",
            email: "admin@example.com",
          },
        },
      },
      error: null,
    }
  }

  return browserClient
}
