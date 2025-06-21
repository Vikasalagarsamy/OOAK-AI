// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:40:16.377Z
// Original file backed up as: test-database-connection.js.backup


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
 * TEST DATABASE CONNECTION AND CREATE WHATSAPP TABLE
 * Direct test to solve the storage issue
 */

const { Pool } = require('pg');

// Use environment variables
const supabaseUrl = 'https://aavofqdzjhyfjygkxynq.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwMjc1MDYsImV4cCI6MjA0NzYwMzUwNn0.lYNdKH0x-mfaVkb4zjuF_sVG-FgLO9V60mKa6bABxEQ'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjAyNzUwNiwiZXhwIjoyMDQ3NjAzNTA2fQ.bSGWEJLFGIrLDTKo8cq1YVU6Vm_iGAI8_TcqPgOUhzM'

console.log('🔧 TESTING DATABASE CONNECTION FOR WHATSAPP STORAGE')
console.log('='.repeat(60))

async function testWithKey(keyName, key) {
  console.log(`\n🔑 Testing with ${keyName}...`)
  // PostgreSQL connection - see pool configuration below
  
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error(`❌ ${keyName} failed:`, error.message)
      return false
    }
    
    console.log(`✅ ${keyName} works!`)
    return supabase
  } catch (err) {
    console.error(`❌ ${keyName} error:`, err.message)
    return false
  }
}

async function testLeadsInsert(supabase, keyName) {
  console.log(`\n📝 Testing INSERT with ${keyName}...`)
  
  try {
    const testLead = {
      name: `WhatsApp Test ${Date.now()}`,
      phone: '919677362524',
      email: `test_${Date.now()}@example.com`,
      source: 'whatsapp',
      status: 'active',
      notes: `Database test from ${keyName}`
    }
    
    const { data, error } = await supabase
      .from('leads')
      .insert(testLead)
      .select()
      .single()
    
    if (error) {
      console.log(`⚠️ ${keyName} INSERT failed:`, error.message)
      return false
    }
    
    console.log(`✅ ${keyName} INSERT works! Record ID:`, data.id)
    
    // Read it back
    const { data: readData, error: readError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', data.id)
      .single()
    
    if (!readError && readData) {
      console.log(`✅ ${keyName} READ works! Found record:`, readData.name)
    }
    
    // Clean up
    await supabasequery('DELETE FROM leads WHERE id = data.id')
    console.log(`🧹 Cleaned up test record`)
    
    return true
  } catch (err) {
    console.log(`❌ ${keyName} INSERT error:`, err.message)
    return false
  }
}

async function main() {
  // Test both keys
  const anonSupabase = await testWithKey('ANON KEY', anonKey)
  const serviceSupabase = await testWithKey('SERVICE ROLE KEY', serviceRoleKey)
  
  if (!anonSupabase && !serviceSupabase) {
    console.log('\n❌ CRITICAL: Both keys failed!')
    console.log('🔧 Check if Supabase project is accessible')
    process.exit(1)
  }
  
  // Test insertion with working key
  let workingSupabase = null
  let workingKeyName = ''
  
  if (serviceSupabase) {
    workingSupabase = serviceSupabase
    workingKeyName = 'SERVICE ROLE'
    const insertWorks = await testLeadsInsert(serviceSupabase, 'SERVICE ROLE')
    if (insertWorks) {
      console.log('\n🎉 SOLUTION: Use SERVICE ROLE KEY for database operations')
    }
  } else if (anonSupabase) {
    workingSupabase = anonSupabase
    workingKeyName = 'ANON'
    const insertWorks = await testLeadsInsert(anonSupabase, 'ANON')
    if (insertWorks) {
      console.log('\n🎉 SOLUTION: Use ANON KEY for database operations')
    }
  }
  
  console.log('\n🎯 NEXT STEPS:')
  console.log('1. Update webhook to use working Supabase key')
  console.log('2. Store WhatsApp messages in leads table (confirmed working)')
  console.log('3. Test real WhatsApp message storage')
  console.log('4. Verify AI can read stored messages')
}

main().catch(console.error) 