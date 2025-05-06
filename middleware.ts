import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

export async function middleware(req: NextRequest) {
  // Public paths that don't require authentication
  const publicPaths = ["/login", "/forgot-password"]
  const path = req.nextUrl.pathname

  // Allow access to public paths and static files
  if (
    publicPaths.includes(path) ||
    path.startsWith("/_next") ||
    path.startsWith("/api/") ||
    path.includes("favicon.ico") ||
    path.includes(".png") ||
    path.includes(".jpg") ||
    path.includes(".svg")
  ) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  const authToken = req.cookies.get("auth_token")?.value

  if (!authToken) {
    console.log("No auth token, redirecting to login")
    // Redirect to login if no token exists
    const url = new URL("/login", req.url)
    url.searchParams.set("reason", "unauthenticated")
    url.searchParams.set("from", path)
    return NextResponse.redirect(url)
  }

  try {
    // Verify the authentication token
    const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
    const secretKey = new TextEncoder().encode(secret)

    const { payload } = await jwtVerify(authToken, secretKey, {
      algorithms: ["HS256"],
    })

    // For admin-only paths, verify admin role
    const adminPaths = ["/admin"]
    if (adminPaths.some((adminPath) => path.startsWith(adminPath))) {
      if (payload.roleName !== "Administrator") {
        // Not an admin, redirect to dashboard with error message
        const url = new URL("/dashboard", req.url)
        url.searchParams.set("error", "insufficient_permissions")
        return NextResponse.redirect(url)
      }
    }

    // Allow the request to proceed
    return NextResponse.next()
  } catch (error) {
    console.error("Auth middleware error:", error)

    // Clear the invalid token and redirect to login
    const response = NextResponse.redirect(new URL("/login", req.url))
    response.cookies.delete("auth_token")
    return response
  }
}

// Apply middleware to all routes except public assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
}
