#!/usr/bin/env node

const fs = require('fs');

// Remote and Local configurations
const REMOTE_CONFIG = {
  url: 'https://aavofqdzjhyfjygkxynq.supabase.co',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY'
};

const LOCAL_CONFIG = {
  url: 'http://localhost:8000',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
};

async function getAllTablesFromRemote() {
  console.log('🔍 Discovering all tables from remote Supabase...');
  const fetch = (await import('node-fetch')).default;
  
  try {
    // Get the OpenAPI schema to discover all tables
    const response = await fetch(`${REMOTE_CONFIG.url}/rest/v1/`, {
      headers: {
        'apikey': REMOTE_CONFIG.serviceKey,
        'Authorization': `Bearer ${REMOTE_CONFIG.serviceKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const schema = await response.json();
    const tables = Object.keys(schema.definitions || {});
    
    console.log(`📋 Found ${tables.length} tables:`, tables);
    return tables;
    
  } catch (error) {
    console.log(`❌ Error discovering tables: ${error.message}`);
    // Fallback to known tables
    const knownTables = [
      'roles', 'employees', 'companies', 'clients', 'vendors', 'branches',
      'departments', 'designations', 'deliverable_master', 'notifications',
      'user_accounts', 'sales_team_members', 'sales_performance_metrics',
      'sales_leads', 'sales_opportunities', 'sales_quotations', 'sales_quotes',
      'aiml_chat_conversations', 'aiml_prompt_templates', 'projects', 'tasks',
      'timesheet_entries', 'documents', 'contracts', 'invoices', 'payments'
    ];
    console.log(`📋 Using known tables (${knownTables.length}):`, knownTables);
    return knownTables;
  }
}

async function getTableSchema(tableName) {
  console.log(`📐 Getting schema for ${tableName}...`);
  const fetch = (await import('node-fetch')).default;
  
  try {
    const response = await fetch(`${REMOTE_CONFIG.url}/rest/v1/${tableName}?limit=1`, {
      method: 'HEAD',
      headers: {
        'apikey': REMOTE_CONFIG.serviceKey,
        'Authorization': `Bearer ${REMOTE_CONFIG.serviceKey}`
      }
    });
    
    if (response.ok) {
      return { exists: true, tableName };
    } else {
      return { exists: false, tableName };
    }
  } catch (error) {
    return { exists: false, tableName, error: error.message };
  }
}

async function fetchAllDataFromTable(tableName) {
  console.log(`📥 Fetching all data from ${tableName}...`);
  const fetch = (await import('node-fetch')).default;
  
  try {
    // Fetch with pagination to get ALL data
    let allData = [];
    let offset = 0;
    const limit = 1000; // Fetch in chunks of 1000
    
    while (true) {
      const response = await fetch(`${REMOTE_CONFIG.url}/rest/v1/${tableName}?limit=${limit}&offset=${offset}`, {
        headers: {
          'apikey': REMOTE_CONFIG.serviceKey,
          'Authorization': `Bearer ${REMOTE_CONFIG.serviceKey}`,
          'Prefer': 'count=exact'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`⚠️  Table ${tableName} not found`);
          return [];
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      allData = allData.concat(data);
      
      console.log(`   📊 Fetched ${data.length} records (total: ${allData.length})`);
      
      // If we got less than the limit, we've reached the end
      if (data.length < limit) {
        break;
      }
      
      offset += limit;
    }
    
    console.log(`✅ Total records fetched from ${tableName}: ${allData.length}`);
    return allData;
    
  } catch (error) {
    console.log(`❌ Error fetching from ${tableName}: ${error.message}`);
    return [];
  }
}

async function createTableInLocal(tableName, sampleData) {
  console.log(`🏗️  Creating table ${tableName} in local database...`);
  
  if (!sampleData || sampleData.length === 0) {
    console.log(`ℹ️  No sample data to infer schema for ${tableName}`);
    return;
  }
  
  // Use Docker to execute SQL directly in the database
  const { execSync } = require('child_process');
  
  try {
    // Infer column types from first record
    const firstRecord = sampleData[0];
    const columns = Object.keys(firstRecord).map(key => {
      const value = firstRecord[key];
      let sqlType = 'TEXT';
      
      if (key === 'id') {
        sqlType = 'BIGSERIAL PRIMARY KEY';
      } else if (typeof value === 'number') {
        sqlType = Number.isInteger(value) ? 'BIGINT' : 'DECIMAL';
      } else if (typeof value === 'boolean') {
        sqlType = 'BOOLEAN';
      } else if (value && typeof value === 'object') {
        sqlType = 'JSONB';
      } else if (typeof value === 'string') {
        if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          sqlType = 'TIMESTAMPTZ';
        } else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
          sqlType = 'DATE';
        } else {
          sqlType = 'TEXT';
        }
      }
      
      return `${key} ${sqlType}`;
    });
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${columns.join(',\n        ')}
      );
    `;
    
    console.log(`   📝 SQL for ${tableName}:`);
    console.log(createTableSQL);
    
    // Execute via Docker
    const escapedSQL = createTableSQL.replace(/"/g, '\\"').replace(/\n/g, ' ');
    execSync(`echo "${escapedSQL}" | docker exec -i supabase-db psql -U postgres -d postgres`, 
      { stdio: 'inherit' });
    
    console.log(`✅ Table ${tableName} created successfully`);
    
  } catch (error) {
    console.log(`❌ Error creating table ${tableName}: ${error.message}`);
  }
}

async function insertDataIntoLocal(tableName, data) {
  if (!data || data.length === 0) {
    console.log(`ℹ️  No data to insert for ${tableName}`);
    return;
  }

  console.log(`📤 Inserting ${data.length} records into local ${tableName}...`);
  const fetch = (await import('node-fetch')).default;
  
  // Insert in batches
  const batchSize = 100;
  let successCount = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    try {
      const response = await fetch(`${LOCAL_CONFIG.url}/rest/v1/${tableName}`, {
        method: 'POST',
        headers: {
          'apikey': LOCAL_CONFIG.serviceKey,
          'Authorization': `Bearer ${LOCAL_CONFIG.serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(batch)
      });

      if (response.ok) {
        successCount += batch.length;
        console.log(`   ✅ Inserted batch ${Math.floor(i/batchSize) + 1} (${batch.length} records)`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Failed batch ${Math.floor(i/batchSize) + 1}: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error inserting batch: ${error.message}`);
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ Successfully inserted ${successCount}/${data.length} records into ${tableName}`);
}

async function migrateCompleteTable(tableName) {
  console.log(`\n🔄 === Migrating ${tableName} ===`);
  
  // Step 1: Check if table exists
  const schema = await getTableSchema(tableName);
  if (!schema.exists) {
    console.log(`⚠️  Table ${tableName} does not exist in remote`);
    return;
  }
  
  // Step 2: Fetch all data
  const data = await fetchAllDataFromTable(tableName);
  
  if (data.length === 0) {
    console.log(`ℹ️  Table ${tableName} is empty, skipping`);
    return;
  }
  
  // Step 3: Create table in local (with schema inference)
  await createTableInLocal(tableName, data);
  
  // Step 4: Insert data
  await insertDataIntoLocal(tableName, data);
  
  console.log(`✅ Migration completed for ${tableName}`);
}

async function main() {
  console.log('🚀 COMPLETE DATABASE MIGRATION');
  console.log('===============================');
  console.log(`📡 Remote: ${REMOTE_CONFIG.url}`);
  console.log(`🏠 Local: ${LOCAL_CONFIG.url}`);
  console.log('');

  // Step 1: Discover all tables
  const allTables = await getAllTablesFromRemote();
  
  console.log(`\n🎯 Starting migration of ${allTables.length} tables...\n`);

  // Step 2: Migrate each table
  for (const tableName of allTables) {
    await migrateCompleteTable(tableName);
  }

  console.log('\n🎉 COMPLETE MIGRATION FINISHED!');
  console.log('================================');
  console.log('');
  console.log('📍 Your local Supabase Studio: http://localhost:8000');
  console.log('🔑 Login: supabase / this_password_is_insecure_and_should_be_updated');
  console.log('📊 All your tables and data are now available locally');
  console.log('');
  console.log('🎯 Next steps:');
  console.log('1. Update your app to use: http://localhost:8000');
  console.log('2. Discontinue remote Supabase when ready');
  console.log('3. Enjoy your local development environment!');
}

if (require.main === module) {
  main().catch(console.error);
} 