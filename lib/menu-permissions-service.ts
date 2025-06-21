import { pool } from '@/lib/postgresql-client'
import { MenuItem } from '@/components/menu-system/menu-data'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

interface MenuPermission {
  menu_string_id: string
  can_view: boolean
  can_add: boolean
  can_edit: boolean
  can_delete: boolean
}

interface UserPermissions {
  userId: number
  roleId: number
  roleName: string
  isAdmin: boolean
}

export class MenuPermissionsService {
  private static instance: MenuPermissionsService
  private permissionCache = new Map<string, MenuPermission[]>()
  private cacheExpiry = new Map<string, number>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): MenuPermissionsService {
    if (!MenuPermissionsService.instance) {
      MenuPermissionsService.instance = new MenuPermissionsService()
    }
    return MenuPermissionsService.instance
  }

  private constructor() {}

  /**
   * Get user permissions from JWT token or database
   */
  async getUserPermissions(request?: Request): Promise<UserPermissions | null> {
    try {
      // First try to get from cookie
      const authCookie = request?.headers.get('cookie')?.split(';')
        .find(c => c.trim().startsWith('auth_token='))
        ?.split('=')[1]

      if (authCookie) {
        // Decode JWT to get user info
        const jwt = require('jsonwebtoken')
        const payload = jwt.decode(authCookie) as any
        
        if (payload && payload.sub) {
          return {
            userId: payload.sub,
            roleId: payload.role,
            roleName: payload.roleName,
            isAdmin: payload.isAdmin || payload.roleName === 'Administrator'
          }
        }
      }

      return null
    } catch (error) {
      console.error('❌ Error getting user permissions:', error)
      return null
    }
  }

  /**
   * Get role menu permissions from database with caching
   */
  async getRolePermissions(roleId: number): Promise<MenuPermission[]> {
    const cacheKey = `role_${roleId}`
    const now = Date.now()

    // Check cache first
    if (this.permissionCache.has(cacheKey) && 
        this.cacheExpiry.has(cacheKey) && 
        now < this.cacheExpiry.get(cacheKey)!) {
      return this.permissionCache.get(cacheKey)!
    }

    try {
      const client = await pool.connect()
      
      const query = `
        SELECT 
          menu_string_id,
          can_view,
          can_add,
          can_edit,
          can_delete
        FROM role_menu_permissions 
        WHERE role_id = $1 AND can_view = true
        ORDER BY menu_string_id
      `
      
      const result = await client.query(query, [roleId])
      client.release()

      const permissions: MenuPermission[] = result.rows.map(row => ({
        menu_string_id: row.menu_string_id,
        can_view: row.can_view,
        can_add: row.can_add,
        can_edit: row.can_edit,
        can_delete: row.can_delete
      }))

      // Cache the results
      this.permissionCache.set(cacheKey, permissions)
      this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION)

      console.log(`✅ Loaded ${permissions.length} menu permissions for role ${roleId}`)
      return permissions

    } catch (error) {
      console.error('❌ Error fetching role permissions:', error)
      return []
    }
  }

  /**
   * Filter menu items based on user role permissions
   */
  async filterMenuByRole(menuItems: MenuItem[], userPermissions: UserPermissions): Promise<MenuItem[]> {
    // Admin users see everything
    if (userPermissions.isAdmin || userPermissions.roleName === 'Administrator') {
      console.log('👑 Admin user - showing all menus')
      return menuItems
    }

    // Get role permissions
    const permissions = await this.getRolePermissions(userPermissions.roleId)
    const allowedMenuIds = new Set(permissions.map(p => p.menu_string_id))

    console.log(`🔒 Filtering menus for role ${userPermissions.roleName} (${userPermissions.roleId})`)
    console.log(`📋 Allowed menu IDs:`, Array.from(allowedMenuIds))

    // Recursively filter menu items
    const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
      return items.reduce((filtered: MenuItem[], item) => {
        // Check if this menu item is allowed
        const isAllowed = allowedMenuIds.has(item.string_id)
        
        if (isAllowed) {
          const filteredItem = { ...item }
          
          // If it has children, filter them too
          if (item.children && item.children.length > 0) {
            filteredItem.children = filterMenuItems(item.children)
          }
          
          filtered.push(filteredItem)
        }

        return filtered
      }, [])
    }

    const filteredMenus = filterMenuItems(menuItems)
    console.log(`✅ Filtered to ${filteredMenus.length} top-level menus`)
    
    return filteredMenus
  }

  /**
   * Check if user has specific permission for a menu
   */
  async hasPermission(
    userPermissions: UserPermissions, 
    menuStringId: string, 
    permissionType: 'view' | 'add' | 'edit' | 'delete' = 'view'
  ): Promise<boolean> {
    // Admin users have all permissions
    if (userPermissions.isAdmin || userPermissions.roleName === 'Administrator') {
      return true
    }

    const permissions = await this.getRolePermissions(userPermissions.roleId)
    const menuPermission = permissions.find(p => p.menu_string_id === menuStringId)
    
    if (!menuPermission) {
      return false
    }

    switch (permissionType) {
      case 'view': return menuPermission.can_view
      case 'add': return menuPermission.can_add
      case 'edit': return menuPermission.can_edit
      case 'delete': return menuPermission.can_delete
      default: return false
    }
  }

  /**
   * Clear permission cache (useful for testing or when permissions change)
   */
  clearCache(): void {
    this.permissionCache.clear()
    this.cacheExpiry.clear()
    console.log('🧹 Menu permissions cache cleared')
  }
}

// Export singleton instance
export const menuPermissionsService = MenuPermissionsService.getInstance() 