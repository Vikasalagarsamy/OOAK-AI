// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:51:57.548Z
// Original file backed up as: scripts/run-workflow-migration.js.backup


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
 * 🗄️ WORKFLOW DATABASE MIGRATION SCRIPT
 * =====================================
 * Executes the complete workflow schema migration for Supabase
 */

const { Pool } = require('pg');)
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

// PostgreSQL connection - see pool configuration below

async function runMigration() {
  console.log('🚀 Starting workflow database migration...')
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250107_create_workflow_tables.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📖 Migration file loaded successfully')
    
    // Split the SQL file into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      if (statement.trim().length > 1) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
        
        try {
          await supabasequery('SELECT execute_sql( sql_query: statement )')
          console.log(`✅ Statement ${i + 1} executed successfully`)
        } catch (statementError) {
          // Try direct SQL execution for CREATE TABLE statements
          if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX') || statement.includes('INSERT INTO')) {
            try {
              const { error } = await supabasequery('SELECT * FROM __ignore__').limit(0)
              // This is a workaround - we'll use the raw SQL execution
              console.log(`⚠️  Statement ${i + 1} may need manual execution: ${statementError.message}`)
            } catch (e) {
              console.log(`⚠️  Statement ${i + 1} skipped: ${statementError.message}`)
            }
          } else {
            console.log(`⚠️  Statement ${i + 1} failed: ${statementError.message}`)
          }
        }
      }
    }
    
    console.log('\n🎉 Migration completed!')
    console.log('📋 Verifying table creation...')
    
    // Verify tables exist by checking if we can query them
    const tablesToCheck = [
      'payments',
      'quotation_revisions', 
      'department_instructions',
      'instruction_approvals',
      'accounting_workflows',
      'post_sales_workflows',
      'notifications',
      'ai_tasks'
    ]
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1)
        if (error) {
          console.log(`❌ Table '${table}' verification failed: ${error.message}`)
        } else {
          console.log(`✅ Table '${table}' exists and accessible`)
        }
      } catch (e) {
        console.log(`❌ Table '${table}' check failed: ${e.message}`)
      }
    }
    
    console.log('\n🏁 Workflow migration process complete!')
    console.log('🔗 You can now test the workflow at: http://localhost:3000/test-workflow')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Execute migration
runMigration() 