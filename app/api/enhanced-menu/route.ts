import { NextResponse } from "next/server"
import { getEnhancedMenuForCurrentUser } from "@/services/enhanced-menu-service"

export async function GET() {
  try {
    console.log("API route: /api/enhanced-menu - Fetching enhanced menu for current user")

    // Add stronger cache control headers to prevent caching
    const headers = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    }

    const menu = await getEnhancedMenuForCurrentUser()
    console.log(`API route: /api/enhanced-menu - Returning ${menu.length} menu items`)

    return NextResponse.json(menu, { headers })
  } catch (error) {
    console.error("API route: /api/enhanced-menu - Error:", error)
    return NextResponse.json({ error: "Failed to fetch enhanced menu" }, { status: 500 })
  }
}
