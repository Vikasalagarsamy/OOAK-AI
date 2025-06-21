// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:38:43.924Z
// Original file backed up as: sync-remote-to-local.cjs.backup


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
const { Pool } = require('pg');)
const { Client } = require('pg')
require('dotenv').config({ path: '.env.local' })

// Remote Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Local PostgreSQL configuration
const localConfig = {
  user: 'vikasalagarsamy',
  host: 'localhost',
  database: 'ooak_local',
  port: 5432,
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

// PostgreSQL connection - see pool configuration below

async function syncRemoteToLocal() {
  console.log('🔄 Starting remote to local sync...')
  
  const localClient = new Client(localConfig)
  
  try {
    await localClient.connect()
    console.log('✅ Connected to local PostgreSQL')
    
    console.log('ℹ️  Using manual table list')
    // Define known tables from your migrations
    const knownTables = [
      'roles',
      'employees', 
      'deliverable_master',
      'notifications',
      'notification_preferences',
      'user_activity_logs',
      'ai_models',
      'ai_tasks',
      'leads',
      'companies',
      'team_performance_metrics',
      'sales_performance_metrics',
      'call_transcriptions',
      'ai_conversation_memory',
      'lead_followups',
      'task_generation_log',
      'lead_task_performance',
      'task_reminders',
      'task_performance',
      'task_comments',
      'quotations',
      'clients',
      'organizations',
      'quotation_items',
      'payments',
      'quotation_revisions',
      'department_instructions',
      'instruction_approvals',
      'accounting_workflows',
      'post_sales_workflows'
    ]
    
    for (const tableName of knownTables) {
      await syncTable(tableName, localClient)
    }
    
    console.log('✅ Sync completed successfully!')
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message)
  } finally {
    await localClient.end()
  }
}

async function syncTable(tableName, localClient) {
  try {
    console.log(`🔄 Syncing table: ${tableName}`)
    
    // Get data from remote table
    const { data: remoteData, error } = await supabase
      .from(tableName)
      .select('*')
    
    if (error) {
      console.log(`⚠️  Skipping ${tableName}: ${error.message}`)
      return
    }
    
    if (!remoteData || remoteData.length === 0) {
      console.log(`ℹ️  Table ${tableName} is empty`)
      return
    }
    
    // Clear local table
    await localClient.query(`TRUNCATE TABLE "${tableName}" CASCADE`).catch(() => {
      console.log(`ℹ️  Table ${tableName} doesn't exist locally, skipping truncate`)
    })
    
    // Insert data into local table
    for (const row of remoteData) {
      const columns = Object.keys(row)
      const values = Object.values(row)
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
      
      const query = `
        INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')})
        VALUES (${placeholders})
        ON CONFLICT DO NOTHING
      `
      
      await localClient.query(query, values).catch(err => {
        console.log(`⚠️  Error inserting into ${tableName}:`, err.message)
      })
    }
    
    console.log(`✅ Synced ${remoteData.length} rows to ${tableName}`)
    
  } catch (error) {
    console.log(`❌ Error syncing ${tableName}:`, error.message)
  }
}

// Run the sync
syncRemoteToLocal() 