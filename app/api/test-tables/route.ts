import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client'

export async function GET(request: NextRequest) {
  try {
    const { query, transaction } = createClient()
    
    console.log('🔍 Testing database tables...')
    
    // Test each table individually
    const tableTests = []
    
    // Test call_transcriptions table
    try {
      const { data: transcriptions, error: transcriptionError } = await supabase
        .from('call_transcriptions')
        .select('*')
        .limit(1)
      
      tableTests.push({
        table: 'call_transcriptions',
        exists: !transcriptionError,
        error: transcriptionError?.message,
        sampleData: transcriptions
      })
    } catch (e) {
      tableTests.push({
        table: 'call_transcriptions',
        exists: false,
        error: e instanceof Error ? e.message : String(e)
      })
    }
    
    // Test call_analytics table
    try {
      const { data: analytics, error: analyticsError } = await supabase
        .from('call_analytics')
        .select('*')
        .limit(1)
      
      tableTests.push({
        table: 'call_analytics',
        exists: !analyticsError,
        error: analyticsError?.message,
        sampleData: analytics
      })
    } catch (e) {
      tableTests.push({
        table: 'call_analytics',
        exists: false,
        error: e instanceof Error ? e.message : String(e)
      })
    }
    
    // Test call_insights table
    try {
      const { data: insights, error: insightsError } = await supabase
        .from('call_insights')
        .select('*')
        .limit(1)
      
      tableTests.push({
        table: 'call_insights',
        exists: !insightsError,
        error: insightsError?.message,
        sampleData: insights
      })
    } catch (e) {
      tableTests.push({
        table: 'call_insights',
        exists: false,
        error: e instanceof Error ? e.message : String(e)
      })
    }
    
    // Test ai_tasks table (should exist)
    try {
      const { data: tasks, error: tasksError } = await supabase
        .from('ai_tasks')
        .select('*')
        .limit(1)
      
      tableTests.push({
        table: 'ai_tasks',
        exists: !tasksError,
        error: tasksError?.message,
        sampleData: tasks
      })
    } catch (e) {
      tableTests.push({
        table: 'ai_tasks',
        exists: false,
        error: e instanceof Error ? e.message : String(e)
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Table existence check completed',
      tables: tableTests,
      summary: {
        total: tableTests.length,
        existing: tableTests.filter(t => t.exists).length,
        missing: tableTests.filter(t => !t.exists).length
      }
    })
    
  } catch (error) {
    console.error('❌ Table test error:', error)
    return NextResponse.json(
      { 
        error: 'Table test failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 