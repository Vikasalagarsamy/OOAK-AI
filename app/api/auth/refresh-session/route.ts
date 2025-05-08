import { type NextRequest, NextResponse } from "next/server"
import { refreshUserSession } from "@/actions/auth-actions"

export async function POST(req: NextRequest) {
  try {
    const result = await refreshUserSession()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Session refreshed successfully",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to refresh session",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error in refresh session API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while refreshing the session",
      },
      { status: 500 },
    )
  }
}
