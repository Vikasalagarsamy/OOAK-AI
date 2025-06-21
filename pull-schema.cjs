// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:38:43.922Z
// Original file backed up as: pull-schema.cjs.backup


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
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

// Remote Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

// PostgreSQL connection - see pool configuration below

async function pullSchema() {
  console.log('🔄 Pulling database schema from remote Supabase...')
  
  try {
    // Get table definitions
    const { data: tables, error: tablesError } = await supabase.rpc('get_table_definitions')
    
    if (tablesError) {
      console.log('⚠️ Custom RPC not available, trying manual approach...')
      await manualSchemaPull()
      return
    }
    
    // Write schema to file
    const schemaSQL = tables.map(table => table.definition).join('\n\n')
    fs.writeFileSync('remote-schema.sql', schemaSQL)
    
    console.log('✅ Schema pulled successfully to remote-schema.sql')
    
  } catch (error) {
    console.error('❌ Failed to pull schema:', error.message)
    console.log('📋 Using existing migrations instead...')
  }
}

async function manualSchemaPull() {
  console.log('📋 Getting basic table information...')
  
  // Get basic table info that we can access
  const tableQueries = [
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'",
    "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public'"
  ]
  
  let schemaInfo = '-- Remote Schema Information\n\n'
  
  for (const query of tableQueries) {
    try {
      const { data, error } = await supabasequery('SELECT execute_sql( query )')
      if (!error && data) {
        schemaInfo += `-- Query: ${query}\n`
        schemaInfo += JSON.stringify(data, null, 2) + '\n\n'
      }
    } catch (err) {
      console.log(`⚠️ Query failed: ${query}`)
    }
  }
  
  fs.writeFileSync('remote-schema-info.txt', schemaInfo)
  console.log('ℹ️ Basic schema info saved to remote-schema-info.txt')
}

// Run the schema pull
pullSchema() 