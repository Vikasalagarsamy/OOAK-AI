/**
 * 🔑 Get Auth Token and User ID for Testing
 * 
 * This script helps you get the correct credentials for testing
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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