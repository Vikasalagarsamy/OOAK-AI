// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:50:05.792Z
// Original file backed up as: test-dashboard-queries.cjs.backup


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

// Test Dashboard Queries
// ======================

const { Pool } = require('pg');)

const LOCAL_CONFIG = {
  url: 'http://127.0.0.1:54321',
  anonKey: 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY'
}

async function testDashboardQueries() {
  console.log('🔍 Testing Dashboard API Queries...\n')
  
  try {
    // PostgreSQL connection - see pool configuration below
    
    console.log('✅ Connected to local Supabase')
    
    // Test 1: Employee count (exact same query as dashboard API)
    console.log('\n📊 Test 1: Employee count query...')
    try {
      const employeesResult = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
      
      console.log('Employee query result:', {
        count: employeesResult.count,
        error: employeesResult.error,
        data: employeesResult.data
      })
    } catch (e) {
      console.log('Employee query failed:', e.message)
    }
    
    // Test 2: Department count
    console.log('\n🏢 Test 2: Department count query...')
    try {
      const departmentsResult = await supabase
        .from('departments')
        .select('*', { count: 'exact', head: true })
      
      console.log('Department query result:', {
        count: departmentsResult.count,
        error: departmentsResult.error,
        data: departmentsResult.data
      })
    } catch (e) {
      console.log('Department query failed:', e.message)
    }
    
    // Test 3: Quotation count
    console.log('\n📄 Test 3: Quotation count query...')
    try {
      const quotationsResult = await supabase
        .from('quotations')
        .select('*', { count: 'exact', head: true })
      
      console.log('Quotation query result:', {
        count: quotationsResult.count,
        error: quotationsResult.error,
        data: quotationsResult.data
      })
    } catch (e) {
      console.log('Quotation query failed:', e.message)
    }
    
    // Test 4: Roles query (different from count)
    console.log('\n👥 Test 4: Roles query...')
    try {
      const rolesResult = await supabase
        .from('roles')
        .select('id, title')
        .limit(10)
      
      console.log('Roles query result:', {
        count: rolesResult.data?.length || 0,
        error: rolesResult.error,
        data: rolesResult.data
      })
    } catch (e) {
      console.log('Roles query failed:', e.message)
    }
    
    // Test 5: Recent leads query
    console.log('\n🎯 Test 5: Recent leads query...')
    try {
      const leadsResult = await supabase
        .from('leads')
        .select(`
          id, 
          client_name, 
          status, 
          created_at,
          companies:company_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)
      
      console.log('Leads query result:', {
        count: leadsResult.data?.length || 0,
        error: leadsResult.error,
        data: leadsResult.data
      })
    } catch (e) {
      console.log('Leads query failed:', e.message)
    }
    
    // Test 6: Alternative count queries (without head: true)
    console.log('\n🔄 Test 6: Alternative count methods...')
    
    try {
      const altEmployees = await supabase
        .from('employees')
        .select('id')
        .limit(1000)
      
      console.log('Alternative employee count:', altEmployees.data?.length || 0)
    } catch (e) {
      console.log('Alternative employee count failed:', e.message)
    }
    
    try {
      const altDepartments = await supabase
        .from('departments')
        .select('id')
        .limit(1000)
      
      console.log('Alternative department count:', altDepartments.data?.length || 0)
    } catch (e) {
      console.log('Alternative department count failed:', e.message)
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

testDashboardQueries() 