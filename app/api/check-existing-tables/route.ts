import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client-unified'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const results: any[] = []
    
    // Check notifications table structure
    try {
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .limit(1)
      
      if (!notificationsError) {
        results.push({
          table: 'notifications',
          status: 'exists',
          message: 'Table exists - checking columns...',
          sample_data: notificationsData?.[0] || null
        })
        
        // Try to check if specific columns exist by doing a select
        try {
          await query(`SELECT ${params} FROM ${table}`).limit(1)
          results.push({ table: 'notifications', column: 'recipient_role', status: 'exists' })
        } catch (e) {
          results.push({ table: 'notifications', column: 'recipient_role', status: 'missing', error: (e as Error).message })
        }
        
        try {
          await query(`SELECT ${params} FROM ${table}`).limit(1)
          results.push({ table: 'notifications', column: 'recipient_id', status: 'exists' })
        } catch (e) {
          results.push({ table: 'notifications', column: 'recipient_id', status: 'missing', error: (e as Error).message })
        }
        
        try {
          await query(`SELECT ${params} FROM ${table}`).limit(1)
          results.push({ table: 'notifications', column: 'type', status: 'exists' })
        } catch (e) {
          results.push({ table: 'notifications', column: 'type', status: 'missing', error: (e as Error).message })
        }
        
      } else {
        results.push({
          table: 'notifications',
          status: 'missing',
          message: 'Table does not exist',
          error: notificationsError.message
        })
      }
    } catch (e) {
      results.push({
        table: 'notifications',
        status: 'error',
        message: 'Failed to check table',
        error: (e as Error).message
      })
    }
    
    // Check ai_tasks table
    try {
      const { data: aiTasksData, error: aiTasksError } = await supabase
        .from('ai_tasks')
        .select('*')
        .limit(1)
      
      if (!aiTasksError) {
        results.push({
          table: 'ai_tasks',
          status: 'exists',
          message: 'Table exists',
          sample_data: aiTasksData?.[0] || null
        })
      } else {
        results.push({
          table: 'ai_tasks',
          status: 'missing',
          message: 'Table does not exist'
        })
      }
    } catch (e) {
      results.push({
        table: 'ai_tasks',
        status: 'error',
        error: (e as Error).message
      })
    }
    
    // Check other workflow tables
    const workflowTables = [
      'payments',
      'quotation_revisions',
      'department_instructions',
      'instruction_approvals',
      'accounting_workflows',
      'post_sales_workflows'
    ]
    
    for (const tableName of workflowTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (!error) {
          results.push({
            table: tableName,
            status: 'exists',
            message: 'Table exists',
            sample_data: data?.[0] || null
          })
        } else {
          results.push({
            table: tableName,
            status: 'missing',
            message: 'Table does not exist'
          })
        }
      } catch (e) {
        results.push({
          table: tableName,
          status: 'error',
          error: (e as Error).message
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database structure analysis complete',
      results
    })
    
  } catch (error) {
    console.error('❌ Check failed:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      message: 'Failed to check database structure'
    }, { status: 500 })
  }
} 