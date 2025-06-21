import { query, transaction } from "@/lib/postgresql-client"

// Browser-compatible PostgreSQL client (replaces supabase-browser.ts)
export function createBrowserClient() {
  return {
    // Core query and transaction functions
    query: async (sql: string, params?: any[]) => {
      console.log('🌐 PostgreSQL Browser Query:', sql.substring(0, 80) + '...')
      return await query(sql, params)
    },

    transaction: async (callback: (queryFn: typeof query) => Promise<any>) => {
      console.log('🌐 PostgreSQL Browser Transaction')
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
          order: (column: string, options?: { ascending?: boolean }) => ({
            limit: (count: number) => ({
              then: async (resolve: any) => {
                const orderDir = options?.ascending === false ? 'DESC' : 'ASC'
                const sql = `SELECT ${columns} FROM ${tableName} WHERE ${column} = $1 ORDER BY ${column} ${orderDir} LIMIT ${count}`
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
        })
      })
    }),

    // Auth placeholder (for compatibility)
    auth: {
      getUser: async () => ({ 
        data: { user: { id: 'mock-user-id', email: 'user@example.com' } }, 
        error: null 
      }),
      getSession: async () => ({ 
        data: { session: { user: { id: 'mock-user-id' } } }, 
        error: null 
      })
    },

    // RPC function replacement
    rpc: async (functionName: string, params: Record<string, any> = {}) => {
      console.log(`�� PostgreSQL Browser RPC: ${functionName}`)
      
      if (functionName === 'execute_sql') {
        const sql = params.sql_statement || params.sql
        const result = await query(sql)
        return { data: result.data, error: result.success ? null : result.error }
      }
      
      const paramKeys = Object.keys(params)
      const paramValues = Object.values(params)
      const paramPlaceholders = paramKeys.map((_, i) => `$${i + 1}`).join(', ')
      
      const sql = `SELECT * FROM ${functionName}(${paramPlaceholders})`
      const result = await query(sql, paramValues)
      return { data: result.data, error: result.success ? null : result.error }
    }
  }
}

// Keep the original function for backward compatibility
export function getSupabaseBrowser() {
  return createBrowserClient()
}

// Export createClient as a named export for compatibility
export function createClient() {
  return createBrowserClient()
}
