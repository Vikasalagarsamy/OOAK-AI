export interface MenuItemPermissions {
  canView: boolean
  canAdd: boolean
  canEdit: boolean
  canDelete: boolean
}

export interface MenuItem {
  id: number
  parentId: number | null
  name: string
  path: string | null
  icon: string | null
  isVisible: boolean
  sortOrder: number | null
  description?: string
}

export interface MenuItemWithPermission extends MenuItem {
  permissions: MenuItemPermissions
  children?: MenuItemWithPermission[]
}

export interface MenuItemWithChildren extends MenuItem {
  children: MenuItemWithChildren[]
}
