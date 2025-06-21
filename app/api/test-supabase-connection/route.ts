import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/postgresql-client'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [TEST CONNECTION] Testing PostgreSQL connection...')
    
    // Test basic PostgreSQL connection
    let basicTest: { success: boolean, error: string | null, data: number | null } = { success: false, error: null, data: null }
    try {
      const result = await query('SELECT COUNT(*) as count FROM companies LIMIT 1')
      basicTest = {
        success: true,
        error: null,
        data: parseInt(result.rows[0]?.count || '0')
      }
    } catch (err: any) {
      basicTest.error = err.message
    }
    
    // Test transaction capability
    let transactionTest: { success: boolean, error: string | null } = { success: false, error: null }
    try {
      await transaction(async (client) => {
        await client.query('SELECT 1')
      })
      transactionTest = { success: true, error: null }
    } catch (err: any) {
      transactionTest.error = err.message
    }

    // Test complex query
    let complexTest: { success: boolean, error: string | null, tables: number } = { success: false, error: null, tables: 0 }
    try {
      const result = await query(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `)
      complexTest = {
        success: true,
        error: null,
        tables: parseInt(result.rows[0]?.table_count || '0')
      }
    } catch (err: any) {
      complexTest.error = err.message
    }

    console.log('✅ [TEST CONNECTION] PostgreSQL connection test completed')
    
    return NextResponse.json({
      success: true,
      message: 'PostgreSQL connection test completed',
      tests: {
        basic_query: basicTest,
        transaction: transactionTest,
        complex_query: complexTest
      },
      database: 'PostgreSQL',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ PostgreSQL connection test error:', error)
    return NextResponse.json(
      { error: 'Failed to test PostgreSQL connection' },
      { status: 500 }
    )
  }
} 