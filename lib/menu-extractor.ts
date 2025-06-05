// Utility to extract menu structure from sidebar navigation
// This ensures role permissions are always in sync with actual navigation

export interface PermissionMenuItem {
  id: string
  name: string
  path: string
  description?: string
  children?: PermissionMenuItem[]
}

// Convert sidebar navigation menu items to permission structure
export function extractMenuStructure(): PermissionMenuItem[] {
  return [
    {
      id: 'dashboard',
      name: 'Dashboard',
      path: '/dashboard',
      description: 'Main dashboard overview'
    },
    {
      id: 'organization',
      name: 'Organization',
      path: '/organization',
      description: 'Organization management',
      children: [
        { id: 'organization-companies', name: 'Companies', path: '/organization/companies', description: 'Manage organization companies' },
        { id: 'organization-branches', name: 'Branches', path: '/organization/branches', description: 'Manage branch locations' },
        { id: 'organization-clients', name: 'Clients', path: '/organization/clients', description: 'Client management' },
        { id: 'organization-suppliers', name: 'Suppliers', path: '/organization/suppliers', description: 'Supplier management' },
        { id: 'organization-vendors', name: 'Vendors', path: '/organization/vendors', description: 'Vendor management' },
        { id: 'organization-roles', name: 'Roles', path: '/organization/roles', description: 'User roles and permissions' },
        { id: 'organization-user-accounts', name: 'User Accounts', path: '/organization/user-accounts', description: 'Manage user accounts' },
        { id: 'organization-account-creation', name: 'Account Creation', path: '/organization/account-creation', description: 'Create user accounts for employees' }
      ]
    },
    {
      id: 'people',
      name: 'People',
      path: '/people',
      description: 'People management',
      children: [
        { id: 'people-dashboard', name: 'Dashboard', path: '/people/dashboard', description: 'People analytics dashboard' },
        { id: 'people-employees', name: 'Employees', path: '/people/employees', description: 'Manage employees' },
        { id: 'people-departments', name: 'Departments', path: '/people/departments', description: 'Manage departments' },
        { id: 'people-designations', name: 'Designations', path: '/people/designations', description: 'Manage designations' }
      ]
    },
    {
      id: 'sales',
      name: 'Sales',
      path: '/sales',
      description: 'Sales management',
      children: [
        { id: 'sales-dashboard', name: 'Dashboard', path: '/sales', description: 'Sales dashboard' },
        { id: 'sales-create-lead', name: 'Create Lead', path: '/sales/create-lead', description: 'Create new sales lead' },
        { id: 'sales-my-leads', name: 'My Leads', path: '/sales/my-leads', description: 'View and manage my leads' },
        { id: 'sales-unassigned-lead', name: 'Unassigned Leads', path: '/sales/unassigned-lead', description: 'Unassigned leads' },
        { id: 'sales-lead-sources', name: 'Lead Sources', path: '/sales/lead-sources', description: 'Manage lead sources' },
        { id: 'sales-follow-up', name: 'Follow Up', path: '/sales/follow-up', description: 'Follow up on leads' },
        { id: 'sales-quotations', name: 'Quotations', path: '/sales/quotations', description: 'Create and manage quotations' },
        { id: 'sales-approvals', name: 'Approval Queue', path: '/sales/approvals', description: 'Review and approve quotations' },
        { id: 'sales-order-confirmation', name: 'Order Confirmation', path: '/sales/order-confirmation', description: 'Confirm orders' },
        { id: 'sales-rejected-leads', name: 'Rejected Leads', path: '/sales/rejected-leads', description: 'Manage rejected leads' },
        { id: 'sales-ai-insights', name: 'AI Insights', path: '/sales/ai-insights', description: 'AI-powered sales insights' }
      ]
    },
    {
      id: 'tasks',
      name: 'Tasks',
      path: '/tasks',
      description: 'AI-powered task management system',
      children: [
        { id: 'tasks-dashboard', name: 'My Tasks Dashboard', path: '/tasks/dashboard', description: 'Employee portal for task management' },
        { id: 'tasks-admin', name: 'Admin Control Center', path: '/admin/task-management', description: 'Administrative task management and oversight' },
        { id: 'tasks-ai-generator', name: 'AI Task Generator', path: '/test-ai-task-system.html', description: 'Generate intelligent tasks using AI' },
        { id: 'tasks-migration', name: 'Migration Panel', path: '/followup-to-task-migration.html', description: 'Migrate followups to intelligent tasks' },
        { id: 'tasks-analytics', name: 'Task Analytics', path: '/tasks/analytics', description: 'Task performance and insights' },
        { id: 'tasks-calendar', name: 'Task Calendar', path: '/tasks/calendar', description: 'Calendar view of all tasks' },
        { id: 'tasks-reports', name: 'Task Reports', path: '/tasks/reports', description: 'Comprehensive task reporting' }
      ]
    },
    {
      id: 'accounting',
      name: 'Accounting',
      path: '/accounting',
      description: 'Accounting and finance workflow',
      children: [
        { id: 'accounting-payments', name: 'Payment Processing', path: '/accounting/payments', description: 'Process payments for approved quotations' }
      ]
    },
    {
      id: 'post-sales',
      name: 'Post-Sales',
      path: '/post-sales',
      description: 'Post-sales operations',
      children: [
        { id: 'post-sales-confirmations', name: 'Confirmations', path: '/post-sales/confirmations', description: 'Confirmation calls and follow-ups' }
      ]
    },
    {
      id: 'events',
      name: 'Events',
      path: '/events',
      description: 'Event management',
      children: [
        { id: 'events-calendar', name: 'Calendar', path: '/events/calendar', description: 'Event calendar' },
        { id: 'events-list', name: 'All Events', path: '/events', description: 'All events overview' },
        { id: 'events-venues', name: 'Venues', path: '/events/venues', description: 'Venue management' },
        { id: 'events-staff', name: 'Staff Assignment', path: '/events/staff', description: 'Event staff assignments' }
      ]
    },
    {
      id: 'production',
      name: 'Production',
      path: '/post-production',
      description: 'Production management',
      children: [
        { id: 'production-timeline', name: 'Timeline', path: '/post-production/timeline', description: 'Production timeline' },
        { id: 'production-assets', name: 'Assets', path: '/post-production/assets', description: 'Digital assets' },
        { id: 'production-delivery', name: 'Delivery', path: '/post-production/delivery', description: 'Asset delivery' }
      ]
    },
    {
      id: 'reports',
      name: 'Reports',
      path: '/reports',
      description: 'Analytics and reports',
      children: [
        { id: 'reports-lead-sources', name: 'Lead Sources', path: '/reports/lead-sources', description: 'Lead source analysis' },
        { id: 'reports-conversion-funnel', name: 'Conversion Funnel', path: '/reports/conversion-funnel', description: 'Sales conversion analysis' },
        { id: 'reports-team-performance', name: 'Team Performance', path: '/reports/team-performance', description: 'Team performance metrics' },
        { id: 'reports-trends', name: 'Trends', path: '/reports/trends', description: 'Trend analysis' },
        { id: 'reports-custom', name: 'Custom Reports', path: '/reports/custom', description: 'Create custom reports' },
        { id: 'reports-workflow-history', name: 'Workflow History', path: '/reports/workflow-history', description: 'Quotation workflow audit trail' }
      ]
    },
    {
      id: 'audit',
      name: 'Audit',
      path: '/audit',
      description: 'System audit and logs',
      children: [
        { id: 'audit-activity-logs', name: 'Activity Logs', path: '/audit/activity-logs', description: 'System activity logs' },
        { id: 'audit-employee-audit', name: 'Employee Audit', path: '/audit/employee-audit', description: 'Employee activity audit' }
      ]
    },
    {
      id: 'admin',
      name: 'Admin',
      path: '/admin',
      description: 'System administration',
      children: [
        { id: 'admin-migration', name: 'Migration', path: '/admin/migration', description: 'Database migrations' },
        { id: 'admin-templates', name: 'Templates', path: '/admin/templates', description: 'Email and document templates' },
        { id: 'admin-menu-permissions', name: 'Menu Permissions', path: '/admin/menu-permissions', description: 'Menu and role permissions' },
        { id: 'admin-system-settings', name: 'System Settings', path: '/admin/system-settings', description: 'System configuration' }
      ]
    },
    {
      id: 'follow-ups',
      name: 'Follow-ups',
      path: '/follow-ups',
      description: 'Lead follow-up management',
      children: [
        { id: 'follow-ups-pending', name: 'Pending Follow-ups', path: '/follow-ups/pending', description: 'Pending follow-up tasks' },
        { id: 'follow-ups-completed', name: 'Completed Follow-ups', path: '/follow-ups/completed', description: 'Completed follow-up history' }
      ]
    }
  ]
} 