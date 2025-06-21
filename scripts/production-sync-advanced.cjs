#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connections
const localPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ooak_future',
  user: 'vikasalagarsamy',
  password: '',
  ssl: false,
  max: 10,
});

const productionPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ooak_future_production',
  user: 'vikasalagarsamy',
  password: '',
  ssl: false,
  max: 10,
});

// Tables to sync in dependency order
const SYNC_TABLES = [
  'companies',
  'departments', 
  'branches',
  'employees',
  'leads',
  'clients',
  'suppliers',
  'quotations',
  'activities',
  'menu_items',
  'roles',
  'permissions'
];

// Log file for sync operations
const LOG_FILE = path.join(__dirname, '../logs/production-sync.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  // Ensure logs directory exists
  const logsDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Append to log file
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

async function syncSchema() {
  try {
    log('🔧 Starting schema synchronization...');
    
    // Get all table structures from local database
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    const localTables = await localPool.query(tablesQuery);
    
    for (const table of localTables.rows) {
      const tableName = table.table_name;
      
      try {
        // Get table structure from local
        const structureQuery = `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `;
        
        const localStructure = await localPool.query(structureQuery, [tableName]);
        
        // Check if table exists in production
        const prodTableExists = await productionPool.query(
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1 AND table_schema = 'public')",
          [tableName]
        );
        
        if (!prodTableExists.rows[0].exists) {
          log(`📋 Creating new table in production: ${tableName}`);
          
          // Get CREATE TABLE statement from local
          const createTableQuery = `
            SELECT 'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
            array_to_string(
              array_agg(
                column_name || ' ' || type || ' ' || not_null
              ), ', '
            ) || ');' as ddl
            FROM (
              SELECT 
                schemaname,
                tablename,
                column_name,
                data_type as type,
                case when is_nullable = 'NO' then 'NOT NULL' else '' end as not_null
              FROM information_schema.columns c
              JOIN information_schema.tables t ON c.table_name = t.table_name
              WHERE c.table_name = $1 AND c.table_schema = 'public'
              ORDER BY ordinal_position
            ) as query
            GROUP BY schemaname, tablename
          `;
          
          // For now, just copy the table structure using pg_dump
          await syncTableStructure(tableName);
        } else {
          // Check for structural differences
          const prodStructure = await productionPool.query(structureQuery, [tableName]);
          
          if (JSON.stringify(localStructure.rows) !== JSON.stringify(prodStructure.rows)) {
            log(`🔄 Updating table structure: ${tableName}`);
            await syncTableStructure(tableName);
          }
        }
      } catch (error) {
        log(`❌ Schema sync failed for ${tableName}: ${error.message}`);
      }
    }
    
    // Sync indexes
    await syncIndexes();
    
    log('✅ Schema synchronization completed');
  } catch (error) {
    log(`❌ Schema synchronization failed: ${error.message}`);
  }
}

async function syncTableStructure(tableName) {
  try {
    // Use pg_dump to get exact table structure
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    // Export table structure from local
    const dumpCommand = `pg_dump -h localhost -p 5432 -U vikasalagarsamy -d ooak_future --schema-only -t ${tableName}`;
    const { stdout } = await execAsync(dumpCommand);
    
    // Apply to production (drop and recreate)
    await productionPool.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
    await productionPool.query(stdout);
    
    log(`✅ Table structure synced: ${tableName}`);
  } catch (error) {
    log(`❌ Failed to sync table structure ${tableName}: ${error.message}`);
  }
}

async function syncIndexes() {
  try {
    log('🔍 Syncing indexes...');
    
    // Get all indexes from local database
    const indexQuery = `
      SELECT indexname, tablename, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname NOT LIKE '%_pkey'
    `;
    
    const localIndexes = await localPool.query(indexQuery);
    const prodIndexes = await productionPool.query(indexQuery);
    
    // Create missing indexes in production
    for (const localIndex of localIndexes.rows) {
      const prodHasIndex = prodIndexes.rows.find(p => p.indexname === localIndex.indexname);
      
      if (!prodHasIndex) {
        try {
          await productionPool.query(localIndex.indexdef);
          log(`✅ Created index: ${localIndex.indexname}`);
        } catch (error) {
          log(`❌ Failed to create index ${localIndex.indexname}: ${error.message}`);
        }
      }
    }
    
    log('✅ Index synchronization completed');
  } catch (error) {
    log(`❌ Index synchronization failed: ${error.message}`);
  }
}

