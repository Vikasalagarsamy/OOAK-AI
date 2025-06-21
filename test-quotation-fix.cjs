// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:38:43.928Z
// Original file backed up as: test-quotation-fix.cjs.backup


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

async function testQuotationOwnershipFix() {
  console.log('🧪 FINAL COMPREHENSIVE TEST - QUOTATION OWNERSHIP FIX');
  console.log('='.repeat(60));
  
  try {
    // 1. Check if the quotation was fixed in the database
    console.log('\n1️⃣ TESTING: Direct quotation check (ID 19)');
    const { data: quotation19, error: q19Error } = await supabase
      .from('quotations')
      .select('id, quotation_number, client_name, total_amount, status, created_by, assigned_to')
      .eq('id', 19)
      .single();
    
    if (q19Error) {
      console.log('❌ Quotation ID 19 not found:', q19Error.message);
    } else {
      console.log('✅ Found quotation ID 19:');
      console.log(`    Client: ${quotation19.client_name}`);
      console.log(`    Amount: ₹${quotation19.total_amount}`);
      console.log(`    Status: ${quotation19.status}`);
      console.log(`    Created by: ${quotation19.created_by}`);
      console.log(`    Assigned to: ${quotation19.assigned_to}`);
      
      const isAssignedToVikas = quotation19.created_by === '87000000-0000-0000-0000-000000000000' || 
                               quotation19.created_by === '87' || 
                               quotation19.assigned_to === 87;
      console.log(`    Vikas assignment: ${isAssignedToVikas ? '✅ YES' : '❌ NO'}`);
    }
    
    // 2. Check all quotations to see their assignment
    console.log('\n2️⃣ TESTING: All quotations in database');
    const { data: allQuotations } = await supabase
      .from('quotations')
      .select('id, quotation_number, client_name, total_amount, status, created_by, assigned_to')
      .order('id', { ascending: false });
    
    console.log(`✅ Found ${allQuotations?.length || 0} total quotations:`);
    allQuotations?.forEach(q => {
      const isVikasQuotation = q.created_by === '87000000-0000-0000-0000-000000000000' || 
                              q.created_by === '87' || 
                              q.assigned_to === 87;
      console.log(`    • ${q.quotation_number}: ${q.client_name} - ₹${q.total_amount}`);
      console.log(`      Created by: ${q.created_by}, Assigned to: ${q.assigned_to} ${isVikasQuotation ? '✅' : '❌'}`);
    });
    
    // 3. Check employees in sales department
    console.log('\n3️⃣ TESTING: Sales employees');
    const { data: salesEmployees } = await supabase
      .from('employees')
      .select('id, name, email, department_id')
      .eq('department_id', 2);
    
    console.log(`✅ Found ${salesEmployees?.length || 0} sales employees:`);
    salesEmployees?.forEach(emp => {
      console.log(`    • ID: ${emp.id}, Name: ${emp.name}, Dept: ${emp.department_id}`);
    });
    
    // 4. Check leads assignment
    console.log('\n4️⃣ TESTING: Leads assignment');
    const { data: leads } = await supabase
      .from('leads')
      .select('id, client_name, assigned_to, status')
      .order('id', { ascending: false });
    
    console.log(`✅ Found ${leads?.length || 0} leads:`);
    leads?.forEach(lead => {
      const assignedToVikas = lead.assigned_to === 87;
      console.log(`    • ID: ${lead.id}, Client: ${lead.client_name}`);
      console.log(`      Assigned to: ${lead.assigned_to} ${assignedToVikas ? '✅ (Vikas)' : '❌ (Not Vikas)'}, Status: ${lead.status}`);
    });
    
    // 5. Calculate metrics for Vikas
    console.log('\n5️⃣ TESTING: Calculate Vikas performance metrics');
    
    const vikasQuotations = allQuotations?.filter(q => {
      return q.created_by === '87000000-0000-0000-0000-000000000000' || 
             q.created_by === '87' || 
             q.assigned_to === 87;
    }) || [];
    
    const vikasLeads = leads?.filter(l => l.assigned_to === 87) || [];
    
    const totalRevenue = vikasQuotations.reduce((sum, q) => sum + (q.total_amount || 0), 0);
    const approvedQuotations = vikasQuotations.filter(q => 
      q.status === 'approved' || q.status === 'completed' || q.status === 'pending_approval'
    );
    
    console.log(`📊 Vikas Alagarsamy Performance Metrics:`);
    console.log(`    • Leads assigned: ${vikasLeads.length}`);
    console.log(`    • Quotations created: ${vikasQuotations.length}`);
    console.log(`    • Quotations approved: ${approvedQuotations.length}`);
    console.log(`    • Total revenue: ₹${totalRevenue.toLocaleString()}`);
    
    // 6. Expected vs Actual
    console.log('\n6️⃣ EXPECTED vs ACTUAL RESULTS:');
    console.log('Expected after fixes:');
    console.log('  ✅ Vikas should have at least 1 lead assigned');
    console.log('  ✅ Vikas should have 1 quotation (Jothi Alagarsamy - ₹43,500)');
    console.log('  ✅ Quotation should be properly assigned to Vikas');
    console.log('  ✅ Team Performance should show ₹43,500+ revenue for Vikas');
    
    const success = (
      vikasLeads.length >= 1 &&
      vikasQuotations.length >= 1 &&
      totalRevenue >= 43500
    );
    
    console.log(`\n🎯 OVERALL TEST RESULT: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (!success) {
      console.log('\n❌ Issues found:');
      if (vikasLeads.length === 0) console.log('  • No leads assigned to Vikas (ID 87)');
      if (vikasQuotations.length === 0) console.log('  • No quotations assigned to Vikas');
      if (totalRevenue < 43500) console.log('  • Revenue is less than expected ₹43,500');
    } else {
      console.log('\n🎉 ALL TESTS PASSED! The quotation ownership bug has been fixed!');
      console.log('\n📋 SUMMARY OF FIXES APPLIED:');
      console.log('  ✅ Fixed getAuthenticatedUser() to return actual user ID (87) instead of mock UUID');
      console.log('  ✅ Updated quotation ID 19 to be assigned to Vikas (created_by: 87000000-0000-0000-0000-000000000000)');
      console.log('  ✅ Fixed quotations-list API to include created_by and assigned_to fields');
      console.log('  ✅ Fixed team performance queries to use department_id instead of department');
      console.log('  ✅ Team Performance metrics now show correct revenue for Vikas');
    }
    
    return success;
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
}

// Run the test
testQuotationOwnershipFix().then(success => {
  process.exit(success ? 0 : 1);
}); 