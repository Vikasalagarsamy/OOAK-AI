import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect()
    const startTime = Date.now()

    try {
      console.log('🔍 Debugging call analytics data with PostgreSQL...')

      // Enhanced database schema analysis
      const { rows: tableInfo } = await client.query(`
        SELECT 
          schemaname,
          tablename,
          hasindexes,
          hasrules,
          hastriggers,
          rowsecurity
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename IN ('call_transcriptions', 'call_analytics')
        ORDER BY tablename
      `)

      // Detailed column information for both tables
      const { rows: transcriptionColumns } = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'call_transcriptions' 
          AND table_schema = 'public'
        ORDER BY ordinal_position
      `)

      const { rows: analyticsColumns } = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'call_analytics' 
          AND table_schema = 'public'
        ORDER BY ordinal_position
      `)

      // Get accurate data counts with performance metrics
      const countStart = Date.now()
      const { rows: counts } = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM call_transcriptions) as transcription_count,
          (SELECT COUNT(*) FROM call_analytics) as analytics_count,
          (SELECT COUNT(*) FROM call_transcriptions WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as recent_transcriptions,
          (SELECT COUNT(*) FROM call_analytics WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as recent_analytics,
          (SELECT MAX(created_at) FROM call_transcriptions) as latest_transcription,
          (SELECT MAX(created_at) FROM call_analytics) as latest_analytics
      `)
      const countTime = Date.now() - countStart

      // Sample data with enhanced details
      const sampleStart = Date.now()
      const { rows: sampleTranscriptions } = await client.query(`
        SELECT 
          id,
          call_id,
          client_name,
          employee_name,
          transcript_text,
          created_at,
          CASE 
            WHEN LENGTH(transcript_text) > 100 
            THEN SUBSTRING(transcript_text FROM 1 FOR 100) || '...'
            ELSE transcript_text
          END as transcript_preview,
          LENGTH(transcript_text) as transcript_length
        FROM call_transcriptions 
        ORDER BY created_at DESC 
        LIMIT 3
      `)

      const { rows: sampleAnalytics } = await client.query(`
        SELECT 
          id,
          call_id,
          sentiment_score,
          key_topics,
          action_items,
          summary,
          created_at,
          analysis_version
        FROM call_analytics 
        ORDER BY created_at DESC 
        LIMIT 3
      `)
      const sampleTime = Date.now() - sampleStart

      // Database performance analysis
      const { rows: performanceStats } = await client.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables 
        WHERE tablename IN ('call_transcriptions', 'call_analytics')
      `)

      // Index information
      const { rows: indexInfo } = await client.query(`
        SELECT 
          t.tablename,
          i.indexname,
          i.indexdef,
          s.idx_tup_read,
          s.idx_tup_fetch
        FROM pg_indexes i
        JOIN pg_stat_user_indexes s ON i.indexname = s.indexrelname
        JOIN pg_tables t ON i.tablename = t.tablename
        WHERE t.tablename IN ('call_transcriptions', 'call_analytics')
        ORDER BY t.tablename, i.indexname
      `)

      // Call analytics quality assessment
      const { rows: qualityMetrics } = await client.query(`
        SELECT 
          COUNT(*) as total_calls,
          COUNT(*) FILTER (WHERE ct.transcript_text IS NOT NULL AND LENGTH(ct.transcript_text) > 0) as calls_with_transcripts,
          COUNT(*) FILTER (WHERE ca.id IS NOT NULL) as calls_with_analytics,
          COUNT(*) FILTER (WHERE ca.sentiment_score IS NOT NULL) as calls_with_sentiment,
          COUNT(*) FILTER (WHERE ca.key_topics IS NOT NULL) as calls_with_topics,
          AVG(LENGTH(ct.transcript_text)) as avg_transcript_length,
          AVG(ca.sentiment_score) as avg_sentiment_score
        FROM call_transcriptions ct
        LEFT JOIN call_analytics ca ON ct.call_id = ca.call_id
      `)

      const totalTime = Date.now() - startTime

      // Prepare comprehensive debug response
      const debugInfo = {
        timestamp: new Date().toISOString(),
        database_connection: 'PostgreSQL localhost:5432',
        performance_metrics: {
          total_debug_time: `${totalTime}ms`,
          count_query_time: `${countTime}ms`,
          sample_query_time: `${sampleTime}ms`,
          connection_pool: {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount
          }
        },
        database_status: {
          transcriptions_table: {
            exists: tableInfo.some(t => t.tablename === 'call_transcriptions'),
            schema: transcriptionColumns,
            has_indexes: tableInfo.find(t => t.tablename === 'call_transcriptions')?.hasindexes || false,
            has_triggers: tableInfo.find(t => t.tablename === 'call_transcriptions')?.hastriggers || false,
            count: counts[0]?.transcription_count || 0,
            recent_count: counts[0]?.recent_transcriptions || 0
          },
          analytics_table: {
            exists: tableInfo.some(t => t.tablename === 'call_analytics'),
            schema: analyticsColumns,
            has_indexes: tableInfo.find(t => t.tablename === 'call_analytics')?.hasindexes || false,
            has_triggers: tableInfo.find(t => t.tablename === 'call_analytics')?.hastriggers || false,
            count: counts[0]?.analytics_count || 0,
            recent_count: counts[0]?.recent_analytics || 0
          }
        },
        table_performance: performanceStats,
        index_analysis: indexInfo,
        data_quality: {
          metrics: qualityMetrics[0],
          coverage: {
            transcript_coverage: qualityMetrics[0]?.total_calls > 0 ? 
              ((qualityMetrics[0]?.calls_with_transcripts || 0) / qualityMetrics[0].total_calls * 100).toFixed(2) + '%' : '0%',
            analytics_coverage: qualityMetrics[0]?.total_calls > 0 ? 
              ((qualityMetrics[0]?.calls_with_analytics || 0) / qualityMetrics[0].total_calls * 100).toFixed(2) + '%' : '0%',
            sentiment_coverage: qualityMetrics[0]?.total_calls > 0 ? 
              ((qualityMetrics[0]?.calls_with_sentiment || 0) / qualityMetrics[0].total_calls * 100).toFixed(2) + '%' : '0%'
          }
        },
        sample_data: {
          transcriptions: sampleTranscriptions || [],
          analytics: sampleAnalytics || []
        }
      }

      console.log('✅ Enhanced PostgreSQL debug info compiled:', {
        transcriptions: counts[0]?.transcription_count || 0,
        analytics: counts[0]?.analytics_count || 0,
        debug_time: `${totalTime}ms`
      })

      return NextResponse.json({
        success: true,
        debug_info: debugInfo,
        summary: {
          total_transcriptions: counts[0]?.transcription_count || 0,
          total_analytics: counts[0]?.analytics_count || 0,
          recent_transcriptions: counts[0]?.recent_transcriptions || 0,
          recent_analytics: counts[0]?.recent_analytics || 0,
          has_data: (counts[0]?.transcription_count || 0) > 0 || (counts[0]?.analytics_count || 0) > 0,
          latest_transcription: counts[0]?.latest_transcription || null,
          latest_analytics: counts[0]?.latest_analytics || null,
          data_quality_score: qualityMetrics[0]?.total_calls > 0 ? 
            ((qualityMetrics[0]?.calls_with_analytics || 0) / qualityMetrics[0].total_calls * 100).toFixed(1) : '0'
        },
        recommendations: {
          performance: totalTime > 100 ? 
            ['Consider adding database indexes', 'Optimize query performance'] : 
            ['Database performance is optimal'],
          data_quality: qualityMetrics[0]?.calls_with_analytics < qualityMetrics[0]?.total_calls ?
            ['Ensure all calls have analytics', 'Check analytics processing pipeline'] :
            ['Data quality is excellent'],
          monitoring: [
            'Set up automated performance monitoring',
            'Configure alerting for data quality issues',
            'Monitor connection pool usage'
          ]
        },
        metadata: {
          source: 'PostgreSQL Direct Connection Debug',
          database_version: 'PostgreSQL 15.8',
          debug_capabilities: ['Schema Analysis', 'Performance Metrics', 'Data Quality Assessment', 'Index Analysis']
        }
      })

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('❌ PostgreSQL debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown PostgreSQL error',
      details: {
        code: error.code,
        detail: error.detail,
        hint: error.hint
      },
      timestamp: new Date().toISOString(),
      database_connection: 'PostgreSQL localhost:5432'
    }, { status: 500 })
  }
} 