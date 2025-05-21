import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-helpers"

export async function POST() {
  try {
    // Use the helper to get a client with cookie support
    const supabase = getSupabaseServerClient()

    // Rest of the function remains the same
    const { data, error } = await supabase.from("menu_items").select("*").order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching menu items:", error)
      return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in sync-menus route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
