import { menuStructure } from "@/lib/menu-structure"
import { DEFAULT_ROLES, hasPermission } from "@/types/role-permissions"
import type { MenuItem } from "@/types/menu"

// Map menu items to permission IDs
const menuPermissionMap: Record<string, string> = {
  Dashboard: "dashboard",
  People: "people.*",
  "People Dashboard": "people.dashboard",
  Employees: "people.employees",
  Departments: "people.departments",
  Designations: "people.designations",
  Organization: "organization.*",
  Companies: "organization.companies",
  Branches: "organization.branches",
  Roles: "organization.roles",
  Vendors: "organization.vendors",
  Suppliers: "organization.suppliers",
  Clients: "organization.clients",
  "User Accounts": "organization.user_accounts",
  "Account Creation": "organization.account_creation",
  Sales: "sales.*",
  "Create Lead": "sales.create_lead",
  "Manage Lead": "sales.manage_lead",
  "Unassigned Lead": "sales.unassigned_lead",
  "My Leads": "sales.my_leads",
  "Lead Sources": "sales.lead_sources",
  "Follow Up": "sales.follow_up",
  Quotation: "sales.quotation",
  "Order Confirmation": "sales.order_confirmation",
  "Rejected Leads": "sales.rejected_leads",
  Reports: "reports.*",
  "Lead Sources Report": "reports.lead_sources",
  Admin: "admin.*",
  "Menu Permissions": "admin.menu_permissions",
  "Fix Admin Permissions": "admin.fix_admin_permissions",
  "Menu Debug": "admin.menu_debug",
  "Menu Repair": "admin.menu_repair",
  "Debug Menu Permissions": "admin.debug_menu_permissions",
  "Fix Account Creation": "admin.fix_account_creation",
  "Test Permissions": "admin.test_permissions",
  "Add Event Menu": "admin.add_event_menu",
  "Setup Menu Permissions": "admin.setup_menu_permissions",
  "Fix Users by Role": "admin.fix_users_by_role",
  "Fix Users by Role Function": "admin.fix_users_by_role_function",
  "Role Permissions": "admin.role_permissions",
  "Menu Diagnostics": "admin.menu_diagnostics",
  "Menu Reset": "admin.menu_reset",
  "Check Schema": "admin.check_schema",
  "Ensure Tables": "admin.ensure_tables",
  "Update Constraints": "admin.update_constraints",
  "Update Employee Companies Table": "admin.update_employee_companies_table",
  "Fix Lead Sources": "admin.fix_lead_sources",
  "Event Coordination": "events.*",
  "Event Calendar": "events.calendar",
  "Event Planning": "events.planning",
  "Event Execution": "events.execution",
  "Post-Event": "events.post_event",
  Audit: "audit",
}

// Filter menu based on role permissions
export function filterMenuByRole(roleId: string): Record<string, MenuItem> {
  // Find the role by ID
  const role = DEFAULT_ROLES.find((r) => r.id === roleId)

  if (!role) {
    console.error(`Role with ID ${roleId} not found`)
    return menuStructure // Return full menu as fallback
  }

  // If admin or has admin.all permission, return full menu
  if (role.isAdmin || role.permissions.includes("admin.all")) {
    console.log("Admin role detected - returning full menu structure")
    return menuStructure
  }

  // Filter main menu items
  const filteredMenu: Record<string, MenuItem> = {}

  Object.entries(menuStructure).forEach(([name, item]) => {
    const permissionId = menuPermissionMap[name]

    if (!permissionId || hasPermission(role, permissionId)) {
      // Filter submenus if they exist
      if (item.subMenus && item.subMenus.length > 0) {
        const filteredSubMenus = item.subMenus.filter((subItem) => {
          const subPermissionId = menuPermissionMap[subItem.name]
          return !subPermissionId || hasPermission(role, subPermissionId)
        })

        // Only include main menu if it has accessible submenus or is directly accessible
        if (filteredSubMenus.length > 0 || item.path) {
          filteredMenu[name] = {
            ...item,
            subMenus: filteredSubMenus,
          }
        }
      } else {
        // No submenus, include the menu item directly
        filteredMenu[name] = item
      }
    }
  })

  return filteredMenu
}
