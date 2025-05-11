export interface MenuItem {
  id: number
  parentId: number | null
  name: string
  path?: string
  icon?: string
  isVisible?: boolean
  sortOrder: number
  description?: string
  status?: "new" | "modified" | "removed"
}

export interface MenuItemWithPermission extends MenuItem {
  permissions: {
    canView: boolean
    canAdd: boolean
    canEdit: boolean
    canDelete: boolean
  }
  children: MenuItemWithPermission[]
}

export interface MenuItemWithStatus extends MenuItem {
  status?: "new" | "modified" | "removed"
  children?: MenuItemWithStatus[]
}