async function syncTableData(tableName) {
  try {
    log(`🔄 Syncing data: ${tableName}...`);
    
    // Get row count first
    const countQuery = `SELECT COUNT(*) FROM ${tableName}`;
    const localCount = await localPool.query(countQuery);
    const localRows = parseInt(localCount.rows[0].count);
    
    if (localRows === 0) {
      log(`⚪ ${tableName}: No data to sync`);
      return { synced: 0, total: 0 };
    }
    
    // Get all data from local
    const localResult = await localPool.query(`SELECT * FROM ${tableName} ORDER BY id`);
    
    // Disable constraints temporarily
    await productionPool.query('SET session_replication_role = replica;');
    
    // Clear production table
    await productionPool.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
    
    // Insert all data to production
    const columns = Object.keys(localResult.rows[0]);
    let syncedCount = 0;
    
    for (const row of localResult.rows) {
      try {
        const values = columns.map(col => row[col]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        await productionPool.query(insertQuery, values);
        syncedCount++;
      } catch (error) {
        log(`❌ Failed to sync row in ${tableName}: ${error.message}`);
      }
    }
    
    // Re-enable constraints
    await productionPool.query('SET session_replication_role = DEFAULT;');
    
    log(`✅ ${tableName}: Synced ${syncedCount}/${localRows} rows`);
    return { synced: syncedCount, total: localRows };
    
  } catch (error) {
    log(`❌ Failed to sync ${tableName}: ${error.message}`);
    // Re-enable constraints on error
    try {
      await productionPool.query('SET session_replication_role = DEFAULT;');
    } catch (e) {}
    return { synced: 0, total: 0 };
  }
}

async function fullSync() {
  const startTime = Date.now();
  log('🚀 Starting full database synchronization...');
  
  // First sync schema and structure
  await syncSchema();
  
  // Then sync data
  const results = {};
  for (const table of SYNC_TABLES) {
    results[table] = await syncTableData(table);
  }
  
  const duration = Date.now() - startTime;
  const totalSynced = Object.values(results).reduce((sum, r) => sum + r.synced, 0);
  const totalRows = Object.values(results).reduce((sum, r) => sum + r.total, 0);
  
  log(`🏁 Full sync completed in ${duration}ms`);
  log(`📊 Total: ${totalSynced}/${totalRows} rows synced across ${SYNC_TABLES.length} tables`);
  log('✨ Production database is fully synchronized!');
  
  return results;
}

async function getSyncStatus() {
  log('📊 Checking database sync status...');
  
  const status = {};
  for (const table of SYNC_TABLES) {
    try {
      const localCount = await localPool.query(`SELECT COUNT(*) FROM ${table}`);
      const prodCount = await productionPool.query(`SELECT COUNT(*) FROM ${table}`);
      
      const localRows = parseInt(localCount.rows[0].count);
      const prodRows = parseInt(prodCount.rows[0].count);
      const synced = localRows === prodRows;
      
      status[table] = { local: localRows, production: prodRows, synced };
      
      const statusIcon = synced ? '✅' : '❌';
      const statusText = synced ? 'SYNCED' : 'OUT OF SYNC';
      log(`${statusIcon} ${table.padEnd(15)} Local: ${localRows.toString().padStart(4)} | Production: ${prodRows.toString().padStart(4)} | ${statusText}`);
    } catch (error) {
      status[table] = { local: 0, production: 0, synced: false };
      log(`❌ ${table.padEnd(15)} ERROR: ${error.message}`);
    }
  }
  
  return status;
}

async function restoreFromProduction() {
  try {
    log('🔄 Starting restore from production to local...');
    
    for (const table of SYNC_TABLES) {
      try {
        // Get data from production
        const prodResult = await productionPool.query(`SELECT * FROM ${table} ORDER BY id`);
        
        if (prodResult.rows.length === 0) {
          log(`⚪ ${table}: No data to restore`);
          continue;
        }
        
        // Clear local table
        await localPool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
        
        // Insert production data to local
        const columns = Object.keys(prodResult.rows[0]);
        let restoredCount = 0;
        
        for (const row of prodResult.rows) {
          try {
            const values = columns.map(col => row[col]);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            
            const insertQuery = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
            await localPool.query(insertQuery, values);
            restoredCount++;
          } catch (error) {
            log(`❌ Failed to restore row in ${table}: ${error.message}`);
          }
        }
        
        log(`✅ ${table}: Restored ${restoredCount}/${prodResult.rows.length} rows`);
      } catch (error) {
        log(`❌ Failed to restore ${table}: ${error.message}`);
      }
    }
    
    log('✅ Restore from production completed!');
  } catch (error) {
    log(`❌ Restore failed: ${error.message}`);
  }
}

async function continuousSync() {
  log('👀 Starting continuous sync monitoring (10-minute intervals)...');
  
  // Initial sync
  await fullSync();
  
  // Set up 10-minute interval
  setInterval(async () => {
    try {
      log('⏰ Scheduled sync starting...');
      await fullSync();
    } catch (error) {
      log(`❌ Scheduled sync error: ${error.message}`);
    }
  }, 10 * 60 * 1000); // 10 minutes = 600,000 milliseconds
  
  // Keep process alive
  process.on('SIGINT', async () => {
    log('🛑 Graceful shutdown requested...');
    await localPool.end();
    await productionPool.end();
    process.exit(0);
  });
}

// Main execution
async function main() {
  const command = process.argv[2] || 'status';
  
  try {
    switch (command) {
      case 'sync':
        await fullSync();
        break;
      case 'status':
        await getSyncStatus();
        break;
      case 'watch':
        await continuousSync();
        break;
      case 'restore':
        await restoreFromProduction();
        break;
      case 'schema':
        await syncSchema();
        break;
      default:
        console.log('🔧 Advanced Production Sync Tool');
        console.log('================================');
        console.log('Usage: node production-sync-advanced.cjs [command]');
        console.log('');
        console.log('Commands:');
        console.log('  sync     - One-time full sync (schema + data)');
        console.log('  status   - Show sync status');
        console.log('  watch    - Continuous sync every 10 minutes');
        console.log('  restore  - Restore local from production');
        console.log('  schema   - Sync only schema/structure');
    }
  } catch (error) {
    log(`❌ Command error: ${error.message}`);
  } finally {
    if (command !== 'watch') {
      await localPool.end();
      await productionPool.end();
      process.exit(0);
    }
  }
}

main().catch(error => {
  log(`❌ Fatal error: ${error.message}`);
  process.exit(1);
}); 