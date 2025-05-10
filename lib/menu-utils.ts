import { menuStructure, type MenuItem, type SubMenuItem } from "@/lib/menu-structure"

export interface UserPermissions {
  roles: string[]
  permissions: Record<string, boolean>
}

export function filterMenuByPermissions(userPermissions: UserPermissions): Record<string, MenuItem> {
  // This is a placeholder implementation
  // In a real application, you would check against actual user permissions

  // For now, we'll just return the full menu structure
  // In a real implementation, you would filter based on user roles and permissions
  return menuStructure
}

export function findMenuItemByPath(path: string): {
  mainItem?: { name: string; item: MenuItem }
  subItem?: SubMenuItem
} {
  for (const [name, item] of Object.entries(menuStructure)) {
    // Check if this is the main item
    if (item.path === path) {
      return { mainItem: { name, item } }
    }

    // Check sub-items
    const subItem = item.subMenus.find((sub) => sub.path === path)
    if (subItem) {
      return { mainItem: { name, item }, subItem }
    }
  }

  return {}
}

export function generateBreadcrumbs(path: string) {
  const { mainItem, subItem } = findMenuItemByPath(path)

  if (!mainItem) return []

  const breadcrumbs = [
    { name: "Home", path: "/dashboard" },
    { name: mainItem.name, path: mainItem.item.path },
  ]

  if (subItem) {
    breadcrumbs.push({ name: subItem.name, path: subItem.path })
  }

  return breadcrumbs
}
