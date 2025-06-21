import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { createClient } from '@/lib/postgresql-client'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [TASKS DEBUG] Starting debug tasks API...')
    
    // Step 1: Test authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({
        error: 'Not authenticated',
        step: 'authentication'
      }, { status: 401 })
    }
    
    console.log('✅ [TASKS DEBUG] Authentication successful:', currentUser.username)
    
    // Step 2: Test Supabase connection
    const { query, transaction } = createClient()
    
    // Step 3: Test simple query first
    const { data: simpleTest, error: simpleError } = await supabase
      .from('ai_tasks')
      .select('id, task_title, status')
      .limit(3)
    
    if (simpleError) {
      console.error('❌ [TASKS DEBUG] Simple query failed:', simpleError)
      return NextResponse.json({
        error: 'Database query failed',
        step: 'simple_query',
        details: simpleError.message,
        sqlError: simpleError
      }, { status: 500 })
    }
    
    console.log('✅ [TASKS DEBUG] Simple query successful, found', simpleTest?.length || 0, 'tasks')
    
    return NextResponse.json({
      success: true,
      user: {
        id: currentUser.id,
        username: currentUser.username,
        roleName: currentUser.roleName,
        employeeId: currentUser.employeeId
      },
      tasksFound: simpleTest?.length || 0,
      sampleTasks: simpleTest || [],
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ [TASKS DEBUG] Unexpected error:', error)
    return NextResponse.json({
      error: 'Unexpected error',
      step: 'unexpected',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 