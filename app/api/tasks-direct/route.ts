import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'

// Direct database connection using pg (PostgreSQL client)
import { pool } from '@/lib/postgresql-client'

// Create PostgreSQL connection pool
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [TASKS DIRECT] Starting direct database tasks API...')
    
    // Get current user using our working auth system
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      console.log('❌ [TASKS DIRECT] No current user found')
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
    }
    
    console.log(`✅ [TASKS DIRECT] User authenticated: ${currentUser.username}, employeeId: ${currentUser.employeeId}`)
    
    // Direct database query
    let query = `
      SELECT * FROM ai_tasks 
      ORDER BY created_at DESC 
      LIMIT 50
    `
    let queryParams: any[] = []
    
    // Check for personal scope query parameter
    const url = new URL(request.url)
    const scope = url.searchParams.get('scope')

    if (scope === 'personal') {
      // Personal scope: only show tasks assigned to the current user
      if (currentUser.employeeId) {
        query = `
          SELECT * FROM ai_tasks 
          WHERE assigned_to_employee_id = $1
          ORDER BY created_at DESC 
          LIMIT 50
        `
        queryParams = [currentUser.employeeId]
        console.log(`🔐 [TASKS DIRECT] Personal scope for employee ID: ${currentUser.employeeId}`)
      } else {
        console.log('🔐 [TASKS DIRECT] No employee ID, returning empty result')
        return NextResponse.json([])
      }
    } else {
      // Simplified role-based access control
      if (currentUser.isAdmin || currentUser.roleName === 'Administrator') {
        // Admins see all tasks
        console.log('🔐 [TASKS DIRECT] Admin access - showing all tasks')
      } else if (currentUser.roleName?.includes('Manager') || currentUser.roleName?.includes('Head')) {
        // Managers and Heads see all tasks (simplified)
        console.log('🔐 [TASKS DIRECT] Manager/Head access - showing all tasks')
      } else {
        // Regular employees only see their assigned tasks
        if (currentUser.employeeId) {
          query = `
            SELECT * FROM ai_tasks 
            WHERE assigned_to_employee_id = $1
            ORDER BY created_at DESC 
            LIMIT 50
          `
          queryParams = [currentUser.employeeId]
          console.log(`🔐 [TASKS DIRECT] Employee access - tasks for employee ID: ${currentUser.employeeId}`)
        } else {
          console.log('🔐 [TASKS DIRECT] No employee ID, returning empty result')
          return NextResponse.json([])
        }
      }
    }
    
    console.log('🔍 [TASKS DIRECT] Executing direct database query...')
    const client = await pool.connect()
    
    try {
      const result = await client.query(query, queryParams)
      const tasks = result.rows
      
      console.log(`🔍 [TASKS DIRECT] Database returned ${tasks.length} tasks`)
      
      return NextResponse.json(tasks)
      
    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('❌ [TASKS DIRECT] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 