export interface MenuItem {
  label: string
  icon?: string
  href?: string
  submenu?: Record<string, MenuItem>
  permissions?: string[]
}
