/**
 * 🎯 ENTERPRISE MENU SYSTEM
 * ========================
 * 
 * This is the SINGLE SOURCE OF TRUTH for all navigation in the application.
 * 
 * Features:
 * - Type-safe menu definitions
 * - Role-based access control with database integration
 * - Dynamic permission filtering
 * - Audit logging
 * - Performance optimization
 * - Easy maintenance
 * 
 * @author CRM Development Team
 * @version 2.1.0
 * @since 2025-01-08
 */

import { type LucideIcon } from 'lucide-react'
import { query, transaction } from '@/lib/postgresql-client'

// ===================================
// TYPE DEFINITIONS
// ===================================

export interface MenuPermission {
  requiredRoles?: string[]
}

export interface MenuBadge {
  text: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  color?: string
}

export interface Permission {
  allowedRoles?: string[] // Role titles that can access this item
}

export interface MenuItem {
  id: string
  title: string
  path: string
  icon?: string
  sortOrder: number
  badge?: string
  permissions?: Permission
}

export interface MenuSection {
  id: string
  title: string
  sortOrder: number
  icon?: string
  permissions?: Permission
  items: MenuItem[]
}

export interface UserContext {
  id: string
  roleInfo: {
    id: number
    title: string
    description: string
    department_id: number | null
    is_management: boolean
  } | null
  isAdmin: boolean
}

export interface BreadcrumbItem {
  title: string
  path: string
}

// ===================================
// DATABASE TYPES
// ===================================

interface DatabaseMenuPermission {
  can_view: boolean
  can_add: boolean
  can_edit: boolean
  can_delete: boolean
}

interface DatabaseMenuItem {
  string_id: string
  name: string
  description?: string
  icon?: string
  path?: string
  sort_order: number
  section_name: string
  parent_string_id?: string
}

type DatabasePermissionResult = {
  menu_item_id: number
  can_view: boolean
  can_add: boolean
  can_edit: boolean
  can_delete: boolean
  menu_items: DatabaseMenuItem
}

// ===================================
// MENU CONFIGURATION
// ===================================

const ENTERPRISE_MENU_CONFIG: MenuSection[] = [
  {
    id: 'core',
    title: 'Core Business',
    sortOrder: 1,
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        path: '/dashboard',
        icon: 'LayoutDashboard',
        sortOrder: 1
      },
      {
        id: 'leads',
        title: 'All Leads',
        path: '/leads',
        icon: 'Users',
        sortOrder: 2,
        permissions: {
          allowedRoles: ['Sales Manager', 'Sales Head']
        }
      }
    ]
  },
  {
    id: 'sales',
    title: 'Sales & Revenue',
    sortOrder: 2,
    permissions: {
      allowedRoles: ['Sales Executive', 'Sales Manager', 'Sales Head']
    },
    items: [
      {
        id: 'my-leads',
        title: 'My Leads',
        path: '/sales/my-leads',
        icon: 'UserCircle',
        sortOrder: 1,
        permissions: {
          allowedRoles: ['Sales Executive']
        }
      },
      {
        id: 'team-leads',
        title: 'Team Leads',
        path: '/sales/team',
        icon: 'Users',
        sortOrder: 2,
        permissions: {
          allowedRoles: ['Sales Manager', 'Sales Head']
        }
      },
      {
        id: 'quotations',
        title: 'Quotations',
        path: '/sales/quotations',
        icon: 'FileText',
        sortOrder: 3
      }
    ]
  },
  {
    id: 'accounting',
    title: 'Accounting & Finance',
    sortOrder: 3,
    permissions: {
      allowedRoles: ['Accountant', 'Admin Head']
    },
    items: [
      {
        id: 'invoices',
        title: 'Invoices',
        path: '/accounting/invoices',
        icon: 'Receipt',
        sortOrder: 1
      },
      {
        id: 'reports',
        title: 'Financial Reports',
        path: '/accounting/reports',
        icon: 'BarChart',
        sortOrder: 2,
        permissions: {
          allowedRoles: ['Admin Head']
        }
      }
    ]
  },
  {
    id: 'admin',
    title: 'Administration',
    sortOrder: 4,
    permissions: {
      allowedRoles: ['Administrator', 'Admin Head']
    },
    items: [
      {
        id: 'users',
        title: 'User Management',
        path: '/admin/users',
        icon: 'Users',
        sortOrder: 1
      },
      {
        id: 'roles',
        title: 'Role Management',
        path: '/admin/roles',
        icon: 'Shield',
        sortOrder: 2
      },
      {
        id: 'settings',
        title: 'System Settings',
        path: '/admin/settings',
        icon: 'Settings',
        sortOrder: 3
      }
    ]
  }
]

// ===================================
// MENU MANAGER
// ===================================

export class MenuManager {
  private static instance: MenuManager
  private menuCache: Map<string, MenuSection[]> = new Map()
  private permissionCache: Map<string, DatabaseMenuPermission> = new Map()

  private constructor() {}

  public static getInstance(): MenuManager {
    if (!MenuManager.instance) {
      MenuManager.instance = new MenuManager()
    }
    return MenuManager.instance
  }

