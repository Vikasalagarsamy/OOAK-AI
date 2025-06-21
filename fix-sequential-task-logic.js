// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:40:16.379Z
// Original file backed up as: fix-sequential-task-logic.js.backup


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
 * Fix Sequential Task Logic
 * =========================
 * Implement ONE task per lead/quotation at a time
 * Tasks progress sequentially: Contact → Qualify → Quote → Follow-up
 */

const { Pool } = require('pg');

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY'

async function fixSequentialTaskLogic() {
  try {
    // PostgreSQL connection - see pool configuration below
    
    console.log('🔧 FIXING SEQUENTIAL TASK LOGIC')
    console.log('=' * 40)
    console.log('Goal: ONE task per lead/quotation at a time\n')
    
    // 1. Get all current tasks
    const { data: allTasks, error: tasksError } = await supabase
      .from('ai_tasks')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError)
      return
    }
    
    console.log(`📋 Current tasks: ${allTasks.length}`)
    
    // 2. Group tasks by client/lead/quotation
    const taskGroups = {}
    
    allTasks.forEach(task => {
      const clientName = task.client_name || 'Unknown'
      const leadId = task.lead_id
      const quotationId = task.quotation_id
      
      // Create unique key for grouping
      let groupKey = clientName
      if (leadId) groupKey += `-lead-${leadId}`
      if (quotationId) groupKey += `-quote-${quotationId}`
      
      if (!taskGroups[groupKey]) {
        taskGroups[groupKey] = []
      }
      taskGroups[groupKey].push(task)
    })
    
    console.log('\n🔍 DUPLICATE TASK ANALYSIS:')
    console.log('=' * 40)
    
    const duplicateGroups = []
    const singleTasks = []
    
    Object.entries(taskGroups).forEach(([groupKey, tasks]) => {
      if (tasks.length > 1) {
        duplicateGroups.push({ key: groupKey, tasks })
        console.log(`❌ DUPLICATES: ${groupKey} (${tasks.length} tasks)`)
        tasks.forEach(task => {
          console.log(`   • Task ${task.id}: ${task.task_title}`)
        })
        console.log()
      } else {
        singleTasks.push(tasks[0])
      }
    })
    
    console.log(`📊 SUMMARY:`)
    console.log(`✅ Single tasks: ${singleTasks.length}`)
    console.log(`❌ Duplicate groups: ${duplicateGroups.length}`)
    console.log(`🗑️  Total duplicates to resolve: ${allTasks.length - singleTasks.length}`)
    
    // 3. Propose sequential logic
    console.log('\n💡 PROPOSED SEQUENTIAL LOGIC:')
    console.log('=' * 40)
    
    for (const group of duplicateGroups) {
      const { key, tasks } = group
      console.log(`\n🎯 GROUP: ${key}`)
      
      // Determine the logical sequence
      const sequence = determineTaskSequence(tasks)
      
      console.log('   CURRENT (Duplicates):')
      tasks.forEach(task => {
        console.log(`   ❌ Task ${task.id}: ${task.task_title}`)
      })
      
      console.log('   SHOULD BE (Sequential):')
      console.log(`   ✅ ONE TASK: ${sequence.recommendedTask.task_title}`)
      console.log(`   📋 Next steps: ${sequence.nextSteps.join(' → ')}`)
      
      console.log(`   🗑️  DELETE: Tasks [${sequence.tasksToDelete.map(t => t.id).join(', ')}]`)
    }
    
    // 4. Show proposed fix
    console.log('\n🚀 RECOMMENDED ACTION:')
    console.log('=' * 40)
    console.log('1. Keep ONE task per client (the most appropriate one)')
    console.log('2. Delete duplicate tasks')
    console.log('3. Update task generation logic to prevent duplicates')
    console.log('4. Implement sequential workflow')
    
    console.log('\n🎯 SEQUENTIAL WORKFLOW DESIGN:')
    console.log('=' * 40)
    console.log('Lead Stage 1: "Contact [Client]" → Complete → Auto-create Stage 2')
    console.log('Lead Stage 2: "Qualify [Client]" → Complete → Auto-create Stage 3') 
    console.log('Lead Stage 3: "Prepare Quote for [Client]" → Complete → Auto-create Stage 4')
    console.log('Lead Stage 4: "Follow up [Client] Quote" → Complete → DONE')
    
    return { duplicateGroups, singleTasks }
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

/**
 * Determine the best task sequence for a group of duplicate tasks
 */
function determineTaskSequence(tasks) {
  // Define priority order for task types
  const taskPriority = {
    'contact': 1,        // Initial contact first
    'qualify': 2,        // Qualification second  
    'quotation': 3,      // Quotation prep/approval third
    'followup': 4,       // Follow-up last
    'payment': 5,        // Payment collection final
    'meeting': 2.5       // Meetings can happen during qualification
  }
  
  // Categorize each task
  const categorizedTasks = tasks.map(task => {
    const title = task.task_title.toLowerCase()
    let category = 'other'
    let priority = 10
    
    if (title.includes('contact') || title.includes('initial')) {
      category = 'contact'
      priority = taskPriority.contact
    } else if (title.includes('qualify') || title.includes('qualification')) {
      category = 'qualify' 
      priority = taskPriority.qualify
    } else if (title.includes('quotation') || title.includes('quote') || title.includes('approve')) {
      category = 'quotation'
      priority = taskPriority.quotation
    } else if (title.includes('follow') || title.includes('follow-up')) {
      category = 'followup'
      priority = taskPriority.followup
    } else if (title.includes('payment')) {
      category = 'payment'
      priority = taskPriority.payment
    } else if (title.includes('meeting')) {
      category = 'meeting'
      priority = taskPriority.meeting
    }
    
    return { ...task, category, priority }
  })
  
  // Sort by priority (lowest number = highest priority)
  categorizedTasks.sort((a, b) => a.priority - b.priority)
  
  // The first task should be kept, others deleted
  const recommendedTask = categorizedTasks[0]
  const tasksToDelete = categorizedTasks.slice(1)
  
  // Generate next steps based on current stage
  const nextSteps = generateNextSteps(recommendedTask.category)
  
  return {
    recommendedTask,
    tasksToDelete,
    nextSteps
  }
}

/**
 * Generate logical next steps for sequential workflow
 */
function generateNextSteps(currentCategory) {
  const workflows = {
    'contact': ['Qualify requirements', 'Prepare quotation', 'Follow up'],
    'qualify': ['Prepare quotation', 'Follow up'], 
    'quotation': ['Follow up', 'Payment collection'],
    'meeting': ['Qualify requirements', 'Prepare quotation', 'Follow up'],
    'followup': ['Payment collection'],
    'payment': ['Task complete']
  }
  
  return workflows[currentCategory] || ['Review and plan next action']
}

// Run the fix
fixSequentialTaskLogic() 