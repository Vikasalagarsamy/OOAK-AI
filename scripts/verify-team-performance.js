// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:50:05.794Z
// Original file backed up as: scripts/verify-team-performance.js.backup


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

// Initialize Supabase client
// PostgreSQL connection - see pool configuration below

async function verifyTeamPerformanceData() {
  console.log('🔍 VERIFYING TEAM PERFORMANCE DATA...\n')

  try {
    // Get employees
    const { data: employees } = await supabase
      .from('employees')
      .select('id, name, email, department')
      .eq('department', 'SALES')

    console.log('👥 EMPLOYEES IN SALES:', employees?.length || 0)
    employees?.forEach(emp => {
      console.log(`   - ${emp.name} (ID: ${emp.id})`)
    })

    // Get quotations
    const { data: quotations } = await supabase
      .from('quotations')
      .select('id, client_name, total_amount, status, assigned_to, created_by')

    console.log('\n💰 QUOTATIONS:', quotations?.length || 0)
    quotations?.forEach(q => {
      console.log(`   - ${q.client_name}: ₹${q.total_amount} (${q.status}) [assigned_to: ${q.assigned_to}, created_by: ${q.created_by}]`)
    })

    // Get leads  
    const { data: leads } = await supabase
      .from('leads')
      .select('id, client_name, assigned_to, status')

    console.log('\n📈 LEADS:', leads?.length || 0)
    leads?.forEach(l => {
      console.log(`   - ${l.client_name}: ${l.status} [assigned_to: ${l.assigned_to}]`)
    })

    // Calculate what the fixed logic should show
    console.log('\n🧮 CALCULATED TEAM PERFORMANCE:')
    console.log('=' .repeat(50))

    employees?.forEach(employee => {
      // Apply same logic as the fixed AIMLService
      const employeeQuotations = quotations?.filter(q => {
        if (q.assigned_to === employee.id) return true
        if (q.created_by === employee.id) return true
        
        // For Vikas Alagarsamy, assign all unassigned quotations
        if (employee.name === 'Vikas Alagarsamy' && (!q.assigned_to || q.assigned_to === null)) {
          return true
        }
        
        return false
      }) || []

      const employeeLeads = leads?.filter(l => l.assigned_to === employee.id) || []
      
      const convertedQuotations = employeeQuotations.filter(q => 
        q.status === 'approved' || q.status === 'completed'
      )
      
      const conversionRate = employeeLeads.length > 0 ? 
        convertedQuotations.length / employeeLeads.length : 0

      const totalRevenue = employeeQuotations
        .filter(q => q.status === 'approved' || q.status === 'completed')
        .reduce((sum, q) => sum + (q.total_amount || 0), 0)

      console.log(`\n${employee.name}:`)
      console.log(`   📊 Quotations: ${employeeQuotations.length} (created), ${convertedQuotations.length} (converted)`)
      console.log(`   📈 Leads: ${employeeLeads.length}`)
      console.log(`   💰 Revenue: ₹${totalRevenue.toLocaleString()}`)
      console.log(`   📈 Conversion Rate: ${(conversionRate * 100).toFixed(1)}%`)
      
      if (employeeQuotations.length > 0) {
        console.log(`   📋 Their Quotations:`)
        employeeQuotations.forEach(q => {
          console.log(`      - ${q.client_name}: ₹${q.total_amount} (${q.status})`)
        })
      }
    })

    console.log('\n✅ VERIFICATION COMPLETE')
    console.log('\nThis is what the Team Performance report SHOULD show after the fix.')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

verifyTeamPerformanceData() 