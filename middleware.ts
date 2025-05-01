import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This middleware has been modified to bypass authentication
export async function middleware(req: NextRequest) {
  // Simply allow all requests to proceed without authentication
  return NextResponse.next()
}

// Keep the matcher to maintain the structure, but authentication is bypassed
export const config = {
  matcher: ["/people/:path*", "/organization/:path*", "/sales/:path*", "/audit/:path*"],
}
