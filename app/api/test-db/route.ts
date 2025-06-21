import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/postgresql-client'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [TEST-DB] Testing PostgreSQL database connectivity...')

    // Test 1: Basic connection
    const healthResult = await query(`
      SELECT COUNT(*) as count
      FROM call_transcriptions
      LIMIT 1
    `)

    console.log('✅ [TEST-DB] Basic PostgreSQL connection successful')

    // Test 2: Check table structure
    const tableInfoResult = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'call_transcriptions'
      ORDER BY ordinal_position
    `)

    // Test 3: Try a simple insert test
    const testId = 'test-' + Date.now()
    const testData = {
      id: testId,
      call_id: 'test-call-' + Date.now(),
      client_name: 'Test Client',
      sales_agent: 'Test Agent',
      phone_number: '+91-TEST',
      transcript: 'Test transcript',
      duration: 0,
      recording_url: '/test/path',
      confidence_score: 0.5,
      detected_language: 'test'
    }

    console.log('🧪 [TEST-DB] Testing insert with PostgreSQL...')

    // Use transaction for test operations
    await transaction(async (client) => {
      // Insert test record
      await client.query(`
        INSERT INTO call_transcriptions (
          id, call_id, client_name, sales_agent, phone_number,
          transcript, duration, recording_url, confidence_score, detected_language, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      `, [
        testData.id,
        testData.call_id,
        testData.client_name,
        testData.sales_agent,
        testData.phone_number,
        testData.transcript,
        testData.duration,
        testData.recording_url,
        testData.confidence_score,
        testData.detected_language
      ])

      // Clean up test record immediately
      await client.query('DELETE FROM call_transcriptions WHERE id = $1', [testId])
    })

    console.log('✅ [TEST-DB] PostgreSQL insert/delete test successful')

    return NextResponse.json({
      status: 'success',
      message: 'PostgreSQL database is working correctly',
      connectionOk: true,
      insertOk: true,
      deleteOk: true,
      tableInfo: {
        columns: tableInfoResult.rows,
        columnCount: tableInfoResult.rows.length
      },
      testData,
      database: 'PostgreSQL',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [TEST-DB] PostgreSQL test error:', error)
    return NextResponse.json({
      error: 'PostgreSQL test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      database: 'PostgreSQL',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 