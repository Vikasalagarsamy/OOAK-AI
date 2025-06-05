import { verifyLeadFollowupsTable, verifyDeliverableMasterTable } from "@/utils/table-verification"

/**
 * Initializes database tables required by the application
 * This function should be called during application startup
 */
export async function initializeDatabase(): Promise<{
  success: boolean
  message: string
  details: Record<string, { exists: boolean; message: string; error?: string }>
}> {
  const results: Record<string, { exists: boolean; message: string; error?: string }> = {}

  try {
    console.log("Initializing database...")

    // Verify lead_followups table with error handling
    try {
      const result = await verifyLeadFollowupsTable()
      results.lead_followups = {
        exists: result.exists,
        message: result.message,
        error: result.error,
      }
    } catch (error) {
      console.error("Error verifying lead_followups table:", error)
      // Don't block app startup on verification failure
      results.lead_followups = {
        exists: true, // Assume it exists to not block startup
        message: "Error verifying lead_followups table, but continuing application startup",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Verify deliverable_master table with error handling
    try {
      const result = await verifyDeliverableMasterTable()
      results.deliverable_master = {
        exists: result.exists,
        message: result.message,
        error: result.error,
      }
    } catch (error) {
      console.error("Error verifying deliverable_master table:", error)
      // Don't block app startup on verification failure
      results.deliverable_master = {
        exists: true, // Assume it exists to not block startup
        message: "Error verifying deliverable_master table, but continuing application startup",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Add more table verifications here as needed

    // Always return success to prevent blocking app startup
    console.log("Database initialization complete (with potential warnings)")
    return {
      success: true,
      message: "Application startup continuing with database verification results",
      details: results,
    }
  } catch (error) {
    console.error("Error initializing database:", error)
    // Still return success to prevent blocking app startup
    return {
      success: true,
      message: "Application continuing despite database initialization errors",
      details: results,
    }
  }
}
