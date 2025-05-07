import { NextResponse } from "next/server"
import { getMenuForCurrentUser } from "@/services/menu-service"

export async function GET() {
  try {
    console.log("API route: /api/menu - Fetching menu for current user")
    const menu = await getMenuForCurrentUser()

    console.log(`API route: /api/menu - Returning ${menu.length} menu items`)
    return NextResponse.json(menu)
  } catch (error) {
    console.error("API route: /api/menu - Error:", error)
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 })
  }
}
