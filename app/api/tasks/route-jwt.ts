import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function GET(request: NextRequest) {
  try {
    // First, check for JWT token in cookies (from login)
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')?.value
    
    let currentUser = null
    
    if (authToken) {
      try {
        console.log('🔍 Found JWT token, verifying...')
        const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
        const secretKey = new TextEncoder().encode(secret)
        
        const { payload } = await jwtVerify(authToken, secretKey, {
          algorithms: ["HS256"],
        })
        
        console.log('✅ JWT verified for user:', payload.username, 'employeeId:', payload.employeeId)
        
        currentUser = {
          employeeId: payload.employeeId,
          email: payload.email,
          username: payload.username,
        }
      } catch (jwtError) {
        console.log('❌ JWT verification failed:', jwtError)
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
      }
    } else {
      console.log('❌ No JWT token found')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!currentUser || !currentUser.employeeId) {
      console.log('❌ No employee ID found')
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    console.log('✅ Getting tasks for employee:', currentUser.employeeId)

    // Get tasks assigned to this employee
    const { query, transaction } = createClient()
    const { data: tasks, error: tasksError } = await supabase
      .from('ai_tasks')
      .select(`
        *,
        assigned_employee:employees!assigned_to_employee_id(
          id,
          first_name,
          last_name,
          job_title
        )
      `)
      .eq('assigned_to_employee_id', currentUser.employeeId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (tasksError) {
      console.error('❌ Tasks query error:', tasksError)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    console.log(`✅ Found ${tasks?.length || 0} tasks for employee ${currentUser.employeeId}`)

    // Get lead data for tasks that have lead_id
    const tasksWithLeads = []
    for (const task of tasks || []) {
      let taskWithLead = { ...task }
      
      if (task.lead_id) {
        const { data: lead } = await supabase
          .from('leads')
          .select('id, phone, country_code, whatsapp_number, full_name')
          .eq('id', task.lead_id)
          .single()
        
        if (lead) {
          taskWithLead.lead = lead
        }
      }
      
      tasksWithLeads.push(taskWithLead)
    }

    return NextResponse.json(tasksWithLeads)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 