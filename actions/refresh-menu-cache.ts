"use server"
import { revalidatePath } from "next/cache"

export async function refreshMenuCache() {
  try {
    // Revalidate the paths that might be using the menu data
    revalidatePath("/admin")
    revalidatePath("/admin/menu-permissions")
    revalidatePath("/admin/role-permissions")

    // You could also clear any server-side caches here if needed

    return { success: true, message: "Menu cache refreshed successfully" }
  } catch (error) {
    console.error("Error refreshing menu cache:", error)
    return { success: false, message: "Failed to refresh menu cache" }
  }
}
