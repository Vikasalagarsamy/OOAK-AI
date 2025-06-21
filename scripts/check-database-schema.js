// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:50:05.778Z
// Original file backed up as: scripts/check-database-schema.js.backup


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

/**
 * Check Database Schema for Call Transcriptions
 * This script tests the database connection and schema
 */

const { Pool } = require('pg');
import dotenv from 'dotenv'
import crypto from 'crypto'
dotenv.config({ path: '.env.local' })

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema and connection...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    return
  }
  
  // PostgreSQL connection - see pool configuration below
  
  try {
    console.log('📊 Testing database connection...')
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('call_transcriptions')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connection failed:', testError)
      return
    }
    
    console.log('✅ Database connection successful')
    
    // Check existing records
    const { data: records, error: recordsError } = await supabase
      .from('call_transcriptions')
      .select('*')
      .limit(5)
    
    if (recordsError) {
      console.error('❌ Failed to fetch records:', recordsError)
      return
    }
    
    console.log(`📄 Found ${records.length} existing records`)
    if (records.length > 0) {
      console.log('📋 Sample record structure:')
      console.log(Object.keys(records[0]))
    }
    
    // Test insert with minimal data
    console.log('🧪 Testing minimal insert...')
    // Generate a proper UUID for the test
    const testId = crypto.randomUUID()
    
    const { data: insertData, error: insertError } = await supabase
      .from('call_transcriptions')
      .insert({
        id: testId,
        call_id: testId,
        client_name: 'Test Client',
        sales_agent: 'Test Agent',
        phone_number: '+91-TEST',
        transcript: 'Test transcript',
        duration: 60,
        confidence_score: 0.9
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Test insert failed:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
      return
    }
    
    console.log('✅ Test insert successful:', insertData.id)
    
    // Clean up test record
    await supabase
      .from('call_transcriptions')
      .delete()
      .eq('id', testId)
    
    console.log('✅ Test cleanup complete')
    
    // Check call_analytics table
    console.log('📊 Checking call_analytics table...')
    const { data: analyticsTest, error: analyticsError } = await supabase
      .from('call_analytics')
      .select('count')
      .limit(1)
    
    if (analyticsError) {
      console.error('❌ call_analytics table issue:', analyticsError)
    } else {
      console.log('✅ call_analytics table accessible')
    }
    
    // Check call_insights table
    console.log('📊 Checking call_insights table...')
    const { data: insightsTest, error: insightsError } = await supabase
      .from('call_insights')
      .select('count')
      .limit(1)
    
    if (insightsError) {
      console.error('❌ call_insights table issue:', insightsError)
    } else {
      console.log('✅ call_insights table accessible')
    }
    
    console.log('🎉 Database schema check complete!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the check
checkDatabaseSchema().catch(console.error) 