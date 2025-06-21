// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:50:05.784Z
// Original file backed up as: diagnose-database-issues.cjs.backup


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

// Database Issues Diagnostic
// ===========================

const { Pool } = require('pg');)

const LOCAL_CONFIG = {
  url: 'http://127.0.0.1:54321',
  anonKey: 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY'
}

async function diagnoseDatabaseIssues() {
  console.log('🔍 Diagnosing Database Issues...\n')
  
  try {
    // PostgreSQL connection - see pool configuration below
    
    // Issue 1: Check if user_accounts table exists and its structure
    console.log('🔧 Issue 1: Checking user_accounts table...')
    try {
      const { data: userAccountsData, error: userAccountsError } = await supabase
        .from('user_accounts')
        .select('*')
        .limit(1)
      
      if (userAccountsError) {
        console.log('❌ user_accounts table issue:', userAccountsError.message)
        if (userAccountsError.message.includes('does not exist')) {
          console.log('📋 Solution: Need to create user_accounts table')
        }
      } else {
        console.log('✅ user_accounts table exists')
        console.log('📊 Sample record:', userAccountsData?.[0] || 'No records')
        
        // Check for existing records that might cause primary key conflicts
        const { data: allUsers, error: countError } = await supabase
          .from('user_accounts')
          .select('id, username, email')
        
        if (!countError) {
          console.log(`📊 Total user accounts: ${allUsers?.length || 0}`)
          if (allUsers && allUsers.length > 0) {
            console.log('👥 Existing accounts:', allUsers)
          }
        }
      }
    } catch (e) {
      console.log('❌ user_accounts table error:', e.message)
    }
    
    // Issue 2: Check employee-user account linking
    console.log('\n🔗 Issue 2: Checking employee-user account relationships...')
    try {
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email')
      
      if (!empError && employees) {
        console.log(`📊 Total employees: ${employees.length}`)
        console.log('👥 Employees:', employees.map(e => `${e.id}: ${e.first_name} ${e.last_name} (${e.email})`))
        
        // Check which employees have user accounts
        const { data: userAccounts, error: usersError } = await supabase
          .from('user_accounts')
          .select('id, employee_id, username, email')
        
        if (!usersError && userAccounts) {
          const linkedEmployees = userAccounts.map(u => u.employee_id)
          const unlinkedEmployees = employees.filter(e => !linkedEmployees.includes(e.id))
          
          console.log('🔗 Linked employees:', linkedEmployees)
          console.log('❌ Unlinked employees:', unlinkedEmployees.map(e => `${e.id}: ${e.first_name} ${e.last_name}`))
        }
      }
    } catch (e) {
      console.log('❌ Employee relationship error:', e.message)
    }
    
    // Issue 3: Check ID types and UUID issues
    console.log('\n🆔 Issue 3: Checking ID types across tables...')
    
    // Check employees table ID type
    try {
      const { data: empSample, error: empError } = await supabase
        .from('employees')
        .select('id')
        .limit(1)
      
      if (!empError && empSample?.[0]) {
        const empId = empSample[0].id
        console.log(`👤 Employee ID type: ${typeof empId} (value: ${empId})`)
      }
    } catch (e) {
      console.log('❌ Employee ID check error:', e.message)
    }
    
    // Check roles table ID type
    try {
      const { data: rolesSample, error: rolesError } = await supabase
        .from('roles')
        .select('id, title')
        .limit(1)
      
      if (!rolesError && rolesSample?.[0]) {
        const roleId = rolesSample[0].id
        console.log(`🎭 Role ID type: ${typeof roleId} (value: ${roleId})`)
      }
    } catch (e) {
      console.log('❌ Role ID check error:', e.message)
    }
    
    // Check quotations table ID type
    try {
      const { data: quotationsSample, error: quotationsError } = await supabase
        .from('quotations')
        .select('id, created_by')
        .limit(1)
      
      if (!quotationsError && quotationsSample?.[0]) {
        const quotationId = quotationsSample[0].id
        const createdBy = quotationsSample[0].created_by
        console.log(`📄 Quotation ID type: ${typeof quotationId} (value: ${quotationId})`)
        console.log(`📄 Quotation created_by type: ${typeof createdBy} (value: ${createdBy})`)
      }
    } catch (e) {
      console.log('❌ Quotation ID check error:', e.message)
    }
    
    // Issue 4: Check authentication token structure
    console.log('\n🔐 Issue 4: Checking current authentication setup...')
    
    // The JWT token from logs shows user ID as '87' - check if this matches our data
    const problemUserId = '87'
    console.log(`🔍 Looking for user ID: ${problemUserId}`)
    
    try {
      // Check if this ID exists in employees
      const { data: empWithId87, error: emp87Error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', parseInt(problemUserId))
      
      if (!emp87Error && empWithId87?.[0]) {
        console.log(`✅ Found employee with ID ${problemUserId}:`, empWithId87[0])
      } else {
        console.log(`❌ No employee found with ID ${problemUserId}`)
      }
      
      // Check if this ID exists in user_accounts
      try {
        const { data: userWithId87, error: user87Error } = await supabase
          .from('user_accounts')
          .select('*')
          .eq('id', parseInt(problemUserId))
        
        if (!user87Error && userWithId87?.[0]) {
          console.log(`✅ Found user account with ID ${problemUserId}:`, userWithId87[0])
        } else {
          console.log(`❌ No user account found with ID ${problemUserId}`)
        }
      } catch (e) {
        console.log(`❌ user_accounts check failed: ${e.message}`)
      }
    } catch (e) {
      console.log('❌ ID checking error:', e.message)
    }
    
    // Issue 5: Check for UUID vs Integer mismatches
    console.log('\n🔄 Issue 5: Checking for UUID/Integer mismatches...')
    
    try {
      // Try to query quotations with string ID (this should fail if expecting UUID)
      const { data: quotationsTest, error: quotationsTestError } = await supabase
        .from('quotations')
        .select('*')
        .eq('created_by', problemUserId) // String value
      
      if (quotationsTestError) {
        console.log(`❌ Quotations query with string ID failed: ${quotationsTestError.message}`)
        
        // Try with integer
        const { data: quotationsTestInt, error: quotationsTestIntError } = await supabase
          .from('quotations')
          .select('*')
          .eq('created_by', parseInt(problemUserId))
        
        if (!quotationsTestIntError) {
          console.log(`✅ Quotations query with integer ID works`)
        } else {
          console.log(`❌ Quotations query with integer ID also failed: ${quotationsTestIntError.message}`)
        }
      } else {
        console.log(`✅ Quotations query with string ID works`)
      }
    } catch (e) {
      console.log('❌ UUID/Integer test error:', e.message)
    }
    
    console.log('\n🎯 Summary of Issues Found:')
    console.log('================================')
    console.log('1. Check if user_accounts table exists and is properly structured')
    console.log('2. Check employee-user account relationships')
    console.log('3. Verify ID type consistency across tables')
    console.log('4. Fix authentication token user ID mapping')
    console.log('5. Resolve UUID vs Integer mismatches in queries')
    
  } catch (error) {
    console.error('💥 Diagnostic error:', error.message)
  }
}

diagnoseDatabaseIssues() 