-- Run this in your REMOTE Supabase Studio SQL Editor
-- This will generate all CREATE TABLE statements

-- Step 1: Get table list
SELECT table_name as "Missing Tables You Need"
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name NOT IN (
    'activities', 'ai_behavior_settings', 'ai_configurations', 'ai_contacts',
    'ai_prompt_templates', 'ai_tasks', 'analytics_metrics', 'branches',
    'call_analytics', 'call_transcriptions', 'clients', 'companies',
    'deliverable_master', 'deliverables', 'departments', 'designations',
    'email_notification_templates', 'employee_companies', 'employees', 'events',
    'lead_sources', 'leads', 'management_insights', 'menu_items',
    'menu_items_tracking', 'mv_user_roles_fast', 'notification_patterns',
    'notification_performance_metrics', 'notification_settings', 'notifications',
    'permissions', 'query_performance_logs', 'quotation_approvals',
    'quotation_events', 'quotations', 'revenue_forecasts', 'role_menu_permissions',
    'role_permissions', 'roles', 'sales_activities', 'sales_performance_metrics',
    'sales_team_members', 'sequence_rules', 'sequence_steps', 'service_packages',
    'services', 'suppliers', 'task_generation_log', 'task_performance_metrics',
    'task_sequence_templates', 'task_status_history', 'user_accounts',
    'user_ai_profiles', 'user_id_mapping', 'user_menu_permissions',
    'user_notification_summary', 'user_roles', 'users', 'v_package_deliverables',
    'v_package_services', 'vendors', 'whatsapp_templates'
  )
ORDER BY table_name;

-- Step 2: Generate CREATE statements for missing tables
SELECT 
  table_name,
  'CREATE TABLE ' || table_name || ' (' || CHR(10) ||
  string_agg(
    '    ' || column_name || ' ' || 
    CASE 
      WHEN data_type = 'character varying' THEN 'TEXT'
      WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMP WITH TIME ZONE'
      WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
      WHEN data_type = 'integer' THEN 'INTEGER'
      WHEN data_type = 'bigint' THEN 'BIGINT'
      WHEN data_type = 'boolean' THEN 'BOOLEAN'
      WHEN data_type = 'text' THEN 'TEXT'
      WHEN data_type = 'uuid' THEN 'UUID'
      WHEN data_type = 'jsonb' THEN 'JSONB'
      WHEN data_type = 'numeric' THEN 'DECIMAL'
      WHEN data_type = 'USER-DEFINED' THEN udt_name
      ELSE UPPER(data_type)
    END,
    ',' || CHR(10)
  ) || CHR(10) || ');' || CHR(10) as create_sql
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name NOT IN (
    'activities', 'ai_behavior_settings', 'ai_configurations', 'ai_contacts',
    'ai_prompt_templates', 'ai_tasks', 'analytics_metrics', 'branches',
    'call_analytics', 'call_transcriptions', 'clients', 'companies',
    'deliverable_master', 'deliverables', 'departments', 'designations',
    'email_notification_templates', 'employee_companies', 'employees', 'events',
    'lead_sources', 'leads', 'management_insights', 'menu_items',
    'menu_items_tracking', 'mv_user_roles_fast', 'notification_patterns',
    'notification_performance_metrics', 'notification_settings', 'notifications',
    'permissions', 'query_performance_logs', 'quotation_approvals',
    'quotation_events', 'quotations', 'revenue_forecasts', 'role_menu_permissions',
    'role_permissions', 'roles', 'sales_activities', 'sales_performance_metrics',
    'sales_team_members', 'sequence_rules', 'sequence_steps', 'service_packages',
    'services', 'suppliers', 'task_generation_log', 'task_performance_metrics',
    'task_sequence_templates', 'task_status_history', 'user_accounts',
    'user_ai_profiles', 'user_id_mapping', 'user_menu_permissions',
    'user_notification_summary', 'user_roles', 'users', 'v_package_deliverables',
    'v_package_services', 'vendors', 'whatsapp_templates'
  )
GROUP BY table_name
ORDER BY table_name; 