import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

/**
 * 🗄️ DATABASE TABLE CREATION - PostgreSQL Version
 * ================================================
 * 
 * Creates the task sequence management tables in PostgreSQL
 */

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function POST() {
  try {
    const client = await pool.connect()
    
    try {
      console.log('🗄️ Creating task sequence management tables in PostgreSQL...')

      // Begin transaction for atomic table creation
      await client.query('BEGIN')

      // Create task_sequence_templates table
      const createTemplatesTable = `
        CREATE TABLE IF NOT EXISTS task_sequence_templates (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100) DEFAULT 'sales_followup',
          is_active BOOLEAN DEFAULT TRUE,
          created_by VARCHAR(100) DEFAULT 'Admin',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `

      // Create sequence_steps table  
      const createStepsTable = `
        CREATE TABLE IF NOT EXISTS sequence_steps (
          id SERIAL PRIMARY KEY,
          sequence_template_id INTEGER REFERENCES task_sequence_templates(id) ON DELETE CASCADE,
          step_number INTEGER NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          icon VARCHAR(50) DEFAULT 'target',
          due_after_hours INTEGER DEFAULT 24,
          priority VARCHAR(20) DEFAULT 'medium',
          is_conditional BOOLEAN DEFAULT FALSE,
          condition_type VARCHAR(100),
          condition_value TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `

      // Create sequence_rules table
      const createRulesTable = `
        CREATE TABLE IF NOT EXISTS sequence_rules (
          id SERIAL PRIMARY KEY,
          sequence_template_id INTEGER REFERENCES task_sequence_templates(id) ON DELETE CASCADE,
          rule_type VARCHAR(100) NOT NULL,
          condition_field VARCHAR(100) NOT NULL,
          condition_operator VARCHAR(20) NOT NULL,
          condition_value TEXT NOT NULL,
          action_type VARCHAR(100) NOT NULL,
          action_data JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `

      // Create indexes for performance
      const createIndexes = `
        CREATE INDEX IF NOT EXISTS idx_sequence_steps_template_id ON sequence_steps(sequence_template_id);
        CREATE INDEX IF NOT EXISTS idx_sequence_steps_step_number ON sequence_steps(step_number);
        CREATE INDEX IF NOT EXISTS idx_sequence_rules_template_id ON sequence_rules(sequence_template_id);
        CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_sequence_templates(category);
        CREATE INDEX IF NOT EXISTS idx_task_templates_active ON task_sequence_templates(is_active);
      `

      // Execute table creation
      console.log('📊 Creating tables...')
      await client.query(createTemplatesTable)
      console.log('✅ task_sequence_templates table created')
      
      await client.query(createStepsTable)
      console.log('✅ sequence_steps table created')
      
      await client.query(createRulesTable)
      console.log('✅ sequence_rules table created')
      
      await client.query(createIndexes)
      console.log('✅ Indexes created')

      // Insert sample data
      console.log('📊 Inserting sample data...')

      // Insert standard template
      const insertTemplateQuery = `
        INSERT INTO task_sequence_templates (name, description, category, metadata)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `
      
      const templateResult = await client.query(insertTemplateQuery, [
        'Standard Photography Follow-up',
        'Default follow-up sequence for photography quotations',
        'sales_followup',
        JSON.stringify({
          total_steps: 5,
          estimated_duration_days: 7,
          success_rate: 0.65
        })
      ])

      const templateId = templateResult.rows[0].id
      console.log(`✅ Standard template created with ID: ${templateId}`)

      // Insert steps for the standard template
      const sampleSteps = [
        [templateId, 1, 'Initial Follow-up Call', 'Call client to confirm quotation receipt and answer initial questions', 'phone', 2, 'high', JSON.stringify({
          estimated_duration: '15-20 minutes',
          success_criteria: ['Client confirms receipt', 'Initial questions answered']
        })],
        [templateId, 2, 'WhatsApp Check-in', 'Send WhatsApp message asking for quotation review status', 'message', 24, 'medium', JSON.stringify({
          estimated_duration: '5 minutes',
          success_criteria: ['Message delivered', 'Client response received']
        })],
        [templateId, 3, 'Detailed Discussion', 'Schedule detailed discussion about services and deliverables', 'target', 72, 'medium', JSON.stringify({
          estimated_duration: '30-45 minutes',
          success_criteria: ['Meeting scheduled', 'Requirements clarified']
        })],
        [templateId, 4, 'Payment Discussion', 'Discuss payment terms and advance payment', 'dollar', 120, 'high', JSON.stringify({
          estimated_duration: '20-30 minutes',
          success_criteria: ['Payment terms agreed', 'Advance discussed']
        })],
        [templateId, 5, 'Final Follow-up', 'Final follow-up to close deal or understand rejection', 'clipboard', 168, 'medium', JSON.stringify({
          estimated_duration: '15-20 minutes',
          success_criteria: ['Deal closed OR rejection reason understood']
        })]
      ]

      const insertStepQuery = `
        INSERT INTO sequence_steps (
          sequence_template_id, step_number, title, description, icon, 
          due_after_hours, priority, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `

      for (const step of sampleSteps) {
        await client.query(insertStepQuery, step)
      }

      console.log(`✅ ${sampleSteps.length} steps created for standard template`)

      // Create high-value template
      const hvTemplateResult = await client.query(insertTemplateQuery, [
        'High-Value Client Sequence',
        'Premium follow-up for quotations above ₹1,00,000',
        'premium_followup',
        JSON.stringify({
          total_steps: 5,
          estimated_duration_days: 5,
          success_rate: 0.85,
          value_threshold: 100000
        })
      ])

      const hvTemplateId = hvTemplateResult.rows[0].id

      // Insert high-value steps
      const hvSteps = [
        [hvTemplateId, 1, 'Priority Call', 'Immediate priority call for high-value client', 'phone', 1, 'high', JSON.stringify({ priority_level: 'urgent' })],
        [hvTemplateId, 2, 'Team Strategy Meeting', 'Internal team discussion for high-value deal strategy', 'users', 12, 'high', JSON.stringify({ meeting_type: 'internal' })],
        [hvTemplateId, 3, 'Personalized Proposal', 'Create and present personalized proposal', 'target', 24, 'high', JSON.stringify({ customization_required: true })],
        [hvTemplateId, 4, 'Executive Meeting', 'Meeting with decision makers and executives', 'users', 48, 'high', JSON.stringify({ executive_level: true })],
        [hvTemplateId, 5, 'Contract Finalization', 'Finalize contract terms and payment', 'dollar', 72, 'high', JSON.stringify({ contract_ready: true })]
      ]

      for (const step of hvSteps) {
        await client.query(insertStepQuery, step)
      }

      console.log(`✅ ${hvSteps.length} steps created for high-value template`)

      // Commit transaction
      await client.query('COMMIT')
      console.log('✅ All operations completed successfully!')

      // Verify table creation
      const verifyQuery = `
        SELECT 
          t.name as template_name,
          t.category,
          COUNT(s.id) as step_count
        FROM task_sequence_templates t
        LEFT JOIN sequence_steps s ON t.id = s.sequence_template_id
        GROUP BY t.id, t.name, t.category
        ORDER BY t.id
      `
      
      const verificationResult = await client.query(verifyQuery)

      return NextResponse.json({
        success: true,
        message: 'Database tables created and sample data inserted successfully',
        database: 'PostgreSQL localhost:5432',
        tables_created: [
          'task_sequence_templates',
          'sequence_steps', 
          'sequence_rules'
        ],
        indexes_created: 5,
        sample_data: {
          templates_created: 2,
          total_steps: sampleSteps.length + hvSteps.length,
          templates: verificationResult.rows
        },
        sql_schemas: {
          templates: createTemplatesTable.trim(),
          steps: createStepsTable.trim(),
          rules: createRulesTable.trim()
        },
        metadata: {
          source: "Direct PostgreSQL Admin",
          operation: "Table Creation",
          timestamp: new Date().toISOString()
        }
      })

    } catch (error: any) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('❌ Database setup error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to setup database tables',
      details: {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      },
      database: 'PostgreSQL localhost:5432',
      recovery_instructions: [
        '1. Check if PostgreSQL is running on localhost:5432',
        '2. Verify database permissions for user "vikasalagarsamy"',
        '3. Check if tables already exist and have different schema',
        '4. Review the error details above for specific issues'
      ],
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET endpoint to show table information
export async function GET() {
  try {
    const client = await pool.connect()
    
    try {
      // Check if tables exist
      const tableExistsQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('task_sequence_templates', 'sequence_steps', 'sequence_rules')
        ORDER BY table_name
      `
      
      const existingTables = await client.query(tableExistsQuery)
      
      let tableStats = []
      if (existingTables.rows.length > 0) {
        // Get table statistics
        const statsQuery = `
          SELECT 
            'task_sequence_templates' as table_name,
            COUNT(*) as row_count
          FROM task_sequence_templates
          UNION ALL
          SELECT 'sequence_steps', COUNT(*) FROM sequence_steps
          UNION ALL  
          SELECT 'sequence_rules', COUNT(*) FROM sequence_rules
        `
        
        const statsResult = await client.query(statsQuery)
        tableStats = statsResult.rows
      }
      
      return NextResponse.json({
        status: "Database Table Creator - PostgreSQL",
        database: "PostgreSQL localhost:5432",
        tables: {
          target_tables: ['task_sequence_templates', 'sequence_steps', 'sequence_rules'],
          existing_tables: existingTables.rows.map(r => r.table_name),
          statistics: tableStats
        },
        operations: {
          create: "POST /api/admin/create-tables - Creates all sequence management tables",
          verify: "GET /api/admin/create-tables - Shows current table status"
        },
        features: [
          "Atomic table creation with transactions",
          "Performance indexes automatically created",
          "Sample data insertion with real business scenarios",
          "Foreign key relationships with CASCADE delete"
        ],
        metadata: {
          version: "2.0.0",
          migrationPhase: "Phase 4.2",
          timestamp: new Date().toISOString()
        }
      })
      
    } finally {
      client.release()
    }
  } catch (error: any) {
    return NextResponse.json({
      status: "Database connection error",
      error: error.message
    }, { status: 500 })
  }
} 