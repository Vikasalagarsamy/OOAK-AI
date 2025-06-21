// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:40:16.378Z
// Original file backed up as: test-local-supabase-frontend.js.backup


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

// Test Local Supabase Frontend Connection
// ======================================

const { Pool } = require('pg');)

// Local Supabase configuration (from supabase status)
const LOCAL_SUPABASE_CONFIG = {
  url: 'http://127.0.0.1:54321',
  anonKey: 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY',
  serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
}

async function testLocalSupabaseConnection() {
  console.log('🧪 Testing Local Supabase Frontend Connection...\n')

  try {
    // Create client with anon key (frontend usage)
    // PostgreSQL connection - see pool configuration below
    
    console.log('✅ Supabase client created successfully')
    console.log(`📍 API URL: ${LOCAL_SUPABASE_CONFIG.url}`)
    console.log(`🔑 Using anonymous key: ${LOCAL_SUPABASE_CONFIG.anonKey.substring(0, 20)}...`)
    
    // Test 1: Get companies (business data)
    console.log('\n📊 Test 1: Fetching companies...')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (companiesError) {
      console.error('❌ Companies error:', companiesError)
    } else {
      console.log(`✅ Found ${companies.length} companies:`)
      companies.forEach(company => {
        console.log(`   • ${company.name} (ID: ${company.id})`)
      })
    }
    
    // Test 2: Get employees
    console.log('\n👥 Test 2: Fetching employees...')
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, job_title')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (employeesError) {
      console.error('❌ Employees error:', employeesError)
    } else {
      console.log(`✅ Found ${employees.length} employees:`)
      employees.forEach(emp => {
        console.log(`   • ${emp.first_name} ${emp.last_name} - ${emp.job_title || 'No title'} (ID: ${emp.id})`)
      })
    }
    
    // Test 3: Get leads (key business data)
    console.log('\n🎯 Test 3: Fetching leads...')
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, lead_number, client_name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (leadsError) {
      console.error('❌ Leads error:', leadsError)
    } else {
      console.log(`✅ Found ${leads.length} leads:`)
      leads.forEach(lead => {
        console.log(`   • ${lead.client_name} - ${lead.status} (${lead.lead_number})`)
      })
    }
    
    // Test 4: Get branches
    console.log('\n🏢 Test 4: Fetching branches...')
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, name, location, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (branchesError) {
      console.error('❌ Branches error:', branchesError)
    } else {
      console.log(`✅ Found ${branches.length} branches:`)
      branches.forEach(branch => {
        console.log(`   • ${branch.name} - ${branch.location || 'No location'} (ID: ${branch.id})`)
      })
    }
    
    // Test 5: Complex join query (like your frontend)
    console.log('\n🔗 Test 5: Complex join query (leads with company names)...')
    const { data: leadsWithCompanies, error: joinError } = await supabase
      .from('leads')
      .select(`
        id,
        lead_number,
        client_name,
        status,
        companies:company_id(name),
        branches:branch_id(name)
      `)
      .limit(3)
    
    if (joinError) {
      console.error('❌ Join query error:', joinError)
    } else {
      console.log(`✅ Found ${leadsWithCompanies.length} leads with company info:`)
      leadsWithCompanies.forEach(lead => {
        const companyName = lead.companies?.name || 'No company'
        const branchName = lead.branches?.name || 'No branch'
        console.log(`   • ${lead.client_name} (${lead.lead_number}) - ${companyName} / ${branchName}`)
      })
    }
    
    console.log('\n🎉 All tests completed successfully!')
    console.log('\n💡 Your Next.js app should be able to connect to local Supabase with these credentials:')
    console.log(`   NEXT_PUBLIC_SUPABASE_URL=${LOCAL_SUPABASE_CONFIG.url}`)
    console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY=${LOCAL_SUPABASE_CONFIG.anonKey}`)
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

testLocalSupabaseConnection() 