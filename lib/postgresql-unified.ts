import { query, transaction } from "@/lib/postgresql-client"

// Get environment variables with fallbacks (compatibility layer)
function getSupabaseConfig() {
  console.log('🔧 PostgreSQL config (compatibility mode)')
  return { 
    supabaseUrl: 'postgresql://localhost:5432', 
    supabaseAnonKey: 'mock-key-for-compatibility' 
  }
}

// Create a singleton PostgreSQL client (replaces old database client)
let supabaseInstance: any = null

export function createClient() {
  if (!supabaseInstance) {
    try {
      supabaseInstance = {
        // Core query and transaction functions
        query: async (sql: string, params?: any[]) => {
          console.log('🔗 PostgreSQL Unified Main Query:', sql.substring(0, 80) + '...')
          return await query(sql, params)
        },

        transaction: async (callback: (queryFn: typeof query) => Promise<any>) => {
          console.log('🔗 PostgreSQL Unified Main Transaction')
          return await transaction(callback)
        },

        // Full Supabase-compatible API
        from: (tableName: string) => ({
          select: (columns = '*') => ({
            eq: (column: string, value: any) => ({
              single: async () => {
                const sql = `SELECT ${columns} FROM ${tableName} WHERE ${column} = $1 LIMIT 1`
                const result = await query(sql, [value])
                return { data: result.data?.[0] || null, error: result.success ? null : result.error }
              },
              then: async (resolve: any) => {
                const sql = `SELECT ${columns} FROM ${tableName} WHERE ${column} = $1`
                const result = await query(sql, [value])
                resolve({ data: result.data || [], error: result.success ? null : result.error })
              }
            }),
            order: (column: string, options?: { ascending?: boolean }) => ({
              then: async (resolve: any) => {
                const orderDir = options?.ascending === false ? 'DESC' : 'ASC'
                const sql = `SELECT ${columns} FROM ${tableName} ORDER BY ${column} ${orderDir}`
                const result = await query(sql)
                resolve({ data: result.data || [], error: result.success ? null : result.error })
              }
            }),
            then: async (resolve: any) => {
              const sql = `SELECT ${columns} FROM ${tableName}`
              const result = await query(sql)
              resolve({ data: result.data || [], error: result.success ? null : result.error })
            }
          }),

          insert: (data: Record<string, any> | Record<string, any>[]) => ({
            then: async (resolve: any) => {
              const isArray = Array.isArray(data)
              const records = isArray ? data : [data]
              
              if (records.length === 0) {
                resolve({ data: [], error: null })
                return
              }

              const keys = Object.keys(records[0])
              const placeholders = records.map((_, rowIndex) => 
                `(${keys.map((_, colIndex) => `$${rowIndex * keys.length + colIndex + 1}`).join(', ')})`
              ).join(', ')
              
              const values = records.flatMap(record => Object.values(record))
              const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES ${placeholders} RETURNING *`
              
              const result = await query(sql, values)
              resolve({ 
                data: isArray ? (result.data || []) : (result.data?.[0] || null), 
                error: result.success ? null : result.error 
              })
            }
          }),

          update: (data: Record<string, any>) => ({
            eq: (column: string, value: any) => ({
              then: async (resolve: any) => {
                const setClause = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ')
                const values = [...Object.values(data), value]
                const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${column} = $${values.length} RETURNING *`
                const result = await query(sql, values)
                resolve({ data: result.data || [], error: result.success ? null : result.error })
              }
            })
          }),

          delete: () => ({
            eq: (column: string, value: any) => ({
              then: async (resolve: any) => {
                const sql = `DELETE FROM ${tableName} WHERE ${column} = $1 RETURNING *`
                const result = await query(sql, [value])
                resolve({ data: result.data || [], error: result.success ? null : result.error })
              }
            })
          })
        }),

        // RPC function replacement
        rpc: async (functionName: string, params: Record<string, any> = {}) => {
          console.log(`🔗 PostgreSQL Unified RPC: ${functionName}`)
          
          if (functionName === 'execute_sql') {
            const sql = params.sql_statement || params.sql
            const result = await query(sql)
            return { data: result.data, error: result.success ? null : result.error }
          }
          
          const paramKeys = Object.keys(params)
          const paramValues = Object.values(params)
          
          if (paramKeys.length === 0) {
            const sql = `SELECT * FROM ${functionName}()`
            const result = await query(sql)
            return { data: result.data, error: result.success ? null : result.error }
          }
          
          const paramPlaceholders = paramKeys.map((_, i) => `$${i + 1}`).join(', ')
          const sql = `SELECT * FROM ${functionName}(${paramPlaceholders})`
          const result = await query(sql, paramValues)
          return { data: result.data, error: result.success ? null : result.error }
        }
      }

      console.log("✅ PostgreSQL unified client created successfully")
    } catch (error) {
      console.error("❌ Failed to create PostgreSQL unified client:", error)
      throw error
    }
  }

  return supabaseInstance
}

// Server-side PostgreSQL client
export function createServiceClient() {
  return createClient()
}

// Export a singleton instance
export const supabase = createClient()

// IMPORTANT: Export createClient for backward compatibility
export function createClientOld() {
  return createClient()
}

// Global variable to store the client instance
let clientSingleton: any = null

// Function to get the credentials (compatibility layer)
function getSupabaseCredentials() {
  return { 
    supabaseUrl: 'postgresql://localhost:5432', 
    supabaseAnonKey: 'mock-key-for-compatibility' 
  }
}

// Create the PostgreSQL client singleton
function createSupabaseClientOld() {
  if (clientSingleton) {
    return clientSingleton
  }

  clientSingleton = createClient()
  return clientSingleton
}

// Also export the original createClient for maximum compatibility
export const originalCreateClient = createClient
