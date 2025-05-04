import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Get the admin session cookie
  const adminSession = request.cookies.get("admin_session")?.value

  // Check if the path is for admin login
  const isAdminLoginPath = request.nextUrl.pathname === "/admin/login"

  // If there's no admin session and the path is not the login page, redirect to login
  if (!adminSession && !isAdminLoginPath && request.nextUrl.pathname.startsWith("/admin")) {
    const loginUrl = new URL("/admin/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If there's an admin session and the path is the login page, redirect to dashboard
  if (adminSession && isAdminLoginPath) {
    const dashboardUrl = new URL("/admin/dashboard", request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
