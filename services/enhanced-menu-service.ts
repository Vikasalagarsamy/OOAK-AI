import { createClient } from "@/lib/supabase-server"
import type { MenuItem } from "@/types/menu"

// Get the current user ID from the session
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.warn("No authenticated session found when getting current user ID")
      return null
    }

    return session.user.id
  } catch (error) {
    console.error("Error getting current user ID:", error)
    return null
  }
}

// Get the role ID for the current user
export async function getUserRoleId(userId: string | null): Promise<number | null> {
  if (!userId) {
    console.warn("No user ID provided when getting user role")
    return null
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("user_accounts").select("role_id").eq("user_id", userId).single()

    if (error) {
      console.error("Error fetching user role:", error)
      return null
    }

    return data?.role_id || null
  } catch (error) {
    console.error("Error in getUserRoleId:", error)
    return null
  }
}

// Get menu items for a specific role
export async function getMenuItemsForRole(roleId: number | null): Promise<MenuItem[]> {
  if (!roleId) {
    console.warn("No role ID provided when getting menu items")
    return []
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc("get_complete_menu_hierarchy", {
      p_role_id: roleId,
    })

    if (error) {
      console.error("Error fetching menu hierarchy:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getMenuItemsForRole:", error)
    return []
  }
}

// Get enhanced menu for the current user
export async function getEnhancedMenuForCurrentUser(userId?: string | null): Promise<MenuItem[]> {
  try {
    // If userId is provided, use it; otherwise, get it from the session
    const currentUserId = userId || (await getCurrentUserId())

    if (!currentUserId) {
      console.warn("No user ID available for menu retrieval")
      return []
    }

    const roleId = await getUserRoleId(currentUserId)

    if (!roleId) {
      console.warn(`No role found for user ${currentUserId}`)
      return []
    }

    return await getMenuItemsForRole(roleId)
  } catch (error) {
    console.error("Error getting enhanced menu:", error)
    return []
  }
}
