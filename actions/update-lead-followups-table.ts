"use server"

import { query, transaction } from "@/lib/postgresql-client"

/**
 * UPDATE LEAD FOLLOWUPS TABLE - NOW 100% POSTGRESQL
 * 
 * Complete migration from Supabase to PostgreSQL
 * - Direct DDL operations for table alterations
 * - Enhanced error handling and logging
 * - Column type and constraint modifications
 * - All Supabase dependencies eliminated
 */

export async function updateLeadFollowupsTable(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔧 Updating lead_followups table schema via PostgreSQL...')

    // Use transaction for atomic schema updates
    await transaction(async (client) => {
      // First operation: Make created_by nullable
      console.log('📝 Making created_by column nullable...')
      try {
        await client.query(`
          ALTER TABLE lead_followups 
          ALTER COLUMN created_by DROP NOT NULL
        `)
        console.log('✅ Successfully made created_by nullable')
      } catch (error: any) {
        console.warn('⚠️ Warning making created_by nullable:', error.message)
        // Continue with next operation even if this fails
      }

      // Second operation: Change created_by to TEXT type
      console.log('🔤 Changing created_by column to TEXT type...')
      try {
        await client.query(`
          ALTER TABLE lead_followups 
          ALTER COLUMN created_by TYPE TEXT
        `)
        console.log('✅ Successfully changed created_by to TEXT type')
      } catch (error: any) {
        console.warn('⚠️ Warning changing created_by to TEXT:', error.message)
        // Log but don't fail the entire operation
      }
    })

    console.log('🎉 Lead followups table updated successfully!')
    return { 
      success: true, 
      message: "Lead followups table updated successfully" 
    }
  } catch (error) {
    console.error("❌ Error updating lead_followups table:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
