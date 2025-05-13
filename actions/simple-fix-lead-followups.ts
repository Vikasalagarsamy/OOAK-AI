"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function simpleFixLeadFollowups(): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    // First, check if the table exists by trying to select from it
    const { data, error: tableCheckError } = await supabase.from("lead_followups").select("id").limit(1)

    // If the table doesn't exist, create it
    if (tableCheckError) {
      console.log("Table check error:", tableCheckError.message)

      // Create the table with the correct structure
      const createTableResult = await createLeadFollowupsTable()

      if (!createTableResult.success) {
        return createTableResult
      }

      return {
        success: true,
        message: "Successfully created lead_followups table with all required columns",
      }
    }

    // If we get here, the table exists
    // Check if the contact_method column exists
    const { data: columnData, error: columnCheckError } = await supabase
      .from("lead_followups")
      .select("contact_method")
      .limit(1)

    if (columnCheckError) {
      console.log("Column check error:", columnCheckError.message)

      // The column doesn't exist, so add it
      const addColumnResult = await addContactMethodColumn()

      if (!addColumnResult.success) {
        return addColumnResult
      }

      return {
        success: true,
        message: "Successfully added contact_method column to lead_followups table",
      }
    }

    // Check if the followup_type column exists (for migration purposes)
    const { data: oldColumnData, error: oldColumnCheckError } = await supabase
      .from("lead_followups")
      .select("followup_type")
      .limit(1)

    if (!oldColumnCheckError) {
      // Both columns exist, we might need to migrate data
      const migrationResult = await migrateFollowupTypeData()

      if (!migrationResult.success) {
        return migrationResult
      }

      return {
        success: true,
        message: "Successfully migrated data from followup_type to contact_method",
      }
    }

    // Revalidate paths that might be affected
    revalidatePath("/follow-ups")
    revalidatePath("/sales/my-leads")

    return {
      success: true,
      message: "Lead followups table structure is correct",
    }
  } catch (error) {
    console.error("Error fixing lead_followups table:", error)
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

    return {
      success: true,
      message: "Successfully created lead_followups table",
    }
  } catch (error) {
    console.error("Error creating lead_followups table:", error)
    return {
      success: false,
      message: `Error creating lead_followups table: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Helper function to add the contact_method column
async function addContactMethodColumn(): Promise<{ success: boolean; message: string }> {
  try {
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

    return {
      success: true,
      message: "Successfully added contact_method column",
    }
  } catch (error) {
    console.error("Error adding contact_method column:", error)
    return {
      success: false,
      message: `Error adding contact_method column: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Helper function to migrate data from followup_type to contact_method
async function migrateFollowupTypeData(): Promise<{ success: boolean; message: string }> {
  try {
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

    return {
      success: true,
      message: "Successfully migrated followup data",
    }
  } catch (error) {
    console.error("Error migrating followup data:", error)
    return {
      success: false,
      message: `Error migrating followup data: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
