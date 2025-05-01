"use client"

import { useState, useEffect } from "react"
import { type Role, type MenuPermission, type Permission, applicationMenus } from "@/types/role"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Info } from "lucide-react"

interface PermissionMatrixDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
  onUpdatePermissions: (role: Role) => void
}

export function PermissionMatrixDialog({ open, onOpenChange, role, onUpdatePermissions }: PermissionMatrixDialogProps) {
  const [permissions, setPermissions] = useState<Record<string, Permission>>({})
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  // Initialize permissions when dialog opens
  useEffect(() => {
    if (open) {
      // Create a deep copy of the permissions to avoid reference issues
      const permissionsCopy = JSON.parse(JSON.stringify(role.permissions || {}))
      setPermissions(permissionsCopy)

      // Initialize expanded state for all menus
      const expanded: Record<string, boolean> = {}
      applicationMenus.forEach((menu) => {
        expanded[menu.id] = true
      })
      setExpandedMenus(expanded)
    }
  }, [open, role])

  const getPermission = (menuId: string): Permission => {
    return permissions[menuId] || { view: false, read: false, write: false, delete: false }
  }

  const togglePermission = (menuId: string, permType: keyof Permission) => {
    const currentPerm = getPermission(menuId)

    // Create updated permission
    const updatedPerm: Permission = { ...currentPerm }

    // Special handling for permission dependencies
    if (permType === "view") {
      // If turning off view, turn off all other permissions
      if (currentPerm.view) {
        updatedPerm.view = false
        updatedPerm.read = false
        updatedPerm.write = false
        updatedPerm.delete = false
      } else {
        updatedPerm.view = true
      }
    } else if (permType === "read") {
      // Read requires view
      if (currentPerm.read) {
        updatedPerm.read = false
        // If turning off read, also turn off write and delete
        updatedPerm.write = false
        updatedPerm.delete = false
      } else {
        updatedPerm.view = true // Ensure view is enabled
        updatedPerm.read = true
      }
    } else if (permType === "write") {
      // Write requires view and read
      if (currentPerm.write) {
        updatedPerm.write = false
        // If turning off write, also turn off delete
        updatedPerm.delete = false
      } else {
        updatedPerm.view = true // Ensure view is enabled
        updatedPerm.read = true // Ensure read is enabled
        updatedPerm.write = true
      }
    } else if (permType === "delete") {
      // Delete requires view, read, and write
      if (currentPerm.delete) {
        updatedPerm.delete = false
      } else {
        updatedPerm.view = true // Ensure view is enabled
        updatedPerm.read = true // Ensure read is enabled
        updatedPerm.write = true // Ensure write is enabled
        updatedPerm.delete = true
      }
    }

    // Update permissions state
    setPermissions({
      ...permissions,
      [menuId]: updatedPerm,
    })
  }

  const toggleExpand = (menuId: string) => {
    setExpandedMenus({
      ...expandedMenus,
      [menuId]: !expandedMenus[menuId],
    })
  }

  const handleSave = () => {
    onUpdatePermissions({
      ...role,
      permissions,
    })
    onOpenChange(false)
  }

  // Render a menu item and its permissions
  const renderMenuItem = (menu: MenuPermission, level = 0) => {
    const menuId = menu.id
    const permission = getPermission(menuId)
    const hasSubmenus = menu.subMenus && menu.subMenus.length > 0
    const isExpanded = expandedMenus[menuId]

    return (
      <div key={menuId} className="mb-2">
        <div className={`flex items-center ${level > 0 ? "ml-6" : ""}`}>
          {hasSubmenus && (
            <Button variant="ghost" size="sm" className="p-0 h-6 w-6 mr-2" onClick={() => toggleExpand(menuId)}>
              {isExpanded ? "−" : "+"}
            </Button>
          )}
          {!hasSubmenus && <div className="w-8" />}

          <div className="flex-1 font-medium">{menu.name}</div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${menuId}-view`}
                checked={permission.view}
                onCheckedChange={() => togglePermission(menuId, "view")}
              />
              <label htmlFor={`${menuId}-view`} className="text-sm">
                View
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${menuId}-read`}
                checked={permission.read}
                onCheckedChange={() => togglePermission(menuId, "read")}
                disabled={!permission.view}
              />
              <label htmlFor={`${menuId}-read`} className="text-sm">
                Read
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${menuId}-write`}
                checked={permission.write}
                onCheckedChange={() => togglePermission(menuId, "write")}
                disabled={!permission.read}
              />
              <label htmlFor={`${menuId}-write`} className="text-sm">
                Write
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${menuId}-delete`}
                checked={permission.delete}
                onCheckedChange={() => togglePermission(menuId, "delete")}
                disabled={!permission.write}
              />
              <label htmlFor={`${menuId}-delete`} className="text-sm">
                Delete
              </label>
            </div>
          </div>
        </div>

        {hasSubmenus && isExpanded && (
          <div className="mt-2 border-l-2 border-gray-200 pl-2">
            {menu.subMenus!.map((submenu) => renderMenuItem(submenu, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Manage Permissions: {role.name}</DialogTitle>
          <DialogDescription>Configure access permissions for each menu and feature.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center mb-4 p-2 bg-muted rounded-md text-sm">
            <Info className="h-4 w-4 mr-2" />
            <p>
              <strong>Permission hierarchy:</strong> Delete requires Write, Write requires Read, Read requires View.
              Enabling a higher permission automatically enables lower ones.
            </p>
          </div>

          <div className="mb-4 border-b pb-2">
            <div className="flex items-center">
              <div className="flex-1 font-semibold">Menu Item</div>
              <div className="flex items-center space-x-6">
                <div className="w-14 text-center text-sm font-semibold">View</div>
                <div className="w-14 text-center text-sm font-semibold">Read</div>
                <div className="w-14 text-center text-sm font-semibold">Write</div>
                <div className="w-14 text-center text-sm font-semibold">Delete</div>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">{applicationMenus.map((menu) => renderMenuItem(menu))}</div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Permissions</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
