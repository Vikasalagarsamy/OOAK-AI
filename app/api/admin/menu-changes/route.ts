import { NextResponse } from "next/server"
import { detectMenuChanges, updateMenuTracking } from "@/services/unified-menu-service"

export async function GET() {
  try {
    const changes = await detectMenuChanges()
    return NextResponse.json(changes)
  } catch (error) {
    console.error("Error detecting menu changes:", error)
    return NextResponse.json({ error: "Failed to detect menu changes" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const success = await updateMenuTracking()

    if (success) {
      return NextResponse.json({ success: true, message: "Menu tracking updated successfully" })
    } else {
      return NextResponse.json({ error: "Failed to update menu tracking" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating menu tracking:", error)
    return NextResponse.json({ error: "Failed to update menu tracking" }, { status: 500 })
  }
}
