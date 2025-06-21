// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:40:16.381Z
// Original file backed up as: check-registration.cjs.backup


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
const { Pool } = require('pg');)
require('dotenv').config({ path: '.env.local' })

// PostgreSQL connection - see pool configuration below

async function checkCurrentState() {
  console.log('🔍 Checking current registration state...')
  
  // Check all employee devices
  const { data: devices, error: devError } = await supabase
    .from('employee_devices')
    .select('*')
    .order('updated_at', { ascending: false })
  
  console.log('\n📱 All employee devices:')
  if (devError) {
    console.error('❌ Error:', devError)
  } else {
    devices?.forEach((device, index) => {
      console.log(`  ${index + 1}. Employee: ${device.employee_id}, Device: ${device.device_id}`)
      console.log(`     Created: ${device.created_at}, Updated: ${device.updated_at}`)
      console.log(`     FCM Token: ${device.fcm_token ? 'Present' : 'Missing'}, Active: ${device.is_active}`)
      console.log(`     Device Name: ${device.device_name}, Platform: ${device.platform}`)
      console.log('')
    })
  }
  
  // Check recent call triggers
  const { data: triggers, error: trigError } = await supabase
    .from('call_triggers')
    .select('*')
    .order('triggered_at', { ascending: false })
    .limit(5)
    
  console.log('📞 Recent call triggers:')
  if (trigError) {
    console.error('❌ Error:', trigError)
  } else {
    triggers?.forEach((trigger, index) => {
      console.log(`  ${index + 1}. Employee: ${trigger.employee_id}, Phone: ${trigger.phone_number}`)
      console.log(`     Client: ${trigger.client_name}, Status: ${trigger.status}`)
      console.log(`     Triggered: ${trigger.triggered_at}`)
      console.log('')
    })
  }
  
  // Check admin employee mapping
  console.log('👤 Admin user mapping:')
  const { data: admin, error: adminError } = await supabase
    .from('user_accounts')
    .select('id, username, employee_id')
    .eq('username', 'admin')
    .single()
    
  if (adminError) {
    console.error('❌ Admin user error:', adminError)
  } else {
    console.log(`Admin user: employee_id = ${admin.employee_id}`)
    
    // Get corresponding employee
    const { data: emp, error: empError } = await supabase
      .from('employees')
      .select('id, employee_id, first_name, last_name')
      .eq('id', admin.employee_id)
      .single()
      
    if (empError) {
      console.error('❌ Employee lookup error:', empError)
    } else {
      console.log(`Mapped employee: ${emp.employee_id} - ${emp.first_name} ${emp.last_name}`)
    }
  }
}

checkCurrentState().catch(console.error) 