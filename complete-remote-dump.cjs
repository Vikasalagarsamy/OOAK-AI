// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:38:43.926Z
// Original file backed up as: complete-remote-dump.cjs.backup


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
const { execSync } = require('child_process');
const { Pool } = require('pg'););

// Remote database connection details
const REMOTE_HOST = 'aws-0-ap-southeast-1.pooler.supabase.com';
const REMOTE_PORT = '6543';
const REMOTE_DB = 'postgres';
const REMOTE_USER = 'postgres.aavofqdzjhyfjygkxynq';
const REMOTE_PASSWORD = 'YourDBPassword123!'; // You'll need to provide this

// Local database connection details
const LOCAL_HOST = 'localhost';
const LOCAL_PORT = '54322';
const LOCAL_DB = 'postgres';
const LOCAL_USER = 'postgres';
const LOCAL_PASSWORD = 'postgres';

// Remote Supabase configuration for getting table list
const REMOTE_URL = 'https://aavofqdzjhyfjygkxynq.supabase.co';
const REMOTE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY';

// PostgreSQL connection - see pool configuration below

// List of important tables to prioritize
const IMPORTANT_TABLES = [
  'accounting_workflows', 'roles', 'employees', 'deliverable_master', 
  'notifications', 'sales_team_members', 'quotation_approvals', 
  'client_insights', 'lead_sources', 'whatsapp_config', 'companies',
  'clients', 'quotations', 'leads', 'users', 'departments', 'services'
];

async function getTablesWithData() {
  console.log('🔍 Discovering tables with data in remote database...');
  
  const tablesWithData = [];
  
  for (const table of IMPORTANT_TABLES) {
    try {
      const { data, error, count } = await remoteSupabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`⚠️ Cannot access table ${table}: ${error.message}`);
        continue;
      }
      
      if (count > 0) {
        tablesWithData.push({ table, count });
        console.log(`✅ ${table}: ${count} records`);
      } else {
        console.log(`📭 ${table}: empty`);
      }
    } catch (err) {
      console.log(`❌ Error checking table ${table}: ${err.message}`);
    }
  }
  
  return tablesWithData;
}

async function dumpTableData(tableName) {
  try {
    console.log(`📥 Dumping table: ${tableName}`);
    
    // Get all data from remote
    const { data: remoteData, error } = await remoteSupabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.log(`❌ Error fetching ${tableName}: ${error.message}`);
      return null;
    }
    
    if (!remoteData || remoteData.length === 0) {
      console.log(`📭 Table ${tableName} is empty`);
      return null;
    }
    
    // Create SQL insert statements
    const columns = Object.keys(remoteData[0]);
    const tableSql = [];
    
    for (const row of remoteData) {
      const values = columns.map(col => {
        const val = row[col];
        if (val === null) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        if (val instanceof Date) return `'${val.toISOString()}'`;
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        return val;
      });
      
      tableSql.push(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`);
    }
    
    return {
      table: tableName,
      count: remoteData.length,
      sql: tableSql.join('\n')
    };
    
  } catch (error) {
    console.log(`❌ Error dumping ${tableName}: ${error.message}`);
    return null;
  }
}

async function createCompleteDump() {
  console.log('🚀 Creating complete database dump...\n');
  
  // Get tables with data
  const tablesWithData = await getTablesWithData();
  
  if (tablesWithData.length === 0) {
    console.log('❌ No tables with data found!');
    return;
  }
  
  console.log(`\n📋 Found ${tablesWithData.length} tables with data. Creating dump...\n`);
  
  let completeSql = `-- Complete database dump from remote Supabase
-- Generated on ${new Date().toISOString()}
-- Tables with data: ${tablesWithData.map(t => `${t.table}(${t.count})`).join(', ')}

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

`;

  const results = {
    successful: [],
    failed: [],
    totalRecords: 0
  };
  
  for (const { table } of tablesWithData) {
    const tableData = await dumpTableData(table);
    
    if (tableData) {
      completeSql += `\n-- Table: ${tableData.table} (${tableData.count} records)\n`;
      completeSql += `TRUNCATE TABLE ${tableData.table} CASCADE;\n`;
      completeSql += tableData.sql + '\n\n';
      
      results.successful.push({ table: tableData.table, count: tableData.count });
      results.totalRecords += tableData.count;
    } else {
      results.failed.push(table);
    }
  }
  
  // Write to file
  const fs = require('fs');
  const dumpFile = 'complete-remote-dump.sql';
  fs.writeFileSync(dumpFile, completeSql);
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 DUMP COMPLETE!');
  console.log('='.repeat(80));
  console.log(`✅ Successfully dumped: ${results.successful.length} tables`);
  console.log(`❌ Failed: ${results.failed.length} tables`);
  console.log(`📊 Total records: ${results.totalRecords}`);
  console.log(`📄 Dump file: ${dumpFile}`);
  
  if (results.successful.length > 0) {
    console.log('\n✅ Dumped tables:');
    results.successful.forEach(({ table, count }) => {
      console.log(`  - ${table}: ${count} records`);
    });
  }
  
  console.log(`\n📝 To import this dump into your local database, run:`);
  console.log(`   psql -h ${LOCAL_HOST} -p ${LOCAL_PORT} -U ${LOCAL_USER} -d ${LOCAL_DB} -f ${dumpFile}`);
  console.log(`\n🎯 This will give you all the missing data including accounting_workflows!`);
}

// Run the dump
createCompleteDump().catch(console.error); 