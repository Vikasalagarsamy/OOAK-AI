import { NextResponse } from "next/server"
import { getCurrentUser } from "@/actions/auth-actions"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        message: "Not authenticated",
      })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        roleId: user.roleId,
        roleName: user.roleName,
        isAdmin: user.isAdmin,
      },
    })
  } catch (error) {
    console.error("Error in auth status API:", error)
    return NextResponse.json(
      {
        authenticated: false,
        error: "Error checking authentication status",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
