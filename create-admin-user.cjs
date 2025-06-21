// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:40:16.381Z
// Original file backed up as: create-admin-user.cjs.backup


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
const bcrypt = require('bcryptjs')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Environment check:')
console.log('- Supabase URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('- Supabase Key:', supabaseKey ? 'Found' : 'Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.')
  process.exit(1)
}

// PostgreSQL connection - see pool configuration below

async function createAdminUser() {
  try {
    console.log('Creating admin user account...')
    
    // First, check the existing employee record
    const { data: existingEmployee, error: employeeCheckError } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', 'EMP001')
      .single()
    
    if (employeeCheckError) {
      console.error('Error checking employee:', employeeCheckError)
      return
    }

    if (existingEmployee) {
      console.log('Found existing employee:', existingEmployee)
    }
    
    let employeeId
    
    if (!existingEmployee) {
      console.log('Creating employee record...')
      
      const { data: newEmployee, error: createEmployeeError } = await supabase
        .from('employees')
        .insert({
          first_name: 'Vikas',
          last_name: 'Alagarsamy',
          email: 'vikas.alagarsamy1987@gmail.com',
          phone: '+1234567890',
          employee_id: 'EMP001',
          job_title: 'Administrator',
          hire_date: new Date().toISOString().split('T')[0],
          status: 'active',
          name: 'Vikas Alagarsamy'
        })
        .select()
        .single()
      
      if (createEmployeeError) {
        console.error('Error creating employee:', createEmployeeError)
        return
      }
      
      employeeId = newEmployee.id
      console.log('Employee created with ID:', employeeId)
    } else {
      employeeId = existingEmployee.id
      console.log('Using existing employee with ID:', employeeId)
    }
    
    // Ensure we have an Administrator role
    const { data: roles, error: roleCheckError } = await supabase
      .from('roles')
      .select('id')
      .eq('title', 'Administrator')
    
    let roleId
    
    if (roleCheckError || !roles || roles.length === 0) {
      console.log('Creating Administrator role...')
      
      const { data: newRole, error: createRoleError } = await supabase
        .from('roles')
        .insert({
          title: 'Administrator',
          description: 'Full system access',
          is_admin: true,
          permissions: JSON.stringify(['*']),
          status: 'active'
        })
        .select()
        .single()
      
      if (createRoleError) {
        console.error('Error creating role:', createRoleError)
        return
      }
      
      roleId = newRole.id
      console.log('Administrator role created with ID:', roleId)
    } else {
      roleId = roles[0].id
      console.log('Administrator role found with ID:', roleId)
    }
    
    // Update employee with role
    const { error: updateEmployeeError } = await supabase
      .from('employees')
      .update({
        role_id: roleId,
        username: 'vikas.alagarsamy1987',
        password_hash: await bcrypt.hash('password123', 10),
        is_active: true
      })
      .eq('id', employeeId)
    
    if (updateEmployeeError) {
      console.error('Error updating employee:', updateEmployeeError)
      return
    }
    
    console.log('✅ Admin user account created/updated successfully!')
    
    console.log('\n=== LOGIN CREDENTIALS ===')
    console.log('Username: vikas.alagarsamy1987')
    console.log('Password: password123')
    console.log('========================\n')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createAdminUser() 