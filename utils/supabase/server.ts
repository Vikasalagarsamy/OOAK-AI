import { Pool, PoolClient } from 'pg'

// PostgreSQL connection pool for server-side operations
let pool: Pool | null = null

// Create a PostgreSQL client pool for server-side operations
export function createServerClient() {
  // Debug logging to see what environment variables we have
  const postgresHost = process.env.POSTGRES_HOST || "localhost"
  const postgresPort = parseInt(process.env.POSTGRES_PORT || "5432")
  const postgresDatabase = process.env.POSTGRES_DATABASE || "ooak_future"
  const postgresUser = process.env.POSTGRES_USER || "vikasalagarsamy"
  const postgresPassword = process.env.POSTGRES_PASSWORD || "password"
  const postgresSSL = process.env.POSTGRES_SSL === 'true'
  
  console.log("🔧 PostgreSQL config check:", {
    hasHost: !!postgresHost,
    hasDatabase: !!postgresDatabase,
    hasUser: !!postgresUser,
    hasPassword: !!postgresPassword,
    hostPreview: postgresHost,
    databasePreview: postgresDatabase,
    port: postgresPort,
    ssl: postgresSSL
  })

  if (!postgresHost) {
    throw new Error("POSTGRES_HOST is missing from environment variables")
  }

  if (!postgresDatabase) {
    throw new Error("POSTGRES_DATABASE is missing from environment variables")
  }

  if (!postgresUser) {
    throw new Error("POSTGRES_USER is missing from environment variables")
  }

  if (!postgresPassword) {
    throw new Error("POSTGRES_PASSWORD is missing from environment variables")
  }

  // Create pool if it doesn't exist
  if (!pool) {
    pool = new Pool({
      host: postgresHost,
      port: postgresPort,
      database: postgresDatabase,
      user: postgresUser,
      password: postgresPassword,
      ssl: postgresSSL ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of connections
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    })

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('❌ PostgreSQL pool error:', err)
    })

    console.log("✅ PostgreSQL connection pool created successfully")
  }

  return {
    // Query helper function
    async query(text: string, params?: any[]) {
      const client = await pool!.connect()
      try {
        const result = await client.query(text, params)
        return { data: result.rows, error: null }
      } catch (error: any) {
        console.error('❌ PostgreSQL Query Error:', error.message)
        return { data: null, error: error.message }
      } finally {
        client.release()
      }
    },

    // Transaction helper function
    async transaction(callback: (client: PoolClient) => Promise<any>) {
      const client = await pool!.connect()
      try {
        await client.query('BEGIN')
        const result = await callback(client)
        await client.query('COMMIT')
        return { data: result, error: null }
      } catch (error: any) {
        await client.query('ROLLBACK')
        console.error('❌ PostgreSQL Transaction Error:', error.message)
        return { data: null, error: error.message }
      } finally {
        client.release()
      }
    },

    // Raw connection for advanced operations
    async getConnection() {
      return await pool!.connect()
    },

    // Health check
    async healthCheck() {
      try {
        const result = await this.query('SELECT NOW() as current_time, version() as version')
        if (result.data && result.data.length > 0) {
          console.log('✅ PostgreSQL connection healthy:', {
            time: result.data[0].current_time,
            version: result.data[0].version?.substring(0, 50) + '...'
          })
          return true
        }
        return false
      } catch (error) {
        console.error('❌ PostgreSQL health check failed:', error)
        return false
      }
    }
  }
}

// Export createClient as a named export for compatibility
export function createClient() {
  return createServerClient()
}

// Graceful shutdown helper
export async function closePool() {
  if (pool) {
    await pool.end()
    pool = null
    console.log('✅ PostgreSQL pool closed')
  }
}
