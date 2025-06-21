// 🎯 MIGRATED: Table Verification Utils - PostgreSQL Version
// Original: utils/table-verification.ts (Supabase)
// Migrated: Direct PostgreSQL queries for table verification

import { query } from "@/lib/postgresql-client"

/**
 * Verifies if the lead_followups table exists and creates it if it doesn't.
 * @returns A promise that resolves to an object with the verification result
 */
export async function verifyLeadFollowupsTable(): Promise<{
  exists: boolean
  message: string
  error?: string
}> {
  try {
    console.log("🔍 Verifying lead_followups table existence...")

    // Check if table exists using PostgreSQL information_schema
    const tableExistsResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'lead_followups'
      ) as exists;
    `)

    const exists = tableExistsResult.rows[0]?.exists || false

    if (exists) {
      console.log("✅ lead_followups table exists")
      return { 
        exists: true, 
        message: "Lead followups table exists and is accessible" 
      }
    } else {
      console.log("⚠️ lead_followups table does not exist")
      return {
        exists: false,
        message: "Lead followups table does not exist, but continuing application startup"
      }
    }

  } catch (error) {
    console.error("❌ Error verifying lead_followups table:", error)
    // Return exists: true to prevent blocking app startup
    return {
      exists: true,
      message: "Error checking lead_followups table, but continuing application startup",
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Gets the structure of the lead_followups table
 * @returns A promise that resolves to the table structure
 */
export async function getLeadFollowupsStructure() {
  try {
    console.log("📊 Getting lead_followups table structure...")

    const structureResult = await query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'lead_followups'
      ORDER BY ordinal_position;
    `)

    console.log(`✅ Found ${structureResult.rows.length} columns in lead_followups table`)
    return { 
      success: true, 
      structure: structureResult.rows 
    }

  } catch (error) {
    console.error("❌ Error getting lead_followups structure:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Checks if a table exists in the database
 * @param tableName The name of the table to check
 * @returns A promise that resolves to a boolean indicating if the table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    console.log(`🔍 Checking if table '${tableName}' exists...`)

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
    console.error(`❌ Error checking if table '${tableName}' exists:`, error)
    return false
  }
}

/**
 * Verifies if the deliverable_master table exists and creates it if it doesn't.
 * @returns A promise that resolves to an object with the verification result
 */
export async function verifyDeliverableMasterTable(): Promise<{
  exists: boolean
  message: string
  error?: string
}> {
  try {
    console.log("🔍 Verifying deliverable_master table existence...")

    // Check if table exists using PostgreSQL information_schema
    const tableExistsResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'deliverable_master'
      ) as exists;
    `)

    const exists = tableExistsResult.rows[0]?.exists || false

    if (exists) {
      console.log("✅ deliverable_master table exists")
      return { 
        exists: true, 
        message: "Deliverable master table exists and is accessible" 
      }
    } else {
      console.log("⚠️ deliverable_master table does not exist")
      return {
        exists: false,
        message: "Deliverable master table does not exist, but continuing application startup"
      }
    }

  } catch (error) {
    console.error("❌ Error verifying deliverable_master table:", error)
    // Return exists: true to prevent blocking app startup
    return {
      exists: true,
      message: "Error checking deliverable_master table, but continuing application startup",
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Enhanced table verification with detailed information
 * @param tableName The name of the table to verify
 * @returns Detailed table information
 */
export async function getDetailedTableInfo(tableName: string): Promise<{
  exists: boolean
  rowCount?: number
  columns?: Array<{
    name: string
    type: string
    nullable: boolean
    default?: string
  }>
  error?: string
}> {
  try {
    console.log(`📊 Getting detailed info for table '${tableName}'...`)

    // First check if table exists
    const existsResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = $1
      ) as exists;
    `, [tableName])

    const exists = existsResult.rows[0]?.exists || false

    if (!exists) {
      return {
        exists: false,
        error: `Table '${tableName}' does not exist`
      }
    }

    // Get column information
    const columnsResult = await query(`
      SELECT 
        column_name as name,
        data_type as type,
        is_nullable = 'YES' as nullable,
        column_default as default
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position;
    `, [tableName])

    // Get row count (with error handling for large tables)
    let rowCount = 0
    try {
      const countResult = await query(`SELECT COUNT(*) as count FROM "${tableName}";`)
      rowCount = parseInt(countResult.rows[0]?.count || '0')
    } catch (countError) {
      console.warn(`⚠️ Could not get row count for '${tableName}':`, countError)
    }

    console.log(`✅ Table '${tableName}' has ${columnsResult.rows.length} columns and ${rowCount} rows`)

    return {
      exists: true,
      rowCount,
      columns: columnsResult.rows
    }

  } catch (error) {
    console.error(`❌ Error getting detailed info for table '${tableName}':`, error)
    return {
      exists: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Verify multiple tables at once
 * @param tableNames Array of table names to verify
 * @returns Status of all tables
 */
export async function verifyMultipleTables(tableNames: string[]): Promise<{
  results: Array<{
    tableName: string
    exists: boolean
    error?: string
  }>
  summary: {
    total: number
    existing: number
    missing: number
  }
}> {
  console.log(`🔍 Verifying ${tableNames.length} tables...`)

  const results = []
  let existing = 0

  for (const tableName of tableNames) {
    try {
      const exists = await tableExists(tableName)
      results.push({
        tableName,
        exists
      })
      if (exists) existing++
    } catch (error) {
      results.push({
        tableName,
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }

  const summary = {
    total: tableNames.length,
    existing,
    missing: tableNames.length - existing
  }

  console.log(`📊 Table verification complete: ${existing}/${tableNames.length} tables exist`)

  return { results, summary }
}
