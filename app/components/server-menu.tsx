import { getCompleteMenuForUser } from "@/services/direct-menu-service"
import { getCurrentUser } from "@/actions/auth-actions"
import { MenuRenderer } from "@/components/dynamic-menu/menu-renderer"

export async function ServerMenu() {
  const user = await getCurrentUser()

  if (!user) {
    return <div>Please log in to view the menu</div>
  }

  try {
    const menuItems = await getCompleteMenuForUser(user.id)

    // Log the menu items for debugging
    console.log(`Server-rendered menu for user ${user.username}: ${menuItems.length} items`)

    return <MenuRenderer menuItems={menuItems} />
  } catch (error) {
    console.error("Error rendering server menu:", error)
    return <div>Error loading menu</div>
  }
}
