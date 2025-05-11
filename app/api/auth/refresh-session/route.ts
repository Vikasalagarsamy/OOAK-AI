import { type NextRequest, NextResponse } from "next/server"
import { refreshUserSession } from "@/actions/auth-actions"

export async function POST(req: NextRequest) {
  try {
    const result = await refreshUserSession()

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 })
    }
  } catch (error) {
    console.error("Error refreshing session:", error)
    return NextResponse.json({ success: false, error: "Failed to refresh session" }, { status: 500 })
  }
}
