"use server"

import { createClient } from "@/utils/supabase/server"

export async function fixLeadSourcesActiveStatus(): Promise<{
  success: boolean
  message: string
  updatedCount?: number
}> {
  try {
    const supabase = createClient()

    // 1. First, update all inactive lead sources to active
    const { data: updatedData, error: updateError } = await supabase
      .from("lead_sources")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .match({ is_active: false })
      .select("id")

    if (updateError) {
      console.error("Error updating lead sources:", updateError)
      throw updateError
    }

    // Also update any lead sources with NULL is_active
    const { data: updatedNullData, error: updateNullError } = await supabase
      .from("lead_sources")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .is("is_active", null)
      .select("id")

    if (updateNullError) {
      console.error("Error updating lead sources with null is_active:", updateNullError)
      throw updateNullError
    }

    // 2. Check if the is_active column has a default value
    // This is more complex and might require direct SQL execution
    // For now, we'll just log a message about it

    // Calculate total updated count
    const updatedCount = (updatedData?.length || 0) + (updatedNullData?.length || 0)

    console.log(`Updated ${updatedCount} lead sources to active status`)

    return {
      success: true,
      message:
        updatedCount > 0
          ? `Successfully updated ${updatedCount} lead sources to active status.`
          : "All lead sources are already active.",
      updatedCount,
    }
  } catch (error) {
    console.error("Error fixing lead sources active status:", error)
    return {
      success: false,
      message: `Failed to fix lead sources: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
