-- Standardize menu string IDs
BEGIN;

-- First, let's clear any existing string_ids to start fresh
UPDATE menu_items SET string_id = NULL;

-- Now update all items with standardized string IDs
-- Update Core Business items
UPDATE menu_items SET string_id = 'core-business' WHERE name = 'Core Business';
UPDATE menu_items SET string_id = 'dashboard' WHERE name = 'Dashboard';
UPDATE menu_items SET string_id = 'ai-control' WHERE name = '🚀 AI Business Control';
UPDATE menu_items SET string_id = 'ai-business-insights' WHERE name = '🤖 AI Business Insights';
UPDATE menu_items SET string_id = 'ai-call-analytics' WHERE name = '📞 AI Call Analytics';

-- Update Sales & Revenue items
UPDATE menu_items SET string_id = 'sales-revenue' WHERE name = 'Sales & Revenue';
UPDATE menu_items SET string_id = 'sales-dashboard' WHERE name = 'Sales Dashboard';
UPDATE menu_items SET string_id = 'sales-create-lead' WHERE name = 'Create Lead';
UPDATE menu_items SET string_id = 'sales-my-leads' WHERE name = 'My Leads';
UPDATE menu_items SET string_id = 'sales-unassigned-leads' WHERE name = 'Unassigned Leads';
UPDATE menu_items SET string_id = 'sales-follow-up' WHERE name = 'Follow Up';
UPDATE menu_items SET string_id = 'sales-quotations' WHERE name = 'Quotations';
UPDATE menu_items SET string_id = 'sales-approval-queue' WHERE name = 'Approval Queue';
UPDATE menu_items SET string_id = 'sales-rejected-quotes' WHERE name = 'Rejected Quotes';
UPDATE menu_items SET string_id = 'sales-order-confirmation' WHERE name = 'Order Confirmation';
UPDATE menu_items SET string_id = 'sales-rejected-leads' WHERE name = 'Rejected Leads';
UPDATE menu_items SET string_id = 'sales-lead-sources' WHERE name = 'Lead Sources';
UPDATE menu_items SET string_id = 'sales-quotations-analytics' WHERE name = 'Quotations Analytics';

-- Update Organization items
UPDATE menu_items SET string_id = 'organization' WHERE name = 'Organization';
UPDATE menu_items SET string_id = 'organization-companies' WHERE name = 'Companies';
UPDATE menu_items SET string_id = 'organization-branches' WHERE name = 'Branches';
UPDATE menu_items SET string_id = 'organization-vendors' WHERE name = 'Vendors';
UPDATE menu_items SET string_id = 'organization-suppliers' WHERE name = 'Suppliers';
UPDATE menu_items SET string_id = 'organization-clients' WHERE name = 'Clients';
UPDATE menu_items SET string_id = 'organization-roles' WHERE name = 'Roles & Permissions';
UPDATE menu_items SET string_id = 'organization-menu-manager' WHERE name = 'Menu Manager';
UPDATE menu_items SET string_id = 'organization-user-accounts' WHERE name = 'User Accounts';
UPDATE menu_items SET string_id = 'organization-account-creation' WHERE name = 'Account Creation';

-- Update People & HR items
UPDATE menu_items SET string_id = 'people-hr' WHERE name = 'People & HR';
UPDATE menu_items SET string_id = 'people-dashboard' WHERE name = 'People Dashboard';
UPDATE menu_items SET string_id = 'people-employees' WHERE name = 'Employees';
UPDATE menu_items SET string_id = 'people-departments' WHERE name = 'Departments';
UPDATE menu_items SET string_id = 'people-designations' WHERE name = 'Designations';

-- Update Task Management items
UPDATE menu_items SET string_id = 'task-management' WHERE name = 'Task Management';
UPDATE menu_items SET string_id = 'tasks-my-tasks' WHERE name = 'My Tasks';
UPDATE menu_items SET string_id = 'tasks-control-center' WHERE name = 'Task Control Center';
UPDATE menu_items SET string_id = 'tasks-ai-generator' WHERE name = 'AI Task Generator';
UPDATE menu_items SET string_id = 'tasks-analytics' WHERE name = 'Task Analytics';
UPDATE menu_items SET string_id = 'tasks-calendar' WHERE name = 'Task Calendar';
UPDATE menu_items SET string_id = 'tasks-reports' WHERE name = 'Task Reports';
UPDATE menu_items SET string_id = 'tasks-sequence-management' WHERE name = 'Task Sequence Management';
UPDATE menu_items SET string_id = 'tasks-integration-status' WHERE name = 'Integration Status';

