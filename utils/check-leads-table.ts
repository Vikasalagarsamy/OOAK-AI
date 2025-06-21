import { query } from "@/lib/postgresql-client"

/**
 * CHECK LEADS TABLE - NOW 100% POSTGRESQL
 * =======================================
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Optimized leads table verification
 * - All Supabase dependencies eliminated
 */

/**
 * Checks if the leads table exists in the database
 */
export async function checkLeadsTableExists(): Promise<boolean> {
  try {
    console.log('📊 Checking if leads table exists via PostgreSQL...')

    // Use PostgreSQL information_schema to check leads table existence
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'leads'
      ) as table_exists
    `)

    const exists = result.rows[0]?.table_exists || false
    
    if (exists) {
      console.log('✅ Leads table exists in database')
    } else {
      console.log('⚠️ Leads table does not exist in database')
    }
    
    return exists

  } catch (error: any) {
    console.error('❌ Error checking leads table via PostgreSQL:', error)
    return false
  }
}

/**
 * Check leads table with detailed information
 */
export async function checkLeadsTableWithDetails(): Promise<{
  exists: boolean
  rowCount?: number
  columns?: string[]
  error?: string
}> {
  try {
    console.log('📊 Checking leads table with detailed information via PostgreSQL...')

    // First check if table exists
    const existsResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'leads'
      ) as table_exists
    `)

    const exists = existsResult.rows[0]?.table_exists || false

    if (!exists) {
      console.log('⚠️ Leads table does not exist')
      return { exists: false }
    }

    // Get column information
    const columnsResult = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'leads'
      ORDER BY ordinal_position
    `)

    // Get row count
    const countResult = await query(`
      SELECT COUNT(*) as row_count 
      FROM leads
    `)

    const rowCount = Number.parseInt(countResult.rows[0].row_count, 10)
    const columns = columnsResult.rows.map(row => 
      `${row.column_name} (${row.data_type}${row.is_nullable === 'NO' ? ' NOT NULL' : ''})`
    )

    console.log(`✅ Leads table exists with ${columns.length} columns and ${rowCount} rows`)
    
    return {
      exists: true,
      rowCount,
      columns
    }

  } catch (error: any) {
    console.error('❌ Error checking leads table details via PostgreSQL:', error)
    return {
      exists: false,
      error: error.message
    }
  }
}

/**
 * Verify leads table has required columns
 */
export async function verifyLeadsTableStructure(requiredColumns: string[] = [
  'id', 'lead_number', 'title', 'description', 'status', 'company_id', 'assigned_to'
]): Promise<{
  isValid: boolean
  missingColumns: string[]
  existingColumns: string[]
}> {
  try {
    console.log(`🔍 Verifying leads table structure with ${requiredColumns.length} required columns...`)

    // Get existing columns
    const result = await query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'leads'
      ORDER BY ordinal_position
    `)

    const existingColumns = result.rows.map(row => row.column_name)
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))
    
    const isValid = missingColumns.length === 0

    if (isValid) {
      console.log('✅ Leads table structure is valid - all required columns present')
    } else {
      console.log(`⚠️ Leads table missing ${missingColumns.length} required columns: ${missingColumns.join(', ')}`)
    }

    return {
      isValid,
      missingColumns,
      existingColumns
    }

  } catch (error: any) {
    console.error('❌ Error verifying leads table structure via PostgreSQL:', error)
    return {
      isValid: false,
      missingColumns: requiredColumns,
      existingColumns: []
    }
  }
} 