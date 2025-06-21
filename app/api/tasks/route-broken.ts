import { NextRequest, NextResponse } from 'next/server'
import { createServerClient as createClient } from '@/lib/postgresql-client'
import { getCurrentUser } from '@/actions/auth-actions'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [TASKS API] Starting simplified tasks API...')
    
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      console.log('❌ [TASKS API] No current user found')
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
    }
    
    console.log(`✅ [TASKS API] User authenticated: ${currentUser.username}, employeeId: ${currentUser.employeeId}`)
    
    const { query, transaction } = createClient()
    
    let query = supabase
      .from('ai_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    
    // Simplified role-based access control
    if (currentUser.isAdmin || currentUser.roleName === 'Administrator') {
      console.log('🔐 Admin access - showing all tasks')
    } else if (currentUser.roleName?.includes('Manager') || currentUser.roleName?.includes('Head')) {
      console.log('🔐 Manager/Head access - showing all tasks')
    } else {
      if (currentUser.employeeId) {
        query = query.eq('assigned_to_employee_id', currentUser.employeeId)
        console.log(`🔐 Employee access - tasks for employee ID: ${currentUser.employeeId}`)
      } else {
        console.log('🔐 No employee ID, returning empty result')
        return NextResponse.json([])
      }
    }
    
    console.log('🔍 Executing database query...')
    const { data: tasksData, error: tasksError } = await query

    if (tasksError) {
      console.error('❌ Error fetching AI tasks:', tasksError)
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: tasksError.message },
        { status: 500 }
      )
    }

    console.log(`✅ [TASKS API] Found ${tasksData?.length || 0} tasks`)
    return NextResponse.json(tasksData || [])

  } catch (error: any) {
    console.error('❌ Unexpected error in tasks API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
