// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:40:16.380Z
// Original file backed up as: fix-task-lead-links.js.backup


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
const { Pool } = require('pg');)

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZn60CzaoQpLOsXaLaH0AOXfuT0CzwwKqUaY'

// PostgreSQL connection - see pool configuration below

async function fixTaskLeadLinks() {
  try {
    console.log('🔗 Fixing task-lead links...')
    
    // Get all tasks without lead_id but with client_name
    const { data: tasks, error: tasksError } = await supabase
      .from('ai_tasks')
      .select('id, client_name, lead_id')
      .is('lead_id', null)
      .not('client_name', 'is', null)
    
    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError)
      return
    }
    
    console.log(`📋 Found ${tasks.length} tasks without lead_id`)
    
    // Get all leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, client_name')
    
    if (leadsError) {
      console.error('❌ Error fetching leads:', leadsError)
      return
    }
    
    console.log(`👥 Found ${leads.length} leads`)
    
    // Match tasks to leads by client name
    const updates = []
    for (const task of tasks) {
      const matchingLead = leads.find(lead => 
        lead.client_name?.toLowerCase().trim() === task.client_name?.toLowerCase().trim()
      )
      
      if (matchingLead) {
        updates.push({
          taskId: task.id,
          leadId: matchingLead.id,
          clientName: task.client_name
        })
        console.log(`✅ Match found: Task "${task.client_name}" → Lead ${matchingLead.id}`)
      } else {
        console.log(`⚠️ No lead found for task client: "${task.client_name}"`)
      }
    }
    
    console.log(`🔗 Found ${updates.length} task-lead matches to update`)
    
    // Update tasks with lead_id
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('ai_tasks')
        .update({ lead_id: update.leadId })
        .eq('id', update.taskId)
      
      if (updateError) {
        console.error(`❌ Failed to update task ${update.taskId}:`, updateError)
      } else {
        console.log(`✅ Updated task ${update.taskId} (${update.clientName}) with lead_id ${update.leadId}`)
      }
    }
    
    console.log('🎉 Task-lead linking complete!')
    
  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

fixTaskLeadLinks() 