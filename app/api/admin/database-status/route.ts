import { NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Test basic connectivity with PostgreSQL
    const client = await pool.connect()
    let connectionTime = 0
    
    try {
      const connectionTestQuery = 'SELECT COUNT(*) FROM companies LIMIT 1'
      await client.query(connectionTestQuery)
      connectionTime = Date.now() - startTime
      
    } finally {
      client.release()
    }

    // Get comprehensive database statistics
    const tableStats = await getTableStatistics()
    
    // Get foreign key status
    const fkStatus = await getForeignKeyStatus()
    
    // Get database schema info
    const schemaInfo = await getSchemaInfo()
    
    // Get recent activity
    const recentActivity = await getRecentActivity()
    
    // Get PostgreSQL specific metrics
    const pgMetrics = await getPostgreSQLMetrics()

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      connection: {
        status: 'connected',
        responseTime: `${connectionTime}ms`,
        environment: process.env.NODE_ENV || 'development',
        database: 'PostgreSQL localhost:5432'
      },
      tables: tableStats,
      foreignKeys: fkStatus,
      schema: schemaInfo,
      recentActivity,
      postgresql: pgMetrics,
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      },
      metadata: {
        source: "Direct PostgreSQL Admin",
        migrationPhase: "Phase 4.1",
        lastCheck: new Date().toISOString()
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Database monitoring failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function getTableStatistics() {
  try {
    const client = await pool.connect()
    
    try {
      // Core business tables
      const tables = [
        'companies', 'employees', 'departments', 'leads', 'quotations', 
        'notifications', 'user_accounts', 'roles', 'permissions',
        'call_transcriptions', 'call_analytics', 'tasks', 'branches'
      ]
      
      const stats = await Promise.all(
        tables.map(async (table) => {
          try {
            const countQuery = `SELECT COUNT(*) as count FROM ${table}`
            const result = await client.query(countQuery)
            const count = parseInt(result.rows[0].count)
            
            // Get table size information
            const sizeQuery = `
              SELECT 
                pg_size_pretty(pg_total_relation_size($1)) as total_size,
                pg_size_pretty(pg_relation_size($1)) as table_size
            `
            const sizeResult = await client.query(sizeQuery, [table])
            
            return {
              name: table,
              count: count,
              status: 'healthy',
              totalSize: sizeResult.rows[0]?.total_size || 'Unknown',
              tableSize: sizeResult.rows[0]?.table_size || 'Unknown'
            }
          } catch (err: any) {
            return {
              name: table,
              count: 0,
              status: 'error',
              error: err.message,
              totalSize: 'N/A',
              tableSize: 'N/A'
            }
          }
        })
      )
      
      return stats
    } finally {
      client.release()
    }
  } catch (error) {
    return []
  }
}

async function getForeignKeyStatus() {
  try {
    const client = await pool.connect()
    
    try {
      // Check foreign key constraints
      const fkQuery = `
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
        ORDER BY tc.table_name
      `
      
      const result = await client.query(fkQuery)
      
      return {
        status: 'healthy',
        message: `Found ${result.rows.length} foreign key constraints`,
        constraintCount: result.rows.length,
        constraints: result.rows.slice(0, 5), // Show first 5 as sample
        lastChecked: new Date().toISOString()
      }
    } finally {
      client.release()
    }
  } catch (error: any) {
    return {
      status: 'error',
      message: 'FK validation failed',
      error: error.message
    }
  }
}

async function getSchemaInfo() {
  try {
    const client = await pool.connect()
    
    try {
      // Get all tables in public schema
      const tablesQuery = `
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `
      
      const tablesResult = await client.query(tablesQuery)
      
      // Get database size
      const dbSizeQuery = `
        SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
      `
      
      const dbSizeResult = await client.query(dbSizeQuery)
      
      return {
        tableCount: tablesResult.rows.length,
        schemas: ['public', 'information_schema', 'pg_catalog'],
        databaseSize: dbSizeResult.rows[0]?.database_size || 'Unknown',
        tables: tablesResult.rows.map(r => r.table_name),
        lastUpdate: new Date().toISOString()
      }
    } finally {
      client.release()
    }
  } catch (error) {
    return { 
      tableCount: 0, 
      schemas: [],
      databaseSize: 'Unknown',
      tables: []
    }
  }
}

async function getRecentActivity() {
  try {
    const client = await pool.connect()
    
    try {
      // Get recent quotations
      const quotationsQuery = `
        SELECT id, created_at, status, client_name, total_amount
        FROM quotations 
        ORDER BY created_at DESC 
        LIMIT 5
      `
      const quotationsResult = await client.query(quotationsQuery)
      
      // Get recent leads
      const leadsQuery = `
        SELECT id, created_at, status, name, phone 
        FROM leads 
        ORDER BY created_at DESC 
        LIMIT 5
      `
      const leadsResult = await client.query(leadsQuery)
      
      // Get recent employees
      const employeesQuery = `
        SELECT id, employee_id, first_name, last_name, created_at
        FROM employees 
        ORDER BY created_at DESC 
        LIMIT 3
      `
      const employeesResult = await client.query(employeesQuery)
      
      return {
        recentQuotations: quotationsResult.rows || [],
        recentLeads: leadsResult.rows || [],
        recentEmployees: employeesResult.rows || [],
        lastActivity: new Date().toISOString()
      }
    } finally {
      client.release()
    }
  } catch (error) {
    return {
      recentQuotations: [],
      recentLeads: [],
      recentEmployees: [],
      lastActivity: null
    }
  }
}

async function getPostgreSQLMetrics() {
  try {
    const client = await pool.connect()
    
    try {
      // Get PostgreSQL version and basic metrics
      const versionQuery = 'SELECT version()'
      const versionResult = await client.query(versionQuery)
      
      // Get active connections
      const connectionsQuery = `
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `
      const connectionsResult = await client.query(connectionsQuery)
      
      // Get database statistics
      const statsQuery = `
        SELECT 
          numbackends as connections,
          xact_commit as transactions_committed,
          xact_rollback as transactions_rolled_back,
          blks_read as blocks_read,
          blks_hit as blocks_hit
        FROM pg_stat_database 
        WHERE datname = current_database()
      `
      const statsResult = await client.query(statsQuery)
      
      return {
        version: versionResult.rows[0]?.version || 'Unknown',
        activeConnections: parseInt(connectionsResult.rows[0]?.active_connections || '0'),
        statistics: statsResult.rows[0] || {},
        poolStatus: {
          totalConnections: pool.totalCount,
          idleConnections: pool.idleCount,
          waitingConnections: pool.waitingCount
        }
      }
    } finally {
      client.release()
    }
  } catch (error) {
    return {
      version: 'Unknown',
      activeConnections: 0,
      statistics: {},
      poolStatus: {}
    }
  }
} 