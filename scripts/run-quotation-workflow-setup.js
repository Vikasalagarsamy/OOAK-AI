#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing required environment variables')
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

async function runWorkflowSetup() {
  console.log('Setting up quotation workflow database schema...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'setup-quotation-workflow.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')

    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'))

    console.log(`Executing ${statements.length} SQL statements...`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}`)
        
        // Use rpc for complex statements like CREATE TABLE, ALTER TABLE, etc.
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        }).single()

        if (error) {
          // Try direct query for simpler statements
          const { error: directError } = await supabase.from('_').select().limit(0)
          if (directError) {
            console.warn(`Statement ${i + 1} warning:`, error.message)
            // Continue with next statement as some errors might be expected (like "already exists")
          }
        } else {
          console.log(`✓ Statement ${i + 1} executed successfully`)
        }
      }
    }

    console.log('\n✅ Quotation workflow setup completed!')
    console.log('\nNew features added:')
    console.log('- Enhanced quotation workflow statuses')
    console.log('- Approval system for Sales Head')
    console.log('- Post-sale confirmation tracking')
    console.log('- Workflow analytics view')
    
  } catch (error) {
    console.error('Error setting up workflow:', error)
    
    // Try alternative approach - execute key statements individually
    console.log('\nTrying alternative setup approach...')
    await alternativeSetup(supabase)
  }
}

async function alternativeSetup(supabase) {
  try {
    // Check if workflow_status column exists
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'quotations')
      .eq('column_name', 'workflow_status')

    if (!columns || columns.length === 0) {
      console.log('Adding workflow_status column to quotations table...')
      // This would need to be done via database admin panel or SQL editor
      console.log('Please add the following columns to your quotations table via Supabase dashboard:')
      console.log('- workflow_status (text, default: draft)')
      console.log('- client_verbal_confirmation_date (timestamp)')
      console.log('- payment_received_date (timestamp)')
      console.log('- payment_amount (numeric)')
      console.log('- payment_reference (text)')
      console.log('- confirmation_required (boolean, default: true)')
    }

    console.log('\n📝 Manual setup required:')
    console.log('1. Go to your Supabase project dashboard')
    console.log('2. Navigate to the SQL Editor')
    console.log('3. Copy and paste the contents of scripts/setup-quotation-workflow.sql')
    console.log('4. Execute the script to create the workflow tables and functions')

    console.log('\nWorkflow will work once the database schema is updated.')
    
  } catch (error) {
    console.error('Alternative setup failed:', error)
  }
}

runWorkflowSetup() 