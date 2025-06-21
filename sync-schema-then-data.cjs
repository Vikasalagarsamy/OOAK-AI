// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:38:43.925Z
// Original file backed up as: sync-schema-then-data.cjs.backup


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
const REMOTE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY';

// Local Supabase configuration  
const LOCAL_URL = 'http://localhost:54321';
const LOCAL_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

// PostgreSQL connection - see pool configuration below
// PostgreSQL connection - see pool configuration below

// Core tables that likely have data
const PRIORITY_TABLES = [
  'roles', 'employees', 'deliverable_master', 'notifications', 'sales_team_members',
  'quotation_approvals', 'client_insights', 'lead_sources', 'whatsapp_config',
  'notification_patterns', 'post_sale_confirmations', 'call_analytics',
  'accounting_workflows', 'companies', 'clients', 'quotations', 'leads',
  'users', 'departments', 'designations', 'permissions', 'services'
];

async function syncTableData(tableName) {
  try {
    console.log(`🔄 Syncing table: ${tableName}`);
    
    // Get all data from remote
    const { data: remoteData, error: remoteError } = await remoteSupabase
      .from(tableName)
      .select('*');
    
    if (remoteError) {
      console.log(`❌ Error fetching from remote ${tableName}: ${remoteError.message}`);
      return { success: false, error: remoteError.message };
    }
    
    if (!remoteData || remoteData.length === 0) {
      console.log(`📭 Table ${tableName} is empty`);
      return { success: true, count: 0 };
    }
    
    // Try to delete existing data (ignore errors if table doesn't exist)
    try {
      await localSupabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      // Table might not exist yet, that's ok
    }
    
    // Insert data to local in smaller batches
    const batchSize = 50; // Smaller batches to avoid issues
    let totalInserted = 0;
    
    for (let i = 0; i < remoteData.length; i += batchSize) {
      const batch = remoteData.slice(i, i + batchSize);
      
      const { error: localError } = await localSupabase
        .from(tableName)
        .insert(batch);
      
      if (localError) {
        console.log(`❌ Error inserting batch to local ${tableName}: ${localError.message}`);
        
        // Try inserting one by one to identify problematic records
        for (const record of batch) {
          const { error: singleError } = await localSupabase
            .from(tableName)
            .insert([record]);
          
          if (singleError) {
            console.log(`   ⚠️ Skipping problematic record in ${tableName}: ${singleError.message}`);
          } else {
            totalInserted++;
          }
        }
      } else {
        totalInserted += batch.length;
      }
    }
    
    console.log(`✅ Successfully synced ${tableName}: ${totalInserted} records`);
    return { success: true, count: totalInserted };
    
  } catch (error) {
    console.log(`❌ Unexpected error syncing ${tableName}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function syncPriorityTables() {
  console.log('🚀 Starting priority database sync from remote to local...\n');
  
  console.log(`🔄 Syncing ${PRIORITY_TABLES.length} priority tables...\n`);
  
  const results = {
    successful: [],
    failed: [],
    totalRecords: 0
  };
  
  for (const table of PRIORITY_TABLES) {
    const result = await syncTableData(table);
    
    if (result.success) {
      results.successful.push({ table, count: result.count });
      results.totalRecords += result.count;
    } else {
      results.failed.push({ table, error: result.error });
    }
    
    // Small delay between tables
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('🎉 PRIORITY SYNC COMPLETE! Summary:');
  console.log('='.repeat(80));
  console.log(`✅ Successfully synced: ${results.successful.length} tables`);
  console.log(`❌ Failed: ${results.failed.length} tables`);
  console.log(`📊 Total records synced: ${results.totalRecords}`);
  
  if (results.successful.length > 0) {
    console.log('\n✅ Successful syncs:');
    results.successful.forEach(({ table, count }) => {
      console.log(`  - ${table}: ${count} records`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed syncs:');
    results.failed.forEach(({ table, error }) => {
      console.log(`  - ${table}: ${error}`);
    });
  }
  
  console.log('\n🎯 Priority tables synced from remote to local!');
  
  // Check specifically for accounting_workflows
  const accountingResult = results.successful.find(r => r.table === 'accounting_workflows') || 
                          results.failed.find(r => r.table === 'accounting_workflows');
  
  if (accountingResult) {
    if (accountingResult.count !== undefined) {
      console.log(`\n✅ accounting_workflows table: ${accountingResult.count} records synced`);
    } else {
      console.log(`\n❌ accounting_workflows table failed: ${accountingResult.error}`);
    }
  }
}

// Run the sync
syncPriorityTables().catch(console.error); 