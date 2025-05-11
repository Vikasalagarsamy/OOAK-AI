import { NextResponse } from "next/server"
import { getMenuForCurrentUser } from "@/services/menu-service"
import { getCurrentUser } from "@/actions/auth-actions"

export async function GET() {
  try {
    // First check if user is authenticated
    const user = await getCurrentUser()

    if (!user) {
      console.log("API: No authenticated user found")
      return NextResponse.json([], {
        status: 401,
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    }

    console.log(`API: Fetching menu for user ${user.username} (${user.id})`)

    // Get menu items for the current user
    const menuItems = await getMenuForCurrentUser()

    console.log(`API: Returning ${menuItems.length} menu items`)

    // Return the menu items with cache control headers
    return NextResponse.json(menuItems, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error in menu API:", error)
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  }
}
