import { NextResponse } from "next/server"
import { refreshUserSession } from "@/actions/auth-actions"

export async function POST() {
  try {
    const result = await refreshUserSession()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Session refreshed successfully",
        timestamp: new Date().toISOString(),
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
    console.error("Session refresh error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
