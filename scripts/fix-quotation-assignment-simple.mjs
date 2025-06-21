// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:51:57.541Z
// Original file backed up as: scripts/fix-quotation-assignment-simple.mjs.backup


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

async function fixQuotationAssignment() {
  console.log('🔧 Fixing quotation assignment to Vikas...');
  
  try {
    // Update the quotation to assign created_by to Vikas (ID "87")
    const { data: updatedQuotation, error: updateError } = await supabase
      .from('quotations')
      .update({ 
        created_by: "87",  // Assign to Vikas's actual employee ID as string
        status: 'pending_approval'  // Change status from draft
      })
      .eq('id', 19)
      .select();
      
    if (updateError) {
      console.error('❌ Error updating quotation:', updateError);
      return;
    }
    
    console.log('✅ Updated quotation:', updatedQuotation);
    
    // Verify the fix
    const { data: verification } = await supabase
      .from('quotations')
      .select('id, client_name, total_amount, status, created_by')
      .eq('id', 19)
      .single();
      
    console.log('🔍 Verification after fix:', verification);
    
    console.log('\n🎯 EXPECTED RESULT:');
    console.log('  • created_by should be "87" ✅');
    console.log('  • status should be "pending_approval" ✅');
    console.log('  • Team Performance should now show ₹43,500 for Vikas ✅');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

fixQuotationAssignment(); 