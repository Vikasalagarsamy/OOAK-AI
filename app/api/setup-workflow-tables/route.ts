import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client-unified'

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Setting up workflow database tables...')
    
    const results = []
    
    // 1️⃣ Create payments table
    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('id')
        .limit(1)
      
      if (paymentsError && paymentsError.code === 'PGRST116') {
        // Table doesn't exist, create it via raw SQL
        results.push({ table: 'payments', status: 'creating', message: 'Table does not exist, needs creation' })
      } else {
        results.push({ table: 'payments', status: 'exists', message: 'Table already exists' })
      }
    } catch (e) {
      results.push({ table: 'payments', status: 'error', message: (e as Error).message })
    }
    
    // 2️⃣ Create ai_tasks table
    try {
      const { data: aiTasksData, error: aiTasksError } = await supabase
        .from('ai_tasks')
        .select('id')
        .limit(1)
      
      if (aiTasksError && aiTasksError.code === 'PGRST116') {
        results.push({ table: 'ai_tasks', status: 'creating', message: 'Table does not exist, needs creation' })
      } else {
        results.push({ table: 'ai_tasks', status: 'exists', message: 'Table already exists' })
      }
    } catch (e) {
      results.push({ table: 'ai_tasks', status: 'error', message: (e as Error).message })
    }
    
    // 3️⃣ Create quotation_revisions table
    try {
      const { data: revisionsData, error: revisionsError } = await supabase
        .from('quotation_revisions')
        .select('id')
        .limit(1)
      
      if (revisionsError && revisionsError.code === 'PGRST116') {
        results.push({ table: 'quotation_revisions', status: 'creating', message: 'Table does not exist, needs creation' })
      } else {
        results.push({ table: 'quotation_revisions', status: 'exists', message: 'Table already exists' })
      }
    } catch (e) {
      results.push({ table: 'quotation_revisions', status: 'error', message: (e as Error).message })
    }
    
    // 4️⃣ Create department_instructions table
    try {
      const { data: instructionsData, error: instructionsError } = await supabase
        .from('department_instructions')
        .select('id')
        .limit(1)
      
      if (instructionsError && instructionsError.code === 'PGRST116') {
        results.push({ table: 'department_instructions', status: 'creating', message: 'Table does not exist, needs creation' })
      } else {
        results.push({ table: 'department_instructions', status: 'exists', message: 'Table already exists' })
      }
    } catch (e) {
      results.push({ table: 'department_instructions', status: 'error', message: (e as Error).message })
    }
    
    // 5️⃣ Create instruction_approvals table
    try {
      const { data: approvalsData, error: approvalsError } = await supabase
        .from('instruction_approvals')
        .select('id')
        .limit(1)
      
      if (approvalsError && approvalsError.code === 'PGRST116') {
        results.push({ table: 'instruction_approvals', status: 'creating', message: 'Table does not exist, needs creation' })
      } else {
        results.push({ table: 'instruction_approvals', status: 'exists', message: 'Table already exists' })
      }
    } catch (e) {
      results.push({ table: 'instruction_approvals', status: 'error', message: (e as Error).message })
    }
    
    // 6️⃣ Create accounting_workflows table
    try {
      const { data: accountingData, error: accountingError } = await supabase
        .from('accounting_workflows')
        .select('id')
        .limit(1)
      
      if (accountingError && accountingError.code === 'PGRST116') {
        results.push({ table: 'accounting_workflows', status: 'creating', message: 'Table does not exist, needs creation' })
      } else {
        results.push({ table: 'accounting_workflows', status: 'exists', message: 'Table already exists' })
      }
    } catch (e) {
      results.push({ table: 'accounting_workflows', status: 'error', message: (e as Error).message })
    }
    
    // 7️⃣ Create post_sales_workflows table
    try {
      const { data: postSalesData, error: postSalesError } = await supabase
        .from('post_sales_workflows')
        .select('id')
        .limit(1)
      
      if (postSalesError && postSalesError.code === 'PGRST116') {
        results.push({ table: 'post_sales_workflows', status: 'creating', message: 'Table does not exist, needs creation' })
      } else {
        results.push({ table: 'post_sales_workflows', status: 'exists', message: 'Table already exists' })
      }
    } catch (e) {
      results.push({ table: 'post_sales_workflows', status: 'error', message: (e as Error).message })
    }
    
    // 8️⃣ Create notifications table
    try {
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1)
      
      if (notificationsError && notificationsError.code === 'PGRST116') {
        results.push({ table: 'notifications', status: 'creating', message: 'Table does not exist, needs creation' })
      } else {
        results.push({ table: 'notifications', status: 'exists', message: 'Table already exists' })
      }
    } catch (e) {
      results.push({ table: 'notifications', status: 'error', message: (e as Error).message })
    }
    
    // Count tables that need creation
    const tablesToCreate = results.filter(r => r.status === 'creating').length
    const existingTables = results.filter(r => r.status === 'exists').length
    
    return NextResponse.json({
      success: true,
      message: `Database analysis complete: ${existingTables} tables exist, ${tablesToCreate} tables need creation`,
      results,
      instructions: tablesToCreate > 0 ? 
        'Some tables are missing. Please run the migration script or create tables manually in Supabase dashboard.' :
        'All required tables exist! The workflow should work properly now.'
    })
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      message: 'Failed to setup workflow tables'
    }, { status: 500 })
  }
} 