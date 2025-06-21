"use server"

import { query } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"

export async function simpleFixLeadFollowups(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔧 Starting lead_followups table structure validation...')

    // First, check if the table exists using PostgreSQL information_schema
    const tableExistsResult = await query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_followups'
      ) as table_exists`,
      []
    )

    const tableExists = tableExistsResult.rows[0]?.table_exists || false

    // If the table doesn't exist, create it
    if (!tableExists) {
      console.log("❌ Table does not exist, creating it...")

      // Create the table with the correct structure
      const createTableResult = await createLeadFollowupsTable()

      if (!createTableResult.success) {
        return createTableResult
      }

      console.log('✅ Table created successfully')
      return {
        success: true,
        message: "Successfully created lead_followups table with all required columns",
      }
    }

    console.log('✅ Table exists, checking column structure...')

    // If we get here, the table exists
    // Check if the contact_method column exists
    const contactMethodColumnResult = await query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_followups' 
        AND column_name = 'contact_method'
      ) as column_exists`,
      []
    )

    const contactMethodExists = contactMethodColumnResult.rows[0]?.column_exists || false

    if (!contactMethodExists) {
      console.log("❌ contact_method column does not exist, adding it...")

      // The column doesn't exist, so add it
      const addColumnResult = await addContactMethodColumn()

      if (!addColumnResult.success) {
        return addColumnResult
      }

      console.log('✅ contact_method column added successfully')
      return {
        success: true,
        message: "Successfully added contact_method column to lead_followups table",
      }
    }

    // Check if the followup_type column exists (for migration purposes)
    const followupTypeColumnResult = await query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_followups' 
        AND column_name = 'followup_type'
      ) as column_exists`,
      []
    )

    const followupTypeExists = followupTypeColumnResult.rows[0]?.column_exists || false

    if (followupTypeExists) {
      console.log('🔄 Both columns exist, checking if data migration is needed...')
      
      // Both columns exist, we might need to migrate data
      const migrationResult = await migrateFollowupTypeData()

      if (!migrationResult.success) {
        return migrationResult
      }

      console.log('✅ Data migration completed successfully')
      return {
        success: true,
        message: "Successfully migrated data from followup_type to contact_method",
      }
    }

    // Revalidate paths that might be affected
    revalidatePath("/follow-ups")
    revalidatePath("/sales/my-leads")

    console.log('✅ Lead followups table structure is correct')
    return {
      success: true,
      message: "Lead followups table structure is correct",
    }
  } catch (error) {
    console.error("❌ Error fixing lead_followups table:", error)
    return {
      success: false,
      message:
        typeof error === "object" && error !== null && "message" in error
          ? (error as Error).message
          : "An unexpected error occurred",
    }
  }
}

// Helper function to create the lead_followups table
async function createLeadFollowupsTable(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('📡 Calling API to create lead_followups table...')
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/create-followups-table`, {
      method: "POST",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      return {
        success: false,
        message: `Failed to create lead_followups table: ${errorData.error || response.statusText}`,
      }
    }

    console.log('✅ API call successful')
    return {
      success: true,
      message: "Successfully created lead_followups table",
    }
  } catch (error) {
    console.error("❌ Error creating lead_followups table:", error)
    return {
      success: false,
      message: `Error creating lead_followups table: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Helper function to add the contact_method column
async function addContactMethodColumn(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('📡 Calling API to add contact_method column...')
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/ensure-contact-method-column`, {
      method: "POST",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      return {
        success: false,
        message: `Failed to add contact_method column: ${errorData.error || response.statusText}`,
      }
    }

    console.log('✅ API call successful')
    return {
      success: true,
      message: "Successfully added contact_method column",
    }
  } catch (error) {
    console.error("❌ Error adding contact_method column:", error)
    return {
      success: false,
      message: `Error adding contact_method column: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Helper function to migrate data from followup_type to contact_method
async function migrateFollowupTypeData(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('📡 Calling API to migrate followup data...')
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/migrate-followup-data`, {
      method: "POST",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      return {
        success: false,
        message: `Failed to migrate followup data: ${errorData.error || response.statusText}`,
      }
    }

    console.log('✅ API call successful')
    return {
      success: true,
      message: "Successfully migrated followup data",
    }
  } catch (error) {
    console.error("❌ Error migrating followup data:", error)
    return {
      success: false,
      message: `Error migrating followup data: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
