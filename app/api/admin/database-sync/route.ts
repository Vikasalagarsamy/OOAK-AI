import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgresql-client';
import { Pool } from 'pg';

// Production database connection
const productionPool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: 'ooak_future_production',
  user: process.env.POSTGRES_USER || 'vikasalagarsamy',
  password: process.env.POSTGRES_PASSWORD || '',
  ssl: false,
  max: 10,
});

export async function GET() {
  try {
    console.log('🔄 Database sync status requested');
    
    return NextResponse.json({
      success: true,
      data: {
        enabled: true,
        production_db: 'ooak_future_production',
        local_db: 'ooak_future',
        status: 'active'
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Sync status failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, table } = await request.json();

    if (action === 'sync-table' && table) {
      console.log(`🔄 Manual sync requested for: ${table}`);
      
      // Get all data from local database
      const localResult = await pool.query(`SELECT * FROM ${table} ORDER BY id`);
      
      if (localResult.rows.length === 0) {
        return NextResponse.json({
          success: true,
          message: `No data to sync for ${table}`
        });
      }

      // Clear production table
      await productionPool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
      
      // Insert all data to production
      const columns = Object.keys(localResult.rows[0]);
      let syncedCount = 0;

      for (const row of localResult.rows) {
        try {
          const values = columns.map(col => row[col]);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          
          const insertQuery = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
          await productionPool.query(insertQuery, values);
          syncedCount++;
        } catch (error) {
          console.error(`❌ Failed to sync row in ${table}:`, error);
        }
      }

      console.log(`✅ Synced ${syncedCount}/${localResult.rows.length} rows for ${table}`);

      return NextResponse.json({
        success: true,
        message: `Synced ${syncedCount}/${localResult.rows.length} rows for ${table}`
      });
    }

    if (action === 'sync-all') {
      console.log('🔄 Full database sync requested...');
      
      const tables = ['companies', 'branches', 'employees', 'leads', 'clients', 'suppliers'];
      const results: Record<string, string> = {};

      for (const table of tables) {
        try {
          const localResult = await pool.query(`SELECT * FROM ${table} ORDER BY id`);
          
          if (localResult.rows.length > 0) {
            await productionPool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
            
            const columns = Object.keys(localResult.rows[0]);
            let syncedCount = 0;

            for (const row of localResult.rows) {
              try {
                const values = columns.map(col => row[col]);
                const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                
                const insertQuery = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
                await productionPool.query(insertQuery, values);
                syncedCount++;
              } catch (error) {
                console.error(`❌ Failed to sync row in ${table}:`, error);
              }
            }
            
            results[table] = `${syncedCount}/${localResult.rows.length} rows`;
          } else {
            results[table] = '0 rows (empty table)';
          }
        } catch (error) {
          console.error(`❌ Failed to sync ${table}:`, error);
          results[table] = 'Error';
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Full database sync completed',
        results
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Database sync action error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to perform sync action'
    }, { status: 500 });
  }
} 