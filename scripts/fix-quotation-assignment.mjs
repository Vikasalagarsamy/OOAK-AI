// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:51:57.542Z
// Original file backed up as: scripts/fix-quotation-assignment.mjs.backup


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

async function fixQuotationAssignment() {
  console.log('🔧 Fixing quotation assignment...');
  
  try {
    // Update quotation to assign to Vikas (ID 87) and change status
    const { data, error } = await supabase
      .from('quotations')
      .update({ 
        assigned_to: 87,
        status: 'pending_approval'
      })
      .eq('id', 19)
      .select();
      
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log('✅ Updated quotation:', data);
    
    // Verify the update
    const { data: verification } = await supabase
      .from('quotations')
      .select('id, client_name, total_amount, status, assigned_to')
      .eq('id', 19)
      .single();
      
    console.log('🔍 Verification:', verification);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

fixQuotationAssignment(); 