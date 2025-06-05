import { NextResponse } from "next/server"
import { getUpcomingNotifications, getOverdueFollowUps } from "@/actions/follow-up-notifications"

// Disable static generation for this API route
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Get the minutes threshold from query params
    const url = new URL(request.url)
    const minutesThreshold = Number.parseInt(url.searchParams.get("minutes") || "15", 10)

    // For now, return empty results to prevent fetch errors
    // This will be re-enabled when the database tables are properly set up
    console.log("📢 Follow-up notifications API called but returning empty results (database not ready)")
    
    return NextResponse.json({
      upcoming: [],
      overdue: [],
      timestamp: new Date().toISOString(),
      status: "disabled",
      message: "Follow-up notifications are currently disabled pending database setup"
    })

    // TODO: Uncomment when database is ready
    /*
    // Get upcoming notifications
    const upcomingResult = await getUpcomingNotifications(minutesThreshold)

    // Get overdue follow-ups
    const overdueResult = await getOverdueFollowUps()

    if (!upcomingResult.success || !overdueResult.success) {
      return NextResponse.json(
        {
          error: upcomingResult.error || overdueResult.error || "Failed to fetch notifications",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      upcoming: upcomingResult.notifications || [],
      overdue: overdueResult.overdue || [],
      timestamp: new Date().toISOString(),
    })
    */
  } catch (error) {
    console.error("Error in notifications API:", error)
    return NextResponse.json({ 
      error: "An unexpected error occurred",
      upcoming: [],
      overdue: [],
      timestamp: new Date().toISOString()
    }, { status: 200 }) // Return 200 instead of 500 to prevent fetch errors
  }
}
