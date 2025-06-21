import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { createClient } = await import('@/lib/supabase')
    const { query, transaction } = createClient()
    
    console.log('🧪 Testing simple database query...')
    
    const { data: tasks, error } = await supabase
      .from('ai_tasks')
      .select('id, task_title')
      .limit(5)

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message 
      }, { status: 500 })
    }

    console.log(`✅ Found ${tasks?.length || 0} tasks`)
    return NextResponse.json({ 
      success: true, 
      taskCount: tasks?.length || 0,
      sampleTasks: tasks || []
    })

  } catch (error: any) {
    console.error('❌ Test error:', error)
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message 
    }, { status: 500 })
  }
} 