#!/usr/bin/env node

const { Pool } = require('pg');

// Database connections
const localPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ooak_future',
  user: 'vikasalagarsamy',
  password: '',
  ssl: false,
});

const productionPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ooak_future_production',
  user: 'vikasalagarsamy',
  password: '',
  ssl: false,
});

// Sync tables in dependency order (parent tables first)
const SYNC_TABLES = [
  'companies',
  'departments',
  'branches', 
  'employees',
  'leads',
  'clients',
  'suppliers',
  'quotations'
];

async function syncTable(tableName) {
  try {
    console.log(`🔄 Syncing ${tableName}...`);
    
    // Get all data from local
    const localResult = await localPool.query(`SELECT * FROM ${tableName} ORDER BY id`);
    
    if (localResult.rows.length === 0) {
      console.log(`⚪ ${tableName}: No data to sync`);
      return;
    }

    // Clear production table (disable constraints temporarily)
    await productionPool.query(`SET session_replication_role = replica;`);
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
        console.error(`❌ Failed to sync row in ${tableName}:`, error.message);
      }
    }

    // Re-enable constraints
    await productionPool.query(`SET session_replication_role = DEFAULT;`);

    console.log(`✅ ${tableName}: Synced ${syncedCount}/${localResult.rows.length} rows`);
    
  } catch (error) {
    console.error(`❌ Failed to sync ${tableName}:`, error.message);
    // Re-enable constraints on error
    try {
      await productionPool.query(`SET session_replication_role = DEFAULT;`);
    } catch (e) {}
  }
}

async function fullSync() {
  const startTime = Date.now();
  console.log('🚀 Starting full database sync...');
  console.log(`📅 ${new Date().toISOString()}`);
  
  for (const table of SYNC_TABLES) {
    await syncTable(table);
  }
  
  const duration = Date.now() - startTime;
  console.log(`🏁 Full sync completed in ${duration}ms`);
  console.log('✨ Production database is now up to date!');
}

async function getSyncStatus() {
  console.log('📊 Database Sync Status:');
  console.log('========================');
  
  for (const table of SYNC_TABLES) {
    try {
      const localCount = await localPool.query(`SELECT COUNT(*) FROM ${table}`);
      const prodCount = await productionPool.query(`SELECT COUNT(*) FROM ${table}`);
      
      const localRows = parseInt(localCount.rows[0].count);
      const prodRows = parseInt(prodCount.rows[0].count);
      const synced = localRows === prodRows;
      
      console.log(`${synced ? '✅' : '❌'} ${table.padEnd(15)} Local: ${localRows.toString().padStart(4)} | Production: ${prodRows.toString().padStart(4)} | ${synced ? 'SYNCED' : 'OUT OF SYNC'}`);
    } catch (error) {
      console.log(`❌ ${table.padEnd(15)} ERROR: ${error.message}`);
    }
  }
}

async function watchAndSync() {
  console.log('👀 Starting continuous sync monitoring...');
  
  setInterval(async () => {
    try {
      await fullSync();
    } catch (error) {
      console.error('❌ Auto-sync error:', error.message);
    }
  }, 30000); // Sync every 30 seconds
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
        await getSyncStatus();
        await fullSync();
        await watchAndSync();
        break;
      default:
        console.log('Usage: node auto-sync-production.js [sync|status|watch]');
        console.log('  sync   - Perform one-time full sync');
        console.log('  status - Show sync status');
        console.log('  watch  - Continuous sync every 30 seconds');
    }
  } catch (error) {
    console.error('❌ Script error:', error.message);
  } finally {
    if (command !== 'watch') {
      await localPool.end();
      await productionPool.end();
      process.exit(0);
    }
  }
}

main().catch(console.error); 