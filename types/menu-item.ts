export interface MenuItem {
  id: string
  name: string
  path: string
  icon: string
  requiredRoles?: string[]
  adminOnly?: boolean
  children?: MenuItem[]
  badge?: {
    text: string
    variant: "default" | "secondary" | "destructive" | "outline"
  }
}

export interface MenuSection {
  title: string
  items: MenuItem[]
}
