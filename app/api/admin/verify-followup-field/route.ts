import { type NextRequest, NextResponse } from "next/server"
import { testFollowupScheduling } from "@/verification/test-followup-scheduling"
import { getCurrentUser } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  // Verify user authentication and authorization
  const currentUser = await getCurrentUser()
  if (!currentUser || !currentUser.isAdmin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { leadId } = body

    if (!leadId || isNaN(Number(leadId))) {
      return NextResponse.json({ success: false, message: "Invalid lead ID" }, { status: 400 })
    }

    const result = await testFollowupScheduling(Number(leadId))
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in verify-followup-field API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify follow-up field",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
