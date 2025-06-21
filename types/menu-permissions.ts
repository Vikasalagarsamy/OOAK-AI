export interface MenuItem {
  id: string
  parentId: string | null
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
  menuItemId: string
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
