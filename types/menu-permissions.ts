export interface MenuItem {
  id: number
  parentId: number | null
  name: string
  path?: string
  icon?: string
  description?: string
  isVisible: boolean
  sortOrder: number
}

export interface MenuItemWithChildren extends MenuItem {
  children: MenuItemWithChildren[]
}

export interface RolePermission {
  roleId: number
  menuItemId: number
  canView: boolean
  canAdd: boolean
  canEdit: boolean
  canDelete: boolean
}

export interface Role {
  id: number
  name: string
  description?: string
}

export interface MenuPermission {
  menuItem: MenuItem
  permissions: RolePermission[]
}
