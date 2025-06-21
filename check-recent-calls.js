// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:51:57.551Z
// Original file backed up as: check-recent-calls.js.backup


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

async function checkRecentCalls() {
  try {
    console.log('📋 Checking recent call records...');
    
    const { data, error } = await supabase
      .from('call_transcriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Database error:', error);
      return;
    }
    
    console.log(`📊 Found ${data.length} recent records:`);
    console.log('='.repeat(80));
    
    data.forEach((record, i) => {
      console.log(`${i+1}. Client: ${record.client_name}`);
      console.log(`   Call ID: ${record.call_id}`);
      console.log(`   Created: ${record.created_at}`);
      console.log(`   Transcript: ${record.transcript.substring(0, 150)}...`);
      console.log(`   Confidence: ${record.confidence_score}`);
      console.log(`   Duration: ${record.duration} seconds`);
      console.log(`   Language: ${record.detected_language || 'N/A'}`);
      console.log(`   Recording: ${record.recording_url ? 'Yes' : 'No'}`);
      console.log('   ' + '-'.repeat(50));
    });
    
    // Also check for any processing logs
    console.log('\n🔍 Checking for any calls still processing...');
    const processingCalls = data.filter(call => 
      call.transcript && call.transcript.includes('Processing')
    );
    
    if (processingCalls.length > 0) {
      console.log(`⚠️  Found ${processingCalls.length} calls still processing:`);
      processingCalls.forEach(call => {
        console.log(`   - ${call.client_name} (${call.call_id})`);
      });
    } else {
      console.log('✅ No calls currently processing');
    }
    
  } catch (error) {
    console.error('❌ Error checking calls:', error);
  }
}

checkRecentCalls(); 