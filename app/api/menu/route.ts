import { NextResponse } from "next/server"
import { getMenuForCurrentUser } from "@/services/menu-service"

export async function GET() {
  try {
    const menu = await getMenuForCurrentUser()
    return NextResponse.json(menu)
  } catch (error) {
    console.error("Error in menu API:", error)
    return NextResponse.json({ error: "Failed to load menu" }, { status: 500 })
  }
}
