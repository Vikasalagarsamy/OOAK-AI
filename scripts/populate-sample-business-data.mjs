// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:38:43.920Z
// Original file backed up as: scripts/populate-sample-business-data.mjs.backup


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
const { Pool } = require('pg');

// PostgreSQL connection - see pool configuration below

async function populateSampleBusinessData() {
  console.log('🚀 POPULATING SAMPLE BUSINESS DATA...\n')

  try {
    // 1. Create employees first
    console.log('👥 Creating employees...')
    const employees = [
      {
        name: 'Vikas Alagarsamy',
        first_name: 'Vikas',
        last_name: 'Alagarsamy',
        email: 'vikas@company.com',
        department: 'SALES',
        job_title: 'Business Owner'
      },
      {
        name: 'Navya N Kumar',
        first_name: 'Navya',
        last_name: 'Kumar',
        email: 'navya@company.com',
        department: 'SALES',
        job_title: 'Sales Representative'
      }
    ]

    const { data: createdEmployees, error: employeeError } = await supabase
      .from('employees')
      .insert(employees)
      .select()

    if (employeeError) {
      console.error('❌ Employee creation error:', employeeError)
      return
    }

    console.log(`✅ Created ${createdEmployees.length} employees`)

    // 2. Create quotations
    console.log('\n💰 Creating quotations...')
    const quotations = [
      {
        client_name: 'Jothi Alagarsamy',
        total_amount: 23000,
        status: 'draft',
        created_at: new Date('2024-11-15').toISOString(),
        assigned_to: createdEmployees.find(e => e.name === 'Vikas Alagarsamy')?.id,
        quotation_number: 'Q-2024-001'
      },
      {
        client_name: 'Ramya Wedding Photography',
        total_amount: 45000,
        status: 'sent',
        created_at: new Date('2024-12-01').toISOString(),
        assigned_to: createdEmployees.find(e => e.name === 'Vikas Alagarsamy')?.id,
        quotation_number: 'Q-2024-002'
      },
      {
        client_name: 'Tamil Corporate Event',
        total_amount: 15000,
        status: 'approved',
        created_at: new Date('2024-11-20').toISOString(),
        assigned_to: createdEmployees.find(e => e.name === 'Navya N Kumar')?.id,
        quotation_number: 'Q-2024-003'
      }
    ]

    const { data: createdQuotations, error: quotationError } = await supabase
      .from('quotations')
      .insert(quotations)
      .select()

    if (quotationError) {
      console.error('❌ Quotation creation error:', quotationError)
      return
    }

    console.log(`✅ Created ${createdQuotations.length} quotations`)

    // 3. Create leads
    console.log('\n📈 Creating leads...')
    const leads = [
      {
        client_name: 'Jenny Birthday Party',
        status: 'new',
        assigned_to: createdEmployees.find(e => e.name === 'Vikas Alagarsamy')?.id,
        created_at: new Date('2024-12-05').toISOString()
      },
      {
        client_name: 'Pradeep Anniversary',
        status: 'contacted',
        assigned_to: createdEmployees.find(e => e.name === 'Navya N Kumar')?.id,
        created_at: new Date('2024-12-03').toISOString()
      },
      {
        client_name: 'Harish Corporate Shoot',
        status: 'converted',
        assigned_to: createdEmployees.find(e => e.name === 'Navya N Kumar')?.id,
        created_at: new Date('2024-11-25').toISOString()
      }
    ]

    const { data: createdLeads, error: leadError } = await supabase
      .from('leads')
      .insert(leads)
      .select()

    if (leadError) {
      console.error('❌ Lead creation error:', leadError)
      return
    }

    console.log(`✅ Created ${createdLeads.length} leads`)

    // 4. Summary
    console.log('\n📊 BUSINESS DATA SUMMARY:')
    console.log('=' .repeat(50))
    
    const totalRevenue = quotations
      .filter(q => q.status === 'approved')
      .reduce((sum, q) => sum + q.total_amount, 0)
    
    const conversionRate = leads.length > 0 ? 
      (leads.filter(l => l.status === 'converted').length / leads.length) * 100 : 0

    console.log(`💰 Total Revenue: ₹${totalRevenue.toLocaleString()}`)
    console.log(`📊 Total Quotations: ${quotations.length}`)
    console.log(`👥 Team Members: ${employees.length}`)
    console.log(`📈 Leads: ${leads.length}`)
    console.log(`📈 Conversion Rate: ${conversionRate.toFixed(1)}%`)
    
    console.log('\n🎯 TEAM PERFORMANCE:')
    employees.forEach(emp => {
      const empQuotations = quotations.filter(q => q.assigned_to === emp.id)
      const empLeads = leads.filter(l => l.assigned_to === emp.id)
      const empRevenue = empQuotations
        .filter(q => q.status === 'approved')
        .reduce((sum, q) => sum + q.total_amount, 0)
      
      console.log(`${emp.name}:`)
      console.log(`   📊 Quotations: ${empQuotations.length}`)
      console.log(`   📈 Leads: ${empLeads.length}`)
      console.log(`   💰 Revenue: ₹${empRevenue.toLocaleString()}`)
    })

    console.log('\n✅ SAMPLE DATA POPULATED SUCCESSFULLY!')
    console.log('\nNow both the Team Performance report and Business Partner AI will show consistent data.')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

populateSampleBusinessData() 