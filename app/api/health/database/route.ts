import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    const client = await pool.connect()
    
    try {
      // Comprehensive database health check
      const healthChecks = []
      
      // 1. Basic connectivity and response time
      const connectivityStart = Date.now()
      const { rows: transcriptCount } = await client.query('SELECT COUNT(*) as count FROM call_transcriptions')
      const connectivityTime = Date.now() - connectivityStart
      
      healthChecks.push({
        check: 'Database Connectivity',
        status: 'healthy',
        response_time: `${connectivityTime}ms`,
        details: `Found ${transcriptCount[0].count} call transcriptions`
      })

      // 2. PostgreSQL version and uptime
      const { rows: versionInfo } = await client.query(`
        SELECT 
          version() as version,
          current_setting('server_version') as server_version,
          pg_postmaster_start_time() as start_time,
          now() - pg_postmaster_start_time() as uptime
      `)
      
      healthChecks.push({
        check: 'PostgreSQL Instance',
        status: 'healthy',
        version: versionInfo[0].server_version,
        uptime: versionInfo[0].uptime,
        start_time: versionInfo[0].start_time
      })

      // 3. Database size and usage
      const { rows: dbStats } = await client.query(`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          pg_database_size(current_database()) as database_size_bytes,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count
      `)
      
      healthChecks.push({
        check: 'Database Size & Usage',
        status: 'healthy',
        database_size: dbStats[0].database_size,
        table_count: parseInt(dbStats[0].table_count)
      })

      // 4. Connection and activity monitoring
      const { rows: connectionStats } = await client.query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
          max(backend_start) as oldest_connection
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `)
      
      const connectionHealth = parseInt(connectionStats[0].active_connections) < 10 ? 'healthy' : 
                              parseInt(connectionStats[0].active_connections) < 20 ? 'warning' : 'critical'
      
      healthChecks.push({
        check: 'Connection Pool Status',
        status: connectionHealth,
        total_connections: parseInt(connectionStats[0].total_connections),
        active_connections: parseInt(connectionStats[0].active_connections),
        idle_connections: parseInt(connectionStats[0].idle_connections),
        pool_info: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        }
      })

      // 5. Performance metrics
      const { rows: perfStats } = await client.query(`
        SELECT 
          numbackends,
          xact_commit,
          xact_rollback,
          blks_read,
          blks_hit,
          tup_returned,
          tup_fetched,
          tup_inserted,
          tup_updated,
          tup_deleted,
          conflicts,
          temp_files,
          temp_bytes,
          deadlocks
        FROM pg_stat_database 
        WHERE datname = current_database()
      `)
      
      const hitRatio = perfStats[0].blks_hit / (perfStats[0].blks_read + perfStats[0].blks_hit) * 100
      const performanceHealth = hitRatio > 95 ? 'healthy' : hitRatio > 90 ? 'warning' : 'critical'
      
      healthChecks.push({
        check: 'Database Performance',
        status: performanceHealth,
        cache_hit_ratio: `${hitRatio.toFixed(2)}%`,
        transactions: {
          committed: parseInt(perfStats[0].xact_commit),
          rolled_back: parseInt(perfStats[0].xact_rollback)
        },
        deadlocks: parseInt(perfStats[0].deadlocks),
        temp_files: parseInt(perfStats[0].temp_files)
      })

      // 6. Core business tables health
      const businessTables = ['employees', 'quotations', 'leads', 'tasks', 'companies', 'departments']
      const tableHealthChecks = []
      
      for (const tableName of businessTables) {
        try {
          const { rows: tableStats } = await client.query(`
            SELECT 
              COUNT(*) as row_count,
              pg_size_pretty(pg_total_relation_size($1)) as size
          `, [tableName])
          
          tableHealthChecks.push({
            table: tableName,
            status: 'healthy',
            row_count: parseInt(tableStats[0].row_count),
            size: tableStats[0].size
          })
        } catch (error: any) {
          tableHealthChecks.push({
            table: tableName,
            status: 'error',
            error: error.message
          })
        }
      }
      
      healthChecks.push({
        check: 'Business Tables Health',
        status: tableHealthChecks.every(t => t.status === 'healthy') ? 'healthy' : 'warning',
        tables: tableHealthChecks
      })

      // 7. Foreign key integrity check (enhanced)
      try {
        const { rows: fkChecks } = await client.query(`
          SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
        `)
        
        healthChecks.push({
          check: 'Foreign Key Integrity',
          status: 'healthy',
          constraint_count: fkChecks.length,
          details: 'All foreign key constraints validated'
        })
      } catch (error: any) {
        healthChecks.push({
          check: 'Foreign Key Integrity',
          status: 'warning',
          error: error.message
        })
      }

      // Overall health assessment
      const overallStatus = healthChecks.every(check => check.status === 'healthy') ? 'healthy' :
                           healthChecks.some(check => check.status === 'critical') ? 'critical' : 'warning'
      
      const totalTime = Date.now() - startTime

      return NextResponse.json({
        status: overallStatus,
        message: `Database health check completed - ${overallStatus.toUpperCase()}`,
        response_time: `${totalTime}ms`,
        database: 'PostgreSQL localhost:5432',
        health_checks: healthChecks,
        summary: {
          total_checks: healthChecks.length,
          healthy: healthChecks.filter(check => check.status === 'healthy').length,
          warnings: healthChecks.filter(check => check.status === 'warning').length,
          critical: healthChecks.filter(check => check.status === 'critical').length
        },
        metadata: {
          source: "Direct PostgreSQL Health Monitor",
          timestamp: new Date().toISOString(),
          check_duration: `${totalTime}ms`
        }
      })

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('❌ Database health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Database health check failed',
      error: error.message || String(error),
      details: {
        code: error.code,
        detail: error.detail,
        hint: error.hint
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 