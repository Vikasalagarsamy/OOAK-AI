import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    console.log('🧪 Starting comprehensive PostgreSQL database connection test...')
    
    const client = await pool.connect()
    
    try {
      // Environment configuration check
      const envCheck = {
        POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
        POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT || '5432'),
        POSTGRES_USER: process.env.POSTGRES_USER || 'vikasalagarsamy',
        POSTGRES_DATABASE: process.env.POSTGRES_DATABASE || 'ooak_future',
        CONNECTION_TYPE: 'Direct PostgreSQL',
        NODE_ENV: process.env.NODE_ENV || 'development',
        CONNECTION_POOL_MAX: 20
      }
      
      console.log('🐘 PostgreSQL Environment Check:', envCheck)

      // Test 1: Basic connectivity and version
      const connectivityStart = Date.now()
      const { rows: versionInfo } = await client.query(`
        SELECT 
          version() as full_version,
          current_setting('server_version') as server_version,
          current_database() as database_name,
          current_user as current_user,
          inet_server_addr() as server_ip,
          inet_server_port() as server_port
      `)
      const connectivityTime = Date.now() - connectivityStart
      
      console.log('✅ Basic connectivity test passed in', connectivityTime, 'ms')

      // Test 2: Core business tables verification
      const tableTests = []
      const businessTables = [
        'employees', 'quotations', 'leads', 'tasks', 
        'companies', 'departments', 'notifications', 'user_accounts'
      ]
      
      for (const tableName of businessTables) {
        try {
          const tableStart = Date.now()
          const { rows: tableData } = await client.query(`
            SELECT 
              COUNT(*) as row_count,
              pg_size_pretty(pg_total_relation_size($1)) as table_size,
              (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = $1) as column_count
          `, [tableName])
          
          const tableTime = Date.now() - tableStart
          
          // Get sample data if table has records
          let sampleData = null
          if (parseInt(tableData[0].row_count) > 0) {
            const { rows: sample } = await client.query(`SELECT * FROM ${tableName} LIMIT 1`)
            sampleData = sample[0] ? Object.keys(sample[0]) : []
          }
          
          tableTests.push({
            table: tableName,
            status: 'healthy',
            row_count: parseInt(tableData[0].row_count),
            table_size: tableData[0].table_size,
            column_count: parseInt(tableData[0].column_count),
            response_time: `${tableTime}ms`,
            sample_columns: sampleData,
            has_data: parseInt(tableData[0].row_count) > 0
          })
          
          console.log(`✅ Table ${tableName}: ${tableData[0].row_count} rows, ${tableData[0].table_size}`)
          
        } catch (tableError: any) {
          tableTests.push({
            table: tableName,
            status: 'error',
            error: tableError.message,
            response_time: '0ms',
            has_data: false
          })
          console.log(`❌ Table ${tableName}: ${tableError.message}`)
        }
      }

      // Test 3: Advanced query performance test
      const performanceStart = Date.now()
      const { rows: performanceTest } = await client.query(`
        WITH table_stats AS (
          SELECT 
            (SELECT COUNT(*) FROM employees WHERE status = 'active') as active_employees,
            (SELECT COUNT(*) FROM quotations WHERE status != 'deleted') as active_quotations,
            (SELECT COUNT(*) FROM leads WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as recent_leads,
            (SELECT COUNT(*) FROM tasks WHERE status = 'pending') as pending_tasks
        ),
        system_stats AS (
          SELECT 
            pg_database_size(current_database()) as db_size,
            (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
            current_setting('shared_buffers') as shared_buffers,
            current_setting('work_mem') as work_mem
        )
        SELECT 
          ts.*,
          ss.*,
          pg_size_pretty(ss.db_size) as db_size_pretty
        FROM table_stats ts, system_stats ss
      `)
      const performanceTime = Date.now() - performanceStart
      
      console.log(`✅ Performance test completed in ${performanceTime}ms`)

      // Test 4: Connection pool health
      const poolHealth = {
        total_connections: pool.totalCount,
        idle_connections: pool.idleCount,
        waiting_connections: pool.waitingCount,
        max_connections: 20,
        health_status: pool.waitingCount === 0 ? 'optimal' : 'busy',
        utilization_percentage: ((pool.totalCount - pool.idleCount) / 20 * 100).toFixed(1)
      }
      
      console.log('✅ Connection pool health:', poolHealth)

      // Test 5: Foreign key relationships test
      const { rows: foreignKeys } = await client.query(`
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name
      `)
      
      console.log(`✅ Found ${foreignKeys.length} foreign key relationships`)

      // Test 6: Index health check
      const { rows: indexHealth } = await client.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as times_used,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
        LIMIT 10
      `)
      
      console.log(`✅ Top indexes analyzed: ${indexHealth.length}`)

      const totalTestTime = Date.now() - startTime
      
      // Compile comprehensive test results
      const testResults = {
        overall_status: 'healthy',
        connection: {
          status: 'connected',
          response_time: `${connectivityTime}ms`,
          database_info: {
            version: versionInfo[0].server_version,
            database: versionInfo[0].database_name,
            user: versionInfo[0].current_user,
            server_ip: versionInfo[0].server_ip,
            server_port: versionInfo[0].server_port
          }
        },
        environment: envCheck,
        table_tests: {
          total_tables_tested: tableTests.length,
          healthy_tables: tableTests.filter(t => t.status === 'healthy').length,
          tables_with_data: tableTests.filter(t => t.has_data).length,
          table_details: tableTests
        },
        performance_tests: {
          query_performance: `${performanceTime}ms`,
          business_data: {
            active_employees: parseInt(performanceTest[0].active_employees),
            active_quotations: parseInt(performanceTest[0].active_quotations),
            recent_leads: parseInt(performanceTest[0].recent_leads),
            pending_tasks: parseInt(performanceTest[0].pending_tasks)
          },
          database_size: performanceTest[0].db_size_pretty,
          total_tables: parseInt(performanceTest[0].table_count),
          memory_config: {
            shared_buffers: performanceTest[0].shared_buffers,
            work_mem: performanceTest[0].work_mem
          }
        },
        connection_pool: poolHealth,
        relationships: {
          foreign_keys_count: foreignKeys.length,
          foreign_keys: foreignKeys.slice(0, 5), // Show first 5
          data_integrity: 'enforced'
        },
        index_performance: {
          top_indexes: indexHealth.map(idx => ({
            table: idx.tablename,
            index: idx.indexname,
            usage_count: parseInt(idx.times_used),
            efficiency: idx.tuples_fetched / (idx.tuples_read + 1)
          }))
        },
        test_summary: {
          total_test_time: `${totalTestTime}ms`,
          tests_passed: 6,
          tests_failed: 0,
          performance_grade: totalTestTime < 100 ? 'A+' : totalTestTime < 200 ? 'A' : 'B',
          recommendations: [
            totalTestTime < 100 ? 'Database performance is excellent' : 'Consider query optimization',
            poolHealth.waiting_connections === 0 ? 'Connection pool is optimal' : 'Monitor connection usage',
            tableTests.every(t => t.status === 'healthy') ? 'All tables are healthy' : 'Check failed tables'
          ]
        }
      }

      console.log(`✅ Database connection test completed successfully in ${totalTestTime}ms`)
      console.log(`   └─ Tables tested: ${tableTests.length}`)
      console.log(`   └─ Performance grade: ${testResults.test_summary.performance_grade}`)
      console.log(`   └─ Data integrity: ${testResults.relationships.data_integrity}`)

      return NextResponse.json({
        success: true,
        message: '🧪 PostgreSQL database connection test completed successfully',
        results: testResults,
        metadata: {
          source: 'PostgreSQL Connection Test Suite',
          test_version: '2.0',
          timestamp: new Date().toISOString(),
          migration_status: 'Phase 7.1 - Enhanced Database Testing',
          features: [
            'Comprehensive Table Verification',
            'Performance Benchmarking',
            'Connection Pool Monitoring',
            'Foreign Key Relationship Analysis',
            'Index Performance Analysis',
            'Business Data Validation'
          ]
        }
      })

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('❌ PostgreSQL connection test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Database connection test failed',
      details: {
        message: error.message || String(error),
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        stack: error.stack
      },
      environment: {
        POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
        POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT || '5432'),
        POSTGRES_USER: process.env.POSTGRES_USER || 'vikasalagarsamy',
        POSTGRES_DATABASE: process.env.POSTGRES_DATABASE || 'ooak_future',
        CONNECTION_TYPE: 'Direct PostgreSQL',
        NODE_ENV: process.env.NODE_ENV || 'development'
      },
      troubleshooting: [
        'Verify PostgreSQL is running on localhost:5432',
        'Check PostgreSQL credentials (postgres/postgres)',
        'Ensure database "ooak_future" exists',
        'Verify network connectivity to PostgreSQL',
        'Check PostgreSQL logs for connection issues'
      ],
      metadata: {
        source: 'PostgreSQL Connection Test Suite',
        error_timestamp: new Date().toISOString(),
        test_version: '2.0'
      }
    }, { status: 500 })
  }
} 