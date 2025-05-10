import { NextResponse } from "next/server"
import { getMenuForCurrentUser } from "@/services/menu-service"

export async function GET() {
  try {
    console.log("API route: /api/menu - Fetching menu for current user")

    // Add stronger cache control headers to prevent caching
    const headers = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
      "X-Menu-Timestamp": new Date().toISOString(),
    }

    const menu = await getMenuForCurrentUser()
    console.log(`API route: /api/menu - Returning ${menu.length} menu items`)

    return NextResponse.json(menu, { headers })
  } catch (error) {
    console.error("API route: /api/menu - Error:", error)
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 })
  }
}
