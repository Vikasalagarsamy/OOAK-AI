import { NextResponse } from "next/server"
import { query, transaction } from "@/lib/postgresql-client"
import { getCurrentUser } from "@/actions/auth-actions"

export async function GET(request: Request) {
  try {
    console.log('🔐 Permissions API called via PostgreSQL')
    
    const url = new URL(request.url)
    const path = url.searchParams.get("path")

    if (!path) {
      return NextResponse.json({ error: "Path parameter is required" }, { status: 400 })
    }

    const user = await getCurrentUser()

    if (!user) {
      console.log('🔐 No user found, returning no permissions')
      return NextResponse.json(
        { canView: false, canAdd: false, canEdit: false, canDelete: false },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    }

    console.log(`🔐 Checking permissions for user ${user.id} on path: ${path}`)

    try {
      // Check all permission types in a single query for better performance
      const result = await query(`
        SELECT 
          MAX(CASE WHEN p.action = 'view' AND rp.granted = true THEN 1 ELSE 0 END) as can_view,
          MAX(CASE WHEN p.action = 'add' AND rp.granted = true THEN 1 ELSE 0 END) as can_add,
          MAX(CASE WHEN p.action = 'edit' AND rp.granted = true THEN 1 ELSE 0 END) as can_edit,
          MAX(CASE WHEN p.action = 'delete' AND rp.granted = true THEN 1 ELSE 0 END) as can_delete
        FROM employees e
        JOIN roles r ON e.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE e.id = $1 
          AND e.status = 'active'
          AND (p.resource = 'menu' AND p.action IN ('view', 'add', 'edit', 'delete'))
          AND (
            p.resource = $2 
            OR p.resource = 'menu'
            OR EXISTS (
              SELECT 1 FROM menu_items mi 
              WHERE mi.url = $2 AND p.resource = 'menu'
            )
          )
      `, [user.id, path])

      const permissions = result.rows[0] || {
        can_view: 0,
        can_add: 0,
        can_edit: 0,
        can_delete: 0
      }

      const responseData = {
        canView: Boolean(permissions.can_view),
        canAdd: Boolean(permissions.can_add),
        canEdit: Boolean(permissions.can_edit),
        canDelete: Boolean(permissions.can_delete),
      }

      console.log(`✅ Permissions checked for ${path}:`, responseData)

      return NextResponse.json(responseData, {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

    } catch (dbError) {
      console.error("❌ Database error checking permissions:", dbError)
      
      // Fallback: return minimal permissions for safety
      return NextResponse.json(
        { canView: false, canAdd: false, canEdit: false, canDelete: false },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    }

  } catch (error) {
    console.error("❌ Error in permissions API (PostgreSQL):", error)
    return NextResponse.json({ error: "Failed to check permissions" }, { status: 500 })
  }
}
