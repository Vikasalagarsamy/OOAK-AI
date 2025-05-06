import { NextResponse } from "next/server"
import { getMenuForCurrentUser } from "@/services/menu-service"

export async function GET() {
  try {
    console.log("API route /api/menu called")

    // Add a try-catch block specifically for the menu service call
    try {
      const menu = await getMenuForCurrentUser()

      if (!menu || menu.length === 0) {
        console.log("API route /api/menu: No menu items returned from service")
      } else {
        console.log(`API route /api/menu: Returning ${menu.length} top-level menu items`)
      }

      return NextResponse.json(menu || [])
    } catch (menuError) {
      console.error("Error in getMenuForCurrentUser:", menuError)
      return NextResponse.json(
        {
          error: "Menu service error",
          message: menuError instanceof Error ? menuError.message : String(menuError),
          stack: process.env.NODE_ENV !== "production" && menuError instanceof Error ? menuError.stack : undefined,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unhandled error in menu API route:", error)
    return NextResponse.json(
      {
        error: "Unhandled API error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
