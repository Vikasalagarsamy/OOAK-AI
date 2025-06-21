"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Crown, 
  UserCheck, 
  BarChart3, 
  Users, 
  Settings,
  Eye,
  Plus,
  Edit,
  Trash2
} from "lucide-react"

interface Permission {
  can_view: boolean
  can_add: boolean
  can_edit: boolean
  can_delete: boolean
}

interface PermissionTemplate {
  id: string
  name: string
  description: string
  icon: any
  color: string
  permissions: { [menuStringId: string]: Permission }
}

// Permission Templates for Quick Setup
export const PERMISSION_TEMPLATES: PermissionTemplate[] = [
  {
    id: 'administrator',
    name: 'Administrator (Full Access)',
    description: 'Complete access to all menu items and actions',
    icon: Crown,
    color: 'bg-red-100 text-red-800',
    permissions: {
      'dashboard': { can_view: true, can_add: true, can_edit: true, can_delete: true },
      'leads_create': { can_view: true, can_add: true, can_edit: true, can_delete: true },
      'leads_manage': { can_view: true, can_add: true, can_edit: true, can_delete: true },
      'leads_assigned': { can_view: true, can_add: true, can_edit: true, can_delete: true },
      'follow_ups': { can_view: true, can_add: true, can_edit: true, can_delete: true },
      'quotations': { can_view: true, can_add: true, can_edit: true, can_delete: true },
      'employees': { can_view: true, can_add: true, can_edit: true, can_delete: true },
      'departments': { can_view: true, can_add: true, can_edit: true, can_delete: true },
      'user_accounts': { can_view: true, can_add: true, can_edit: true, can_delete: true },
      'roles': { can_view: true, can_add: true, can_edit: true, can_delete: true },
      'reports_sales': { can_view: true, can_add: true, can_edit: true, can_delete: true },
      'reports_performance': { can_view: true, can_add: true, can_edit: true, can_delete: true }
    }
  },
  {
    id: 'sales_executive',
    name: 'Sales Executive',
    description: 'Limited access focused on lead management and quotations',
    icon: UserCheck,
    color: 'bg-purple-100 text-purple-800',
    permissions: {
      'dashboard': { can_view: true, can_add: false, can_edit: false, can_delete: false },
      'leads_create': { can_view: true, can_add: true, can_edit: false, can_delete: false },
      'leads_manage': { can_view: true, can_add: false, can_edit: true, can_delete: false },
      'leads_assigned': { can_view: true, can_add: false, can_edit: true, can_delete: false },
      'follow_ups': { can_view: true, can_add: true, can_edit: true, can_delete: false },
      'quotations': { can_view: true, can_add: true, can_edit: true, can_delete: false },
      'employees': { can_view: true, can_add: false, can_edit: false, can_delete: false },
      'departments': { can_view: true, can_add: false, can_edit: false, can_delete: false }
    }
  },
  {
    id: 'sales_manager',
    name: 'Sales Manager',
    description: 'Team management with reporting access',
    icon: BarChart3,
    color: 'bg-green-100 text-green-800',
    permissions: {
      'dashboard': { can_view: true, can_add: false, can_edit: false, can_delete: false },
      'leads_create': { can_view: true, can_add: true, can_edit: true, can_delete: false },
      'leads_manage': { can_view: true, can_add: false, can_edit: true, can_delete: false },
      'leads_assigned': { can_view: true, can_add: false, can_edit: true, can_delete: false },
      'follow_ups': { can_view: true, can_add: true, can_edit: true, can_delete: true },
      'quotations': { can_view: true, can_add: true, can_edit: true, can_delete: true },
      'employees': { can_view: true, can_add: false, can_edit: true, can_delete: false },
      'departments': { can_view: true, can_add: false, can_edit: false, can_delete: false },
      'reports_sales': { can_view: true, can_add: false, can_edit: false, can_delete: false },
      'reports_performance': { can_view: true, can_add: false, can_edit: false, can_delete: false }
    }
  },
  {
    id: 'hr_manager',
    name: 'HR Manager',
    description: 'People and organization management',
    icon: Users,
    color: 'bg-blue-100 text-blue-800',
    permissions: {
      'dashboard': { can_view: true, can_add: false, can_edit: false, can_delete: false },
      'employees': { can_view: true, can_add: true, can_edit: true, can_delete: true },
      'departments': { can_view: true, can_add: true, can_edit: true, can_delete: true },
      'user_accounts': { can_view: true, can_add: true, can_edit: true, can_delete: false },
      'roles': { can_view: true, can_add: false, can_edit: true, can_delete: false }
    }
  },
  {
    id: 'read_only',
    name: 'Read Only Access',
    description: 'View-only access to most areas',
    icon: Eye,
    color: 'bg-gray-100 text-gray-800',
    permissions: {
      'dashboard': { can_view: true, can_add: false, can_edit: false, can_delete: false },
      'leads_manage': { can_view: true, can_add: false, can_edit: false, can_delete: false },
      'follow_ups': { can_view: true, can_add: false, can_edit: false, can_delete: false },
      'quotations': { can_view: true, can_add: false, can_edit: false, can_delete: false },
      'employees': { can_view: true, can_add: false, can_edit: false, can_delete: false },
      'departments': { can_view: true, can_add: false, can_edit: false, can_delete: false },
      'reports_sales': { can_view: true, can_add: false, can_edit: false, can_delete: false }
    }
  }
]

interface PermissionTemplatesProps {
  onApplyTemplate: (template: PermissionTemplate) => void
  selectedRole?: number
  loading?: boolean
}

export function PermissionTemplates({ onApplyTemplate, selectedRole, loading }: PermissionTemplatesProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Quick Setup Templates</h3>
        <p className="text-sm text-gray-600">
          Apply pre-configured permission sets for common roles
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PERMISSION_TEMPLATES.map(template => {
          const Icon = template.icon
          const permissionCount = Object.keys(template.permissions).length
          const actionsCount = Object.values(template.permissions).reduce((acc, perm) => {
            return acc + (perm.can_add ? 1 : 0) + (perm.can_edit ? 1 : 0) + (perm.can_delete ? 1 : 0)
          }, 0)
          
          return (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${template.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {permissionCount} menus
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Permission Types:</span>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3 text-blue-500" />
                      <span className="text-xs">{permissionCount}</span>
                      <Plus className="h-3 w-3 text-green-500 ml-2" />
                      <Edit className="h-3 w-3 text-orange-500" />
                      <Trash2 className="h-3 w-3 text-red-500" />
                      <span className="text-xs ml-1">{actionsCount}</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => onApplyTemplate(template)}
                    disabled={!selectedRole || loading}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {loading ? (
                      <Settings className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Settings className="h-4 w-4 mr-2" />
                    )}
                    Apply Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 