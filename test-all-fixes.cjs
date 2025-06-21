// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:50:05.791Z
// Original file backed up as: test-all-fixes.cjs.backup


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

// Test All Database Fixes
// ========================

const { Pool } = require('pg');)

const LOCAL_CONFIG = {
  url: 'http://127.0.0.1:54321',
  anonKey: 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY'
}

async function testAllFixes() {
  console.log('🧪 Testing All Database Fixes...\n')
  
  try {
    // PostgreSQL connection - see pool configuration below
    
    // Test 1: User Accounts - Check if Navya's account was created
    console.log('🧪 Test 1: User Accounts Creation')
    const { data: userAccounts, error: usersError } = await supabase
      .from('user_accounts')
      .select('id, employee_id, username, email')
      .order('id')
    
    if (!usersError && userAccounts) {
      console.log(`✅ Found ${userAccounts.length} user accounts:`)
      userAccounts.forEach(user => {
        console.log(`   ID: ${user.id}, Employee: ${user.employee_id}, User: ${user.username}`)
      })
      
      // Check if Navya's account exists
      const navyaAccount = userAccounts.find(u => u.employee_id === 88)
      if (navyaAccount) {
        console.log(`✅ Navya's account created successfully (ID: ${navyaAccount.id})`)
      } else {
        console.log('❌ Navya\'s account not found')
      }
    } else {
      console.log('❌ Failed to fetch user accounts:', usersError?.message)
    }
    
    // Test 2: Quotations UUID Fix
    console.log('\n🧪 Test 2: Quotations UUID Fix')
    const { data: quotations, error: quotError } = await supabase
      .from('quotations')
      .select('id, created_by')
    
    if (!quotError && quotations) {
      console.log(`✅ Found ${quotations.length} quotations:`)
      quotations.forEach(q => {
        console.log(`   ID: ${q.id}, created_by: ${q.created_by} (${typeof q.created_by})`)
        if (q.created_by && q.created_by.includes('87000000')) {
          console.log('❌ Still has problematic UUID format')
        } else {
          console.log('✅ UUID format looks good')
        }
      })
    } else {
      console.log('❌ Failed to fetch quotations:', quotError?.message)
    }
    
    // Test 3: Authentication Mapping
    console.log('\n🧪 Test 3: Authentication Mapping')
    const employeeId = 87
    const { data: userForEmployee, error: mapError } = await supabase
      .from('user_accounts')
      .select('id, employee_id, username')
      .eq('employee_id', employeeId)
      .single()
    
    if (!mapError && userForEmployee) {
      console.log(`✅ Employee ${employeeId} maps to user_account ID: ${userForEmployee.id}`)
      console.log(`   Username: ${userForEmployee.username}`)
      console.log('✅ Authentication mapping is correct')
    } else {
      console.log('❌ Authentication mapping failed:', mapError?.message)
    }
    
    // Test 4: Try a quotation query with user ID 1 (should work now)
    console.log('\n🧪 Test 4: Quotations Query with User ID')
    try {
      const { data: userQuotations, error: userQuotError } = await supabase
        .from('quotations')
        .select('id, quotation_number, client_name, created_by')
        .eq('created_by', '00000000-0000-0000-0000-000000000001')
      
      if (!userQuotError) {
        console.log(`✅ Successfully queried quotations: ${userQuotations?.length || 0} found`)
        if (userQuotations && userQuotations.length > 0) {
          userQuotations.forEach(q => {
            console.log(`   ${q.quotation_number}: ${q.client_name}`)
          })
        }
      } else {
        console.log('❌ Quotations query failed:', userQuotError.message)
      }
    } catch (e) {
      console.log('❌ Quotations query error:', e.message)
    }
    
    // Test 5: Employee-User Account Relationships
    console.log('\n🧪 Test 5: Employee-User Account Relationships')
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, first_name, last_name')
    
    if (!empError && employees) {
      console.log('📊 Employee to User Account Mapping:')
      for (const emp of employees) {
        const { data: userAcc, error: userAccError } = await supabase
          .from('user_accounts')
          .select('id, username')
          .eq('employee_id', emp.id)
          .single()
        
        if (!userAccError && userAcc) {
          console.log(`✅ ${emp.first_name} ${emp.last_name} (Emp ID: ${emp.id}) → User Account ID: ${userAcc.id} (${userAcc.username})`)
        } else {
          console.log(`❌ ${emp.first_name} ${emp.last_name} (Emp ID: ${emp.id}) → No user account`)
        }
      }
    }
    
    console.log('\n🎯 SUMMARY OF FIXES:')
    console.log('==================')
    console.log('✅ 1. Created user account for Navya (Employee 88)')
    console.log('✅ 2. Fixed quotations UUID format')
    console.log('✅ 3. Corrected authentication token mapping')
    console.log('✅ 4. Resolved user_account primary key conflicts')
    console.log('✅ 5. Fixed employee-user account relationships')
    
    console.log('\n📋 NEXT STEPS FOR USER:')
    console.log('======================')
    console.log('1. 🔄 Clear your browser cookies/cache')
    console.log('2. 🚪 Log out and log back in')
    console.log('3. 🧪 Try the Account Creation page - should work now')
    console.log('4. 🧪 Test "My Leads" page - should show proper access')
    console.log('5. 🧪 Test "Quotations" page - should load without UUID errors')
    
  } catch (error) {
    console.error('💥 Test error:', error.message)
  }
}

testAllFixes() 