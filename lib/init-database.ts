import { verifyLeadFollowupsTable } from "@/utils/table-verification"

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

    // Verify lead_followups table
    try {
      const exists = await verifyLeadFollowupsTable()
      results.lead_followups = {
        exists,
        message: exists ? "Lead followups table exists" : "Failed to verify lead followups table",
      }
    } catch (error) {
      console.error("Error verifying lead_followups table:", error)
      results.lead_followups = {
        exists: false,
        message: "Error verifying lead_followups table",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Add more table verifications here as needed

    // Check if all verifications were successful
    const allSuccessful = Object.values(results).every((result) => result.exists)

    console.log("Database initialization complete")
    return {
      success: allSuccessful,
      message: allSuccessful ? "All required tables verified successfully" : "Some tables could not be verified",
      details: results,
    }
  } catch (error) {
    console.error("Error initializing database:", error)
    return {
      success: false,
      message: "Failed to initialize database: " + (error instanceof Error ? error.message : "Unknown error"),
      details: results,
    }
  }
}
