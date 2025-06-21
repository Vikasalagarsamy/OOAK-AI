import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/postgresql-client'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [TEST-BASIC] Testing basic PostgreSQL connection...')
    
    // Test basic query
    const result = await query(`
      SELECT id, task_title
      FROM ai_tasks
      LIMIT 1
    `)
    
    console.log('✅ [TEST-BASIC] PostgreSQL connection successful')
    
    return NextResponse.json({
      success: true,
      message: 'PostgreSQL connection working',
      sample_data: result.rows,
      row_count: result.rows.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ [TEST-BASIC] Basic test error (PostgreSQL):', error)
    return NextResponse.json(
      { 
        error: 'Basic PostgreSQL test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      },
      { status: 500 }
    )
  }
} 