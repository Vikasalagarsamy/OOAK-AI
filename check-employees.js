// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:50:05.783Z
// Original file backed up as: check-employees.js.backup


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

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

// PostgreSQL connection - see pool configuration below

async function checkEmployeesAndTasks() {
  try {
    console.log('🔍 Checking employees in database...')
    
    // Get all employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, employee_id, first_name, last_name, name, email')
      .order('id')

    if (empError) {
      console.error('❌ Error fetching employees:', empError)
      return
    }

    console.log('\n📋 Employees in database:')
    employees.forEach(emp => {
      console.log(`  ID: ${emp.id}, employee_id: ${emp.employee_id}, Name: ${emp.first_name} ${emp.last_name}`)
    })

    // Check task assignments
    console.log('\n🔍 Checking task assignments...')
    const { data: taskAssignments, error: taskError } = await supabase
      .from('ai_tasks')
      .select('assigned_to_employee_id, count(*)')
      .not('assigned_to_employee_id', 'is', null)
      .group('assigned_to_employee_id')

    if (taskError) {
      console.error('❌ Error fetching task assignments:', taskError)
      return
    }

    console.log('\n📊 Task assignments by employee_id:')
    for (const assignment of taskAssignments || []) {
      const employee = employees.find(e => e.id === assignment.assigned_to_employee_id)
      console.log(`  Employee ID ${assignment.assigned_to_employee_id}: ${assignment.count} tasks`)
      if (employee) {
        console.log(`    → ${employee.first_name} ${employee.last_name} (${employee.employee_id})`)
      } else {
        console.log(`    → ⚠️ No employee found with ID ${assignment.assigned_to_employee_id}`)
      }
    }

    // Check current user mapping
    console.log('\n🔍 Checking user accounts...')
    const { data: users, error: userError } = await supabase
      .from('user_accounts')
      .select('id, email, username, employee_id')
      .limit(5)

    if (userError) {
      console.error('❌ Error fetching users:', userError)
    } else {
      console.log('\n👤 User accounts:')
      users.forEach(user => {
        console.log(`  User: ${user.username} (${user.email}), employee_id: ${user.employee_id}`)
      })
    }

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

checkEmployeesAndTasks() 