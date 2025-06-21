import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

// Simple JWT payload decode (without verification)
function decodeJWTPayload(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(atob(parts[1]))
    
    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    
    return payload
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🎭 Getting menu permissions for current user...')
    
    // Get the token from cookies
    const token = request.cookies.get("auth_token")?.value
    let userId = null
    let userRole = 'guest'
    
    if (token) {
      const payload = decodeJWTPayload(token)
      if (payload && payload.sub) {
        userId = payload.sub
      }
    }
    
    const client = await pool.connect()
    
    // Get user information if authenticated
    let userInfo = null
    if (userId) {
      const userQuery = `
        SELECT 
          e.id,
          e.username,
          e.first_name,
          e.last_name,
          r.id as role_id,
          r.title as role_title
        FROM employees e
        LEFT JOIN roles r ON e.role_id = r.id
        WHERE e.id = $1 AND e.is_active = true
      `
      
      const userResult = await client.query(userQuery, [userId])
      if (userResult.rows.length > 0) {
        userInfo = userResult.rows[0]
        userRole = userInfo.role_title || 'user'
      }
    }
    
    // Define role-based menu structure
    const getMenuForRole = (role: string) => {
      const baseMenu = {
        dashboard: {
          id: 'dashboard',
          label: 'Dashboard',
          path: '/dashboard',
          icon: 'LayoutDashboard',
          visible: true
        }
      }
      
      switch (role) {
        case 'Administrator':
          return {
            ...baseMenu,
            organization: {
              id: 'organization',
              label: 'Organization',
              path: '/organization',
              icon: 'Building',
              visible: true,
              children: [
                { id: 'companies', label: 'Companies', path: '/organization/companies', visible: true },
                { id: 'branches', label: 'Branches', path: '/organization/branches', visible: true },
                { id: 'clients', label: 'Clients', path: '/organization/clients', visible: true },
                { id: 'suppliers', label: 'Suppliers', path: '/organization/suppliers', visible: true },
                { id: 'vendors', label: 'Vendors', path: '/organization/vendors', visible: true },
                { id: 'roles', label: 'Roles', path: '/organization/roles', visible: true },
                { id: 'user-accounts', label: 'User Accounts', path: '/organization/user-accounts', visible: true },
                { id: 'account-creation', label: 'Account Creation', path: '/organization/account-creation', visible: true }
              ]
            },
            people: {
              id: 'people',
              label: 'People & HR',
              path: '/people',
              icon: 'Users',
              visible: true,
              children: [
                { id: 'employees', label: 'Employees', path: '/people/employees', visible: true },
                { id: 'departments', label: 'Departments', path: '/people/departments', visible: true },
                { id: 'designations', label: 'Designations', path: '/people/designations', visible: true }
              ]
            },
            sales: {
              id: 'sales',
              label: 'Sales & Revenue',
              path: '/sales',
              icon: 'TrendingUp',
              visible: true,
              children: [
                { id: 'create-lead', label: 'Create Lead', path: '/sales/create-lead', visible: true },
                { id: 'all-leads', label: 'All Leads', path: '/sales/all-leads', visible: true },
                { id: 'quotations', label: 'Quotations', path: '/sales/quotations', visible: true }
              ]
            },
            admin: {
              id: 'admin',
              label: 'Administration',
              path: '/admin',
              icon: 'Settings',
              visible: true,
              children: [
                { id: 'menu-permissions', label: 'Menu Permissions', path: '/admin/menu-permissions', visible: true }
              ]
            }
          }
          
        case 'Admin Head':
          return {
            ...baseMenu,
            organization: {
              id: 'organization',
              label: 'Organization',
              path: '/organization',
              icon: 'Building',
              visible: true,
              children: [
                { id: 'companies', label: 'Companies', path: '/organization/companies', visible: true },
                { id: 'branches', label: 'Branches', path: '/organization/branches', visible: true },
                { id: 'clients', label: 'Clients', path: '/organization/clients', visible: true },
                { id: 'roles', label: 'Roles', path: '/organization/roles', visible: true },
                { id: 'user-accounts', label: 'User Accounts', path: '/organization/user-accounts', visible: true }
              ]
            },
            people: {
              id: 'people',
              label: 'People & HR',
              path: '/people',
              icon: 'Users',
              visible: true,
              children: [
                { id: 'employees', label: 'Employees', path: '/people/employees', visible: true },
                { id: 'departments', label: 'Departments', path: '/people/departments', visible: true },
                { id: 'designations', label: 'Designations', path: '/people/designations', visible: true }
              ]
            }
          }
          
        case 'Sales Head':
          return {
            ...baseMenu,
            people: {
              id: 'people',
              label: 'People & HR',
              path: '/people',
              icon: 'Users',
              visible: true,
              children: [
                { id: 'employees', label: 'Employees', path: '/people/employees', visible: true, readonly: true }
              ]
            },
            sales: {
              id: 'sales',
              label: 'Sales & Revenue',
              path: '/sales',
              icon: 'TrendingUp',
              visible: true,
              children: [
                { id: 'create-lead', label: 'Create Lead', path: '/sales/create-lead', visible: true },
                { id: 'all-leads', label: 'All Leads', path: '/sales/all-leads', visible: true },
                { id: 'team-leads', label: 'Team Leads', path: '/sales/team-leads', visible: true },
                { id: 'quotations', label: 'Quotations', path: '/sales/quotations', visible: true }
              ]
            }
          }
          
        case 'Sales Manager':
          return {
            ...baseMenu,
            sales: {
              id: 'sales',
              label: 'Sales & Revenue',
              path: '/sales',
              icon: 'TrendingUp',
              visible: true,
              children: [
                { id: 'create-lead', label: 'Create Lead', path: '/sales/create-lead', visible: true },
                { id: 'my-leads', label: 'My Leads', path: '/sales/my-leads', visible: true },
                { id: 'team-leads', label: 'Team Leads', path: '/sales/team-leads', visible: true },
                { id: 'quotations', label: 'Quotations', path: '/sales/quotations', visible: true }
              ]
            }
          }
          
        case 'Sales Executive':
          return {
            ...baseMenu,
            sales: {
              id: 'sales',
              label: 'Sales & Revenue',
              path: '/sales',
              icon: 'TrendingUp',
              visible: true,
              children: [
                { id: 'create-lead', label: 'Create Lead', path: '/sales/create-lead', visible: true },
                { id: 'my-leads', label: 'My Leads', path: '/sales/my-leads', visible: true },
                { id: 'quotations', label: 'Quotations', path: '/sales/quotations', visible: true, readonly: true }
              ]
            }
          }
          
        default:
          return baseMenu
      }
    }
    
    const menuStructure = getMenuForRole(userRole)
    
    client.release()
    
    console.log(`✅ Menu permissions loaded for role: ${userRole}`)
    
    return NextResponse.json({
      success: true,
      user: userInfo ? {
        id: userInfo.id,
        username: userInfo.username,
        name: `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim(),
        role: userInfo.role_title
      } : null,
      role: userRole,
      authenticated: !!userInfo,
      menu: menuStructure,
      permissions: {
        canViewOrganization: ['Administrator', 'Admin Head'].includes(userRole),
        canViewPeople: ['Administrator', 'Admin Head', 'Sales Head'].includes(userRole),
        canViewSales: ['Administrator', 'Sales Head', 'Sales Manager', 'Sales Executive'].includes(userRole),
        canViewAdmin: ['Administrator'].includes(userRole),
        canEditUsers: ['Administrator', 'Admin Head'].includes(userRole),
        canCreateLeads: ['Administrator', 'Sales Head', 'Sales Manager', 'Sales Executive'].includes(userRole)
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "Direct PostgreSQL"
      }
    })
    
  } catch (error: any) {
    console.error('❌ Menu permissions error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get menu permissions', 
        details: error.message 
      },
      { status: 500 }
    )
  }
} 