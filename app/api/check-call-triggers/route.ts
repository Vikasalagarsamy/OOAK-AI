import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    console.log(`📡 Checking call triggers for employee: ${employeeId}`)

    const { query, transaction } = createClient()

    // Get pending call triggers for this employee
    const { data: triggers, error } = await supabase
      .from('call_triggers')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('status', 'pending')
      .order('triggered_at', { ascending: true })
      .limit(5) // Limit to 5 triggers at a time

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (!triggers || triggers.length === 0) {
      return NextResponse.json({
        success: true,
        triggers: [],
        message: 'No pending call triggers'
      })
    }

    console.log(`📞 Found ${triggers.length} pending triggers for ${employeeId}`)

    // Mark triggers as 'processing' to avoid duplicate calls
    const triggerIds = triggers.map(t => t.id)
    await supabase
      .from('call_triggers')
      .update({ status: 'processing' })
      .in('id', triggerIds)

    // Return the triggers
    return NextResponse.json({
      success: true,
      triggers: triggers.map(trigger => ({
        id: trigger.id,
        phone_number: trigger.phone_number,
        client_name: trigger.client_name,
        task_id: trigger.task_id,
        triggered_at: trigger.triggered_at
      })),
      message: `${triggers.length} call trigger(s) found`
    })

  } catch (error) {
    console.error('❌ Check call triggers API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 