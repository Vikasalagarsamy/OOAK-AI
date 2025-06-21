const { Pool } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');

// PostgreSQL configurations
const REMOTE_PG_CONFIG = {
  host: process.env.POSTGRES_REMOTE_HOST || 'remote-host',
  port: process.env.POSTGRES_REMOTE_PORT || 5432,
  database: process.env.POSTGRES_REMOTE_DATABASE || 'ooak_future',
  user: process.env.POSTGRES_REMOTE_USER || 'postgres',
  password: process.env.POSTGRES_REMOTE_PASSWORD || 'password',
  ssl: process.env.POSTGRES_REMOTE_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

const LOCAL_PG_CONFIG = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DATABASE || 'ooak_future',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

const remotePool = new Pool(REMOTE_PG_CONFIG);
const localPool = new Pool(LOCAL_PG_CONFIG);

// All tables we need to create
const ALL_TABLES = [
  'accounting_workflows', 'activities', 'ai_behavior_settings', 'ai_configurations',
  'ai_contacts', 'ai_prompt_templates', 'ai_tasks', 'analytics_metrics', 'branches',
  'call_analytics', 'call_transcriptions', 'clients', 'companies', 'deliverable_master',
  'deliverables', 'departments', 'designations', 'email_notification_templates',
  'employee_companies', 'employees', 'events', 'lead_sources', 'leads',
  'management_insights', 'menu_items', 'menu_items_tracking', 'notification_patterns',
  'notification_performance_metrics', 'notification_settings', 'notifications',
  'permissions', 'quotation_approvals', 'quotation_events', 'quotations',
  'role_menu_permissions', 'role_permissions', 'roles', 'sales_activities',
  'sales_performance_metrics', 'sales_team_members', 'services', 'users'
];

async function getTableSchema(tableName) {
  const client = await remotePool.connect();
  try {
    console.log(`🔍 Getting schema for table: ${tableName}`);
    
    // Get table structure from information_schema
    const schemaQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name = $1 
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const schemaResult = await client.query(schemaQuery, [tableName]);
    
    if (schemaResult.rows.length === 0) {
      console.log(`❌ Table ${tableName} not found in remote database`);
      return null;
    }
    
    // Get a sample record to understand the data
    const sampleQuery = `SELECT * FROM ${tableName} LIMIT 1`;
    const sampleResult = await client.query(sampleQuery);
    
    return {
      schema: schemaResult.rows,
      sample: sampleResult.rows[0] || {}
    };
    
  } catch (err) {
    console.log(`❌ Error checking table ${tableName}: ${err.message}`);
    return null;
  } finally {
    client.release();
  }
}

async function createTableInLocal(tableName, tableInfo) {
  const client = await localPool.connect();
  try {
    console.log(`🔨 Creating table structure for: ${tableName}`);
    
    if (!tableInfo || !tableInfo.schema || tableInfo.schema.length === 0) {
      console.log(`📭 Table ${tableName} schema not available, creating basic structure`);
      
      // Create a basic table structure
      const basicSQL = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
        );
      `;
      
      await client.query(basicSQL);
      console.log(`✅ Created basic table structure for ${tableName}`);
      return true;
    }
    
    // Generate CREATE TABLE statement from schema
    const columns = tableInfo.schema.map(col => {
      let columnDef = `${col.column_name}`;
      
      // Handle data types
      switch (col.data_type) {
        case 'bigint':
          if (col.column_name === 'id' && col.column_default?.includes('nextval')) {
            columnDef += ' BIGSERIAL PRIMARY KEY';
          } else {
            columnDef += ' BIGINT';
          }
          break;
        case 'integer':
          if (col.column_name === 'id' && col.column_default?.includes('nextval')) {
            columnDef += ' SERIAL PRIMARY KEY';
          } else {
            columnDef += ' INTEGER';
          }
          break;
        case 'character varying':
          if (col.character_maximum_length) {
            columnDef += ` VARCHAR(${col.character_maximum_length})`;
          } else {
            columnDef += ' TEXT';
          }
          break;
        case 'text':
          columnDef += ' TEXT';
          break;
        case 'boolean':
          columnDef += ' BOOLEAN';
          break;
        case 'timestamp with time zone':
          columnDef += ' TIMESTAMP WITH TIME ZONE';
          break;
        case 'timestamp without time zone':
          columnDef += ' TIMESTAMP';
          break;
        case 'date':
          columnDef += ' DATE';
          break;
        case 'jsonb':
          columnDef += ' JSONB';
          break;
        case 'json':
          columnDef += ' JSON';
          break;
        case 'numeric':
          if (col.numeric_precision && col.numeric_scale) {
            columnDef += ` DECIMAL(${col.numeric_precision},${col.numeric_scale})`;
          } else {
            columnDef += ' DECIMAL';
          }
          break;
        case 'uuid':
          columnDef += ' UUID';
          break;
        default:
          columnDef += ` ${col.data_type.toUpperCase()}`;
      }
      
      // Handle nullability
      if (col.is_nullable === 'NO' && !col.column_default?.includes('nextval')) {
        columnDef += ' NOT NULL';
      }
      
      // Handle defaults (excluding auto-increment)
      if (col.column_default && !col.column_default.includes('nextval')) {
        if (col.column_default.includes('now()')) {
          columnDef += ' DEFAULT TIMEZONE(\'utc\'::text, NOW())';
        } else if (col.column_default.includes('true')) {
          columnDef += ' DEFAULT true';
        } else if (col.column_default.includes('false')) {
          columnDef += ' DEFAULT false';
        } else {
          columnDef += ` DEFAULT ${col.column_default}`;
        }
      }
      
      return columnDef;
    }).join(',\n  ');
    
    const createSQL = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${columns}
      );
    `;
    
    console.log(`📝 Generated SQL for ${tableName}:`);
    console.log(createSQL);
    
    await client.query(createSQL);
    console.log(`✅ Table ${tableName} created successfully`);
    return true;
    
  } catch (error) {
    console.log(`❌ Error creating table ${tableName}: ${error.message}`);
    
    // Write to file for manual execution
    const fallbackSQL = `
      -- Failed to create ${tableName} automatically, manual creation needed
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
      );
    `;
    
    fs.appendFileSync('create_tables.sql', fallbackSQL + '\n');
    console.log(`📝 Added fallback ${tableName} to create_tables.sql`);
    return false;
  } finally {
    client.release();
  }
}

async function copyAllSchemas() {
  console.log('🚀 Starting schema copy from remote to local PostgreSQL...\n');
  
  // Test connections
  try {
    const remoteClient = await remotePool.connect();
    const localClient = await localPool.connect();
    
    await remoteClient.query('SELECT 1');
    await localClient.query('SELECT 1');
    
    remoteClient.release();
    localClient.release();
    
    console.log('✅ Both PostgreSQL connections established');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
  
  // Clear the SQL file
  fs.writeFileSync('create_tables.sql', '-- Schema creation script (PostgreSQL)\n');
  
  const results = {
    successful: [],
    failed: [],
    total: ALL_TABLES.length
  };
  
  for (const tableName of ALL_TABLES) {
    const tableInfo = await getTableSchema(tableName);
    
    if (tableInfo !== null) {
      const success = await createTableInLocal(tableName, tableInfo);
      
      if (success) {
        results.successful.push(tableName);
      } else {
        results.failed.push(tableName);
      }
    } else {
      results.failed.push(tableName);
    }
    
    // Small delay between operations
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('🎉 POSTGRESQL SCHEMA COPY COMPLETE!');
  console.log('='.repeat(80));
  console.log(`✅ Successfully processed: ${results.successful.length} tables`);
  console.log(`❌ Failed: ${results.failed.length} tables`);
  console.log(`📊 Total tables: ${results.total}`);
  
  if (results.successful.length > 0) {
    console.log('\n✅ Successfully processed tables:');
    results.successful.forEach(table => {
      console.log(`  - ${table}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed tables:');
    results.failed.forEach(table => {
      console.log(`  - ${table}`);
    });
  }
  
  console.log('\n📝 Manual SQL file created: create_tables.sql');
  console.log('🔧 If needed, run: psql -h localhost -p 5432 -U postgres -d ooak_future -f create_tables.sql');
  console.log('\n🎯 PostgreSQL migration completed!');
  
  // Close pools
  await remotePool.end();
  await localPool.end();
}

// Execute if run directly
if (require.main === module) {
  copyAllSchemas().catch(console.error);
}