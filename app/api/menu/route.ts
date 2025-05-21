import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    // Create the Supabase client inside the request handler
    const supabase = createClient()

    // Get all menu items
    const { data, error } = await supabase.from("menu_items").select("*").order("sort_order", { ascending: true })

    if (error) {
      console.error("Error fetching menu items:", error)
      return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in menu API:", error)
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}
