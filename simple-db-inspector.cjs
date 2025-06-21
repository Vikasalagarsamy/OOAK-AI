// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:50:05.786Z
// Original file backed up as: simple-db-inspector.cjs.backup


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

// Simple Local Database Inspector
// ===============================

const { Pool } = require('pg');)

// Local Supabase configuration
const LOCAL_CONFIG = {
  url: 'http://127.0.0.1:54321',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
}

async function inspectDatabase() {
  console.log('🔍 Simple Database Inspector - Local Supabase\n')
  
  try {
    // PostgreSQL connection - see pool configuration below
    console.log('✅ Connected to local Supabase\n')
    
    // Known tables to check
    const tablesToCheck = [
      'companies', 'branches', 'employees', 'leads', 'lead_sources',
      'designations', 'departments', 'roles', 'users', 'notifications',
      'employee_companies', 'whatsapp_templates', 'vendors', 'quotations'
    ]
    
    const foundTables = []
    
    console.log('🔍 Discovering tables...\n')
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (!error) {
          foundTables.push(tableName)
          console.log(`✅ ${tableName}`)
        } else {
          console.log(`❌ ${tableName} - ${error.message}`)
        }
      } catch (e) {
        console.log(`❌ ${tableName} - Not accessible`)
      }
    }
    
    console.log(`\n📊 Found ${foundTables.length} accessible tables\n`)
    
    // Inspect each found table
    for (const tableName of foundTables) {
      console.log('='.repeat(60))
      console.log(`📋 TABLE: ${tableName.toUpperCase()}`)
      console.log('='.repeat(60))
      
      try {
        // Get data with count
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(2)
        
        if (error) {
          console.log(`❌ Error: ${error.message}\n`)
          continue
        }
        
        console.log(`📊 Row Count: ${count}`)
        
        if (data && data.length > 0) {
          console.log('\n📝 Fields (from sample data):')
          Object.keys(data[0]).forEach(field => {
            const value = data[0][field]
            const type = value === null ? 'null' : typeof value
            let sampleValue = value
            
            if (typeof value === 'string' && value.length > 30) {
              sampleValue = value.substring(0, 30) + '...'
            }
            
            console.log(`   • ${field}: ${type} ${sampleValue !== null ? `(${sampleValue})` : ''}`)
          })
          
          console.log('\n📄 Sample Records:')
          data.forEach((row, index) => {
            console.log(`\n   Record ${index + 1}:`)
            
            // Show key fields for different table types
            if (tableName === 'companies') {
              console.log(`     ID: ${row.id}`)
              console.log(`     Name: ${row.name}`)
              console.log(`     Code: ${row.company_code || 'N/A'}`)
              console.log(`     Status: ${row.status || 'N/A'}`)
            } else if (tableName === 'employees') {
              console.log(`     ID: ${row.id}`)
              console.log(`     Name: ${row.first_name} ${row.last_name}`)
              console.log(`     Job Title: ${row.job_title || 'N/A'}`)
              console.log(`     Status: ${row.status || 'N/A'}`)
            } else if (tableName === 'leads') {
              console.log(`     ID: ${row.id}`)
              console.log(`     Number: ${row.lead_number || 'N/A'}`)
              console.log(`     Client: ${row.client_name || 'N/A'}`)
              console.log(`     Status: ${row.status || 'N/A'}`)
              console.log(`     Assigned To: ${row.assigned_to || 'Unassigned'}`)
            } else if (tableName === 'branches') {
              console.log(`     ID: ${row.id}`)
              console.log(`     Name: ${row.name}`)
              console.log(`     Location: ${row.location || 'N/A'}`)
            } else {
              // Show first few fields for other tables
              const keys = Object.keys(row).slice(0, 4)
              keys.forEach(key => {
                let value = row[key]
                if (typeof value === 'string' && value.length > 30) {
                  value = value.substring(0, 30) + '...'
                }
                console.log(`     ${key}: ${value}`)
              })
            }
          })
        } else {
          console.log('\n📄 No data found')
        }
        
        console.log('\n')
        
      } catch (error) {
        console.log(`❌ Error inspecting ${tableName}: ${error.message}\n`)
      }
    }
    
    // Summary
    console.log('='.repeat(60))
    console.log('🎯 INSPECTION SUMMARY')
    console.log('='.repeat(60))
    console.log(`📊 Total Tables: ${foundTables.length}`)
    console.log('📋 Tables Found:')
    foundTables.forEach(table => console.log(`   • ${table}`))
    
    console.log('\n💡 Database Structure Confirmed!')
    console.log('🔧 You can now use these exact field names in your frontend queries')
    console.log('🌐 Local Studio: http://127.0.0.1:54323')
    
  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

inspectDatabase() 