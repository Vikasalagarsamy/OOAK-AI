import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/actions/auth-actions"

export async function GET(request: NextRequest) {
  try {
    // Wait a small random amount of time to avoid API hammering
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 50))

    // Check if we're in preview mode
    const isPreview =
      process.env.NEXT_PUBLIC_VERCEL_ENV === "development" ||
      process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
      request.headers.get("host")?.includes("localhost") ||
      request.headers.get("host")?.includes("vercel.app")

    // If in preview mode, return admin access
    if (isPreview) {
      console.log("Preview environment detected, returning admin status")
      return NextResponse.json({
        isAuthenticated: true,
        isAdmin: true,
        user: {
          id: "preview-user-id",
          username: "admin",
          roleId: 1,
          roleName: "Administrator",
        },
      })
    }

    // Otherwise, get the current user
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({
        isAuthenticated: false,
        isAdmin: false,
        user: null,
      })
    }

    const supabase = createClient()

    try {
      // Use timeout to prevent hanging request
      const controller = new AbortController()
      const { signal } = controller
      setTimeout(() => controller.abort(), 3000)

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("title")
        .eq("id", user.roleId)
        .single()
        .abortSignal(signal)

      if (roleError) {
        console.error("Error fetching role:", roleError)
        // If we fail to get role, fall back to the role info from the user object
        const isAdmin = user.isAdmin || user.roleName === "Administrator"

        return NextResponse.json({
          isAuthenticated: true,
          isAdmin,
          user: {
            id: user.id,
            username: user.username,
            roleId: user.roleId,
            roleName: user.roleName,
          },
        })
      }

      const isAdmin = roleData?.title === "Administrator" || user.isAdmin

      return NextResponse.json({
        isAuthenticated: true,
        isAdmin,
        user: {
          id: user.id,
          username: user.username,
          roleId: user.roleId,
          roleName: roleData?.title || user.roleName,
        },
      })
    } catch (fetchError) {
      console.error("Error fetching user role:", fetchError)

      // Fallback to user data
      return NextResponse.json({
        isAuthenticated: true,
        isAdmin: user.isAdmin || false,
        user: {
          id: user.id,
          username: user.username,
          roleId: user.roleId,
          roleName: user.roleName || "User",
        },
      })
    }
  } catch (error) {
    console.error("Auth status error:", error)

    // Always return a valid JSON response to prevent client-side errors
    return NextResponse.json(
      {
        isAuthenticated: false,
        isAdmin: false,
        error: "Error checking authentication status",
        user: null,
      },
      { status: 500 },
    )
  }
}
