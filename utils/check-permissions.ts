import { supabase } from "@/lib/supabase"

export async function checkPermission(
  userId: string,
  permissionPath: string,
  action: "view" | "read" | "write" | "delete" = "view",
): Promise<boolean> {
  try {
    // Get user role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role_id")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      console.error("Error fetching user role:", userError)
      return false
    }

    // Get role permissions
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("permissions")
      .eq("id", userData.role_id)
      .single()

    if (roleError || !roleData) {
      console.error("Error fetching role permissions:", roleError)
      return false
    }

    // Parse permissions
    const permissions =
      typeof roleData.permissions === "string" ? JSON.parse(roleData.permissions) : roleData.permissions

    // Check if user has required permission
    const permissionObj = permissions[permissionPath]
    return permissionObj && permissionObj[action] === true
  } catch (error) {
    console.error("Error checking permissions:", error)
    return false
  }
}
