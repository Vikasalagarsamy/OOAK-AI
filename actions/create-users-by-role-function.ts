"use server"

import { query, transaction } from "@/lib/postgresql-client"

export async function createGetUsersByRoleFunction() {
  try {
    console.log("🔧 Creating get_users_by_role function using PostgreSQL...")

    const sql = `
    -- Function to get users by role
    CREATE OR REPLACE FUNCTION public.get_users_by_role(p_role_id INTEGER)
    RETURNS TABLE (
      id INTEGER,
      username TEXT,
      email TEXT,
      first_name TEXT,
      last_name TEXT,
      role_id INTEGER,
      role_name TEXT
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        ua.id,
        ua.username,
        ua.email,
        e.first_name,
        e.last_name,
        r.id AS role_id,
        r.title AS role_name
      FROM 
        user_accounts ua
      JOIN 
        employees e ON ua.employee_id = e.id
      JOIN 
        roles r ON ua.role_id = r.id
      WHERE 
        ua.role_id = p_role_id
        AND ua.is_active = true;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Grant execute permission
    GRANT EXECUTE ON FUNCTION public.get_users_by_role(INTEGER) TO authenticated;
    `

    // Execute the SQL directly using PostgreSQL
    await query(sql)

    console.log("✅ get_users_by_role function created successfully")
    return { success: true }
  } catch (error: any) {
    console.error("Error creating get_users_by_role function:", error)
    return { success: false, error: error.message }
  }
}
