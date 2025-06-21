// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:50:05.780Z
// Original file backed up as: scripts/get-auth-token.js.backup


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
/**
 * 🔑 Get Auth Token and User ID for Testing
 * 
 * This script helps you get the correct credentials for testing
 */

const { Pool } = require('pg'););

// Load environment variables
require('dotenv').config();

// PostgreSQL connection - see pool configuration below

async function getAuthCredentials() {
  console.log('🔑 Getting Auth Credentials for Testing...\n');
  
  try {
    // Try to sign in with the email from the screenshot
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'vikas.alagarsamy1987@gmail.com',
      password: 'Admin@123' // Try the password from screenshot
    });
    
    if (error) {
      console.log('❌ Error:', error.message);
      console.log('\n🔧 Solutions:');
      console.log('1. Create a test user in Supabase Dashboard → Authentication → Users');
      console.log('2. Or use the correct password for vikas.alagarsamy1987@gmail.com');
      console.log('3. Make sure the user exists and email is confirmed');
      return;
    }
    
    console.log('✅ Authentication Successful!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', data.user.email);
    console.log('🆔 User ID (UUID):', data.user.id);
    console.log('🔑 Auth Token:', data.session.access_token);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n📋 Copy these values to the test page:');
    console.log(`User ID: ${data.user.id}`);
    console.log(`Auth Token: ${data.session.access_token}`);
    
    console.log('\n🧪 Test the credentials:');
    console.log(`curl -X GET "http://localhost:3000/api/notifications/ai?action=behavior&user_id=${data.user.id}" \\`);
    console.log(`  -H "Authorization: Bearer ${data.session.access_token}"`);
    
  } catch (error) {
    console.error('💥 Script error:', error.message);
  }
}

// Alternative: Create a new test user
async function createTestUser() {
  console.log('👤 Creating Test User...\n');
  
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test-ai-notifications@example.com',
      password: 'TestPassword123!',
      email_confirm: true
    });
    
    if (error) {
      console.log('❌ Error creating user:', error.message);
      return;
    }
    
    console.log('✅ Test User Created!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: test-ai-notifications@example.com');
    console.log('🔑 Password: TestPassword123!');
    console.log('🆔 User ID:', data.user.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n📋 Now sign in with this user to get the auth token');
    
  } catch (error) {
    console.error('💥 Error creating user:', error.message);
  }
}

// Run the script
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--create-user')) {
    await createTestUser();
  } else {
    await getAuthCredentials();
  }
}

main(); 