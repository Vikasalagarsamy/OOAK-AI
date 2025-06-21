// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:51:57.549Z
// Original file backed up as: fix-authentication-mapping.cjs.backup


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

// Fix Authentication Token Mapping
// =================================

const { Pool } = require('pg');)

const LOCAL_CONFIG = {
  url: 'http://127.0.0.1:54321',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
}

async function fixAuthenticationMapping() {
  console.log('🔐 Fixing Authentication Token Mapping...\n')
  
  try {
    // PostgreSQL connection - see pool configuration below
    
    console.log('🔍 Current authentication issue:')
    console.log('   - JWT token has sub: "87" (employee ID)')
    console.log('   - But system expects user_account ID')
    console.log('   - Need to map employee 87 to user_account ID\n')
    
    // Find the user account for employee 87
    const { data: userAccount, error: userError } = await supabase
      .from('user_accounts')
      .select('id, employee_id, username, email, role_id')
      .eq('employee_id', 87)
      .single()
    
    if (userError || !userAccount) {
      console.log('❌ No user account found for employee 87')
      return
    }
    
    console.log('✅ Found user account for employee 87:')
    console.log(`   User Account ID: ${userAccount.id}`)
    console.log(`   Employee ID: ${userAccount.employee_id}`)
    console.log(`   Username: ${userAccount.username}`)
    console.log(`   Email: ${userAccount.email}`)
    console.log(`   Role ID: ${userAccount.role_id}\n`)
    
    // Get role information
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, title')
      .eq('id', userAccount.role_id)
      .single()
    
    if (!roleError && role) {
      console.log(`   Role: ${role.title}\n`)
    }
    
    console.log('🔧 Solution: Update authentication to use correct user_account ID')
    console.log('   - Current JWT sub should be "1" (user_account.id)')
    console.log('   - Not "87" (employee.id)\n')
    
    // Create a new JWT token with the correct user_account ID
    const jwt = require('jsonwebtoken')
    const secret = 'fallback-secret-only-for-development'
    
    const payload = {
      sub: userAccount.id.toString(), // Use user_account ID, not employee ID
      username: userAccount.username,
      email: userAccount.email,
      role: userAccount.role_id,
      roleName: role?.title || 'Administrator',
      isAdmin: role?.title === 'Administrator' || userAccount.role_id === 1,
      iat: Math.floor(Date.now() / 1000),
      jti: `${userAccount.id}-${Date.now()}`,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }
    
    const newToken = jwt.sign(payload, secret)
    
    console.log('🎯 New JWT Token Generated:')
    console.log('   Payload:', {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
      roleName: payload.roleName,
      isAdmin: payload.isAdmin
    })
    console.log('\n📋 To fix the authentication:')
    console.log('1. Clear your browser cookies')
    console.log('2. Log in again to get a new token with correct user_account ID')
    console.log('3. Or manually set the auth_token cookie to this new token:\n')
    console.log(`New Token: ${newToken.substring(0, 50)}...\n`)
    
    // Also check if there are any other authentication issues
    console.log('🔄 Checking for other authentication issues...')
    
    // Test the new token structure
    try {
      const decoded = jwt.verify(newToken, secret)
      console.log('✅ New token verification successful')
      console.log('   Subject (user_account ID):', decoded.sub)
      console.log('   Username:', decoded.username)
      console.log('   Role:', decoded.roleName)
    } catch (e) {
      console.log('❌ Token verification failed:', e.message)
    }
    
    // Check if we can query user data with the new ID
    const { data: testUser, error: testError } = await supabase
      .from('user_accounts')
      .select('id, username, employee_id')
      .eq('id', payload.sub)
      .single()
    
    if (!testError && testUser) {
      console.log('✅ User lookup with new token ID successful:')
      console.log(`   Found user: ${testUser.username} (ID: ${testUser.id}, Employee: ${testUser.employee_id})`)
    } else {
      console.log('❌ User lookup failed:', testError?.message)
    }
    
    console.log('\n🎉 Authentication mapping analysis complete!')
    console.log('Next steps:')
    console.log('1. Log out and log back in to get new token')
    console.log('2. Or restart browser to clear cached authentication')
    console.log('3. Try the Account Creation page again')
    
  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

fixAuthenticationMapping() 