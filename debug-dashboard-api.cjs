// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:51:57.550Z
// Original file backed up as: debug-dashboard-api.cjs.backup


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

// Debug Dashboard API Logic
// =========================

const { Pool } = require('pg');)

const LOCAL_CONFIG = {
  url: 'http://127.0.0.1:54321',
  anonKey: 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY'
}

async function debugDashboardApi() {
  console.log('🐛 Debugging Dashboard API Logic...\n')
  
  try {
    // PostgreSQL connection - see pool configuration below
    
    console.log('✅ Connected to local Supabase\n')
    
    // Simulate the exact same queries as the dashboard API
    const queryTimeout = 800
    
    console.log('🔄 Running queries with Promise.race (same as dashboard API)...\n')
    
    const [employeesResult, departmentsResult, quotationsResult, rolesResult, leadsResult] = await Promise.all([
      // Employee count (exact same as dashboard API)
      Promise.race([
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('employees timeout')), queryTimeout))
      ]),
      
      // Department count
      Promise.race([
        supabase.from('departments').select('*', { count: 'exact', head: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('departments timeout')), queryTimeout))
      ]),
      
      // Quotation count
      Promise.race([
        supabase.from('quotations').select('*', { count: 'exact', head: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('quotations timeout')), queryTimeout))
      ]),
      
      // Roles data
      Promise.race([
        supabasequery('SELECT id, title FROM roles').limit(10),
        new Promise((_, reject) => setTimeout(() => reject(new Error('roles timeout')), queryTimeout))
      ]),
      
      // Recent leads
      Promise.race([
        supabase
          .from('leads')
          .select(`
            id, 
            client_name, 
            status, 
            created_at,
            companies:company_id(name)
          `)
          .order('created_at', { ascending: false })
          .limit(5),
        new Promise((_, reject) => setTimeout(() => reject(new Error('leads timeout')), queryTimeout))
      ])
    ])
    
    console.log('📊 Raw Results:')
    console.log('================')
    console.log('employeesResult:', JSON.stringify(employeesResult, null, 2))
    console.log('\ndepartmentsResult:', JSON.stringify(departmentsResult, null, 2))
    console.log('\nquotationsResult:', JSON.stringify(quotationsResult, null, 2))
    console.log('\nrolesResult:', JSON.stringify(rolesResult, null, 2))
    console.log('\nleadsResult:', JSON.stringify(leadsResult, null, 2))
    
    console.log('\n🔧 Dashboard API Processing Logic:')
    console.log('====================================')
    
    const stats = {
      employees: employeesResult?.count || 0,
      departments: departmentsResult?.count || 0,
      quotations: quotationsResult?.count || 0,
      roles: rolesResult?.data?.length || 0
    }
    
    console.log('Processed stats:', stats)
    
    console.log('\n🔍 Detailed Analysis:')
    console.log('=====================')
    console.log('employeesResult?.count:', employeesResult?.count)
    console.log('departmentsResult?.count:', departmentsResult?.count)
    console.log('quotationsResult?.count:', quotationsResult?.count)
    console.log('rolesResult?.data?.length:', rolesResult?.data?.length)
    
    // Process leads
    const processedLeads = leadsResult?.data?.map((lead) => ({
      id: lead.id?.toString() || '',
      company_name: lead.companies?.name || 'Unknown Company',
      status: lead.status || 'Unknown',
      created_at: lead.created_at || new Date().toISOString()
    })) || []
    
    console.log('\n🎯 Processed leads:', processedLeads)
    
    console.log('\n✅ Final dashboard data that should be returned:')
    const finalData = {
      stats,
      recentLeads: processedLeads,
      roles: rolesResult?.data || [],
      timestamp: Date.now(),
      cacheTtl: 60000
    }
    
    console.log(JSON.stringify(finalData, null, 2))
    
  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

debugDashboardApi() 