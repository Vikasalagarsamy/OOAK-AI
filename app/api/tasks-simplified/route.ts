import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/postgresql-client'
import { getCurrentUser } from '@/actions/auth-actions'

// GET /api/tasks-simplified - Fetch AI tasks with simplified role-based filtering
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [TASKS SIMPLIFIED] Starting tasks API via PostgreSQL...')
    
    // Get current user using our working auth system
    console.log('🔍 Starting getCurrentUser...')
    let currentUser
    try {
      currentUser = await getCurrentUser()
      console.log('🔍 getCurrentUser result:', currentUser ? `${currentUser.username} (${currentUser.roleName})` : 'null')
    } catch (authError: any) {
      console.error('❌ getCurrentUser failed:', authError)
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
        { status: 401 }
      )
    }
    
    if (!currentUser) {
      console.log('❌ No current user found')
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }
    
    console.log(`🔐 Tasks request from user: ${currentUser.username}, role: ${currentUser.roleName}, employeeId: ${currentUser.employeeId}`)
    
    // Check for personal scope query parameter
    const url = new URL(request.url)
    const scope = url.searchParams.get('scope')

    let whereClause = ''
    let queryParams: any[] = []

    if (scope === 'personal') {
      // Personal scope: only show tasks assigned to the current user
      if (currentUser.employeeId) {
        whereClause = 'WHERE assigned_to_employee_id = $1'
        queryParams = [currentUser.employeeId]
        console.log(`🔐 [Personal Scope] Tasks for employee ID: ${currentUser.employeeId}`)
      } else {
        console.log('🔐 [Personal Scope] No employee ID, returning empty result')
        return NextResponse.json([])
      }
    } else {
      // Simplified role-based access control
      if (currentUser.isAdmin || currentUser.roleName === 'Administrator') {
        // Admins see all tasks - no additional filtering
        console.log('🔐 Admin access - showing all tasks')
        whereClause = ''
      } else if (currentUser.roleName?.includes('Manager') || currentUser.roleName?.includes('Head')) {
        // Managers and Heads see all tasks (simplified for now)
        console.log('🔐 Manager/Head access - showing all tasks')
        whereClause = ''
      } else {
        // Regular employees only see their assigned tasks
        if (currentUser.employeeId) {
          whereClause = 'WHERE assigned_to_employee_id = $1'
          queryParams = [currentUser.employeeId]
          console.log(`🔐 Employee access - tasks for employee ID: ${currentUser.employeeId}`)
        } else {
          console.log('🔐 No employee ID, returning empty result')
          return NextResponse.json([])
        }
      }
    }
    
    console.log('🔍 Executing PostgreSQL query...')
    
    try {
      const sqlQuery = `
        SELECT *
        FROM ai_tasks
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT 50
      `
      
      const result = await query(sqlQuery, queryParams)
      const tasks = result.rows

      console.log(`🔍 Database returned ${tasks.length} tasks via PostgreSQL`)

      // Process tasks to ensure JSON fields are properly parsed
      const processedTasks = tasks.map(task => ({
        ...task,
        metadata: typeof task.metadata === 'string' 
          ? JSON.parse(task.metadata) 
          : task.metadata
      }))

      return NextResponse.json(processedTasks)

    } catch (dbError) {
      console.error('❌ Database error fetching tasks:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: dbError instanceof Error ? dbError.message : 'Database error' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('❌ Unexpected error in tasks API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 