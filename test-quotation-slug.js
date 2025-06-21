// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:40:16.373Z
// Original file backed up as: test-quotation-slug.js.backup


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
 * Test Quotation Slug - Direct Database Check
 * ===========================================
 */

const { Pool } = require('pg');

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY'

async function testQuotationSlug() {
  try {
    // PostgreSQL connection - see pool configuration below
    
    console.log('🔍 DIRECT QUOTATION SLUG TEST')
    console.log('=' * 50)
    
    // 1. Direct query for quotation 19
    console.log('Testing direct quotation 19 query...')
    const { data: quotation19, error: q19Error } = await supabase
      .from('quotations')
      .select('id, slug, approval_status, workflow_status, quotation_number')
      .eq('id', 19)
      .single()
    
    console.log('Quotation 19 direct query result:')
    console.log('  Data:', quotation19)
    console.log('  Error:', q19Error)
    
    if (quotation19) {
      console.log(`✅ Quotation 19 found:`)
      console.log(`   ID: ${quotation19.id}`)
      console.log(`   Number: ${quotation19.quotation_number}`)
      console.log(`   Slug: ${quotation19.slug}`)
      console.log(`   Approval Status: ${quotation19.approval_status}`)
    } else {
      console.log('❌ Quotation 19 not found')
    }
    
    // 2. Test the exact query used by tasks API
    console.log('\n📋 Testing tasks API quotation query...')
    const quotationIds = [19]
    const { data: quotations, error: quotationsError } = await supabase
      .from('quotations')
      .select('id, slug, approval_status, workflow_status')
      .in('id', quotationIds)
    
    console.log('Tasks API-style query result:')
    console.log('  Data:', quotations)
    console.log('  Error:', quotationsError)
    
    if (quotations && quotations.length > 0) {
      quotations.forEach(q => {
        console.log(`✅ Found quotation ${q.id}: slug=${q.slug}`)
      })
    } else {
      console.log('❌ No quotations found with tasks API query')
    }
    
    // 3. Check all quotations to see structure
    console.log('\n📊 All quotations check...')
    const { data: allQuotations, error: allError } = await supabase
      .from('quotations')
      .select('id, slug, quotation_number')
      .limit(5)
    
    console.log('All quotations sample:')
    console.log('  Data:', allQuotations)
    console.log('  Error:', allError)
    
    return { quotation19, quotations }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testQuotationSlug() 