import { query } from "@/lib/postgresql-client"

/**
 * DATABASE UTILS - NOW 100% POSTGRESQL
 * ====================================
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Optimized table management operations
 * - All Supabase dependencies eliminated
 */

export async function ensureTableExists(tableName: string, createTableSQL: string): Promise<boolean> {
  try {
    console.log(`🗄️ Checking if table '${tableName}' exists via PostgreSQL...`)

    // Check if table exists via direct PostgreSQL query
    const tableCheckResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = $1
      ) as table_exists
    `, [tableName])

    const tableExists = tableCheckResult.rows[0]?.table_exists || false

    if (tableExists) {
      console.log(`✅ Table '${tableName}' already exists`)
      return true
    }

    console.log(`⚠️ Table '${tableName}' does not exist, creating it...`)

    // Create the table via PostgreSQL
    await query(createTableSQL)

    console.log(`✅ Successfully created table '${tableName}' via PostgreSQL`)
    return true

  } catch (error: any) {
    console.error(`❌ Error ensuring table '${tableName}' exists via PostgreSQL:`, error)
    return false
  }
}

/**
 * Check if a column exists in a table
 */
export async function ensureColumnExists(
  tableName: string, 
  columnName: string, 
  addColumnSQL: string
): Promise<boolean> {
  try {
    console.log(`🔍 Checking if column '${columnName}' exists in table '${tableName}' via PostgreSQL...`)

    // Check if column exists via PostgreSQL
    const columnCheckResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = $1 
          AND column_name = $2
      ) as column_exists
    `, [tableName, columnName])

    const columnExists = columnCheckResult.rows[0]?.column_exists || false

    if (columnExists) {
      console.log(`✅ Column '${columnName}' already exists in table '${tableName}'`)
      return true
    }

    console.log(`⚠️ Column '${columnName}' does not exist in table '${tableName}', adding it...`)

    // Add the column via PostgreSQL
    await query(addColumnSQL)

    console.log(`✅ Successfully added column '${columnName}' to table '${tableName}' via PostgreSQL`)
    return true

  } catch (error: any) {
    console.error(`❌ Error ensuring column '${columnName}' exists in table '${tableName}' via PostgreSQL:`, error)
    return false
  }
}

/**
 * Get table schema information
 */
export async function getTableSchema(tableName: string) {
  try {
    console.log(`📋 Getting schema information for table '${tableName}' via PostgreSQL...`)

    const schemaResult = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName])

    console.log(`✅ Retrieved schema for table '${tableName}' with ${schemaResult.rows.length} columns`)
    return {
      success: true,
      columns: schemaResult.rows,
      tableName
    }

  } catch (error: any) {
    console.error(`❌ Error getting schema for table '${tableName}' via PostgreSQL:`, error)
    return {
      success: false,
      error: error.message,
      tableName
    }
  }
}

/**
 * Execute multiple SQL statements safely
 */
export async function executeBatchSQL(sqlStatements: string[]): Promise<boolean> {
  try {
    console.log(`🔄 Executing batch of ${sqlStatements.length} SQL statements via PostgreSQL...`)

    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i].trim()
      if (sql) {
        console.log(`   📝 Executing statement ${i + 1}/${sqlStatements.length}...`)
        await query(sql)
      }
    }

    console.log(`✅ Successfully executed all ${sqlStatements.length} SQL statements`)
    return true

  } catch (error: any) {
    console.error(`❌ Error executing batch SQL via PostgreSQL:`, error)
    return false
  }
}

/**
 * Check database connection and health
 */
export async function checkDatabaseHealth() {
  try {
    console.log('🏥 Checking database health via PostgreSQL...')

    const healthResult = await query(`
      SELECT 
        version() as db_version,
        current_database() as database_name,
        current_user as current_user,
        now() as current_time
    `)

    const health = healthResult.rows[0]
    console.log(`✅ Database is healthy: ${health.database_name} (${health.current_user})`)
    
    return {
      success: true,
      ...health,
      timestamp: new Date().toISOString()
    }

  } catch (error: any) {
    console.error('❌ Database health check failed via PostgreSQL:', error)
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}
