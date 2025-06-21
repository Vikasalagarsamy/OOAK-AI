import { query, transaction } from "@/lib/postgresql-client"

// PostgreSQL server client (replaces supabase-server.ts)
export function createServerSupabaseClient() {
  return createPostgreSQLServerClient()
}

export function createPostgreSQLServerClient() {
  return {
    // Core query and transaction functions
    query: async (sql: string, params?: any[]) => {
      console.log('🖥️ PostgreSQL Server Query:', sql.substring(0, 80) + '...')
      return await query(sql, params)
    },

    transaction: async (callback: (queryFn: typeof query) => Promise<any>) => {
      console.log('🖥️ PostgreSQL Server Transaction')
      return await transaction(callback)
    },

    // Supabase-compatible API for server operations
    from: (tableName: string) => ({
      select: (columns = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            const sql = `SELECT ${columns} FROM ${tableName} WHERE ${column} = $1 LIMIT 1`
            const result = await query(sql, [value])
            return { data: result.data?.[0] || null, error: result.success ? null : result.error }
          },
          order: (orderColumn: string, options?: { ascending?: boolean }) => ({
            limit: (count: number) => ({
              then: async (resolve: any) => {
                const orderDir = options?.ascending === false ? 'DESC' : 'ASC'
                const sql = `SELECT ${columns} FROM ${tableName} WHERE ${column} = $1 ORDER BY ${orderColumn} ${orderDir} LIMIT ${count}`
                const result = await query(sql, [value])
                resolve({ data: result.data || [], error: result.success ? null : result.error })
              }
            })
          })
        }),
        order: (column: string, options?: { ascending?: boolean }) => ({
          limit: (count: number) => ({
            then: async (resolve: any) => {
              const orderDir = options?.ascending === false ? 'DESC' : 'ASC'
              const sql = `SELECT ${columns} FROM ${tableName} ORDER BY ${column} ${orderDir} LIMIT ${count}`
              const result = await query(sql)
              resolve({ data: result.data || [], error: result.success ? null : result.error })
            }
          })
        }),
        limit: (count: number) => ({
          then: async (resolve: any) => {
            const sql = `SELECT ${columns} FROM ${tableName} LIMIT ${count}`
            const result = await query(sql)
            resolve({ data: result.data || [], error: result.success ? null : result.error })
          }
        })
      }),

      insert: (data: Record<string, any> | Record<string, any>[]) => ({
        select: (columns = '*') => ({
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
            const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES ${placeholders} RETURNING ${columns}`
            
            const result = await query(sql, values)
            resolve({ 
              data: isArray ? (result.data || []) : (result.data?.[0] || null), 
              error: result.success ? null : result.error 
            })
          }
        })
      }),

      update: (data: Record<string, any>) => ({
        eq: (column: string, value: any) => ({
          select: (columns = '*') => ({
            then: async (resolve: any) => {
              const setClause = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ')
              const values = [...Object.values(data), value]
              const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${column} = $${values.length} RETURNING ${columns}`
              const result = await query(sql, values)
              resolve({ data: result.data || [], error: result.success ? null : result.error })
            }
          })
        })
      }),

      delete: () => ({
        eq: (column: string, value: any) => ({
          then: async (resolve: any) => {
            const sql = `DELETE FROM ${tableName} WHERE ${column} = $1`
            const result = await query(sql, [value])
            resolve({ data: null, error: result.success ? null : result.error })
          }
        }),
        in: (column: string, values: any[]) => ({
          then: async (resolve: any) => {
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
            const sql = `DELETE FROM ${tableName} WHERE ${column} IN (${placeholders})`
            const result = await query(sql, values)
            resolve({ data: null, error: result.success ? null : result.error })
          }
        })
      })
    }),

    // RPC function replacement for server
    rpc: async (functionName: string, params: Record<string, any> = {}) => {
      console.log(`🖥️ PostgreSQL Server RPC: ${functionName}`)
      
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

// Export the direct client for convenience
export const supabase = createPostgreSQLServerClient()

// Export createClient as alias to fix import errors
export { createPostgreSQLServerClient as createClient }
