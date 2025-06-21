// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:51:57.546Z
// Original file backed up as: cleanup-ai-tasks-sales-only.js.backup


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
 * Clean Up AI Tasks - Sales Only
 * ===============================
 * Remove non-sales tasks and update system to generate sales-only tasks
 */

const { Pool } = require('pg');

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY'

async function cleanupToSalesOnly() {
  try {
    // PostgreSQL connection - see pool configuration below
    
    console.log('🧹 Cleaning AI Tasks to Sales-Only...\n')
    
    // More precise categorization
    const nonSalesTaskIds = []
    const salesTaskIds = []
    
    // Get all tasks for precise review
    const { data: allTasks, error } = await supabase
      .from('ai_tasks')
      .select('*')
      .order('id')
    
    if (error) {
      console.error('❌ Error fetching tasks:', error)
      return
    }
    
    console.log('📋 PRECISE CATEGORIZATION:\n')
    
    allTasks.forEach(task => {
      const title = task.task_title || task.title || 'Unknown'
      const leadId = task.lead_id
      const quotationId = task.quotation_id
      
      // Very specific sales criteria
      const isSalesTask = (
        // Has direct lead or quotation connection
        leadId !== null ||
        quotationId !== null ||
        // Specific sales activities
        title.toLowerCase().includes('contact with') ||
        title.toLowerCase().includes('quotation') ||
        title.toLowerCase().includes('follow-up') ||
        title.toLowerCase().includes('payment follow-up') ||
        title.toLowerCase().includes('client meeting') ||
        title.toLowerCase().includes('approve quotation')
      )
      
      // NOT sales tasks (administrative/operational)
      const isNonSalesTask = (
        title.toLowerCase().includes('crm training') ||
        title.toLowerCase().includes('database optimization') ||
        title.toLowerCase().includes('contract terms') ||
        title.toLowerCase().includes('generate leads') || // This is marketing, not sales follow-up
        title.toLowerCase().includes('backup') ||
        title.toLowerCase().includes('system') ||
        title.toLowerCase().includes('training')
      )
      
      if (isNonSalesTask || !isSalesTask) {
        nonSalesTaskIds.push(task.id)
        console.log(`❌ NON-SALES: Task ${task.id}: ${title}`)
      } else {
        salesTaskIds.push(task.id)
        console.log(`✅ SALES: Task ${task.id}: ${title}`)
      }
    })
    
    console.log(`\n📊 SUMMARY:`)
    console.log(`✅ Sales tasks to keep: ${salesTaskIds.length}`)
    console.log(`❌ Non-sales tasks to remove: ${nonSalesTaskIds.length}`)
    
    if (nonSalesTaskIds.length > 0) {
      console.log(`\n🗑️  Deleting non-sales tasks: [${nonSalesTaskIds.join(', ')}]`)
      
      // Delete non-sales tasks
      const { error: deleteError } = await supabase
        .from('ai_tasks')
        .delete()
        .in('id', nonSalesTaskIds)
      
      if (deleteError) {
        console.error('❌ Error deleting tasks:', deleteError)
        return
      }
      
      console.log(`✅ Successfully deleted ${nonSalesTaskIds.length} non-sales tasks`)
    }
    
    // Verify cleanup
    const { data: remainingTasks, error: verifyError } = await supabase
      .from('ai_tasks')
      .select('id, task_title, lead_id, quotation_id')
      .order('id')
    
    if (verifyError) {
      console.error('❌ Error verifying cleanup:', verifyError)
      return
    }
    
    console.log(`\n✅ CLEANUP COMPLETE!`)
    console.log(`📋 Remaining tasks: ${remainingTasks.length}`)
    console.log('\n🎯 SALES-ONLY TASKS REMAINING:')
    remainingTasks.forEach(task => {
      console.log(`   • Task ${task.id}: ${task.task_title} (Lead: ${task.lead_id || 'None'}, Quote: ${task.quotation_id || 'None'})`)
    })
    
    console.log('\n🚀 AI Tasks system is now SALES-ONLY focused!')
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
  }
}

// Run the cleanup
cleanupToSalesOnly() 