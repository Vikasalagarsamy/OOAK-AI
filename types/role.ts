export interface Permission {
  view: boolean
  read: boolean
  write: boolean
  delete: boolean
}

export interface MenuPermission {
  id: string
  name: string
  permission: Permission
  subMenus?: MenuPermission[]
}

export interface Role {
  id: number
  name: string
  description: string
  permissions: Record<string, Permission>
  created_at?: string
  updated_at?: string
}

// Default permission template
export const defaultPermission: Permission = {
  view: false,
  read: false,
  write: false,
  delete: false,
}

// Application menu structure for permission assignment
export const applicationMenus: MenuPermission[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    permission: { ...defaultPermission },
  },
  {
    id: "organization",
    name: "Organization",
    permission: { ...defaultPermission },
    subMenus: [
      {
        id: "organization.companies",
        name: "Companies",
        permission: { ...defaultPermission },
      },
      {
        id: "organization.branches",
        name: "Branches",
        permission: { ...defaultPermission },
      },
      {
        id: "organization.vendors",
        name: "Vendors",
        permission: { ...defaultPermission },
      },
      {
        id: "organization.suppliers",
        name: "Suppliers",
        permission: { ...defaultPermission },
      },
      {
        id: "organization.clients",
        name: "Clients",
        permission: { ...defaultPermission },
      },
      {
        id: "organization.roles",
        name: "User Roles",
        permission: { ...defaultPermission },
      },
      {
        id: "organization.account-creation",
        name: "Account Creation",
        permission: { ...defaultPermission },
      },
    ],
  },
  {
    id: "people",
    name: "People",
    permission: { ...defaultPermission },
    subMenus: [
      {
        id: "people.employees",
        name: "Employees",
        permission: { ...defaultPermission },
      },
      {
        id: "people.departments",
        name: "Departments",
        permission: { ...defaultPermission },
      },
      {
        id: "people.designations",
        name: "Designations",
        permission: { ...defaultPermission },
      },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    permission: { ...defaultPermission },
    subMenus: [
      {
        id: "sales.create-lead",
        name: "Create Lead",
        permission: { ...defaultPermission },
      },
      {
        id: "sales.manage-lead",
        name: "Manage Lead",
        permission: { ...defaultPermission },
      },
      {
        id: "sales.unassigned-lead",
        name: "Unassigned Lead",
        permission: { ...defaultPermission },
      },
      {
        id: "sales.follow-up",
        name: "Follow Up",
        permission: { ...defaultPermission },
      },
      {
        id: "sales.quotation",
        name: "Quotation",
        permission: { ...defaultPermission },
      },
      {
        id: "sales.order-confirmation",
        name: "Order Confirmation",
        permission: { ...defaultPermission },
      },
      {
        id: "sales.rejected-leads",
        name: "Rejected Leads",
        permission: { ...defaultPermission },
      },
      {
        id: "sales.lead-sources",
        name: "Lead Sources",
        permission: { ...defaultPermission },
      },
    ],
  },
]
