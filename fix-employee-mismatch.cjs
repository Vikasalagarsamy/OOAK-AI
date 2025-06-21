// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:51:57.549Z
// Original file backed up as: fix-employee-mismatch.cjs.backup


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

const supabaseUrl = 'http://127.0.0.1:54321'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZn60CzaoQpLOsXaLaH0AOXfuT0CzwwKqUaY'

// PostgreSQL connection - see pool configuration below

async function fixEmployeeMismatch() {
  try {
    console.log('🔧 Fixing employee ID mismatch...')
    
    // Check current user data
    console.log('\n📋 Current user data:')
    const { data: currentUser } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('username', 'rasvickys')
      .single()
    
    console.log('Current user:', currentUser)
    
    // Check employees table
    console.log('\n👥 Employee records:')
    const { data: employees } = await supabase
      .from('employees')
      .select('id, employee_id, first_name, last_name')
      .in('id', [6, 22])
    
    console.log('Employees:', employees)
    
    // Update user account to match task assignments (employee_id = 22)
    console.log('\n🔄 Updating user account employee_id from 6 to 22...')
    const { data: updateResult, error: updateError } = await supabase
      .from('user_accounts')
      .update({ employee_id: 22 })
      .eq('username', 'rasvickys')
      .select()
    
    if (updateError) {
      console.error('❌ Update failed:', updateError)
      return
    }
    
    console.log('✅ Updated user account:', updateResult)
    
    // Verify the fix
    console.log('\n✅ Verification:')
    const { data: verifyUser } = await supabase
      .from('user_accounts')
      .select('username, employee_id')
      .eq('username', 'rasvickys')
      .single()
    
    console.log('User after update:', verifyUser)
    
    console.log('\n🎉 Fix completed! User rasvickys now has employee_id = 22, matching task assignments.')
    console.log('💡 Please refresh the task dashboard page to see the properly filtered tasks.')
    
  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

fixEmployeeMismatch() 