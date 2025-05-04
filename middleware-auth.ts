import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const session = request.cookies.get("session")
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth")

  // If accessing auth pages while logged in, redirect to profile
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/profile", request.url))
  }

  // If accessing protected pages without being logged in, redirect to login
  if (!isAuthPage && !session) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/profile/:path*", "/auth/:path*"],
}
