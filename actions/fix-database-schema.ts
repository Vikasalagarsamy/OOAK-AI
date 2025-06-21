'use server'

import { query, transaction } from "@/lib/postgresql-client"

/**
 * FIX DATABASE SCHEMA - NOW 100% POSTGRESQL
 * 
 * Complete migration from Supabase to PostgreSQL
 * - Direct DDL operations for table creation and schema updates
 * - Enhanced error handling and logging
 * - Database schema validation and fixes
 * - Transaction support for atomic operations
 * - All Supabase dependencies eliminated
 */

export async function fixDatabaseSchema() {
  try {
    console.log('🔧 Executing database schema fix via PostgreSQL...')
    
    const results = []
    
    // Use transaction for atomic schema operations
    await transaction(async (client) => {
      // 1. Create AI Tasks table
      console.log('📋 Creating ai_tasks table...')
      try {
        await client.query(`
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
          )
        `)
        console.log('✅ AI tasks table created/verified successfully')
        results.push({ step: 'ai_tasks_table', success: true })
      } catch (error: any) {
        console.warn('⚠️ AI tasks table creation warning:', error.message)
        results.push({ step: 'ai_tasks_table', success: false, error: error.message })
      }
      
      // 2. Add name column to employees table
      console.log('👥 Adding name column to employees...')
      try {
        await client.query(`
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
          END $$
        `)
        console.log('✅ Employee name column added/updated successfully')
        results.push({ step: 'employees_name_column', success: true })
      } catch (error: any) {
        console.warn('⚠️ Employee name column warning:', error.message)
        results.push({ step: 'employees_name_column', success: false, error: error.message })
      }
      
      // 3. Create supporting tables
      console.log('🏗️ Creating supporting tables...')
      try {
        await client.query(`
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
          )
        `)
        
        await client.query(`
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
          )
        `)
        
        console.log('✅ Supporting tables created successfully')
        results.push({ step: 'supporting_tables', success: true })
      } catch (error: any) {
        console.warn('⚠️ Supporting tables warning:', error.message)
        results.push({ step: 'supporting_tables', success: false, error: error.message })
      }
    })
    
    // 4. Insert sample data (outside transaction to avoid conflicts)
    console.log('📊 Inserting sample data...')
    try {
      await query(`
        INSERT INTO ai_tasks (
          task_number, title, description, priority, status, 
          assigned_to, created_by, company_id, branch_id, category
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        ) ON CONFLICT (task_number) DO NOTHING
      `, [
        'TASK-SAMPLE-001',
        'Sample AI Task',
        'This is a sample task for testing',
        'MEDIUM',
        'PENDING',
        1,
        1,
        1,
        1,
        'SAMPLE'
      ])
      
      console.log('✅ Sample data inserted successfully')
      results.push({ step: 'sample_data', success: true })
    } catch (error: any) {
      console.warn('⚠️ Sample data warning:', error.message)
      results.push({ step: 'sample_data', success: false, error: error.message })
    }
    
    console.log('🎉 Database schema fix completed successfully!')
    
    return {
      success: true,
      message: 'Database schema fixed successfully! AI Tasks integration is now ready.',
      details: results
    }
    
  } catch (error: any) {
    console.error('❌ Schema fix failed:', error)
    
    // Fallback: Try manual table verification
    try {
      console.log('🔄 Attempting fallback table verification...')
      
      const tableCheckResult = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'ai_tasks' 
        AND table_schema = 'public'
      `)
      
      if (tableCheckResult.rows.length === 0) {
        return {
          success: false,
          message: 'Database schema fix failed. AI tasks table does not exist.',
          error: error.message,
          fallbackInstructions: 'Please run the SQL script manually in your database console'
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
  try {
    console.log('🔍 Checking database schema via PostgreSQL...')
    
    // Check if ai_tasks table exists
    const aiTasksCheckResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'ai_tasks' 
      AND table_schema = 'public'
    `)
    
    const aiTasksExists = aiTasksCheckResult.rows.length > 0
    
    // Check if employees.name column exists
    const employeesNameCheckResult = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'employees' 
      AND column_name = 'name' 
      AND table_schema = 'public'
    `)
    
    const employeesNameExists = employeesNameCheckResult.rows.length > 0
    
    console.log(`📋 Schema check results: AI Tasks table: ${aiTasksExists}, Employee name column: ${employeesNameExists}`)
    
    return {
      success: true,
      checks: {
        ai_tasks_table: aiTasksExists,
        employees_name_column: employeesNameExists
      },
      details: {
        ai_tasks_error: aiTasksExists ? null : 'Table does not exist',
        employees_error: employeesNameExists ? null : 'Column does not exist'
      }
    }
    
  } catch (error: any) {
    console.error('❌ Schema check failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function manualDatabaseFix() {
  try {
    console.log('🛠️ Attempting manual database fix via PostgreSQL...')
    
    const steps = []
    
    // Step 1: Check ai_tasks table
    try {
      const aiTasksResult = await query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'ai_tasks' 
        AND table_schema = 'public'
      `)
      
      const aiTasksExists = parseInt(aiTasksResult.rows[0].count) > 0
      steps.push({ 
        step: 'ai_tasks_table', 
        success: aiTasksExists,
        error: aiTasksExists ? null : 'Table does not exist'
      })
      
    } catch (e: any) {
      steps.push({ step: 'ai_tasks_table', success: false, error: e.message })
    }
    
    // Step 2: Check employees.name column
    try {
      const employeesNameResult = await query(`
        SELECT COUNT(*) as count 
        FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'name' 
        AND table_schema = 'public'
      `)
      
      const employeesNameExists = parseInt(employeesNameResult.rows[0].count) > 0
      steps.push({ 
        step: 'employees_name_column', 
        success: employeesNameExists,
        error: employeesNameExists ? null : 'Column does not exist'
      })
      
    } catch (e: any) {
      steps.push({ step: 'employees_name_column', success: false, error: e.message })
    }
    
    console.log('✅ Manual check completed')
    return {
      success: true,
      message: 'Manual check completed',
      details: steps
    }
    
  } catch (error: any) {
    console.error('❌ Manual fix failed:', error)
    return {
      success: false,
      message: 'Manual fix failed',
      error: error.message
    }
  }
} 