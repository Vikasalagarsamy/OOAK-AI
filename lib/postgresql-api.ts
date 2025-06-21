import { query, transaction } from "@/lib/postgresql-client"

// PostgreSQL API client for API routes (replaces Supabase API client)
export function createApiClient() {
  return {
    // Query function for API routes
    query: async (sql: string, params?: any[]) => {
      console.log('🔍 PostgreSQL API Query:', sql.substring(0, 100) + '...')
      return await query(sql, params)
    },

    // Transaction function for API routes
    transaction: async (callback: (queryFn: typeof query) => Promise<any>) => {
      console.log('🔄 PostgreSQL API Transaction')
      return await transaction(callback)
    },

    // Helper methods for common operations
    from: (tableName: string) => ({
      select: (columns = '*') => ({
        execute: async (where?: string, params?: any[]) => {
          const whereClause = where ? ` WHERE ${where}` : ''
          const sql = `SELECT ${columns} FROM ${tableName}${whereClause}`
          return await query(sql, params)
        }
      }),
      insert: (data: Record<string, any>) => ({
        execute: async () => {
          const columns = Object.keys(data).join(', ')
          const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ')
          const values = Object.values(data)
          const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`
          return await query(sql, values)
        }
      }),
      update: (data: Record<string, any>) => ({
        eq: (column: string, value: any) => ({
          execute: async () => {
            const setClause = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ')
            const values = [...Object.values(data), value]
            const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${column} = $${values.length} RETURNING *`
            return await query(sql, values)
          }
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          execute: async () => {
            const sql = `DELETE FROM ${tableName} WHERE ${column} = $1 RETURNING *`
            return await query(sql, [value])
          }
        })
      })
    }),

    // RPC function replacement
    rpc: async (functionName: string, params: Record<string, any>) => {
      console.log(`🔧 PostgreSQL RPC Call: ${functionName}`)
      
      // Handle common RPC calls
      if (functionName === 'execute_sql') {
        const sql = params.sql_statement || params.sql
        return await query(sql)
      }
      
      // Generic stored procedure call
      const paramKeys = Object.keys(params)
      const paramValues = Object.values(params)
      const paramPlaceholders = paramKeys.map((_, i) => `$${i + 1}`).join(', ')
      
      const sql = `SELECT * FROM ${functionName}(${paramPlaceholders})`
      return await query(sql, paramValues)
    }
  }
}

// Export createClient as a named export for compatibility
export { createApiClient as createClient }
