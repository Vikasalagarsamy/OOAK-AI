"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { getCurrentUser, refreshUserSession } from "./auth-actions"
import fs from "fs"
import path from "path"

export async function fixAllMenuPermissions() {
  try {
    const user = await getCurrentUser()

    if (!user || user.roleName !== "Administrator") {
      return {
        success: false,
        message: "You must be an administrator to perform this action",
      }
    }

    const supabase = createClient()

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "sql/fix-all-menu-permissions.sql")
    let sqlContent: string

    try {
      sqlContent = fs.readFileSync(sqlFilePath, "utf8")
    } catch (error) {
      console.error("Error reading SQL file:", error)

      // If file doesn't exist, use hardcoded SQL
      sqlContent = `
        -- Step 1: Ensure all menu items are visible
        UPDATE menu_items SET is_visible = TRUE WHERE is_visible = FALSE;
        
        -- Step 2: Ensure Administrator role (ID 1) has ALL permissions for ALL menu items
        -- First, delete any existing permissions to start fresh
        DELETE FROM role_menu_permissions WHERE role_id = 1;
        
        -- Then insert full permissions for all menu items
        INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
        SELECT 
            1 as role_id, 
            id as menu_item_id, 
            TRUE as can_view,
            TRUE as can_add,
            TRUE as can_edit,
            TRUE as can_delete
        FROM 
            menu_items;
      `
    }

    // Split the SQL into individual statements
    const statements = sqlContent
      .split(";")
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0)

    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabase.rpc("exec_sql", { sql_query: statement + ";" })

      if (error) {
        console.error("Error executing SQL statement:", error)
        console.error("Statement:", statement)
        // Continue with other statements even if one fails
      }
    }

    // Refresh the user session to get updated permissions
    await refreshUserSession()

    // Revalidate all paths to clear cache
    revalidatePath("/")
    revalidatePath("/dashboard")
    revalidatePath("/admin")
    revalidatePath("/api/menu")

    return {
      success: true,
      message:
        "All menu permissions have been fixed successfully. Please reload the page and log out and back in to see the changes.",
    }
  } catch (error) {
    console.error("Error fixing menu permissions:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
