import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { createClient } from '@/lib/postgresql-client'

export async function GET(request: NextRequest) {
  console.log('🧪 Starting browser auth test...')
  
  try {
    // Step 1: Test getCurrentUser
    console.log('🔍 Step 1: Testing getCurrentUser...')
    let currentUser
    try {
      currentUser = await getCurrentUser()
      console.log('✅ getCurrentUser result:', currentUser ? `${currentUser.username} (${currentUser.roleName})` : 'null')
    } catch (authError: any) {
      console.error('❌ getCurrentUser failed:', authError)
      return NextResponse.json({
        step: 'getCurrentUser',
        error: authError.message,
        stack: authError.stack
      }, { status: 500 })
    }
    
    if (!currentUser) {
      console.log('❌ No current user found')
      return NextResponse.json({
        step: 'authentication',
        error: 'No current user - likely not logged in'
      }, { status: 401 })
    }
    
    // Step 2: Test supabase connection
    console.log('🔍 Step 2: Testing supabase connection...')
    const { query, transaction } = createClient()
    
    try {
      const { data: testQuery, error: testError } = await supabase
        .from('ai_tasks')
        .select('id')
        .limit(1)
        
      if (testError) {
        console.error('❌ Supabase test query failed:', testError)
        return NextResponse.json({
          step: 'supabase_connection',
          error: testError.message,
          details: testError
        }, { status: 500 })
      }
      
      console.log('✅ Supabase connection works')
    } catch (supabaseError: any) {
      console.error('❌ Supabase connection error:', supabaseError)
      return NextResponse.json({
        step: 'supabase_connection',
        error: supabaseError.message,
        stack: supabaseError.stack
      }, { status: 500 })
    }
    
    // Step 3: Test tasks query
    console.log('🔍 Step 3: Testing tasks query...')
    try {
      const { data: tasks, error: tasksError } = await supabase
        .from('ai_tasks')
        .select('id, task_title, status')
        .limit(5)
        
      if (tasksError) {
        console.error('❌ Tasks query failed:', tasksError)
        return NextResponse.json({
          step: 'tasks_query',
          error: tasksError.message,
          details: tasksError
        }, { status: 500 })
      }
      
      console.log('✅ Tasks query successful, found:', tasks?.length || 0, 'tasks')
      
      return NextResponse.json({
        success: true,
        currentUser: {
          id: currentUser.id,
          username: currentUser.username,
          roleName: currentUser.roleName,
          employeeId: currentUser.employeeId
        },
        tasksFound: tasks?.length || 0,
        sampleTasks: tasks?.slice(0, 3),
        timestamp: new Date().toISOString()
      })
      
    } catch (queryError: any) {
      console.error('❌ Tasks query error:', queryError)
      return NextResponse.json({
        step: 'tasks_query',
        error: queryError.message,
        stack: queryError.stack
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('❌ Unexpected error in browser auth test:', error)
    return NextResponse.json({
      step: 'unexpected',
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 