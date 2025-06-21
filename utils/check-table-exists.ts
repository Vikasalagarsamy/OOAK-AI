import { query } from "@/lib/postgresql-client"

/**
 * CHECK TABLE EXISTS - NOW 100% POSTGRESQL
 * ========================================
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Optimized table existence checking
 * - All Supabase dependencies eliminated
 */

export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    console.log(`🗄️ Checking if table '${tableName}' exists via PostgreSQL...`)

    // Use PostgreSQL information_schema to check table existence
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = $1
      ) as table_exists
    `, [tableName])

    const exists = result.rows[0]?.table_exists || false
    
    if (exists) {
      console.log(`✅ Table '${tableName}' exists in database`)
    } else {
      console.log(`⚠️ Table '${tableName}' does not exist in database`)
    }
    
    return exists

  } catch (error: any) {
    console.error(`❌ Error checking if table '${tableName}' exists via PostgreSQL:`, error)
    return false
  }
}

/**
 * Enhanced table existence check with column information
 */
export async function checkTableExistsWithColumns(tableName: string): Promise<{
  exists: boolean
  columns?: string[]
  error?: string
}> {
  try {
    console.log(`🔍 Checking table '${tableName}' with column information via PostgreSQL...`)

    // Check if table exists and get column information
    const result = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName])

    if (result.rows.length === 0) {
      console.log(`⚠️ Table '${tableName}' does not exist`)
      return { exists: false }
    }

    const columns = result.rows.map(row => `${row.column_name} (${row.data_type})`)
    console.log(`✅ Table '${tableName}' exists with ${columns.length} columns`)
    
    return {
      exists: true,
      columns
    }

  } catch (error: any) {
    console.error(`❌ Error checking table '${tableName}' with columns via PostgreSQL:`, error)
    return {
      exists: false,
      error: error.message
    }
  }
}

/**
 * Check multiple tables at once
 */
export async function checkMultipleTablesExist(tableNames: string[]): Promise<{
  [tableName: string]: boolean
}> {
  try {
    console.log(`🗄️ Checking existence of ${tableNames.length} tables via PostgreSQL...`)

    const placeholders = tableNames.map((_, index) => `$${index + 1}`).join(', ')
    
    const result = await query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = ANY(ARRAY[${placeholders}])
    `, tableNames)

    const existingTables = result.rows.map(row => row.table_name)
    
    const results: { [tableName: string]: boolean } = {}
    for (const tableName of tableNames) {
      results[tableName] = existingTables.includes(tableName)
    }

    const existingCount = Object.values(results).filter(Boolean).length
    console.log(`✅ Found ${existingCount}/${tableNames.length} tables exist`)
    
    return results

  } catch (error: any) {
    console.error(`❌ Error checking multiple tables via PostgreSQL:`, error)
    
    // Return all false on error
    const results: { [tableName: string]: boolean } = {}
    for (const tableName of tableNames) {
      results[tableName] = false
    }
    return results
  }
} 