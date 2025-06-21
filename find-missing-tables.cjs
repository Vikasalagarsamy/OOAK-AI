// All 117 remote tables
const REMOTE_TABLES = [
  'accounting_workflows', 'action_recommendations', 'activities', 
  'ai_behavior_settings', 'ai_configurations', 'ai_contacts',
  'ai_decision_log', 'ai_insights_summary', 'ai_performance_tracking',
  'ai_prompt_templates', 'ai_recommendations', 'ai_tasks',
  'analytics_cache', 'analytics_metrics', 'auditions', 'branches',
  'bug_attachments', 'bug_comments', 'bugs', 'business_trends',
  'call_analytics', 'call_insights', 'call_transcriptions', 'chat_logs',
  'client_insights', 'clients', 'companies', 'company_partners',
  'deliverable_master', 'deliverables', 'department_instructions',
  'departments', 'designations', 'email_notification_templates',
  'employee_companies', 'employees', 'events', 'follow_up_auditions',
  'instruction_approvals', 'lead_drafts', 'lead_followups',
  'lead_sources', 'lead_task_performance', 'leads', 'management_insights',
  'menu_items', 'menu_items_tracking', 'ml_model_performance',
  'mv_user_roles_fast', 'notification_batches', 'notification_engagement',
  'notification_patterns', 'notification_performance_metrics',
  'notification_preferences', 'notification_recipients', 'notification_rules',
  'notification_settings', 'notifications', 'partners', 'payments',
  'permissions', 'personalization_learning', 'post_sale_confirmations',
  'post_sales_workflows', 'predictive_insights', 'profiles',
  'query_performance_logs', 'quotation_approvals', 'quotation_events',
  'quotation_predictions', 'quotation_revisions', 'quotation_workflow_history',
  'quotations', 'quote_components', 'quote_deliverables_snapshots',
  'quote_services_snapshot', 'recent_business_notifications',
  'rejected_leads_view', 'revenue_forecasts', 'role_menu_permissions',
  'role_permissions', 'roles', 'sales_activities', 'sales_performance_metrics',
  'sales_team_members', 'sequence_rules', 'sequence_steps',
  'service_packages', 'services', 'suppliers', 'system_logs',
  'task_generation_log', 'task_performance_metrics', 'task_sequence_templates',
  'task_status_history', 'team_members', 'team_performance_trends',
  'teams', 'user_accounts', 'user_activity_history', 'user_ai_profiles',
  'user_behavior_analytics', 'user_engagement_analytics',
  'user_engagement_summary', 'user_id_mapping', 'user_menu_permissions',
  'user_notification_summary', 'user_preferences', 'user_roles',
  'users', 'v_package_deliverables', 'v_package_services',
  'vendors', 'webhook_logs', 'whatsapp_config', 'whatsapp_messages',
  'whatsapp_templates'
];

// 62 local tables (same in both port 54321 and 54323)
const LOCAL_TABLES = [
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
];

function analyzeMissingTables() {
  console.log('🔍 ANALYZING TABLE GAPS BETWEEN REMOTE AND LOCAL\n');
  
  // Find missing tables
  const missingTables = REMOTE_TABLES.filter(table => !LOCAL_TABLES.includes(table));
  
  // Find extra tables (shouldn't be any based on the data)
  const extraTables = LOCAL_TABLES.filter(table => !REMOTE_TABLES.includes(table));
  
  console.log('📊 SUMMARY:');
  console.log(`📡 Remote tables: ${REMOTE_TABLES.length}`);
  console.log(`💻 Local tables: ${LOCAL_TABLES.length}`);
  console.log(`❌ Missing locally: ${missingTables.length}`);
  console.log(`➕ Extra locally: ${extraTables.length}`);
  
  const coverage = Math.round((LOCAL_TABLES.length / REMOTE_TABLES.length) * 100);
  console.log(`📈 Coverage: ${coverage}%\n`);
  
  if (missingTables.length > 0) {
    console.log('🚨 CRITICAL: Missing Tables (55 tables):');
    console.log('=' .repeat(50));
    missingTables.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });
  }
  
  if (extraTables.length > 0) {
    console.log('\n➕ Extra local tables (not in remote):');
    extraTables.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });
  }
  
  // Categorize missing tables
  console.log('\n📂 MISSING TABLES BY CATEGORY:');
  console.log('=' .repeat(40));
  
  const categories = {
    'Accounting & Workflows': missingTables.filter(t => t.includes('accounting') || t.includes('workflow')),
    'AI & Analytics': missingTables.filter(t => t.includes('ai_') && !LOCAL_TABLES.includes(t)),
    'Bug Tracking': missingTables.filter(t => t.includes('bug')),
    'Business & Trends': missingTables.filter(t => t.includes('business') || t.includes('trend')),
    'Communication': missingTables.filter(t => t.includes('chat') || t.includes('whatsapp_') && t !== 'whatsapp_templates'),
    'Insights & Analytics': missingTables.filter(t => t.includes('insight') || t.includes('analytics_') && t !== 'analytics_metrics'),
    'Notifications': missingTables.filter(t => t.includes('notification_') && !LOCAL_TABLES.includes(t)),
    'User Management': missingTables.filter(t => t.includes('user_') && !LOCAL_TABLES.includes(t)),
    'Other Features': []
  };
  
  // Find uncategorized tables
  const categorized = Object.values(categories).flat();
  categories['Other Features'] = missingTables.filter(t => !categorized.includes(t));
  
  Object.entries(categories).forEach(([category, tables]) => {
    if (tables.length > 0) {
      console.log(`\n${category} (${tables.length}):`);
      tables.forEach(table => console.log(`  - ${table}`));
    }
  });
  
  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('=' .repeat(40));
  console.log('🚨 CRITICAL: You are missing 55 tables (47% of your data)!');
  console.log('📋 Before deleting remote database, you MUST:');
  console.log('   1. Export schemas for all 55 missing tables');
  console.log('   2. Export data from remote for these tables');
  console.log('   3. Import both schemas and data to local');
  console.log('   4. Verify 100% coverage before deletion');
  
  console.log('\n💡 OPTIONS:');
  console.log('   A) Use Supabase Studio to export complete database');
  console.log('   B) Create migration scripts for the 55 missing tables');
  console.log('   C) Keep remote database until full migration is complete');
  
  return { missingTables, extraTables, coverage };
}

analyzeMissingTables(); 