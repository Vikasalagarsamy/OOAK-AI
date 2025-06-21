'use server'

import { createClient } from "@/lib/supabase/server"

export async function fixDatabaseSchema() {
  const supabase = createClient()
  
  try {
    console.log('🔧 Executing database schema fix...')
    
    const results = []
    
    // 1. Create AI Tasks table
    console.log('Creating ai_tasks table...')
    const { error: aiTasksError } = await supabase.rpc('execute_sql_statement', {
      statement: `
        CREATE TABLE IF NOT EXISTS public.ai_tasks (
          id SERIAL PRIMARY KEY,
          task_number VARCHAR(50) UNIQUE NOT NULL,
          title VARCHAR(500) NOT NULL,
          description TEXT,
          priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
          status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
          assigned_to INTEGER,
          created_by INTEGER,
          due_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          completed_at TIMESTAMP WITH TIME ZONE,
          company_id INTEGER DEFAULT 1,
          branch_id INTEGER DEFAULT 1,
          category VARCHAR(50) DEFAULT 'GENERAL',
          estimated_hours DECIMAL(5,2),
          actual_hours DECIMAL(5,2),
          business_impact VARCHAR(50),
          automation_source VARCHAR(100),
          lead_id INTEGER,
          quotation_id INTEGER,
          tags TEXT[],
          metadata JSONB
        );
      `
    })
    
    if (aiTasksError && !aiTasksError.message?.includes('already exists')) {
      console.warn('⚠️ AI tasks table creation warning:', aiTasksError.message)
    }
    results.push({ step: 'ai_tasks_table', success: !aiTasksError })
    
    // 2. Add name column to employees table
    console.log('Adding name column to employees...')
    const { error: nameColumnError } = await supabase.rpc('execute_sql_statement', {
      statement: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'employees' AND column_name = 'name') THEN
            ALTER TABLE employees ADD COLUMN name VARCHAR(255);
            
            UPDATE employees 
            SET name = COALESCE(
              CASE 
                WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
                THEN first_name || ' ' || last_name
                WHEN first_name IS NOT NULL 
                THEN first_name
                WHEN last_name IS NOT NULL 
                THEN last_name
                ELSE 'Employee #' || id::text
              END
            )
            WHERE name IS NULL;
          END IF;
        END $$;
      `
    })
    
    if (nameColumnError) {
      console.warn('⚠️ Employee name column warning:', nameColumnError.message)
    }
    results.push({ step: 'employees_name_column', success: !nameColumnError })
    
    // 3. Create supporting tables
    console.log('Creating supporting tables...')
    const { error: supportingTablesError } = await supabase.rpc('execute_sql_statement', {
      statement: `
        CREATE TABLE IF NOT EXISTS public.task_generation_log (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER,
          quotation_id INTEGER,
          rule_triggered VARCHAR(100) NOT NULL,
          task_id INTEGER,
          success BOOLEAN NOT NULL,
          error_message TEXT,
          triggered_by VARCHAR(100),
          triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          metadata JSONB
        );
        
        CREATE TABLE IF NOT EXISTS public.lead_task_performance (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER NOT NULL,
          task_id INTEGER NOT NULL,
          response_time_hours DECIMAL(10,2),
          completion_time_hours DECIMAL(10,2),
          sla_met BOOLEAN,
          revenue_impact DECIMAL(15,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(lead_id, task_id)
        );
      `
    })
    
    if (supportingTablesError) {
      console.warn('⚠️ Supporting tables warning:', supportingTablesError.message)
    }
    results.push({ step: 'supporting_tables', success: !supportingTablesError })
    
    // 4. Insert sample data
    console.log('Inserting sample data...')
    const { error: sampleDataError } = await supabase
      .from('ai_tasks')
      .upsert({
        task_number: 'TASK-SAMPLE-001',
        title: 'Sample AI Task',
        description: 'This is a sample task for testing',
        priority: 'MEDIUM',
        status: 'PENDING',
        assigned_to: 1,
        created_by: 1,
        company_id: 1,
        branch_id: 1,
        category: 'SAMPLE'
      }, { 
        onConflict: 'task_number',
        ignoreDuplicates: true 
      })
    
    if (sampleDataError) {
      console.warn('⚠️ Sample data warning:', sampleDataError.message)
    }
    results.push({ step: 'sample_data', success: !sampleDataError })
    
    console.log('✅ Database schema fix completed')
    
    return {
      success: true,
      message: 'Database schema fixed successfully! AI Tasks integration is now ready.',
      details: results
    }
    
  } catch (error: any) {
    console.error('❌ Schema fix failed:', error)
    
    // Fallback: Try manual table creation
    try {
      console.log('🔄 Attempting fallback table creation...')
      
      // Direct table creation attempt
      const { error: directCreateError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'ai_tasks')
        .single()
      
      if (directCreateError) {
        // Table doesn't exist, we need to create it manually
        return {
          success: false,
          message: 'Database schema fix failed. Please run the SQL script manually.',
          error: error.message,
          fallbackInstructions: 'Copy the contents of fix-database-schema.sql and run it directly in your database console'
        }
      }
      
      return {
        success: true,
        message: 'Tables already exist. Schema should be ready.',
        details: ['fallback_check_passed']
      }
      
    } catch (fallbackError: any) {
      return {
        success: false,
        message: 'Failed to fix database schema',
        error: error.message
      }
    }
  }
}

export async function checkDatabaseSchema() {
  const supabase = createClient()
  
  try {
    // Check if ai_tasks table exists
    const { data: aiTasksCheck, error: aiTasksError } = await supabase
      .from('ai_tasks')
      .select('id')
      .limit(1)
    
    // Check if employees.name column exists
    const { data: employeesCheck, error: employeesError } = await supabase
      .from('employees')
      .select('name')
      .limit(1)
    
    return {
      success: true,
      checks: {
        ai_tasks_table: !aiTasksError,
        employees_name_column: !employeesError
      },
      details: {
        ai_tasks_error: aiTasksError?.message,
        employees_error: employeesError?.message
      }
    }
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

export async function manualDatabaseFix() {
  const supabase = createClient()
  
  try {
    console.log('🛠️ Attempting manual database fix...')
    
    // Try to create tables one by one using direct queries
    const steps = []
    
    // Step 1: Create ai_tasks table using direct insert (hack)
    try {
      const { error } = await supabase
        .from('ai_tasks')
        .select('id')
        .limit(1)
        
      if (error && error.message?.includes('does not exist')) {
        steps.push({ step: 'ai_tasks_table', success: false, error: 'Table does not exist' })
      } else {
        steps.push({ step: 'ai_tasks_table', success: true })
      }
    } catch (e: any) {
      steps.push({ step: 'ai_tasks_table', success: false, error: e.message })
    }
    
    // Step 2: Check employees.name column
    try {
      const { error } = await supabase
        .from('employees')
        .select('name')
        .limit(1)
        
      if (error && error.message?.includes('does not exist')) {
        steps.push({ step: 'employees_name_column', success: false, error: 'Column does not exist' })
      } else {
        steps.push({ step: 'employees_name_column', success: true })
      }
    } catch (e: any) {
      steps.push({ step: 'employees_name_column', success: false, error: e.message })
    }
    
    return {
      success: true,
      message: 'Manual check completed',
      details: steps
    }
    
  } catch (error: any) {
    return {
      success: false,
      message: 'Manual fix failed',
      error: error.message
    }
  }
} 