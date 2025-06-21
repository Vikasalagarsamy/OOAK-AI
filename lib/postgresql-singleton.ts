import { query, transaction } from "@/lib/postgresql-client"

// PostgreSQL singleton (replaces supabase-singleton.ts)
type PostgreSQLClient = ReturnType<typeof createPostgreSQLClient>

let clientSingleton: PostgreSQLClient | null = null

function getSupabaseCredentials() {
  return { 
    supabaseUrl: 'postgresql://localhost:5432', 
    supabaseAnonKey: 'mock-key-for-compatibility' 
  }
}

function createPostgreSQLClient(): PostgreSQLClient {
  if (clientSingleton) {
    return clientSingleton
  }

  clientSingleton = {
    // Core functions
    query: async (sql: string, params?: any[]) => {
      console.log('🔄 PostgreSQL Singleton Query:', sql.substring(0, 60) + '...')
      return await query(sql, params)
    },

    transaction: async (callback: (queryFn: typeof query) => Promise<any>) => {
      console.log('🔄 PostgreSQL Singleton Transaction')
      return await transaction(callback)
    },

    // Auth mock methods
    auth: {
      getUser: async () => ({
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
      }),
      getSession: async () => ({
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
      })
    },

    // Supabase-compatible from() method
    from: (tableName: string) => ({
      select: (columns = '*') => ({
        then: async (resolve: any) => {
          const sql = `SELECT ${columns} FROM ${tableName}`
          const result = await query(sql)
          resolve({ data: result.data || [], error: result.success ? null : result.error })
        }
      }),
      insert: (data: Record<string, any>) => ({
        then: async (resolve: any) => {
          const columns = Object.keys(data).join(', ')
          const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ')
          const values = Object.values(data)
          const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`
          const result = await query(sql, values)
          resolve({ data: result.data?.[0] || null, error: result.success ? null : result.error })
        }
      })
    })
  }

  return clientSingleton
}

// Export a singleton instance
export const supabase = createPostgreSQLClient()

// Server-side PostgreSQL client
export function createServiceClient() {
  return createPostgreSQLClient()
}

// Main createClient function for backward compatibility
let supabaseClient: any = null

export function createClient() {
  if (!supabaseClient) {
    supabaseClient = createPostgreSQLClient()
  }
  return supabaseClient
}

// Also export the original createClient for maximum compatibility
export const originalCreateClient = createPostgreSQLClient

// Create a singleton to prevent multiple instances
let supabaseClientOld: any = null

export function createSingletonClient() {
  if (supabaseClientOld) return supabaseClientOld
  supabaseClientOld = createPostgreSQLClient()
  return supabaseClientOld
}
