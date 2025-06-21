// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:51:57.548Z
// Original file backed up as: test-lead-to-task-automation.js.backup


// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DATABASE || 'ooak_future',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});


// Query helper function
async function query(text, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return { data: result.rows, error: null };
  } catch (error) {
    console.error('❌ PostgreSQL Query Error:', error.message);
    return { data: null, error: error.message };
  } finally {
    client.release();
  }
}

// Transaction helper function  
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return { data: result, error: null };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ PostgreSQL Transaction Error:', error.message);
    return { data: null, error: error.message };
  } finally {
    client.release();
  }
}

// Original content starts here:
#!/usr/bin/env node

/**
 * Test Lead-to-Task Automation
 * =============================
 * This script manually triggers the lead assignment automation
 * to identify why tasks aren't being created from leads.
 */

const { Pool } = require('pg');

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY'

async function testLeadToTaskAutomation() {
  try {
    // PostgreSQL connection - see pool configuration below
    
    console.log('🔍 Testing Lead-to-Task Automation...\n')
    
    // 1. Check recent leads
    console.log('1️⃣ Checking recent leads...')
    const { data: recentLeads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (leadsError) {
      console.error('❌ Error fetching leads:', leadsError)
      return
    }
    
    console.log(`📋 Found ${recentLeads.length} recent leads:`)
    recentLeads.forEach(lead => {
      console.log(`   • Lead ${lead.id}: ${lead.client_name} - Status: ${lead.status} - Assigned: ${lead.assigned_to || 'None'}`)
    })
    
    // 2. Check current tasks
    console.log('\n2️⃣ Checking current tasks...')
    const { data: currentTasks, error: tasksError } = await supabase
      .from('ai_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError)
      return
    }
    
    console.log(`📋 Found ${currentTasks.length} recent tasks:`)
    currentTasks.forEach(task => {
      console.log(`   • Task ${task.id}: ${task.task_title || task.title} - Lead ID: ${task.lead_id || 'None'}`)
    })
    
    // 3. Check task generation logs
    console.log('\n3️⃣ Checking task generation logs...')
    const { data: logs, error: logsError } = await supabase
      .from('task_generation_log')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(5)
    
    if (logsError) {
      console.log('ℹ️ No task generation logs found (table might not exist)')
    } else {
      console.log(`📋 Found ${logs.length} generation logs:`)
      logs.forEach(log => {
        console.log(`   • Log: Lead ${log.lead_id} - Rule: ${log.rule_triggered} - Success: ${log.success}`)
      })
    }
    
    // 4. Test the API endpoint directly
    console.log('\n4️⃣ Testing AI task generation API...')
    try {
      const response = await fetch('http://localhost:3000/api/ai-tasks/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ AI Task Generation API Response:', result)
      } else {
        console.log('❌ AI Task Generation API failed:', response.status)
      }
    } catch (apiError) {
      console.log('❌ API test failed:', apiError.message)
    }
    
    // 5. Create a test lead assignment event
    console.log('\n5️⃣ Creating test lead assignment...')
    const testLead = recentLeads.find(lead => lead.status === 'ASSIGNED')
    
    if (testLead) {
      console.log(`🎯 Testing with lead: ${testLead.client_name} (ID: ${testLead.id})`)
      
      // Simulate the lead assignment hook call
      try {
        const hookResponse = await fetch('http://localhost:3000/api/test-lead-hook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            leadId: testLead.id,
            leadData: testLead,
            eventType: 'lead_assigned'
          })
        })
        
        if (hookResponse.ok) {
          const hookResult = await hookResponse.json()
          console.log('✅ Lead hook test result:', hookResult)
        } else {
          console.log('❌ Lead hook test failed - endpoint might not exist')
        }
      } catch (hookError) {
        console.log('❌ Lead hook test error:', hookError.message)
      }
    } else {
      console.log('ℹ️ No assigned leads found for testing')
    }
    
    console.log('\n✅ Test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testLeadToTaskAutomation() 