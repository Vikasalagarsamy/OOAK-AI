// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:38:43.921Z
// Original file backed up as: get-all-remote-tables.cjs.backup


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

// Remote Supabase configuration
const REMOTE_URL = 'https://aavofqdzjhyfjygkxynq.supabase.co';
const REMOTE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTU3MjE2NCwiZXhwIjoyMDQ3MTQ4MTY0fQ.k3bI6xHO_BsE9p5wXcJo_oLOw2-y7XClJ46r1T_HtTk';

// PostgreSQL connection - see pool configuration below

async function getAllTables() {
  console.log('🔍 Getting ALL tables from remote database...\n');
  
  try {
    // Method 1: Get tables from information_schema
    console.log('📋 Method 1: Using information_schema.tables...');
    const { data: schemaData, error: schemaError } = await remoteSupabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (schemaError) {
      console.log('❌ Method 1 failed:', schemaError.message);
    } else {
      console.log(`✅ Method 1: Found ${schemaData.length} tables`);
      console.log('Tables:', schemaData.map(t => t.table_name).slice(0, 10), '...');
    }
    
    // Method 2: Try direct REST API call to get table metadata
    console.log('\n📋 Method 2: Using REST API...');
    const response = await fetch(`${REMOTE_URL}/rest/v1/`, {
      headers: {
        'apikey': REMOTE_KEY,
        'Authorization': `Bearer ${REMOTE_KEY}`
      }
    });
    
    if (response.ok) {
      const apiData = await response.json();
      console.log('✅ Method 2: REST API response received');
      console.log('Available endpoints:', Object.keys(apiData.definitions || {}).slice(0, 20));
    }
    
    // Method 3: Get list by trying to query each table we can see
    console.log('\n📋 Method 3: Enumerating known tables...');
    const knownTables = [
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
    
    console.log(`📊 Testing ${knownTables.length} known tables...`);
    
    const existingTables = [];
    const nonExistingTables = [];
    
    for (const tableName of knownTables) {
      try {
        const { data, error } = await remoteSupabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          existingTables.push(tableName);
          process.stdout.write('✅');
        } else {
          nonExistingTables.push(tableName);
          process.stdout.write('❌');
        }
      } catch (e) {
        nonExistingTables.push(tableName);
        process.stdout.write('❌');
      }
    }
    
    console.log(`\n\n🎉 RESULTS:`);
    console.log(`✅ Existing tables: ${existingTables.length}`);
    console.log(`❌ Non-existing tables: ${nonExistingTables.length}`);
    
    console.log('\n📝 Existing tables:');
    existingTables.forEach((table, i) => {
      console.log(`${i + 1}. ${table}`);
    });
    
    if (nonExistingTables.length > 0) {
      console.log('\n❌ Non-existing tables:');
      nonExistingTables.forEach((table, i) => {
        console.log(`${i + 1}. ${table}`);
      });
    }
    
    return existingTables;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return [];
  }
}

getAllTables().then(tables => {
  console.log(`\n🎯 Total confirmed tables: ${tables.length}`);
}); 