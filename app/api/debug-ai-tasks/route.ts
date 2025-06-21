import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client-unified'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing ai_tasks table...')
    
    // First try to read existing tasks to verify table exists
    const { data: existingTasks, error: readError } = await supabase
      .from('ai_tasks')
      .select('*')
      .limit(1)
    
    if (readError) {
      console.error('❌ ai_tasks table read error:', readError)
      return NextResponse.json({
        success: false,
        error: 'ai_tasks table access failed',
        details: readError.message
      })
    }
    
    console.log('✅ ai_tasks table accessible')
    
    // Try creating a simple test task based on the current schema
    const testTask = {
      task_title: 'Debug Test Task',
      task_description: 'Test task for debugging insertion',
      priority: 'medium',
      status: 'pending',
      category: 'debug',
      assigned_to: 'debug_user',
      assigned_by: 'system',
      metadata: { test: true, created_at: new Date().toISOString() }
    }
    
    console.log('📝 Attempting to insert test task:', testTask)
    
    const { data: insertResult, error: insertError } = await supabase
      .from('ai_tasks')
      .insert(testTask)
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ ai_tasks issue: Failed to insert test task')
      console.error('Insert error details:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Failed to insert test task',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint
      })
    }
    
    console.log('✅ Successfully inserted test task ID:', insertResult?.id)
    
    return NextResponse.json({
      success: true,
      message: 'ai_tasks table test completed successfully',
      insertedTask: insertResult,
      allTasksCount: (existingTasks?.length || 0) + 1 // +1 for the newly inserted task
    })
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      message: 'Failed to debug ai_tasks table'
    }, { status: 500 })
  }
} 