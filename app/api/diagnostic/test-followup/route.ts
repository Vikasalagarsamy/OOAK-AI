import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// Disable static generation for this API route
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const leadId = searchParams.get("leadId")
  const followupType = searchParams.get("type") || "phone"

  if (!leadId || isNaN(Number(leadId))) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid lead ID provided",
      },
      { status: 400 },
    )
  }

  const supabase = createClient()

  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 },
      )
    }

    // Create minimal test data
    const testData = {
      lead_id: Number(leadId),
      scheduled_at: new Date().toISOString(),
      followup_type: followupType,
      status: "scheduled",
      priority: "medium",
      created_by: String(user.id),
    }

    console.log("Testing follow-up creation with data:", testData)

    const { data, error } = await supabase.from("lead_followups").insert(testData).select()

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: `Test failed: ${error.message}`,
          error: error,
        },
        { status: 500 },
      )
    }

    // Clean up the test data
    if (data && data[0] && data[0].id) {
      await supabase.from("lead_followups").delete().eq("id", data[0].id)
    }

    return NextResponse.json({
      success: true,
      message: "Test follow-up creation succeeded",
      data: data,
    })
  } catch (error: any) {
    console.error("Error in test-followup API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Unexpected error during test",
        error: error.message || String(error),
      },
      { status: 500 },
    )
  }
}