  private async fetchMenuStructure(): Promise<MenuSection[]> {
    try {
      // Fetch all menu items
      const result = await query(
        'SELECT * FROM menu_items ORDER BY sort_order'
      )

      const menuItems = result.rows

      if (!menuItems.length) {
        console.error('No menu items found in database')
        return []
      }

      // Group items by section
      const sections = new Map<string, any[]>()
      menuItems.forEach(item => {
        if (!item.section_name) return
        
        const sectionItems = sections.get(item.section_name) || []
        sectionItems.push(item)
        sections.set(item.section_name, sectionItems)
      })

      // Convert to MenuSection[]
      return Array.from(sections.entries())
        .map(([sectionName, items]) => {
          // Get first item of section for section details
          const sectionItem = items.find(i => !i.parent_string_id)
          
          return {
            id: sectionName.toLowerCase().replace(/\s+/g, '-'),
            title: sectionName,
            sortOrder: sectionItem?.sort_order || 0,
            icon: sectionItem?.icon,
            items: items
              .filter(i => i.parent_string_id) // Only include child items
              .map(item => ({
                id: item.string_id,
                title: item.name,
                path: item.path || '#',
                icon: item.icon,
                sortOrder: item.sort_order,
                badge: undefined // Can be added if needed
              }))
          }
        })
        .sort((a, b) => a.sortOrder - b.sortOrder)
    } catch (error) {
      console.error('❌ Error fetching menu structure:', error)
      return []
    }
  }

  private async fetchDatabasePermissions(roleId: number): Promise<void> {
    try {
      const result = await query(
        `SELECT menu_string_id, can_view, can_add, can_edit, can_delete 
         FROM role_menu_permissions 
         WHERE role_id = $1`,
        [roleId]
      )

      // Clear existing cache
      this.permissionCache.clear()

      // Update cache with new permissions
      result.rows.forEach(perm => {
        if (perm.menu_string_id) {
          this.permissionCache.set(perm.menu_string_id, {
            can_view: perm.can_view,
            can_add: perm.can_add,
            can_edit: perm.can_edit,
            can_delete: perm.can_delete
          })
        }
      })
    } catch (error) {
      console.error('❌ Error fetching menu permissions:', error)
    }
  }

  private async checkDatabasePermissions(menuId: string, roleId: number): Promise<boolean> {
    // If permissions not in cache, fetch them
    if (this.permissionCache.size === 0) {
      await this.fetchDatabasePermissions(roleId)
    }

    // Check if user has view permission
    const permissions = this.permissionCache.get(menuId)
    return permissions?.can_view ?? false
  }

  public async getMenuForUser(userContext?: UserContext): Promise<readonly MenuSection[]> {
    if (!userContext?.roleInfo) {
      return []
    }

    const { roleInfo, isAdmin } = userContext
    const cacheKey = `menu_${roleInfo.id}`

    // Check cache first
    const cachedMenu = this.menuCache.get(cacheKey)
    if (cachedMenu) {
      return cachedMenu
    }

    // Fetch menu structure
    const menuSections = await this.fetchMenuStructure()

    // If admin, return full menu
    if (isAdmin) {
      this.menuCache.set(cacheKey, menuSections)
      return menuSections
    }

    // Filter menu based on permissions
    const filteredSections = await Promise.all(
      menuSections.map(async section => {
        // Filter items based on permissions
        const filteredItems = await Promise.all(
          section.items.map(async item => {
            // Check database permissions
            const hasPermission = await this.checkDatabasePermissions(item.id, roleInfo.id)
            return hasPermission ? item : null
          })
        )

        // Remove null items
        const validItems = filteredItems.filter((item): item is MenuItem => item !== null)

        // Return section only if it has items
        return validItems.length > 0
          ? { ...section, items: validItems }
          : null
      })
    )

    // Remove null sections
    const validSections = filteredSections.filter((section): section is MenuSection => section !== null)

    // Cache the result
    this.menuCache.set(cacheKey, validSections)
    return validSections
  }

  public findMenuItemByPath(path: string): MenuItem | null {
    // Search through all cached menus
    for (const sections of this.menuCache.values()) {
      for (const section of sections) {
        for (const item of section.items) {
          if (item.path === path) {
            return item
          }
        }
      }
    }
    return null
  }

  public getBreadcrumbForPath(path: string): BreadcrumbItem[] {
    const breadcrumb: BreadcrumbItem[] = []
    
    // Search through all cached menus
    for (const sections of this.menuCache.values()) {
      for (const section of sections) {
        const item = section.items.find(i => i.path === path)
        if (item) {
          breadcrumb.push({ title: section.title, path: '#' })
          breadcrumb.push({ title: item.title, path: item.path })
          break
        }
      }
    }

    return breadcrumb
  }

  public getMenuStats(): {
    totalSections: number
    totalItems: number
    adminOnlyItems: number
  } {
    // Get stats from the first cached menu (usually admin menu)
    const firstMenu = Array.from(this.menuCache.values())[0] || []
    
    return {
      totalSections: firstMenu.length,
      totalItems: firstMenu.reduce((total, section) => total + section.items.length, 0),
      adminOnlyItems: 0 // No longer relevant as permissions are dynamic
    }
  }
}

// ===================================
// EXPORTS
// ===================================

export const menuManager = MenuManager.getInstance()

export default {
  MenuManager,
  ENTERPRISE_MENU_CONFIG,
  menuManager
} 