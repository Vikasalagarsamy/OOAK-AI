import { NextRequest, NextResponse } from "next/server"
import { getNotificationFollowUps } from "@/actions/follow-up-actions"

// Get upcoming follow-ups for notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hoursAhead = parseInt(searchParams.get("hours") || "24")
    
    const followUps = await getNotificationFollowUps(hoursAhead)
    
    return NextResponse.json({
      success: true,
      count: followUps.length,
      followUps: followUps.map(f => ({
        id: f.id,
        leadName: f.lead.client_name,
        leadNumber: f.lead.lead_number,
        contactMethod: f.contact_method,
        scheduledAt: f.scheduled_at,
        priority: f.priority,
        notes: f.notes,
        status: f.status,
      })),
    })
  } catch (error) {
    console.error("Error fetching upcoming follow-ups:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Health check
export async function POST() {
  return NextResponse.json({
    status: "ok",
    endpoint: "upcoming-followups",
    timestamp: new Date().toISOString(),
  })
} 