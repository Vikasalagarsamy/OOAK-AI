import type { MenuItem } from "@/types/menu"
import { menuStructure } from "@/lib/menu-structure"

// Filter menu items based on role permissions
export function filterMenuByRole(roleId: string): Record<string, MenuItem> {
  // For simplicity in this demo, we'll just return different subsets based on role
  // In a real app, this would check against actual permissions

  // Admin sees everything
  if (roleId === "admin") {
    return menuStructure
  }

  // Create a filtered copy of the menu structure
  const filteredMenu: Record<string, MenuItem> = {}

  // Manager sees organization, people, and reports
  if (roleId === "manager") {
    if (menuStructure.organization) filteredMenu.organization = { ...menuStructure.organization }
    if (menuStructure.people) filteredMenu.people = { ...menuStructure.people }
    if (menuStructure.reports) filteredMenu.reports = { ...menuStructure.reports }
  }

  // Sales rep sees sales and clients
  if (roleId === "sales") {
    if (menuStructure.sales) filteredMenu.sales = { ...menuStructure.sales }

    // Only add organization with clients submenu
    if (menuStructure.organization) {
      filteredMenu.organization = {
        ...menuStructure.organization,
        submenu: {
          clients: menuStructure.organization.submenu?.clients,
        } as Record<string, MenuItem>,
      }
    }
  }

  // HR staff sees people and some organization items
  if (roleId === "hr") {
    if (menuStructure.people) filteredMenu.people = { ...menuStructure.people }

    // Only add organization with roles submenu
    if (menuStructure.organization) {
      filteredMenu.organization = {
        ...menuStructure.organization,
        submenu: {
          roles: menuStructure.organization.submenu?.roles,
          "user-accounts": menuStructure.organization.submenu?.["user-accounts"],
        } as Record<string, MenuItem>,
      }
    }
  }

  // Employee sees minimal menu
  if (roleId === "employee") {
    if (menuStructure.dashboard) filteredMenu.dashboard = { ...menuStructure.dashboard }

    // Add a profile menu item
    filteredMenu.profile = {
      label: "My Profile",
      icon: "user",
      href: "/profile",
    }
  }

  return filteredMenu
}
