export interface MenuItemWithPermission {
  id: number
  name: string
  path: string
  icon?: string
  parentId?: number | null
  sortOrder?: number
  children?: MenuItemWithPermission[]
  permissions: {
    canView: boolean
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
  }
}

export interface MenuItem {
  id: number
  name: string
  path: string
  icon?: string
  parentId?: number | null
  sortOrder?: number
  children?: MenuItem[]
}
