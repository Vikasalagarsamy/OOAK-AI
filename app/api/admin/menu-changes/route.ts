import { NextResponse } from "next/server"
import { detectMenuChanges, updateMenuTracking } from "@/services/unified-menu-service"

export async function GET() {
  try {
    // Detect menu changes
    const changes = await detectMenuChanges()

    return NextResponse.json({
      success: true,
      changes,
    })
  } catch (error) {
    console.error("Error detecting menu changes:", error)
    return NextResponse.json({ error: "Failed to detect menu changes" }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Update the menu tracking table
    const success = await updateMenuTracking()

    return NextResponse.json({
      success,
      message: success ? "Menu tracking updated successfully" : "Failed to update menu tracking",
    })
  } catch (error) {
    console.error("Error updating menu tracking:", error)
    return NextResponse.json({ error: "Failed to update menu tracking" }, { status: 500 })
  }
}
