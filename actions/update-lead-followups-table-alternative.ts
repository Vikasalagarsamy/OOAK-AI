"use server"

import { query, transaction } from "@/lib/postgresql-client"

/**
 * UPDATE LEAD FOLLOWUPS TABLE ALTERNATIVE - NOW 100% POSTGRESQL
 * 
 * Complete migration from Supabase to PostgreSQL
 * - Direct DDL operations for table alterations
 * - Fixed linter errors (removed invalid database calls)
 * - Enhanced error handling and logging
 * - Column type and constraint modifications
 * - All Supabase dependencies eliminated
 */

export async function updateLeadFollowupsTableAlternative(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔧 Updating lead_followups table (alternative method) via PostgreSQL...')

    let operationsSucceeded = 0
    let operationsFailed = 0

    // First operation: Make created_by nullable
    console.log('📝 Making created_by column nullable...')
    try {
      await query(`
        ALTER TABLE lead_followups 
        ALTER COLUMN created_by DROP NOT NULL
      `)
      console.log('✅ Successfully made created_by nullable')
      operationsSucceeded++
    } catch (error: any) {
      console.warn('⚠️ Warning making created_by nullable:', error.message)
      operationsFailed++
    }

    // Second operation: Change created_by to TEXT type
    console.log('🔤 Changing created_by column to TEXT type...')
    try {
      await query(`
        ALTER TABLE lead_followups 
        ALTER COLUMN created_by TYPE TEXT
      `)
      console.log('✅ Successfully changed created_by to TEXT type')
      operationsSucceeded++
    } catch (error: any) {
      console.warn('⚠️ Warning changing created_by to TEXT:', error.message)
      operationsFailed++
    }

    // Determine success based on results
    if (operationsSucceeded > 0) {
      console.log(`🎉 Table update completed: ${operationsSucceeded} operations succeeded, ${operationsFailed} failed`)
      return {
        success: true,
        message: `Lead followups table updated successfully (${operationsSucceeded}/${operationsSucceeded + operationsFailed} operations completed)`,
      }
    } else {
      return {
        success: false,
        message: "Failed to update lead_followups table. All operations failed.",
      }
    }
  } catch (error) {
    console.error("❌ Error updating lead_followups table:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
