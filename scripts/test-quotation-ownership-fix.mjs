// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:51:57.543Z
// Original file backed up as: scripts/test-quotation-ownership-fix.mjs.backup


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

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// PostgreSQL connection - see pool configuration below

async function testQuotationOwnershipFix() {
  console.log('🧪 TESTING QUOTATION OWNERSHIP FIX');
  console.log('='.repeat(50));
  
  try {
    // 1. TEST: Verify employees in sales department
    console.log('\n1️⃣ TESTING: Sales employees query');
    const { data: salesEmployees } = await supabase
      .from('employees')
      .select('id, name, email, department_id')
      .eq('department_id', 2);
    
    console.log(`✅ Found ${salesEmployees?.length || 0} sales employees:`);
    salesEmployees?.forEach(emp => {
      console.log(`  • ID: ${emp.id}, Name: ${emp.name}, Dept: ${emp.department_id}`);
    });
    
    // 2. TEST: Check quotation assignment
    console.log('\n2️⃣ TESTING: Quotation assignment');
    const { data: quotations } = await supabase
      .from('quotations')
      .select('id, quotation_number, client_name, total_amount, status, created_by, assigned_to')
      .order('created_at', { ascending: false });
    
    console.log(`✅ Found ${quotations?.length || 0} quotations:`);
    quotations?.forEach(q => {
      const createdByVikas = q.created_by === "87" || q.created_by === 87;
      const assignedToVikas = q.assigned_to === 87;
      console.log(`  • ${q.quotation_number}: ${q.client_name}`);
      console.log(`    Amount: ₹${q.total_amount}, Status: ${q.status}`);
      console.log(`    Created by: ${q.created_by} ${createdByVikas ? '✅ (Vikas)' : '❌ (Not Vikas)'}`);
      console.log(`    Assigned to: ${q.assigned_to} ${assignedToVikas ? '✅ (Vikas)' : '❌ (Not Vikas)'}`);
    });
    
    // 3. TEST: Check leads assignment  
    console.log('\n3️⃣ TESTING: Lead assignment');
    const { data: leads } = await supabase
      .from('leads')
      .select('id, client_name, assigned_to, status')
      .order('created_at', { ascending: false });
    
    console.log(`✅ Found ${leads?.length || 0} leads:`);
    leads?.forEach(lead => {
      const assignedToVikas = lead.assigned_to === 87;
      console.log(`  • ID: ${lead.id}, Client: ${lead.client_name}`);
      console.log(`    Assigned to: ${lead.assigned_to} ${assignedToVikas ? '✅ (Vikas)' : '❌ (Not Vikas)'}, Status: ${lead.status}`);
    });
    
    // 4. TEST: Calculate expected team performance
    console.log('\n4️⃣ TESTING: Team performance calculation');
    
    // Filter quotations for Vikas
    const vikasQuotations = quotations?.filter(q => {
      return q.created_by === "87" || q.created_by === 87 || q.assigned_to === 87;
    }) || [];
    
    // Filter leads for Vikas  
    const vikasLeads = leads?.filter(l => l.assigned_to === 87) || [];
    
    // Calculate metrics
    const convertedQuotations = vikasQuotations.filter(q => 
      q.status === 'approved' || q.status === 'completed' || q.status === 'pending_approval'
    );
    
    const totalRevenue = vikasQuotations.reduce((sum, q) => sum + (q.total_amount || 0), 0);
    const conversionRate = vikasQuotations.length > 0 ? convertedQuotations.length / vikasQuotations.length : 0;
    
    console.log(`📊 Vikas Alagarsamy Performance:`);
    console.log(`  • Leads assigned: ${vikasLeads.length}`);
    console.log(`  • Quotations created: ${vikasQuotations.length}`);
    console.log(`  • Quotations converted: ${convertedQuotations.length}`);
    console.log(`  • Total revenue: ₹${totalRevenue.toLocaleString()}`);
    console.log(`  • Conversion rate: ${(conversionRate * 100).toFixed(1)}%`);
    
    // 5. EXPECTED RESULTS
    console.log('\n5️⃣ EXPECTED vs ACTUAL:');
    console.log(`Expected results after fix:`);
    console.log(`  • Vikas should have 1 lead ✅`);
    console.log(`  • Vikas should have 1 quotation (₹43,500) ✅`);
    console.log(`  • Quotation should be assigned to Vikas ✅`);
    console.log(`  • Team Performance should show ₹43,500 revenue ✅`);
    
    const success = (
      vikasLeads.length >= 1 &&
      vikasQuotations.length >= 1 &&
      totalRevenue >= 43500
    );
    
    console.log(`\n🎯 OVERALL TEST RESULT: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (!success) {
      console.log('\n❌ Issues found:');
      if (vikasLeads.length === 0) console.log('  • No leads assigned to Vikas');
      if (vikasQuotations.length === 0) console.log('  • No quotations assigned to Vikas');
      if (totalRevenue < 43500) console.log('  • Revenue is less than expected ₹43,500');
    }
    
    return success;
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
}

// Run the test
testQuotationOwnershipFix().then(success => {
  console.log(`\n${success ? '🎉 ALL TESTS PASSED!' : '💥 TESTS FAILED!'}`);
  process.exit(success ? 0 : 1);
}); 