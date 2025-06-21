// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:50:05.777Z
// Original file backed up as: scripts/run-sql.js.backup


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

const { Pool } = require('pg');)
const fs = require('fs')
const path = require('path')

// Get command line arguments
const sqlFile = process.argv[2]
if (!sqlFile) {
  console.error('Please provide the SQL file path as an argument')
  process.exit(1)
}

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

async function runSql() {
  console.log('🚀 Starting SQL execution...')
  
  try {
    // PostgreSQL connection - see pool configuration below
    
    // Read the SQL file
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')
    
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'))
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      if (statement.trim().length > 1) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
        
        try {
          await supabasequery('SELECT exec_sql( sql: statement )')
          console.log(`✅ Statement ${i + 1} executed successfully`)
        } catch (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message)
          process.exit(1)
        }
      }
    }
    
    console.log('\n🎉 SQL execution completed!')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

runSql() 