import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client'

// POST /api/admin/reset-data - Reset all business data safely
export async function POST(request: NextRequest) {
  try {
    const { query, transaction } = createClient()
    
    // Safety check - only allow in development
    const isDevelopment = process.env.NODE_ENV === 'development'
    if (!isDevelopment) {
      return NextResponse.json(
        { error: 'Data reset only allowed in development environment' },
        { status: 403 }
      )
    }

    console.log('🔄 Starting business data reset...')
    
    // Step 1: Get current counts for logging
    const tasksBeforeResult = await query('SELECT COUNT(*) as count FROM ai_tasks')
    const quotationsBeforeResult = await query('SELECT COUNT(*) as count FROM quotations')
    const leadsBeforeResult = await query('SELECT COUNT(*) as count FROM leads')
    
    const counts = {
      tasks: parseInt(tasksBeforeResult.rows[0]?.count || 0),
      quotations: parseInt(quotationsBeforeResult.rows[0]?.count || 0),
      leads: parseInt(leadsBeforeResult.rows[0]?.count || 0)
    }

    console.log(`📊 Before reset: ${counts.tasks} tasks, ${counts.quotations} quotations, ${counts.leads} leads`)

    // Step 2: Execute deletion in correct order (foreign key dependencies)
    await transaction(async () => {
      // Delete AI tasks first (depends on quotations and leads)
      await query('DELETE FROM ai_tasks')
      console.log('✅ AI tasks deleted')

      // Delete quotations (might be referenced by other tables)
      await query('DELETE FROM quotations')
      console.log('✅ Quotations deleted')

      // Delete leads (base table)
      await query('DELETE FROM leads')
      console.log('✅ Leads deleted')
    })

    // Step 3: Verify deletion
    const tasksAfterResult = await query('SELECT COUNT(*) as count FROM ai_tasks')
    const quotationsAfterResult = await query('SELECT COUNT(*) as count FROM quotations')
    const leadsAfterResult = await query('SELECT COUNT(*) as count FROM leads')
    
    const afterCounts = {
      tasks: parseInt(tasksAfterResult.rows[0]?.count || 0),
      quotations: parseInt(quotationsAfterResult.rows[0]?.count || 0),
      leads: parseInt(leadsAfterResult.rows[0]?.count || 0)
    }

    console.log(`🎯 After reset: ${afterCounts.tasks} tasks, ${afterCounts.quotations} quotations, ${afterCounts.leads} leads`)

    // Step 4: Prepare response
    const success = afterCounts.tasks === 0 && afterCounts.quotations === 0 && afterCounts.leads === 0
    
    if (!success) {
      throw new Error('Data reset incomplete - some records remain')
    }

    const response = {
      success: true,
      message: 'Business data reset completed successfully',
      before: counts,
      after: afterCounts,
      deleted: {
        tasks: counts.tasks - afterCounts.tasks,
        quotations: counts.quotations - afterCounts.quotations,
        leads: counts.leads - afterCounts.leads
      },
      preserved: [
        'Table schemas',
        'Foreign key constraints', 
        'Indexes and triggers',
        'API functionality',
        'Task sequence management',
        'Admin dashboard features'
      ],
      timestamp: new Date().toISOString()
    }

    console.log('🚀 Data reset completed successfully!')
    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ Data reset failed:', error)
    return NextResponse.json(
      { 
        error: 'Data reset failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET /api/admin/reset-data - Get information about what would be reset
export async function GET(request: NextRequest) {
  try {
    const { query, transaction } = createClient()
    
    // Get current counts
    const tasksResult = await query('SELECT COUNT(*) as count FROM ai_tasks')
    const quotationsResult = await query('SELECT COUNT(*) as count FROM quotations')
    const leadsResult = await query('SELECT COUNT(*) as count FROM leads')
    
    const counts = {
      tasks: parseInt(tasksResult.rows[0]?.count || 0),
      quotations: parseInt(quotationsResult.rows[0]?.count || 0),
      leads: parseInt(leadsResult.rows[0]?.count || 0)
    }

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      canReset: process.env.NODE_ENV === 'development',
      currentData: counts,
      totalRecords: counts.tasks + counts.quotations + counts.leads,
      warning: 'This operation will delete ALL business data while preserving schema and functionality',
      preserves: [
        'Table structures and schemas',
        'Foreign key relationships',
        'Indexes and constraints', 
        'API endpoints',
        'Task sequence management',
        'Admin dashboard functionality',
        'User accounts and authentication'
      ],
      deletesOnly: [
        'AI task records',
        'Quotation records', 
        'Lead records'
      ]
    })

  } catch (error: any) {
    console.error('❌ Error getting reset info:', error)
    return NextResponse.json(
      { error: 'Failed to get reset information', details: error.message },
      { status: 500 }
    )
  }
} 