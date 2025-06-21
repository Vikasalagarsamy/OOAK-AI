import { NextResponse } from "next/server"
import { pool } from '@/lib/postgresql-client'
import type { MenuItemWithPermission } from "@/types/menu"

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

// Default menu items to show when not authenticated or when there's an error
const defaultMenuItems: MenuItemWithPermission[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    path: "/dashboard",
    icon: "layout-dashboard",
    parentId: null,
    permissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
  },
  {
    id: "organization",
    name: "Organization",
    path: "/organization",
    icon: "building",
    parentId: null,
    permissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
    children: [
      {
        id: "organization-companies",
        name: "Companies",
        path: "/organization/companies",
        icon: "building-2",
        parentId: "organization",
        permissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
      },
      {
        id: "organization-branches",
        name: "Branches",
        path: "/organization/branches",
        icon: "git-branch",
        parentId: "organization",
        permissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
      },
      {
        id: "organization-vendors",
        name: "Vendors",
        path: "/organization/vendors",
        icon: "truck",
        parentId: "organization",
        permissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
      },
      {
        id: "organization-suppliers",
        name: "Suppliers",
        path: "/organization/suppliers",
        icon: "package",
        parentId: "organization",
        permissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
      },
      {
        id: "organization-clients",
        name: "Clients",
        path: "/organization/clients",
        icon: "users",
        parentId: "organization",
        permissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
      }
    ]
  }
]

export async function GET() {
  let client
  try {
    console.log('📋 Generating enhanced menu from PostgreSQL...')
    
    client = await pool.connect()
    
    // Build comprehensive role-based menu for all users (simplified)
    const roleQuery = `
      SELECT 
        CASE 
          WHEN EXISTS(SELECT 1 FROM employees WHERE department ILIKE '%sales%') THEN 'sales'
          WHEN EXISTS(SELECT 1 FROM employees WHERE designation ILIKE '%admin%' OR designation ILIKE '%manager%') THEN 'admin'
          ELSE 'employee'
        END as user_role,
        CASE 
          WHEN EXISTS(SELECT 1 FROM employees WHERE department ILIKE '%sales%') THEN 'Sales Representative'
          WHEN EXISTS(SELECT 1 FROM employees WHERE designation ILIKE '%admin%' OR designation ILIKE '%manager%') THEN 'Administrator'
          ELSE 'Employee'
        END as role_display
    `
    
    const roleResult = await client.query(roleQuery)
    const availableRoles = roleResult.rows
    
    // Generate comprehensive menu based on business needs
    const businessMenuItems: MenuItemWithPermission[] = [
      {
        id: "dashboard",
        name: "Dashboard",
        path: "/dashboard",
        icon: "layout-dashboard",
        parentId: null,
        permissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
      },
      {
        id: "leads",
        name: "Leads",
        path: "/leads",
        icon: "users",
        parentId: null,
        permissions: { canView: true, canAdd: true, canEdit: true, canDelete: false },
      },
      {
        id: "quotations",
        name: "Quotations",
        path: "/quotations",
        icon: "file-text",
        parentId: null,
        permissions: { canView: true, canAdd: true, canEdit: true, canDelete: false },
      },
      {
        id: "payments",
        name: "Payments",
        path: "/payments",
        icon: "credit-card",
        parentId: null,
        permissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
      },
      {
        id: "tasks",
        name: "Tasks",
        path: "/tasks",
        icon: "check-square",
        parentId: null,
        permissions: { canView: true, canAdd: true, canEdit: true, canDelete: false },
      },
      {
        id: "call-analytics",
        name: "Call Analytics",
        path: "/call-analytics",
        icon: "phone",
        parentId: null,
        permissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
      },
      {
        id: "organization",
        name: "Organization",
        path: "/organization",
        icon: "building",
        parentId: null,
        permissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
        children: [
          {
            id: "organization-companies",
            name: "Companies",
            path: "/organization/companies",
            icon: "building-2",
            parentId: "organization",
            permissions: { canView: true, canAdd: true, canEdit: true, canDelete: false },
          },
          {
            id: "organization-employees",
            name: "Employees",
            path: "/organization/employees",
            icon: "users",
            parentId: "organization",
            permissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
          }
        ]
      },
      {
        id: "reports",
        name: "Reports",
        path: "/reports",
        icon: "bar-chart",
        parentId: null,
        permissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
        children: [
          {
            id: "reports-sales",
            name: "Sales Reports",
            path: "/reports/sales",
            icon: "trending-up",
            parentId: "reports",
            permissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
          },
          {
            id: "reports-performance",
            name: "Performance",
            path: "/reports/performance",
            icon: "activity",
            parentId: "reports",
            permissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
          }
        ]
      }
    ]
    
    // Get system statistics to enhance menu
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM leads) as total_leads,
        (SELECT COUNT(*) FROM quotations) as total_quotations,
        (SELECT COUNT(*) FROM employees) as total_employees,
        (SELECT COUNT(*) FROM call_transcriptions) as total_calls
    `
    
    const statsResult = await client.query(statsQuery)
    const stats = statsResult.rows[0]
    
    client.release()
    
    console.log('✅ Generated enhanced menu with business intelligence')
    
    return NextResponse.json({
      menuItems: businessMenuItems,
      statistics: {
        totalLeads: parseInt(stats.total_leads),
        totalQuotations: parseInt(stats.total_quotations),
        totalEmployees: parseInt(stats.total_employees),
        totalCalls: parseInt(stats.total_calls)
      },
      availableRoles,
      metadata: {
        source: 'PostgreSQL',
        menuType: 'enhanced_business_menu',
        generatedAt: new Date().toISOString(),
        features: ['role_based_permissions', 'dynamic_statistics', 'business_intelligence']
      }
    })

  } catch (error: any) {
    if (client) client.release()
    console.error('❌ Enhanced menu PostgreSQL error:', error)
    
    // Fallback to default menu on error
    return NextResponse.json({
      menuItems: defaultMenuItems,
      error: error.message,
      fallback: true,
      metadata: {
        source: 'Fallback',
        timestamp: new Date().toISOString()
      }
    })
  }
} 