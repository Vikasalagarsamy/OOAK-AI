import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      // Return a default menu when no session exists
      return NextResponse.json({ items: [] }, { status: 200 })
    }

    // Get menu items for the authenticated user
    const { data, error } = await supabase.from("menu_items").select("*").order("sort_order", { ascending: true })

    if (error) {
      console.error("Error fetching menu:", error)
      return NextResponse.json({ items: [], error: error.message }, { status: 500 })
    }

    // Transform the data to the expected format
    const menuItems = data.map((item) => ({
      id: item.id,
      name: item.name,
      path: item.path,
      icon: item.icon,
      parentId: item.parent_id,
      sortOrder: item.sort_order,
    }))

    return NextResponse.json({ items: menuItems })
  } catch (error) {
    console.error("Error in enhanced menu API:", error)
    return NextResponse.json({ items: [], error: "Failed to fetch menu" }, { status: 500 })
  }
}
