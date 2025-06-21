"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Users, 
  Menu as MenuIcon,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronRight,
  ChevronDown,
  Building,
  LayoutGrid,
  DollarSign,
  FileText,
  BarChart,
  Calendar,
  Settings2,
  Home,
  Filter
} from "lucide-react"

interface Role {
  id: number
  title: string
  description: string
}

interface MenuItem {
  id: number
  string_id: string
  name: string
  description: string
  parent_id: number | null
  icon: string
  path: string
  category: string
}

interface Permission {
  can_view: boolean
  can_add: boolean
  can_edit: boolean
  can_delete: boolean
}

interface PermissionsData {
  roles: Role[]
  menus: MenuItem[]
  permissions: { [key: string]: Permission }
}

interface MenuNode extends MenuItem {
  children: MenuNode[]
  level: number
}

export default function MenuPermissionsPage() {
  const [data, setData] = useState<PermissionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [filterLevel, setFilterLevel] = useState<'all' | 'parent' | 'child'>('all')

  // Load data from API
  const loadData = async () => {
    try {
      console.log("🔄 Loading menu permissions data...")
      setLoading(true)
      
      const response = await fetch('/api/admin/menu-permissions')
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
        if (!selectedRole && result.data.roles.length > 0) {
          setSelectedRole(result.data.roles[0].id)
        }
        
        // Debug: Log the menu structure
        console.log("📋 Raw menu data:", result.data.menus)
        console.log("👥 Roles:", result.data.roles)
        console.log("🔐 Permissions count:", Object.keys(result.data.permissions).length)
        
        // Check for parent-child relationships
        const hasParents = result.data.menus.filter((m: MenuItem) => m.parent_id === null)
        const hasChildren = result.data.menus.filter((m: MenuItem) => m.parent_id !== null)
        console.log("📁 Parent menus:", hasParents.length, hasParents.map((m: MenuItem) => m.name))
        console.log("📄 Child menus:", hasChildren.length, hasChildren.map((m: MenuItem) => `${m.name} (parent: ${m.parent_id})`))
        
        showMessage('success', 'Menu permissions data loaded successfully')
      } else {
        showMessage('error', 'Failed to load menu permissions data')
      }
    } catch (error) {
      console.error('❌ Error loading data:', error)
      showMessage('error', 'Error loading menu permissions data')
    } finally {
      setLoading(false)
    }
  }

  // Update permission
  const updatePermission = async (roleId: number, menuStringId: string, permissions: Permission) => {
    try {
      setSaving(`${roleId}_${menuStringId}`)
      
      const response = await fetch('/api/admin/menu-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId,
          menuStringId,
          permissions
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Update local state
        if (data) {
          const key = `${roleId}_${menuStringId}`
          setData({
            ...data,
            permissions: {
              ...data.permissions,
              [key]: permissions
            }
          })
        }
        showMessage('success', 'Permission updated successfully')
      } else {
        showMessage('error', 'Failed to update permission')
      }
    } catch (error) {
      console.error('Error updating permission:', error)
      showMessage('error', 'Error updating permission')
    } finally {
      setSaving(null)
    }
  }

  // Show message
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // Get permission for role/menu combination
  const getPermission = (roleId: number, menuStringId: string): Permission => {
    const key = `${roleId}_${menuStringId}`
    return data?.permissions[key] || {
      can_view: false,
      can_add: false,
      can_edit: false,
      can_delete: false
    }
  }

  // Toggle permission
  const togglePermission = (roleId: number, menuStringId: string, permissionType: keyof Permission) => {
    if (!data) return
    
    const currentPermission = getPermission(roleId, menuStringId)
    const newPermissions = {
      ...currentPermission,
      [permissionType]: !currentPermission[permissionType]
    }
    
    // If turning off view, turn off all others
    if (permissionType === 'can_view' && !newPermissions.can_view) {
      newPermissions.can_add = false
      newPermissions.can_edit = false
      newPermissions.can_delete = false
    }
    
    // If turning on add/edit/delete, turn on view
    if ((permissionType === 'can_add' || permissionType === 'can_edit' || permissionType === 'can_delete') 
        && newPermissions[permissionType]) {
      newPermissions.can_view = true
    }
    
    updatePermission(roleId, menuStringId, newPermissions)
  }

  // Get role color
  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'Administrator': return 'bg-red-50 text-red-700 border-red-200'
      case 'Admin Head': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'Sales Head': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'Sales Manager': return 'bg-green-50 text-green-700 border-green-200'
      case 'Sales Executive': return 'bg-purple-50 text-purple-700 border-purple-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  // Build hierarchical menu structure
  const buildMenuHierarchy = (menus: MenuItem[]): MenuNode[] => {
    console.log("🏗️ Building menu hierarchy from:", menus.length, "menus")
    
    const menuMap = new Map<string, MenuNode>()
    const idToNodeMap = new Map<number, MenuNode>() // Map numeric id to node
    const rootMenus: MenuNode[] = []

    // First pass: Create all nodes and map them
    menus.forEach(menu => {
      const node: MenuNode = {
        ...menu,
        children: [],
        level: 0
      }
      menuMap.set(menu.string_id, node)
      idToNodeMap.set(menu.id, node) // Map by numeric ID for parent lookups
      
      if (menu.parent_id === null) {
        rootMenus.push(node)
      }
    })

    // Second pass: Build hierarchy by matching parent_id with id
    menus.forEach(menu => {
      if (menu.parent_id !== null) {
        // This is a child menu, find its parent by numeric ID
        const childNode = menuMap.get(menu.string_id)!
        const parentNode = idToNodeMap.get(menu.parent_id)
        
        if (parentNode) {
          childNode.level = parentNode.level + 1
          parentNode.children.push(childNode)
          console.log(`👶 Added child ${menu.name} to parent ${parentNode.name}`)
          
          // Remove child from root menus if it was added there
          const rootIndex = rootMenus.findIndex(root => root.string_id === childNode.string_id)
          if (rootIndex > -1) {
            rootMenus.splice(rootIndex, 1)
          }
        } else {
          // Parent not found, treat as root
          console.log(`🔍 Parent not found for ${menu.name} (parent_id: ${menu.parent_id}), treating as root`)
          if (!rootMenus.find(root => root.string_id === childNode.string_id)) {
            rootMenus.push(childNode)
          }
        }
      }
    })

    // Log the final structure
    rootMenus.forEach(root => {
      console.log(`📁 Root menu: ${root.name} (${root.children.length} children)`)
      root.children.forEach(child => {
        console.log(`  📄 Child: ${child.name}`)
      })
    })

    return rootMenus.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Filter menus based on search and level
  const filterMenus = (nodes: MenuNode[], term: string, level: string): MenuNode[] => {
    return nodes.filter(node => {
      const matchesSearch = term === '' || 
        node.name.toLowerCase().includes(term.toLowerCase()) ||
        node.description.toLowerCase().includes(term.toLowerCase())
      
      const matchesLevel = level === 'all' || 
        (level === 'parent' && node.children.length > 0) ||
        (level === 'child' && node.children.length === 0)
      
      const hasMatchingChildren = node.children.some(child =>
        child.name.toLowerCase().includes(term.toLowerCase()) ||
        child.description.toLowerCase().includes(term.toLowerCase())
      )
      
      return (matchesSearch && matchesLevel) || hasMatchingChildren
    }).map(node => ({
      ...node,
      children: node.children.filter(child => {
        const childMatchesSearch = term === '' ||
          child.name.toLowerCase().includes(term.toLowerCase()) ||
          child.description.toLowerCase().includes(term.toLowerCase())
        
        const childMatchesLevel = level === 'all' || level === 'child'
        
        return childMatchesSearch && childMatchesLevel
      })
    }))
  }

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  // Get icon component
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'Building': Building,
      'LayoutGrid': LayoutGrid,
      'DollarSign': DollarSign,
      'FileText': FileText,
      'BarChart': BarChart,
      'Calendar': Calendar,
      'Settings': Settings2,
      'Home': Home,
      'Users': Users
    }
    return iconMap[iconName] || Settings2
  }

  // Render menu node
  const renderMenuNode = (node: MenuNode, roleId: number, level: number = 0) => {
    const permission = getPermission(roleId, node.string_id)
    const isSaving = saving === `${roleId}_${node.string_id}`
    const hasChildren = node.children.length > 0
    const isExpanded = expandedNodes.has(node.string_id)
    const IconComponent = getIconComponent(node.icon)

    console.log(`📁 Rendering ${node.name}: hasChildren=${hasChildren}, isExpanded=${isExpanded}, children=${node.children.length}`)

    return (
      <div key={node.string_id} className="border-b border-gray-100">
        <div className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
          level === 0 ? 'bg-blue-50/30' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-3 flex-1" style={{ marginLeft: `${level * 20}px` }}>
            {/* Expand/Collapse Button - Made More Visible */}
            {hasChildren ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-1 hover:bg-blue-100 border-2 border-blue-300 rounded-md bg-white shadow-md"
                onClick={() => {
                  console.log(`🔄 Toggling ${node.string_id} - currently expanded: ${isExpanded}`)
                  toggleNode(node.string_id)
                }}
                title={isExpanded ? "Click to collapse" : "Click to expand"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-blue-600 font-bold" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-blue-600 font-bold" />
                )}
              </Button>
            ) : (
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
            )}

            {/* Menu Icon */}
            <div className={`p-2 rounded-lg ${level === 0 ? 'bg-blue-100' : 'bg-gray-200'}`}>
              <IconComponent className={`h-4 w-4 ${level === 0 ? 'text-blue-600' : 'text-gray-600'}`} />
            </div>

            {/* Menu Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className={`font-medium ${level === 0 ? 'text-gray-900 text-base' : 'text-gray-700 text-sm'} truncate`}>
                  {node.name}
                </h4>
                {level === 0 && hasChildren && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {node.children.length} items
                  </Badge>
                )}
                {hasChildren && (
                  <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                    {isExpanded ? '▼ Collapse' : '► Expand'}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate">{node.description}</p>
              <div className="text-xs text-gray-400 mt-1">
                {node.path}
              </div>
            </div>
          </div>

          {/* Permission Controls */}
          <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
            {/* View Permission */}
            <div className="flex items-center space-x-1">
              <Eye className="h-3 w-3 text-blue-500" />
              <Switch
                checked={permission.can_view}
                onCheckedChange={() => togglePermission(roleId, node.string_id, 'can_view')}
                disabled={isSaving}
              />
              <span className="text-xs text-gray-600 hidden sm:inline">V</span>
            </div>

            {/* Add Permission */}
            <div className="flex items-center space-x-1">
              <Plus className="h-3 w-3 text-green-500" />
              <Switch
                checked={permission.can_add}
                onCheckedChange={() => togglePermission(roleId, node.string_id, 'can_add')}
                disabled={isSaving || !permission.can_view}
              />
              <span className="text-xs text-gray-600 hidden sm:inline">A</span>
            </div>

            {/* Edit Permission */}
            <div className="flex items-center space-x-1">
              <Edit className="h-3 w-3 text-orange-500" />
              <Switch
                checked={permission.can_edit}
                onCheckedChange={() => togglePermission(roleId, node.string_id, 'can_edit')}
                disabled={isSaving || !permission.can_view}
              />
              <span className="text-xs text-gray-600 hidden sm:inline">E</span>
            </div>

            {/* Delete Permission */}
            <div className="flex items-center space-x-1">
              <Trash2 className="h-3 w-3 text-red-500" />
              <Switch
                checked={permission.can_delete}
                onCheckedChange={() => togglePermission(roleId, node.string_id, 'can_delete')}
                disabled={isSaving || !permission.can_view}
              />
              <span className="text-xs text-gray-600 hidden sm:inline">D</span>
            </div>

            {/* Saving indicator */}
            {isSaving && (
              <RefreshCw className="h-4 w-4 text-blue-500 animate-spin ml-2" />
            )}
          </div>
        </div>

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div className="bg-gray-50/50">
            {node.children.map(child => renderMenuNode(child, roleId, level + 1))}
          </div>
        )}
      </div>
    )
  }

  // Get permission stats for a role
  const getPermissionStats = (roleId: number) => {
    if (!data) return { total: 0, enabled: 0, percentage: 0 }
    
    const rolePermissions = Object.entries(data.permissions).filter(([key]) => 
      key.startsWith(`${roleId}_`)
    )
    
    const total = rolePermissions.length
    const enabled = rolePermissions.filter(([, perm]) => perm.can_view).length
    const percentage = total > 0 ? Math.round((enabled / total) * 100) : 0
    
    return { total, enabled, percentage }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8">
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>Failed to load menu permissions data</AlertDescription>
        </Alert>
      </div>
    )
  }

  const menuHierarchy = buildMenuHierarchy(data.menus)
  const filteredMenus = filterMenus(menuHierarchy, searchTerm, filterLevel)

  return (
    <div className="p-6 space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Menu Permissions Manager</h1>
            <p className="text-gray-600">Configure role-based access control for your application menu system</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="px-3 py-1">
              {data.roles.length} Roles
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {data.menus.length} Menu Items
            </Badge>
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <Alert className={`border ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Selection */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Select Role</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[700px] overflow-y-auto">
              {data.roles.map(role => {
                const stats = getPermissionStats(role.id)
                return (
                  <div
                    key={role.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                      selectedRole === role.id 
                        ? 'border-blue-300 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedRole(role.id)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 text-sm">{role.title}</h4>
                        <Badge className={getRoleColor(role.title)} variant="secondary">
                          {stats.percentage}%
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{role.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>ID: {role.id}</span>
                        <span>{stats.enabled}/{stats.total} enabled</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Menu Permissions */}
        <div className="lg:col-span-2">
          {selectedRole && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex flex-col space-y-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <MenuIcon className="h-5 w-5 text-blue-600" />
                    <span>
                      Permissions for: {data.roles.find(r => r.id === selectedRole)?.title}
                    </span>
                  </CardTitle>
                  
                  {/* Permission Legend */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-6 text-xs">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3 text-blue-500" />
                        <span className="text-gray-600">View - Can access menu</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Plus className="h-3 w-3 text-green-500" />
                        <span className="text-gray-600">Add - Can create items</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Edit className="h-3 w-3 text-orange-500" />
                        <span className="text-gray-600">Edit - Can modify items</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Trash2 className="h-3 w-3 text-red-500" />
                        <span className="text-gray-600">Delete - Can remove items</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="relative flex-1 min-w-0">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search menus..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value as any)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Items</option>
                        <option value="parent">Parent Only</option>
                        <option value="child">Child Only</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="divide-y divide-gray-100">
                    {filteredMenus.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <MenuIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No menu items found matching your criteria</p>
                      </div>
                    ) : (
                      filteredMenus.map(node => renderMenuNode(node, selectedRole))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
          
          {!selectedRole && (
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Role</h3>
                <p className="text-gray-600">Choose a role from the left panel to configure menu permissions</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 