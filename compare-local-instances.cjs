// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:40:16.382Z
// Original file backed up as: compare-local-instances.cjs.backup


// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DATABASE || 'ooak_future',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});


// Query helper function
async function query(text, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return { data: result.rows, error: null };
  } catch (error) {
    console.error('❌ PostgreSQL Query Error:', error.message);
    return { data: null, error: error.message };
  } finally {
    client.release();
  }
}

// Transaction helper function  
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return { data: result, error: null };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ PostgreSQL Transaction Error:', error.message);
    return { data: null, error: error.message };
  } finally {
    client.release();
  }
}

// Original content starts here:
const { Pool } = require('pg'););

// Two local Supabase instances
const instances = [
  {
    name: "Port 54321",
    url: 'http://localhost:54321',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MzE1NTc5NDUsImV4cCI6MjA0NzEzMzk0NX0.gfwXTzTK35nL-lD3-6zY2Wn1azOq5TCKdQY_HXOKYzI'
  },
  {
    name: "Port 54323", 
    url: 'http://localhost:54323',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MzE1NTc5NDUsImV4cCI6MjA0NzEzMzk0NX0.gfwXTzTK35nL-lD3-6zY2Wn1azOq5TCKdQY_HXOKYzI'
  }
];

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

async function analyzeInstance(instance) {
  console.log(`\n🔍 Analyzing ${instance.name}...`);
  console.log(`URL: ${instance.url}`);
  
  // PostgreSQL connection - see pool configuration below
  
  const existingTables = [];
  const missingTables = [];
  const tableData = {};
  
  for (const tableName of REMOTE_TABLES) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(3);
      
      if (!error) {
        existingTables.push(tableName);
        tableData[tableName] = {
          recordCount: data ? data.length : 0,
          hasData: data && data.length > 0
        };
        process.stdout.write('✅');
      } else {
        missingTables.push(tableName);
        process.stdout.write('❌');
      }
    } catch (e) {
      missingTables.push(tableName);
      process.stdout.write('💥');
    }
  }
  
  console.log('\n');
  
  return {
    instanceName: instance.name,
    url: instance.url,
    existingTables,
    missingTables,
    tableData,
    totalExisting: existingTables.length,
    totalMissing: missingTables.length,
    completeness: Math.round((existingTables.length / REMOTE_TABLES.length) * 100)
  };
}

async function compareInstances() {
  console.log('🔍 COMPARING LOCAL SUPABASE INSTANCES\n');
  console.log(`Testing ${REMOTE_TABLES.length} remote tables across both instances...\n`);
  
  const results = [];
  
  for (const instance of instances) {
    const result = await analyzeInstance(instance);
    results.push(result);
    
    // Small delay between instances
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPARISON RESULTS');
  console.log('='.repeat(80));
  
  results.forEach(result => {
    console.log(`\n${result.instanceName}:`);
    console.log(`  📍 URL: ${result.url}`);
    console.log(`  ✅ Tables found: ${result.totalExisting}/${REMOTE_TABLES.length} (${result.completeness}%)`);
    console.log(`  ❌ Tables missing: ${result.totalMissing}`);
    
    if (result.totalExisting > 0) {
      const tablesWithData = Object.values(result.tableData).filter(t => t.hasData).length;
      console.log(`  📊 Tables with data: ${tablesWithData}/${result.totalExisting}`);
    }
  });
  
  // Find the best instance
  const bestInstance = results.reduce((best, current) => 
    current.totalExisting > best.totalExisting ? current : best
  );
  
  console.log(`\n🏆 BEST MATCH: ${bestInstance.instanceName}`);
  console.log(`   ${bestInstance.totalExisting} tables (${bestInstance.completeness}% complete)`);
  
  // Show unique tables in each instance
  if (results.length === 2) {
    const [instance1, instance2] = results;
    
    const onlyIn1 = instance1.existingTables.filter(t => !instance2.existingTables.includes(t));
    const onlyIn2 = instance2.existingTables.filter(t => !instance1.existingTables.includes(t));
    const inBoth = instance1.existingTables.filter(t => instance2.existingTables.includes(t));
    
    console.log(`\n🔄 TABLE DISTRIBUTION:`);
    console.log(`   📋 Only in ${instance1.instanceName}: ${onlyIn1.length} tables`);
    console.log(`   📋 Only in ${instance2.instanceName}: ${onlyIn2.length} tables`);
    console.log(`   📋 In both instances: ${inBoth.length} tables`);
    
    if (onlyIn1.length > 0) {
      console.log(`\n   📝 Unique to ${instance1.instanceName}:`);
      onlyIn1.slice(0, 10).forEach(table => console.log(`      - ${table}`));
      if (onlyIn1.length > 10) console.log(`      ... and ${onlyIn1.length - 10} more`);
    }
    
    if (onlyIn2.length > 0) {
      console.log(`\n   📝 Unique to ${instance2.instanceName}:`);
      onlyIn2.slice(0, 10).forEach(table => console.log(`      - ${table}`));
      if (onlyIn2.length > 10) console.log(`      ... and ${onlyIn2.length - 10} more`);
    }
  }
  
  console.log('\n🎯 RECOMMENDATION:');
  if (bestInstance.completeness < 50) {
    console.log('⚠️  Neither instance has a majority of remote tables.');
    console.log('🚨 You may need to sync BOTH instances with remote before deletion.');
  } else {
    console.log(`✅ Use ${bestInstance.instanceName} as your primary local database.`);
    console.log(`🔄 Sync the missing ${bestInstance.totalMissing} tables from remote.`);
  }
  
  return results;
}

compareInstances(); 