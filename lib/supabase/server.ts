import { query, transaction } from "@/lib/postgresql-client"

// Create a PostgreSQL client for server-side operations (replaces supabase/server.ts)
export function createServerClient() {
  return {
    // Core query and transaction functions
    query: async (sql: string, params?: any[]) => {
      console.log('🏢 PostgreSQL Server Query:', sql.substring(0, 80) + '...')
      return await query(sql, params)
    },

    transaction: async (callback: (queryFn: typeof query) => Promise<any>) => {
      console.log('🏢 PostgreSQL Server Transaction')
      return await transaction(callback)
    },

    // Supabase-compatible API
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

      insert: (data: Record<string, any>) => ({
        then: async (resolve: any) => {
          const columns = Object.keys(data).join(', ')
          const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ')
          const values = Object.values(data)
          const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`
          const result = await query(sql, values)
          resolve({ data: result.data?.[0] || null, error: result.success ? null : result.error })
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
      console.log(`🏢 PostgreSQL Server RPC: ${functionName}`)
      
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
}

// Export createClient as a named export for compatibility
export { createServerClient as createClient }
