// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:38:43.929Z
// Original file backed up as: verify-fixes.cjs.backup


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
const { Pool } = require('pg'););

// PostgreSQL connection - see pool configuration below

async function verifyFixes() {
  console.log('🔧 VERIFYING QUOTATION OWNERSHIP FIXES');
  console.log('='.repeat(50));
  
  try {
    // Check the specific quotation that should be fixed
    console.log('\n📝 Checking quotation ID 19 (Jothi Alagarsamy):');
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', 19)
      .single();
    
    if (error) {
      console.log('❌ Error:', error.message);
      console.log('❓ This could mean:');
      console.log('   • Quotation ID 19 doesn\'t exist');
      console.log('   • Database connection issues');
      console.log('   • The fix wasn\'t applied to this database');
    } else {
      console.log('✅ Found quotation:');
      console.log(`   • ID: ${quotation.id}`);
      console.log(`   • Client: ${quotation.client_name}`);
      console.log(`   • Amount: ₹${quotation.total_amount}`);
      console.log(`   • Status: ${quotation.status}`);
      console.log(`   • Created by: ${quotation.created_by}`);
      console.log(`   • Assigned to: ${quotation.assigned_to}`);
      
      // Check if this quotation is properly assigned to Vikas
      const isAssignedToVikas = quotation.created_by === '87000000-0000-0000-0000-000000000000' || 
                               quotation.created_by === '87' || 
                               quotation.assigned_to === 87;
      
      console.log(`   • Assigned to Vikas: ${isAssignedToVikas ? '✅ YES' : '❌ NO'}`);
      
      if (!isAssignedToVikas) {
        console.log('\n🔧 The quotation needs to be fixed. Let me update it:');
        
        const { data: updated, error: updateError } = await supabase
          .from('quotations')
          .update({ 
            created_by: '87',  // Use Vikas's employee ID
            assigned_to: 87
          })
          .eq('id', 19)
          .select();
          
        if (updateError) {
          console.log('❌ Failed to update quotation:', updateError.message);
        } else {
          console.log('✅ Successfully updated quotation assignment!');
          console.log('   • New created_by:', updated[0]?.created_by);
          console.log('   • New assigned_to:', updated[0]?.assigned_to);
        }
      }
    }
    
    // Check all quotations to see the current state
    console.log('\n📋 All quotations in database:');
    const { data: allQuotations } = await supabase
      .from('quotations')
      .select('id, quotation_number, client_name, total_amount, status, created_by, assigned_to')
      .order('id', { ascending: false });
    
    if (allQuotations && allQuotations.length > 0) {
      console.log(`✅ Found ${allQuotations.length} quotations:`);
      allQuotations.forEach(q => {
        const isVikas = q.created_by === '87' || q.assigned_to === 87 || 
                       q.created_by === '87000000-0000-0000-0000-000000000000';
        console.log(`   • ${q.quotation_number || `ID-${q.id}`}: ${q.client_name} - ₹${q.total_amount} ${isVikas ? '✅' : '❌'}`);
      });
    } else {
      console.log('❌ No quotations found');
    }
    
    // Check employees
    console.log('\n👥 Sales employees:');
    const { data: employees } = await supabase
      .from('employees')
      .select('id, name, email, department_id')
      .eq('department_id', 2);
    
    if (employees && employees.length > 0) {
      console.log(`✅ Found ${employees.length} sales employees:`);
      employees.forEach(emp => {
        console.log(`   • ID: ${emp.id}, Name: ${emp.name}`);
      });
    } else {
      console.log('❌ No sales employees found');
    }
    
    // Check leads
    console.log('\n📈 Leads assignment:');
    const { data: leads } = await supabase
      .from('leads')
      .select('id, client_name, assigned_to, status')
      .order('id', { ascending: false });
    
    if (leads && leads.length > 0) {
      console.log(`✅ Found ${leads.length} leads:`);
      leads.forEach(lead => {
        const isVikas = lead.assigned_to === 87;
        console.log(`   • ${lead.client_name}: ${lead.status} (assigned to: ${lead.assigned_to}) ${isVikas ? '✅' : '❌'}`);
      });
    } else {
      console.log('❌ No leads found');
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('✅ Database connection working');
    
    const vikasQuotations = allQuotations?.filter(q => 
      q.created_by === '87' || q.assigned_to === 87 || 
      q.created_by === '87000000-0000-0000-0000-000000000000'
    ) || [];
    
    const vikasLeads = leads?.filter(l => l.assigned_to === 87) || [];
    const totalRevenue = vikasQuotations.reduce((sum, q) => sum + (q.total_amount || 0), 0);
    
    console.log(`📊 Vikas performance after fixes:`);
    console.log(`   • Leads: ${vikasLeads.length}`);
    console.log(`   • Quotations: ${vikasQuotations.length}`);
    console.log(`   • Total revenue: ₹${totalRevenue.toLocaleString()}`);
    
    if (vikasQuotations.length > 0 && totalRevenue > 0) {
      console.log('\n🎉 SUCCESS! Team Performance will now show correct metrics for Vikas!');
    } else {
      console.log('\n⚠️  Still need to fix the assignments');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyFixes(); 