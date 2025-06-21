// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:40:16.376Z
// Original file backed up as: sync-roles.cjs.backup


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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
// PostgreSQL connection - see pool configuration below

const localConfig = {
  user: 'vikasalagarsamy',
  host: 'localhost',
  database: 'ooak_local',
  port: 5432,
}

async function syncRoles() {
  console.log('🔄 Syncing roles from remote to local...')
  
  const localClient = new Client(localConfig)
  
  try {
    await localClient.connect()
    
    // Get roles from remote
    const { data: roles, error } = await supabasequery('SELECT * FROM roles')
    
    if (error) {
      console.error('❌ Error fetching roles:', error.message)
      return
    }
    
    console.log(`📊 Found ${roles.length} roles in remote`)
    
    // Clear local roles
    await localClient.query('TRUNCATE TABLE roles CASCADE')
    
    // Insert each role
    for (const role of roles) {
      const columns = Object.keys(role)
      const values = Object.values(role)
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
      
      const query = `
        INSERT INTO roles (${columns.map(col => `"${col}"`).join(', ')})
        VALUES (${placeholders})
      `
      
      await localClient.query(query, values)
      console.log(`✅ Synced role: ${role.name}`)
    }
    
    console.log('✅ Roles sync completed!')
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message)
  } finally {
    await localClient.end()
  }
}

syncRoles() 