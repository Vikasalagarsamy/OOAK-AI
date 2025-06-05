import { NextRequest, NextResponse } from "next/server"
import { updateOverdueFollowUps } from "@/actions/follow-up-actions"

// Background job to update overdue follow-ups
// This could be called by a cron job or scheduled task
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization here
    const authHeader = request.headers.get("authorization")
    if (process.env.NODE_ENV === "production" && !authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const result = await updateOverdueFollowUps()
    
    return NextResponse.json({
      success: true,
      message: `Updated ${result.updated} overdue follow-ups`,
      updated: result.updated,
      errors: result.errors,
    })
  } catch (error) {
    console.error("Error in overdue follow-ups cron job:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "update-overdue-followups",
    timestamp: new Date().toISOString(),
  })
} 