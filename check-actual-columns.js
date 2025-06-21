// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:50:05.782Z
// Original file backed up as: check-actual-columns.js.backup


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
#!/usr/bin/env node

const { Pool } = require('pg');

// PostgreSQL connection - see pool configuration below

async function checkActualColumns() {
  console.log('🔍 CHECKING ACTUAL TABLE COLUMNS')
  console.log('=' * 50)
  
  // Try to insert a minimal record to see what columns are required/available
  console.log('\n🛠️  SERVICES TABLE STRUCTURE:')
  try {
    const { data, error } = await supabase
      .from('services')
      .insert({ servicename: 'Test Service' })
      .select()
    
    if (data && data.length > 0) {
      console.log('   Available columns:', Object.keys(data[0]).join(', '))
      // Delete the test record
      await supabasequery('DELETE FROM services WHERE id = data[0].id')
    } else if (error) {
      console.log('   Error (shows required columns):', error.message)
    }
  } catch (err) {
    console.log('   Error:', err.message)
  }
  
  console.log('\n📦 DELIVERABLES TABLE STRUCTURE:')
  try {
    const { data, error } = await supabase
      .from('deliverables')
      .insert({ deliverable_name: 'Test Deliverable' })
      .select()
    
    if (data && data.length > 0) {
      console.log('   Available columns:', Object.keys(data[0]).join(', '))
      // Delete the test record
      await supabasequery('DELETE FROM deliverables WHERE id = data[0].id')
    } else if (error) {
      console.log('   Error (shows required columns):', error.message)
    }
  } catch (err) {
    console.log('   Error:', err.message)
  }
  
  console.log('\n🎉 QUOTATION_EVENTS TABLE STRUCTURE:')
  try {
    const { data, error } = await supabase
      .from('quotation_events')
      .insert({ 
        quotation_id: 999, 
        event_name: 'Test Event',
        event_date: '2025-01-01',
        event_location: 'Test Location'
      })
      .select()
    
    if (data && data.length > 0) {
      console.log('   Available columns:', Object.keys(data[0]).join(', '))
      // Delete the test record
      await supabasequery('DELETE FROM quotation_events WHERE id = data[0].id')
    } else if (error) {
      console.log('   Error (shows required columns):', error.message)
    }
  } catch (err) {
    console.log('   Error:', err.message)
  }
}

checkActualColumns().catch(console.error) 