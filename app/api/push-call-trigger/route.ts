import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/postgresql-client'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('📞 [PUSH CALL TRIGGER] Processing via PostgreSQL...')
    
    const { employeeId, phoneNumber, clientName, taskId } = await request.json()

    if (!employeeId || !phoneNumber) {
      return NextResponse.json(
        { error: 'Employee ID and phone number are required' },
        { status: 400 }
      )
    }

    console.log(`📞 Push call trigger: ${clientName} (${phoneNumber}) for ${employeeId}`)

    // Directly trigger the call via ADB
    const adbCommand = `adb shell am start -a android.intent.action.CALL -d tel:${phoneNumber}`
    
    try {
      await execAsync(adbCommand)
      console.log(`✅ Call initiated successfully to ${phoneNumber}`)
      
      // Log the trigger in database
      await query(`
        INSERT INTO call_triggers (
          employee_id,
          phone_number,
          client_name,
          task_id,
          triggered_at,
          status
        ) VALUES ($1, $2, $3, $4, NOW(), $5)
      `, [employeeId, phoneNumber, clientName, taskId, 'completed'])

      console.log(`✅ Call trigger logged to database via PostgreSQL`)

      return NextResponse.json({
        success: true,
        message: `Call initiated to ${clientName} via PostgreSQL`,
        phoneNumber: phoneNumber,
        method: 'direct_adb_call'
      })

    } catch (adbError) {
      console.error('❌ ADB call failed:', adbError)
      
      // Log failed attempt
      try {
        await query(`
          INSERT INTO call_triggers (
            employee_id,
            phone_number,
            client_name,
            task_id,
            triggered_at,
            status,
            error_details
          ) VALUES ($1, $2, $3, $4, NOW(), $5, $6)
        `, [employeeId, phoneNumber, clientName, taskId, 'failed', adbError.message])
      } catch (logError) {
        console.warn('⚠️ Could not log failed call trigger:', logError)
      }
      
      return NextResponse.json(
        { error: 'Failed to initiate call via ADB' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Push call trigger API error (PostgreSQL):', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 