-- Update Accounting & Finance items
UPDATE menu_items SET string_id = 'accounting-finance' WHERE name = 'Accounting & Finance';
UPDATE menu_items SET string_id = 'accounting-dashboard' WHERE name = 'Financial Dashboard';
UPDATE menu_items SET string_id = 'accounting-invoices' WHERE name = 'Invoices';
UPDATE menu_items SET string_id = 'accounting-payments' WHERE name = 'Payments';
UPDATE menu_items SET string_id = 'accounting-expenses' WHERE name = 'Expenses';

-- Update Event Coordination items
UPDATE menu_items SET string_id = 'event-coordination' WHERE name = 'Event Coordination';
UPDATE menu_items SET string_id = 'events-dashboard' WHERE name = 'Events Dashboard';
UPDATE menu_items SET string_id = 'events' WHERE name = 'Events';
UPDATE menu_items SET string_id = 'events-calendar' WHERE name = 'Event Calendar';
UPDATE menu_items SET string_id = 'events-list' WHERE name = 'Event List';
UPDATE menu_items SET string_id = 'events-types' WHERE name = 'Event Types';
UPDATE menu_items SET string_id = 'events-services' WHERE name = 'Services';
UPDATE menu_items SET string_id = 'events-venues' WHERE name = 'Venues';
UPDATE menu_items SET string_id = 'events-staff' WHERE name = 'Staff Assignment';

-- Update Post Production items
UPDATE menu_items SET string_id = 'post-production' WHERE name = 'Post Production';
UPDATE menu_items SET string_id = 'post-production-dashboard' WHERE name = 'Production Dashboard';
UPDATE menu_items SET string_id = 'post-production-deliverables' WHERE name = 'Deliverables';
UPDATE menu_items SET string_id = 'post-production-deliverables-workflow' WHERE name = 'Deliverables Workflow';
UPDATE menu_items SET string_id = 'post-production-projects' WHERE name = 'Projects';
UPDATE menu_items SET string_id = 'post-production-workflow' WHERE name = 'Workflow';
UPDATE menu_items SET string_id = 'post-production-quality' WHERE name = 'Quality Control';
UPDATE menu_items SET string_id = 'post-production-review' WHERE name = 'Client Review';
UPDATE menu_items SET string_id = 'post-production-delivery' WHERE name = 'Final Delivery';

-- Update Post-Sales items
UPDATE menu_items SET string_id = 'post-sales' WHERE name = 'Post-Sales';
UPDATE menu_items SET string_id = 'post-sales-dashboard' WHERE name = 'Post-Sales Dashboard';
UPDATE menu_items SET string_id = 'post-sales-delivery' WHERE name = 'Delivery Management';
UPDATE menu_items SET string_id = 'post-sales-support' WHERE name = 'Customer Support';
UPDATE menu_items SET string_id = 'post-sales-feedback' WHERE name = 'Customer Feedback';

-- Update Reports & Analytics items
UPDATE menu_items SET string_id = 'reports-analytics' WHERE name = 'Reports & Analytics';
UPDATE menu_items SET string_id = 'reports-lead-sources' WHERE name = 'Lead Source Analysis';
UPDATE menu_items SET string_id = 'reports-conversion-funnel' WHERE name = 'Conversion Funnel';
UPDATE menu_items SET string_id = 'reports-team-performance' WHERE name = 'Team Performance';
UPDATE menu_items SET string_id = 'reports-trends' WHERE name = 'Business Trends';
UPDATE menu_items SET string_id = 'reports-custom' WHERE name = 'Custom Reports';

-- Update System Administration items
UPDATE menu_items SET string_id = 'system-administration' WHERE name = 'System Administration';
UPDATE menu_items SET string_id = 'admin-dashboard' WHERE name = 'Admin Dashboard';
UPDATE menu_items SET string_id = 'admin-database-monitor' WHERE name = 'Database Monitor';
UPDATE menu_items SET string_id = 'admin-menu-permissions' WHERE name = 'Menu Permissions';
UPDATE menu_items SET string_id = 'admin-system-settings' WHERE name = 'System Settings';
UPDATE menu_items SET string_id = 'admin-menu-repair' WHERE name = 'Menu Repair';
UPDATE menu_items SET string_id = 'admin-menu-debug' WHERE name = 'Menu Debug';
UPDATE menu_items SET string_id = 'admin-test-permissions' WHERE name = 'Test Permissions';
UPDATE menu_items SET string_id = 'admin-test-feature' WHERE name = 'Test Feature';

COMMIT; 