#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

// Remote Supabase Configuration
const REMOTE_CONFIG = {
  url: 'https://aavofqdzjhyfjygkxynq.supabase.co',
  projectId: 'aavofqdzjhyfjygkxynq',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTg5MTQsImV4cCI6MjA2MDY3NDkxNH0.wLxD0Tcp5YnpErGSYGF5mmO78V4zIlCvFSeBrPFy9kY',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY'
};

// Local Docker Supabase Configuration  
const LOCAL_CONFIG = {
  url: 'http://localhost:8000',
  dbUrl: 'postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:5432/postgres'
};

async function fetchFromRemote(endpoint) {
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(`${REMOTE_CONFIG.url}/rest/v1/${endpoint}`, {
    headers: {
      'apikey': REMOTE_CONFIG.serviceKey,
      'Authorization': `Bearer ${REMOTE_CONFIG.serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

async function getTableSchema(tableName) {
  try {
    const response = await fetch(`${REMOTE_CONFIG.url}/rest/v1/`, {
      headers: {
        'apikey': REMOTE_CONFIG.serviceKey,
        'Authorization': `Bearer ${REMOTE_CONFIG.serviceKey}`
      }
    });
    
    if (response.ok) {
      const schema = await response.json();
      return schema.definitions[tableName] || null;
    }
  } catch (error) {
    console.log(`⚠️  Could not get schema for ${tableName}: ${error.message}`);
  }
  return null;
}

async function insertIntoLocal(tableName, data) {
  if (!data || data.length === 0) {
    console.log(`ℹ️  No data to insert for ${tableName}`);
    return;
  }

  const fetch = (await import('node-fetch')).default;
  
  // Use local Supabase API keys
  const localAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
  const localServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';
  
  try {
    const response = await fetch(`${LOCAL_CONFIG.url}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        'apikey': localServiceKey,
        'Authorization': `Bearer ${localServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    console.log(`✅ Successfully inserted ${data.length} records into ${tableName}`);
  } catch (error) {
    console.log(`❌ Failed to insert into ${tableName}: ${error.message}`);
  }
}

async function migrateTable(tableName) {
  console.log(`\n🔄 Migrating table: ${tableName}`);
  
  try {
    // Fetch data from remote
    const data = await fetchFromRemote(tableName);
    console.log(`📥 Fetched ${data.length} records from remote ${tableName}`);
    
    // Insert into local
    if (data.length > 0) {
      // Insert in batches to avoid overwhelming the API
      const batchSize = 100;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        await insertIntoLocal(tableName, batch);
        
        if (i + batchSize < data.length) {
          console.log(`   📊 Processed ${i + batchSize}/${data.length} records...`);
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        }
      }
    }
    
  } catch (error) {
    console.log(`❌ Error migrating ${tableName}: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting Migration from Remote Supabase to Local Docker Setup');
  console.log('================================================================');
  console.log(`Remote: ${REMOTE_CONFIG.url}`);
  console.log(`Local: ${LOCAL_CONFIG.url}`);
  console.log('');

  // List of tables to migrate (from your previous setup)
  const tables = [
    'roles',
    'employees', 
    'deliverable_master',
    'notifications',
    'sales_team_members',
    'sales_performance_metrics',
    'sales_leads',
    'sales_opportunities',
    'sales_quotations',
    'sales_quotes',
    'companies',
    'clients',
    'vendors',
    'branches',
    'departments',
    'designations',
    'user_accounts',
    'aiml_chat_conversations',
    'aiml_prompt_templates'
  ];

  console.log(`📋 Tables to migrate: ${tables.length}`);
  console.log('');

  for (const table of tables) {
    await migrateTable(table);
  }

  console.log('\n🎉 Migration completed!');
  console.log('\n📍 Next steps:');
  console.log('1. Open Supabase Studio: http://localhost:8000');
  console.log('2. Login with: supabase / this_password_is_insecure_and_should_be_updated');
  console.log('3. Check your tables and data in the Table Editor');
}

if (require.main === module) {
  main().catch(console.error);
} 