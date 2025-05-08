import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { roleId: string } }) {
  const roleId = params.roleId

  if (!roleId) {
    return NextResponse.json({ error: "Role ID is required" }, { status: 400 })
  }

  try {
    const supabase = createClient()

    // Query user accounts with the specified role
    const { data, error } = await supabase
      .from("user_accounts")
      .select(`
        id,
        username,
        email,
        employees!inner(first_name, last_name),
        roles!inner(name)
      `)
      .eq("role_id", roleId)
      .eq("is_active", true)

    if (error) {
      throw error
    }

    // Format the data for the frontend
    const formattedUsers = data.map((user) => ({
      id: user.id,
      name: user.employees ? `${user.employees.first_name} ${user.employees.last_name}` : user.username,
      email: user.email,
      role_name: user.roles ? user.roles.name : "Unknown",
    }))

    return NextResponse.json(formattedUsers)
  } catch (error: any) {
    console.error("Error fetching users by role:", error)
    return NextResponse.json({ error: `Failed to fetch users: ${error.message}` }, { status: 500 })
  }
}
