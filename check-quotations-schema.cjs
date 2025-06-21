// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:50:05.782Z
// Original file backed up as: check-quotations-schema.cjs.backup


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

const { Pool } = require('pg');)

const LOCAL_CONFIG = {
  url: 'http://127.0.0.1:54321',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
}

async function checkAndFixQuotationsSchema() {
  console.log('🔍 Checking quotations table schema...\n')
  
  try {
    // PostgreSQL connection - see pool configuration below
    
    // First check the actual quotation data
    const { data: quotations, error: quotError } = await supabase
      .from('quotations')
      .select('id, created_by')
      .limit(5)
    
    if (!quotError && quotations) {
      console.log('📊 Current quotations data:')
      quotations.forEach(q => {
        console.log(`  ID: ${q.id} (${typeof q.id}), created_by: ${q.created_by} (${typeof q.created_by})`)
      })
    }
    
    // The issue is that created_by expects a UUID but we have integers
    // Let's fix this by updating the created_by values to use valid UUIDs
    console.log('\n🔧 Fixing quotations created_by field...')
    
    // Strategy: Update the problematic UUID to use user_account ID 1 (Vikas)
    const { data: updatedQuotation, error: updateError } = await supabase
      .from('quotations')
      .update({ 
        created_by: '00000000-0000-0000-0000-000000000001' // Use a valid UUID format
      })
      .eq('created_by', '87000000-0000-0000-0000-000000000000')
      .select()
    
    if (updateError) {
      console.log('❌ Update failed:', updateError.message)
      
      // Alternative approach: Check if the column type is wrong
      console.log('\n🔄 Checking if we need to change column type...')
      
      // The issue might be that created_by should be an integer, not UUID
      // Let's check what the auth system expects
      console.log('🔍 Checking user_accounts table structure...')
      const { data: userAccounts, error: userError } = await supabase
        .from('user_accounts')
        .select('id')
        .limit(1)
      
      if (!userError && userAccounts?.[0]) {
        const userId = userAccounts[0].id
        console.log(`👤 User account ID type: ${typeof userId} (value: ${userId})`)
        
        // Try updating with integer value
        console.log('\n🔧 Trying to update with integer user ID...')
        
        // First, let's try a direct SQL update to change the column type if needed
        const { data: sqlResult, error: sqlError } = await supabasequery('SELECT execute_sql(
          sql_statement: `
            -- First, let's see the current column type
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'quotations' 
            AND column_name = 'created_by';
          `
        )')
        
        if (!sqlError && sqlResult) {
          console.log('📋 Column info:', sqlResult)
          
          // If it's a UUID column but we need integer, we need to change it
          if (sqlResult[0]?.data_type === 'uuid') {
            console.log('🔧 Column is UUID type, changing to INTEGER...')
            
            const { error: alterError } = await supabasequery('SELECT execute_sql(
              sql_statement: `
                -- Change created_by column from UUID to INTEGER
                ALTER TABLE quotations 
                ALTER COLUMN created_by TYPE INTEGER 
                USING CASE 
                  WHEN created_by = '87000000-0000-0000-0000-000000000000' THEN 1
                  ELSE 1
                END;
              `
            )')
            
            if (alterError) {
              console.log('❌ Failed to alter column:', alterError.message)
            } else {
              console.log('✅ Successfully changed created_by column to INTEGER')
              
              // Now verify the fix
              const { data: verifyQuotations, error: verifyError } = await supabase
                .from('quotations')
                .select('id, created_by')
              
              if (!verifyError) {
                console.log('✅ Verification - quotations after fix:')
                verifyQuotations.forEach(q => {
                  console.log(`  ID: ${q.id}, created_by: ${q.created_by} (${typeof q.created_by})`)
                })
              }
            }
          }
        }
      }
    } else {
      console.log('✅ Successfully updated quotation created_by field')
      console.log('Updated quotations:', updatedQuotation)
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

checkAndFixQuotationsSchema() 