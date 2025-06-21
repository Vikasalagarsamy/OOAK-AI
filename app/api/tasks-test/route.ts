import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/postgresql-client'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing service role client connection...')
    
    const supabase = createServerClient()
    
    console.log('🔍 Executing test query...')
    const { data: tasks, error: tasksError } = await supabase
      .from('ai_tasks')
      .select('id, task_title, status')
      .limit(5)

    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError)
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: tasksError.message },
        { status: 500 }
      )
    }

    console.log(`✅ Successfully fetched ${tasks?.length || 0} tasks`)
    
    return NextResponse.json({
      success: true,
      message: 'Service role client working!',
      tasksCount: tasks?.length || 0,
      sampleTasks: tasks || []
    })

  } catch (error: any) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 