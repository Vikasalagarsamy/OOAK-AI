// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:50:05.791Z
// Original file backed up as: sync-data.js.backup


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
#!/usr/bin/env node

/**
 * SUPABASE DATA SYNC SCRIPT
 * Syncs data from remote Supabase to local Supabase using API
 */

const { Pool } = require('pg');

// Remote Supabase configuration
const REMOTE_URL = 'https://aavofqdzjhyfjygkxynq.supabase.co';
const REMOTE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY';

// Local Supabase configuration  
const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Initialize clients
// PostgreSQL connection - see pool configuration below
// PostgreSQL connection - see pool configuration below

// Tables to sync (in order to respect foreign key constraints)
const SYNC_ORDER = [
    'roles',
    'departments', 
    'designations',
    'companies',
    'branches',
    'lead_sources',
    'employees',
    'user_accounts',  // Move after employees to satisfy foreign key
    'leads',
    'quotations',
    'notifications',
    'whatsapp_config',
    'whatsapp_templates',
    'whatsapp_messages',
    'vendors',
    'clients'
    // Removed 'tasks' since it doesn't exist
];

async function syncTable(tableName) {
    console.log(`\n🔄 Syncing ${tableName}...`);
    
    try {
        // Fetch data from remote
        const { data: remoteData, error: fetchError } = await remoteSupabase
            .from(tableName)
            .select('*')
            .limit(1000); // Limit for safety
            
        if (fetchError) {
            console.log(`❌ Error fetching ${tableName}:`, fetchError.message);
            return false;
        }
        
        if (!remoteData || remoteData.length === 0) {
            console.log(`⚪ ${tableName}: No data to sync`);
            return true;
        }
        
        console.log(`📥 Found ${remoteData.length} records in ${tableName}`);
        
        // Clear local table first (optional - comment out if you want to preserve local data)
        const { error: deleteError } = await localSupabase
            .from(tableName)
            .delete()
            .neq('id', 0); // Delete all records
            
        if (deleteError && !deleteError.message.includes('row not found')) {
            console.log(`⚠️  Warning clearing ${tableName}:`, deleteError.message);
        }
        
        // Insert data into local database in chunks
        const chunkSize = 100;
        for (let i = 0; i < remoteData.length; i += chunkSize) {
            const chunk = remoteData.slice(i, i + chunkSize);
            
            const { error: insertError } = await localSupabase
                .from(tableName)
                .insert(chunk);
                
            if (insertError) {
                console.log(`❌ Error inserting chunk ${Math.floor(i/chunkSize) + 1} into ${tableName}:`, insertError.message);
                return false;
            }
        }
        
        console.log(`✅ ${tableName}: Successfully synced ${remoteData.length} records`);
        return true;
        
    } catch (error) {
        console.log(`❌ Unexpected error syncing ${tableName}:`, error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting Supabase Data Sync...');
    console.log('📡 Remote:', REMOTE_URL);
    console.log('🏠 Local:', LOCAL_URL);
    console.log('');
    
    let successCount = 0;
    let totalCount = 0;
    
    for (const tableName of SYNC_ORDER) {
        totalCount++;
        const success = await syncTable(tableName);
        if (success) successCount++;
        
        // Small delay between tables
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 SYNC SUMMARY`);
    console.log(`✅ Successful: ${successCount}/${totalCount} tables`);
    console.log(`❌ Failed: ${totalCount - successCount}/${totalCount} tables`);
    console.log('='.repeat(50));
    
    if (successCount === totalCount) {
        console.log('🎉 All data synced successfully!');
        console.log('🔗 Open local Studio: http://127.0.0.1:54323');
    } else {
        console.log('⚠️  Some tables failed to sync. Check errors above.');
    }
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
});

// Run the sync
main().catch(console.error); 