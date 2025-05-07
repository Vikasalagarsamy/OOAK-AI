import { NextResponse } from "next/server"
import { getMenuForCurrentUser } from "@/services/menu-service"

export async function GET() {
  try {
    console.log("API route: /api/menu - Fetching menu for current user")

    // Add cache control headers to prevent caching
    const headers = {
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    }

    const menu = await getMenuForCurrentUser()
    console.log(`API route: /api/menu - Returning ${menu.length} menu items`)

    return NextResponse.json(menu, { headers })
  } catch (error) {
    console.error("API route: /api/menu - Error:", error)
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 })
  }
}
