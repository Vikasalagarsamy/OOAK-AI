export interface Role {
  id: number
  name: string
  description: string
  status: string
  created_at: string
  updated_at: string
}

export interface Permission {
  id: number
  name: string
  description: string
  resource: string
  action: string
  status: string
  created_at: string
  updated_at: string
}

export interface RolePermission {
  id: number
  role_id: number
  permission_id: number
  status: string
  created_at: string
  updated_at: string
  permissions?: Permission
}

export interface AuditTrail {
  id: number
  entity_type: string
  entity_id: string
  action: string
  user_id: string
  timestamp: string
  old_values: any
  new_values: any
  ip_address: string
  user_agent: string
}
