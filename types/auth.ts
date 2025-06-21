export interface UserContext {
  id: string
  username: string
  roles: string[]
  permissions: string[]
  isAdmin: boolean
  departmentId?: string
} 