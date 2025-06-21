#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

const REMOTE_CONFIG = {
  url: 'https://aavofqdzjhyfjygkxynq.supabase.co',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY'
};

async function fetchDataFromRemote(tableName) {
  console.log(`📥 Fetching data from ${tableName}...`);
  const fetch = (await import('node-fetch')).default;
  
  try {
    const response = await fetch(`${REMOTE_CONFIG.url}/rest/v1/${tableName}`, {
      headers: {
        'apikey': REMOTE_CONFIG.serviceKey,
        'Authorization': `Bearer ${REMOTE_CONFIG.serviceKey}`
      }
    });
    
    if (!response.ok) {
      console.log(`❌ ${tableName}: HTTP ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    console.log(`✅ ${tableName}: ${data.length} records`);
    return data;
    
  } catch (error) {
    console.log(`❌ ${tableName}: ${error.message}`);
    return [];
  }
}

function generateInsertSQL(tableName, data) {
  if (!data || data.length === 0) return '';
  
  const columns = Object.keys(data[0]);
  const values = data.map(row => {
    const rowValues = columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      return value;
    });
    return `(${rowValues.join(', ')})`;
  });
  
  return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n${values.join(',\n')};\n\n`;
}

async function insertDataDirectly(tableName) {
  console.log(`\n🔄 Processing ${tableName}...`);
  
  const data = await fetchDataFromRemote(tableName);
  if (data.length === 0) return;
  
  const sql = generateInsertSQL(tableName, data);
  const filename = `insert_${tableName}.sql`;
  
  fs.writeFileSync(filename, sql);
  
  try {
    console.log(`📤 Inserting ${data.length} records into ${tableName}...`);
    execSync(`docker exec -i supabase-db psql -U postgres -d postgres -f - < ${filename}`, 
      { stdio: 'inherit' });
    console.log(`✅ Successfully inserted data into ${tableName}`);
    
    // Clean up
    fs.unlinkSync(filename);
    
  } catch (error) {
    console.log(`❌ Error inserting into ${tableName}: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 DIRECT DATA INSERTION');
  console.log('========================');
  
  const priorityTables = [
    'roles',
    'employees', 
    'companies',
    'clients',
    'vendors',
    'branches',
    'departments',
    'designations',
    'deliverable_master',
    'notifications',
    'user_accounts',
    'sales_team_members',
    'quotations',
    'activities',
    'call_analytics'
  ];

  for (const table of priorityTables) {
    await insertDataDirectly(table);
  }

  console.log('\n🎉 DATA INSERTION COMPLETED!');
  console.log('============================');
  console.log('');
  console.log('📍 Open Supabase Studio: http://localhost:8000');
  console.log('🔑 Login: supabase / this_password_is_insecure_and_should_be_updated');
  console.log('📊 Check your tables - they should now have data!');
}

if (require.main === module) {
  main().catch(console.error);
} 