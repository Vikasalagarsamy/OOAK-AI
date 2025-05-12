import { type NextRequest, NextResponse } from "next/server"
import { verifyFollowupField } from "@/actions/verify-followup-field"
import { addIsTestColumnToFollowups } from "@/actions/add-is-test-column"

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    const { leadId } = body

    if (!leadId || isNaN(Number(leadId))) {
      return NextResponse.json(
        { success: false, message: "Invalid lead ID", details: "Lead ID must be a number" },
        { status: 400 },
      )
    }

    // Ensure the database is prepared
    const prepResult = await addIsTestColumnToFollowups()
    if (!prepResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to prepare database",
          details: prepResult.error || "Could not add required columns",
        },
        { status: 500 },
      )
    }

    // Run the verification
    const result = await verifyFollowupField(Number(leadId))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in verify-followup-field API:", error)

    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
