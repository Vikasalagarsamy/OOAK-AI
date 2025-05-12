import { type NextRequest, NextResponse } from "next/server"
import { verifyLeadFollowupsTable } from "@/utils/table-verification"

// This is a map to track which tables have been verified
const verifiedTables = new Map<string, boolean>()

export async function tableVerificationMiddleware(request: NextRequest) {
  // Only run verification for specific routes that need the lead_followups table
  const path = request.nextUrl.pathname

  if (path.startsWith("/sales/my-leads") || path.startsWith("/sales/lead/") || path.includes("follow-up")) {
    // Check if we've already verified the table in this session
    if (!verifiedTables.get("lead_followups")) {
      try {
        const { exists } = await verifyLeadFollowupsTable()
        verifiedTables.set("lead_followups", exists)

        // If table verification failed, redirect to an error page
        if (!exists) {
          return NextResponse.redirect(new URL("/error/database-setup", request.url))
        }
      } catch (error) {
        console.error("Error in table verification middleware:", error)
        // Continue anyway to avoid blocking the application
      }
    }
  }

  return NextResponse.next()
}
