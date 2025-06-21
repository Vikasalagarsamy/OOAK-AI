export interface MenuItem {
  id: string
  parentId: string | null
  name: string
  description?: string
  icon?: string
  path: string
  sortOrder: number
  isVisible: boolean
  children?: MenuItem[]
}

export interface MenuItemWithPermission extends MenuItem {
  permissions: {
    canView: boolean
    canAdd: boolean
    canEdit: boolean
    canDelete: boolean
  }
}
