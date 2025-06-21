import { NextRequest, NextResponse } from 'next/server'
import { menuData } from '@/components/menu-system/menu-data'
import { menuPermissionsService } from '@/lib/menu-permissions-service'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching filtered menu based on user permissions...')

    // Get user permissions from request
    const userPermissions = await menuPermissionsService.getUserPermissions(request)
    
    if (!userPermissions) {
      console.log('❌ No user permissions found - returning guest menu')
      // Return minimal menu for unauthenticated users
      return NextResponse.json({
        success: true,
        menu: [
          {
            id: 1,
            name: "Dashboard",
            description: "Access dashboard",
            icon: "Home",
            path: "/dashboard",
            string_id: "dashboard",
            is_visible: true,
            is_admin_only: false,
            badge_variant: "secondary",
            is_new: false,
            category: "primary",
            sort_order: 1
          }
        ],
        user: null,
        message: "Guest menu (no authentication)"
      })
    }

    console.log(`👤 Filtering menu for user: ${userPermissions.roleName} (ID: ${userPermissions.roleId})`)

    // Filter menu based on role permissions
    const filteredMenu = await menuPermissionsService.filterMenuByRole(menuData, userPermissions)

    return NextResponse.json({
      success: true,
      menu: filteredMenu,
      user: {
        roleId: userPermissions.roleId,
        roleName: userPermissions.roleName,
        isAdmin: userPermissions.isAdmin
      },
      menuCount: {
        total: menuData.length,
        filtered: filteredMenu.length
      },
      metadata: {
        source: "Role-based filtered menu",
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('❌ Error fetching filtered menu:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch filtered menu', 
        details: error.message 
      },
      { status: 500 }
    )
  }
} 