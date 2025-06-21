// 🎯 MIGRATED: Table Exists Utils - PostgreSQL Version
// Original: utils/table-exists.ts (Supabase)
// Migrated: Direct PostgreSQL queries for table existence checking

import { query } from "@/lib/postgresql-client"

/**
 * Check if a table exists in the PostgreSQL database
 * @param tableName The name of the table to check
 * @returns Promise<boolean> indicating if the table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    console.log(`🔍 Checking table existence: '${tableName}'`)

    // Use PostgreSQL information_schema to check table existence
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = $1
      ) as exists;
    `, [tableName])

    const exists = result.rows[0]?.exists || false
    
    console.log(`${exists ? '✅' : '❌'} Table '${tableName}' ${exists ? 'exists' : 'does not exist'}`)
    
    return exists

  } catch (error) {
    console.error(`❌ Error checking table '${tableName}' existence:`, error)
    return false
  }
}

/**
 * Check if multiple tables exist
 * @param tableNames Array of table names to check
 * @returns Promise with results for each table
 */
export async function checkMultipleTablesExist(tableNames: string[]): Promise<{
  [tableName: string]: boolean
}> {
  console.log(`🔍 Checking existence of ${tableNames.length} tables...`)

  const results: { [tableName: string]: boolean } = {}

  try {
    // Build a single query to check all tables at once for efficiency
    const placeholders = tableNames.map((_, index) => `$${index + 1}`).join(', ')
    
    const result = await query(`
      SELECT 
        t.table_name,
        t.table_name = ANY(ARRAY[${placeholders}]) as exists
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
      AND t.table_name = ANY(ARRAY[${placeholders}])
    `, tableNames)

    // Initialize all as false
    for (const tableName of tableNames) {
      results[tableName] = false
    }

    // Set existing tables to true
    for (const row of result.rows) {
      results[row.table_name] = true
    }

    const existingCount = Object.values(results).filter(Boolean).length
    console.log(`📊 ${existingCount}/${tableNames.length} tables exist`)

    return results

  } catch (error) {
    console.error('❌ Error checking multiple tables:', error)
    
    // Fallback: check each table individually
    for (const tableName of tableNames) {
      results[tableName] = await tableExists(tableName)
    }
    
    return results
  }
}

/**
 * Get detailed table information including row count and structure
 * @param tableName The name of the table to analyze
 * @returns Detailed table information
 */
export async function getTableDetails(tableName: string): Promise<{
  exists: boolean
  rowCount?: number
  columnCount?: number
  tableSize?: string
  lastModified?: string
  error?: string
}> {
  try {
    console.log(`📊 Getting detailed information for table '${tableName}'...`)

    // First check if table exists
    const exists = await tableExists(tableName)
    
    if (!exists) {
      return {
        exists: false,
        error: `Table '${tableName}' does not exist`
      }
    }

    // Get table statistics
    const statsResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM "${tableName}") as row_count,
        (SELECT COUNT(*) 
         FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = $1) as column_count,
        pg_size_pretty(pg_total_relation_size($1)) as table_size
    `, [tableName])

    const stats = statsResult.rows[0]

    console.log(`✅ Table '${tableName}': ${stats.row_count} rows, ${stats.column_count} columns, ${stats.table_size}`)

    return {
      exists: true,
      rowCount: parseInt(stats.row_count || '0'),
      columnCount: parseInt(stats.column_count || '0'),
      tableSize: stats.table_size,
      lastModified: new Date().toISOString() // PostgreSQL doesn't track this easily
    }

  } catch (error) {
    console.error(`❌ Error getting table details for '${tableName}':`, error)
    return {
      exists: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Check if specific columns exist in a table
 * @param tableName The table to check
 * @param columnNames Array of column names to verify
 * @returns Object with column existence status
 */
export async function checkColumnsExist(tableName: string, columnNames: string[]): Promise<{
  [columnName: string]: boolean
}> {
  try {
    console.log(`🔍 Checking columns in table '${tableName}': [${columnNames.join(', ')}]`)

    const placeholders = columnNames.map((_, index) => `$${index + 2}`).join(', ')
    
    const result = await query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = ANY(ARRAY[${placeholders}])
    `, [tableName, ...columnNames])

    const existingColumns = new Set(result.rows.map(row => row.column_name))
    
    const results: { [columnName: string]: boolean } = {}
    for (const columnName of columnNames) {
      results[columnName] = existingColumns.has(columnName)
    }

    const existingCount = Object.values(results).filter(Boolean).length
    console.log(`📊 ${existingCount}/${columnNames.length} columns exist in '${tableName}'`)

    return results

  } catch (error) {
    console.error(`❌ Error checking columns in '${tableName}':`, error)
    
    // Return all false on error
    const results: { [columnName: string]: boolean } = {}
    for (const columnName of columnNames) {
      results[columnName] = false
    }
    return results
  }
}
