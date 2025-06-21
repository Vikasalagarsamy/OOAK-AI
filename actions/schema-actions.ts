"use server"

import { query, transaction } from "@/lib/postgresql-client"

/**
 * Checks which lead source column exists in the leads table
 * @returns The name of the lead source column that exists, or null if neither exists
 */
export async function getLeadSourceColumnName(): Promise<string | null> {
  try {
    console.log('🔍 Checking if lead_source column exists...')
    
    // Check if the column exists using information_schema
    const columnCheckResult = await query(
      `SELECT EXISTS (
      
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'leads'
          AND column_name = 'lead_source'
      ) as column_exists`,
      []
    )

    const columnExists = columnCheckResult.rows[0]?.column_exists || false
    
    if (columnExists) {
      console.log('✅ lead_source column exists')
      return "lead_source"
    }

    console.log('❌ lead_source column does not exist')
    return null
  } catch (error) {
    console.error("❌ Error checking schema:", error)
    return null
  }
}

/**
 * Checks if the lead_source column exists in the leads table
 * @returns Boolean indicating if the lead_source column exists
 */
export async function checkLeadSourceColumn(): Promise<boolean> {
  try {
    console.log('🔍 Checking lead_source column existence...')
    
    // Use information_schema to check if column exists
    const columnCheckResult = await query(
      `SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'leads'
                AND column_name = 'lead_source'
      ) as column_exists`,
      []
    )

    const columnExists = columnCheckResult.rows[0]?.column_exists || false
    console.log(`${columnExists ? '✅' : '❌'} lead_source column ${columnExists ? 'exists' : 'does not exist'}`)
    
    return columnExists
  } catch (error) {
    console.error("❌ Error checking schema:", error)
    return false
  }
}

/**
 * Adds the lead_source column to the leads table if it doesn't exist
 * @returns Boolean indicating success
 */
export async function addLeadSourceColumn(): Promise<boolean> {
  try {
    console.log('🔄 Adding lead_source column if it does not exist...')

    // First check if the column already exists
    const columnExists = await checkLeadSourceColumn()
    if (columnExists) {
      console.log('✅ Column already exists, no action needed')
      return true // Column already exists
    }

    // Add the column using ALTER TABLE
    await query(
      "ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source TEXT",
      []
    )

    console.log('✅ lead_source column added successfully')
      return true
  } catch (error) {
    console.error("❌ Error adding lead_source column:", error)
    return false
  }
}
