"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

interface MenuItem {
  id: number
  name: string
  path: string
  icon: string
  parent_id: number | null
  is_visible: boolean
  children?: MenuItem[]
}

interface Role {
  id: number
  name: string
  description: string
}

interface RolePermissionManagerProps {
  onRoleSelect?: (roleId: string) => void
}

export function RolePermissionManager({ onRoleSelect }: RolePermissionManagerProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [selectedMenuItems, setSelectedMenuItems] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch roles
        const rolesResponse = await fetch("/api/roles")
        if (!rolesResponse.ok) {
          throw new Error(`Failed to fetch roles: ${rolesResponse.statusText}`)
        }
        const rolesData = await rolesResponse.json()
        setRoles(rolesData || [])

        // Fetch menu items
        const menuResponse = await fetch("/api/menu-items")
        if (!menuResponse.ok) {
          throw new Error(`Failed to fetch menu items: ${menuResponse.statusText}`)
        }
        const menuData = await menuResponse.json()
        setMenuItems(menuData || [])
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(`Failed to fetch data: ${err.message}`)
        toast({
          title: "Error",
          description: `Failed to fetch data: ${err.message}`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const fetchRolePermissions = async (roleId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/roles/${roleId}/permissions`)
      if (!response.ok) {
        throw new Error(`Failed to fetch permissions: ${response.statusText}`)
      }
      const data = await response.json()
      setSelectedMenuItems(data.map((item: { menu_item_id: number }) => item.menu_item_id))
    } catch (err: any) {
      console.error("Error fetching permissions:", err)
      setError(`Failed to fetch permissions: ${err.message}`)
      toast({
        title: "Error",
        description: `Failed to fetch permissions: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (value: string) => {
    setSelectedRole(value)
    if (value) {
      fetchRolePermissions(value)
      if (onRoleSelect) {
        onRoleSelect(value)
      }
    } else {
      setSelectedMenuItems([])
      if (onRoleSelect) {
        onRoleSelect("")
      }
    }
  }

  const handleMenuItemToggle = (menuItemId: number) => {
    setSelectedMenuItems((prev) => {
      if (prev.includes(menuItemId)) {
        return prev.filter((id) => id !== menuItemId)
      } else {
        return [...prev, menuItemId]
      }
    })
  }

  const savePermissions = async () => {
    if (!selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/roles/${selectedRole}/permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ menuItemIds: selectedMenuItems }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save permissions")
      }

      toast({
        title: "Success",
        description: "Permissions saved successfully",
      })
    } catch (err: any) {
      console.error("Error saving permissions:", err)
      setError(`Failed to save permissions: ${err.message}`)
      toast({
        title: "Error",
        description: `Failed to save permissions: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const renderMenuItem = (item: MenuItem) => {
    return (
      <div key={item.id} className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`menu-item-${item.id}`}
            checked={selectedMenuItems.includes(item.id)}
            onCheckedChange={() => handleMenuItemToggle(item.id)}
          />
          <Label htmlFor={`menu-item-${item.id}`}>{item.name}</Label>
        </div>
        {item.children && item.children.length > 0 && (
          <div className="ml-6 space-y-2">{item.children.map((child) => renderMenuItem(child))}</div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Permissions</CardTitle>
        <CardDescription>Manage menu permissions for each role</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={selectedRole} onValueChange={handleRoleChange}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : selectedRole ? (
          <>
            <div className="border rounded-md p-4 space-y-4">
              <h3 className="text-lg font-medium">Menu Items</h3>
              <div className="space-y-4">{menuItems.map((item) => renderMenuItem(item))}</div>
            </div>
            <Button onClick={savePermissions} disabled={saving}>
              {saving ? "Saving..." : "Save Permissions"}
            </Button>
          </>
        ) : (
          <div>Please select a role to manage permissions</div>
        )}
      </CardContent>
    </Card>
  )
}
