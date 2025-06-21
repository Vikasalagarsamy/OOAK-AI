import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'
import { getCurrentUser } from '@/actions/auth-actions'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  const client = await pool.connect()
  try {
    // Get current user for security
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized access. Admin privileges required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('roleId')

    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔐 Loading permissions for role ID: ${roleId}`)

    // Get role permissions from PostgreSQL
    const permissionsQuery = `
      SELECT * FROM role_menu_permissions 
      WHERE role_id = $1
      ORDER BY menu_item_id
    `
    
    const result = await client.query(permissionsQuery, [parseInt(roleId)])
    const permissions = result.rows

    console.log(`✅ Found ${permissions?.length || 0} permissions for role ${roleId}`)

    // Create reverse mapping from database numeric IDs to enterprise menu string IDs
    const reverseMenuIdMapping: { [numericId: number]: string } = {
      // Core Business (2 items)
      1: 'dashboard',
      2: 'ai-control',
      
      // Organization (8 items)
      3: 'organization-companies',
      4: 'organization-branches',
      5: 'organization-vendors',
      6: 'organization-suppliers',
      7: 'organization-clients',
      8: 'organization-roles',
      9: 'organization-user-accounts',
      10: 'organization-account-creation',
      
      // Legacy People items (moved to organization)
      11: 'people-employees',
      12: 'people-departments',
      
      // Sales & Revenue (14 items)
      13: 'sales-dashboard',
      14: 'sales-create-lead',
      15: 'sales-my-leads',
      16: 'sales-unassigned-leads',
      17: 'sales-follow-up',
      18: 'sales-quotations',
      19: 'sales-approvals',
      20: 'sales-rejected-quote',
      21: 'sales-order-confirmation',
      22: 'sales-rejected-leads',
      23: 'sales-lead-sources',
      24: 'sales-ai-insights',
      25: 'sales-call-analytics',
      26: 'sales-head-analytics',
      
      // People & HR (4 items)
      29: 'people-dashboard',
      30: 'people-employees',
      31: 'people-departments',
      32: 'people-designations',
      
      // Task Management (9 items)
      33: 'tasks-dashboard',
      34: 'tasks-admin',
      35: 'tasks-ai-generator',
      36: 'tasks-analytics',
      37: 'tasks-calendar',
      38: 'tasks-migration',
      39: 'tasks-reports',
      40: 'tasks-sequences',
      41: 'tasks-sequences-integration',
      
      // Accounting & Finance (4 items)
      42: 'accounting-dashboard',
      43: 'accounting-invoices',
      44: 'accounting-payments',
      45: 'accounting-expenses',
      
      // Event Coordination (7 items)
      46: 'events-dashboard',
      47: 'events-calendar',
      48: 'events-list',
      49: 'events-types',
      50: 'events-services',
      51: 'events-venues',
      52: 'events-staff',
      
      // Post Production (8 items)
      53: 'post-production-dashboard',
      54: 'post-production-deliverables',
      55: 'post-production-deliverables-workflow',
      56: 'post-production-projects',
      57: 'post-production-workflow',
      58: 'post-production-quality',
      59: 'post-production-review',
      60: 'post-production-delivery',
      
      // Post-Sales (4 items)
      61: 'post-sales-dashboard',
      62: 'post-sales-delivery',
      63: 'post-sales-support',
      64: 'post-sales-feedback',
      
      // Reports & Analytics (5 items)
      65: 'reports-lead-sources',
      66: 'reports-conversion-funnel',
      67: 'reports-team-performance',
      68: 'reports-trends',
      69: 'reports-custom',
      
      // System Administration (8 items)
      70: 'admin-dashboard',
      71: 'admin-database-monitor',
      72: 'admin-menu-permissions',
      73: 'admin-system-settings',
      74: 'admin-menu-repair',
      75: 'admin-menu-debug',
      76: 'admin-test-permissions',
      77: 'admin-test-feature'
    }

    // Convert permissions to include enterprise menu string IDs
    const mappedPermissions = permissions?.map(perm => ({
      ...perm,
      menu_string_id: reverseMenuIdMapping[perm.menu_item_id] || `unknown-${perm.menu_item_id}`
    })) || []

    // Get role details for context
    const roleQuery = `
      SELECT r.*, d.name as department_name
      FROM roles r
      LEFT JOIN departments d ON r.department_id = d.id
      WHERE r.id = $1
    `
    const roleResult = await client.query(roleQuery, [parseInt(roleId)])
    const roleDetails = roleResult.rows[0]

    return NextResponse.json({
      success: true,
      permissions: mappedPermissions,
      roleId: parseInt(roleId),
      roleDetails: roleDetails || null,
      mapping_info: {
        total_mapped: mappedPermissions.filter(p => !p.menu_string_id.startsWith('unknown-')).length,
        unmapped: mappedPermissions.filter(p => p.menu_string_id.startsWith('unknown-')).length
      },
      database: {
        source: 'PostgreSQL',
        connection: 'direct'
      }
    })

  } catch (error: any) {
    console.error('❌ Exception in GET /api/role-permissions:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

// POST endpoint to update role permissions
export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    // Get current user for security
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized access. Admin privileges required.' },
        { status: 401 }
      )
    }

    const { roleId, permissions } = await request.json()

    if (!roleId || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Role ID and permissions array are required' },
        { status: 400 }
      )
    }

    console.log(`🔐 Updating permissions for role ID: ${roleId}`)

    await client.query('BEGIN')

    try {
      // Clear existing permissions
      const deleteQuery = `DELETE FROM role_menu_permissions WHERE role_id = $1`
      await client.query(deleteQuery, [roleId])

      // Insert new permissions
      if (permissions.length > 0) {
        const insertQuery = `
          INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_edit, can_delete)
          VALUES ($1, $2, $3, $4, $5)
        `
        
        for (const permission of permissions) {
          await client.query(insertQuery, [
            roleId,
            permission.menu_item_id,
            permission.can_view || false,
            permission.can_edit || false,
            permission.can_delete || false
          ])
        }
      }

      await client.query('COMMIT')

      console.log(`✅ Updated ${permissions.length} permissions for role ${roleId}`)

      return NextResponse.json({
        success: true,
        message: `Role permissions updated successfully`,
        roleId: roleId,
        permissionsCount: permissions.length
      })

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }

  } catch (error: any) {
    console.error('❌ Exception in POST /api/role-permissions:', error)
    return NextResponse.json(
      { error: 'Failed to update role permissions', details: error.message },
      { status: 500 }
    )
  } finally {
    client.release()
  }
} 