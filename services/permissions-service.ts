import { createClient } from "@/lib/supabase"
import type { Role, Permission, RolePermission } from "@/types/permissions"

/**
 * Service for managing roles and permissions
 */
export async function getRoles(): Promise<Role[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("audit_security.roles")
      .select("id, name, description, status, created_at, updated_at")
      .order("name")

    if (error) {
      console.error("Error fetching roles:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error in getRoles:", error)
    return []
  }
}

export async function getPermissions(): Promise<Permission[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("audit_security.permissions")
      .select("id, name, description, resource, action, status, created_at, updated_at")
      .order("resource, action")

    if (error) {
      console.error("Error fetching permissions:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error in getPermissions:", error)
    return []
  }
}

export async function getRolePermissions(roleId: number): Promise<RolePermission[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("audit_security.role_permissions")
      .select(`
        id, 
        role_id, 
        permission_id, 
        status, 
        created_at, 
        updated_at,
        permissions:permission_id(id, name, resource, action)
      `)
      .eq("role_id", roleId)

    if (error) {
      console.error("Error fetching role permissions:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error in getRolePermissions:", error)
    return []
  }
}

export async function updateRolePermission(roleId: number, permissionId: number, status: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // Check if the permission record exists
    const { data: existingData, error: checkError } = await supabase
      .from("audit_security.role_permissions")
      .select("id")
      .eq("role_id", roleId)
      .eq("permission_id", permissionId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Error checking role permission:", checkError)
      return false
    }

    if (existingData) {
      // Update existing permission
      const { error: updateError } = await supabase
        .from("audit_security.role_permissions")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingData.id)

      if (updateError) {
        console.error("Error updating role permission:", updateError)
        return false
      }
    } else {
      // Insert new permission
      const { error: insertError } = await supabase.from("audit_security.role_permissions").insert({
        role_id: roleId,
        permission_id: permissionId,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Error inserting role permission:", insertError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Unexpected error in updateRolePermission:", error)
    return false
  }
}

export async function getAuditTrail(entityType: string, entityId: string, limit = 10): Promise<any[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("audit_security.audit_trail")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("timestamp", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching audit trail:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error in getAuditTrail:", error)
    return []
  }
}
