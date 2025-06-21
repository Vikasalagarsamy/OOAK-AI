import { NextResponse } from "next/server"
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function POST(request: Request) {
  try {
    const { name, path, icon, parent_string_id, section_name, sort_order } = await request.json()

    // Generate string_id from name
    const string_id = `${section_name.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

    console.log('🍃 Creating menu item in PostgreSQL:', { name, path, string_id, section_name })

    const client = await pool.connect()
    
    // Start transaction for menu item creation and permission setup
    await client.query('BEGIN')

    try {
      // Create the menu item with enhanced metadata
      const insertMenuQuery = `
        INSERT INTO menu_items (
          name,
          path,
          icon,
          parent_string_id,
          section_name,
          sort_order,
          string_id,
          is_visible,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `

      const menuValues = [
        name,
        path,
        icon,
        parent_string_id,
        section_name,
        sort_order,
        string_id,
        true,
        new Date().toISOString(),
        new Date().toISOString()
      ]

      const menuResult = await client.query(insertMenuQuery, menuValues)
      const newItem = menuResult.rows[0]

      console.log('✅ Menu item created:', newItem.id)

      // Get admin role for permissions setup
      const adminRoleQuery = `
        SELECT id FROM roles 
        WHERE title IN ('Administrator', 'Admin') 
        LIMIT 1
      `
      
      const adminResult = await client.query(adminRoleQuery)

      if (adminResult.rows.length > 0) {
        const adminRoleId = adminResult.rows[0].id

        // Check if permission already exists to prevent duplicates
        const existingPermQuery = `
          SELECT id FROM role_menu_permissions 
          WHERE role_id = $1 AND menu_string_id = $2
        `
        
        const existingPerm = await client.query(existingPermQuery, [adminRoleId, string_id])

        if (existingPerm.rows.length === 0) {
          // Add permissions for admin role
          const permissionQuery = `
            INSERT INTO role_menu_permissions (
              role_id,
              menu_string_id,
              can_view,
              can_add,
              can_edit,
              can_delete,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
          `

          const permissionValues = [
            adminRoleId,
            string_id,
            true,
            true,
            true,
            true,
            new Date().toISOString(),
            new Date().toISOString()
          ]

          const permResult = await client.query(permissionQuery, permissionValues)
          console.log('✅ Admin permissions created:', permResult.rows[0].id)
        } else {
          console.log('ℹ️ Admin permissions already exist for menu item')
        }
      } else {
        console.log('⚠️ Admin role not found - permissions not set')
      }

      await client.query('COMMIT')
      client.release()

      return NextResponse.json({
        success: true,
        message: "Menu item created successfully in PostgreSQL",
        data: newItem,
        metadata: {
          source: "Direct PostgreSQL",
          timestamp: new Date().toISOString(),
          permissions_set: adminResult.rows.length > 0
        }
      })
      
    } catch (transactionError) {
      await client.query('ROLLBACK')
      client.release()
      throw transactionError
    }

  } catch (error: any) {
    console.error("❌ Error in menu-items PostgreSQL API:", error)
    return NextResponse.json(
      { 
        error: "Failed to create menu item", 
        details: error.message,
        source: "PostgreSQL"
      }, 
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    console.log('🍃 Fetching menu items from PostgreSQL...')
    
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')
    const includePermissions = searchParams.get('permissions') === 'true'
    
    const client = await pool.connect()
    
    let query = `
      SELECT 
        mi.*,
        COUNT(rmp.id) as total_permissions
      FROM menu_items mi
      LEFT JOIN role_menu_permissions rmp ON mi.string_id = rmp.menu_string_id
    `
    
    let params: any[] = []
    let paramCount = 0
    
    if (section) {
      paramCount++
      query += ` WHERE mi.section_name = $${paramCount}`
      params.push(section)
    }
    
    query += `
      GROUP BY mi.id
      ORDER BY mi.section_name, mi.sort_order, mi.name
    `
    
    const result = await client.query(query, params)
    
    // If permissions requested, get detailed permissions
    let permissionsData = {}
    if (includePermissions && result.rows.length > 0) {
      const menuIds = result.rows.map(item => item.string_id)
      const permQuery = `
        SELECT 
          rmp.*,
          r.title as role_title
        FROM role_menu_permissions rmp
        JOIN roles r ON rmp.role_id = r.id
        WHERE rmp.menu_string_id = ANY($1)
        ORDER BY r.title
      `
      
      const permResult = await client.query(permQuery, [menuIds])
      
      permissionsData = permResult.rows.reduce((acc, perm) => {
        if (!acc[perm.menu_string_id]) {
          acc[perm.menu_string_id] = []
        }
        acc[perm.menu_string_id].push(perm)
        return acc
      }, {} as Record<string, any[]>)
    }
    
    client.release()

    console.log(`✅ Found ${result.rows.length} menu items from PostgreSQL`)

    return NextResponse.json({
      success: true,
      menu_items: result.rows,
      permissions: includePermissions ? permissionsData : undefined,
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString(),
        total: result.rows.length,
        section_filter: section,
        permissions_included: includePermissions
      }
    })

  } catch (error: any) {
    console.error("❌ Error fetching menu items from PostgreSQL:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch menu items", 
        details: error.message,
        source: "PostgreSQL"
      }, 
      { status: 500 }
    )
  }
} 