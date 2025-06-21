import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client'
import { getCurrentUser } from '@/actions/auth-actions'
import { menuManager } from '@/lib/menu-system'
import type { MenuSection, MenuItemConfig } from '@/lib/menu-system'
import type { UserContext } from '@/types/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({
        error: 'No user found',
        authenticated: false
      })
    }

    const { query, transaction } = createClient()

    // Map database roles to enterprise menu roles
    const mapRoleToMenuRole = (roleName: string): string[] => {
      const role = roleName?.toLowerCase()
      switch (role) {
        case 'sales executive':
          return ['sales_executive']
        case 'sales manager':
          return ['sales_manager']  
        case 'sales head':
          return ['sales_head']
        case 'administrator':
          return ['admin']
        case 'accountant':
          return ['accountant']
        default:
          return ['user']
      }
    }

    const userContext: UserContext = {
      id: user.id,
      username: user.username,
      roles: user.isAdmin ? ['admin'] : mapRoleToMenuRole(user.roleName || 'user'),
      permissions: user.isAdmin ? ['admin', 'view', 'edit', 'delete'] : ['view'],
      isAdmin: user.isAdmin || false
    }

    // Get user's role ID from database
    const { data: userAccount, error: userError } = await supabase
      .from('user_accounts')
      .select('role_id')
      .eq('id', user.id)
      .single()

    // Get role info
    const { data: roleInfo, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', userAccount?.role_id)
      .single()

    // Get database permissions for the user's role
    const { data: dbPermissions, error: permError } = await supabase
      .from('role_menu_permissions')
      .select('*')
      .eq('role_id', userAccount?.role_id)
      .eq('can_view', true)

    // Get filtered menus
    const filteredMenus = await menuManager.getMenuForUser(userContext)

    return NextResponse.json({
      debug: {
        user: {
          id: user.id,
          username: user.username,
          roleName: user.roleName,
          isAdmin: user.isAdmin
        },
        userContext: userContext,
        userAccount: userAccount,
        roleInfo: roleInfo,
        dbPermissions: dbPermissions,
        permissionsCount: dbPermissions?.length || 0,
        filteredMenusCount: filteredMenus.length,
        filteredMenus: filteredMenus.map((section: MenuSection) => ({
          id: section.id,
          name: section.name,
          itemCount: section.items.length,
          items: section.items.map((item: MenuItemConfig) => ({
            id: item.id,
            name: item.name,
            path: item.path
          }))
        })),
        errors: {
          userError: userError?.message,
          roleError: roleError?.message,
          permError: permError?.message
        }
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      details: error.message,
      stack: error.stack
    })
  }
} 