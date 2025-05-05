import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

// This middleware replaces the previous one that was bypassing authentication
export async function middleware(req: NextRequest) {
  // Public paths that don't require authentication
  const publicPaths = ["/login", "/forgot-password"]

  const path = req.nextUrl.pathname

  // Allow public paths
  if (publicPaths.includes(path) || path.startsWith("/_next") || path.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  const authToken = req.cookies.get("auth_token")?.value

  if (!authToken) {
    // Redirect to login if no token exists
    const url = new URL("/login", req.url)
    url.searchParams.set("redirectTo", path)
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

    // Update headers with user info for use in the application
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-user-id", payload.sub as string)
    requestHeaders.set("x-user-role", payload.roleName as string)

    // Allow the request to proceed with the additional headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
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
