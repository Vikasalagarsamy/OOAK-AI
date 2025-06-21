import { createClient } from '@/lib/postgresql-client'
import { NextResponse } from "next/server"
import { updateFollowUpWithLeadStatus } from "@/actions/follow-up-actions"
import { getSuggestedLeadStatuses } from "@/lib/follow-up-utils"

export async function POST(request: Request) {
  try {
    const { followUpId, outcome, leadStatus } = await request.json()

    // Example: Complete a follow-up with lead status update
    const result = await updateFollowUpWithLeadStatus(followUpId, "completed", {
      completed_at: new Date().toISOString(),
      outcome: outcome || "Demo completion",
      duration_minutes: 30,
      follow_up_required: false,
      lead_status: leadStatus,
    })

    return NextResponse.json({
      success: true,
      message: "Follow-up and lead status updated successfully",
      result,
    })
  } catch (error) {
    console.error("Error in demo endpoint:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const outcome = searchParams.get("outcome") || ""

    // Get suggested lead statuses based on outcome
    const suggestedStatuses = getSuggestedLeadStatuses(outcome)

    return NextResponse.json({
      outcome,
      suggestedStatuses,
      message: `Found ${suggestedStatuses.length} suggested statuses for outcome: "${outcome}"`,
    })
  } catch (error) {
    console.error("Error getting suggestions:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
} 