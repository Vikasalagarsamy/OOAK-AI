import { NextResponse } from "next/server"
import { getEnhancedMenuForCurrentUser } from "@/services/enhanced-menu-service"

export async function GET() {
  try {
    const menuItems = await getEnhancedMenuForCurrentUser()

    // Ensure we're returning a valid array
    return NextResponse.json({
      items: Array.isArray(menuItems) ? menuItems : [],
      success: true,
    })
  } catch (error) {
    console.error("Error in enhanced-menu API route:", error)

    // Return empty array on error
    return NextResponse.json(
      {
        items: [],
        success: false,
        error: "Failed to load menu",
      },
      { status: 500 },
    )
  }
}
