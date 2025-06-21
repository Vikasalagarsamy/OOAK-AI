// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:51:57.546Z
// Original file backed up as: implement-clean-task-workflow.js.backup


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
 * Clean Task Workflow Implementation
 * ==================================
 * Fix current duplicate tasks and implement proper sequential workflow
 */

const { Pool } = require('pg');

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY'

async function implementCleanTaskWorkflow() {
  try {
    // PostgreSQL connection - see pool configuration below
    
    console.log('🧹 CLEANING UP TASK WORKFLOW')
    console.log('=' * 50)
    
    // 1. Archive current problematic tasks
    console.log('📦 STEP 1: Archive current duplicate tasks')
    
    const problematicTasks = [
      { id: 10, reason: 'Duplicate quotation approval without clear client context' },
      { id: 16, reason: 'Vague "critical client" - no specific client identified' },
      { id: 12, reason: 'Meeting task without prior contact/qualification' }
    ]
    
    for (const task of problematicTasks) {
      const { error } = await supabase
        .from('ai_tasks')
        .update({ 
          status: 'archived',
          notes: `Archived: ${task.reason}. Replaced with sequential workflow.`
        })
        .eq('id', task.id)
        
      if (error) {
        console.error(`❌ Error archiving task ${task.id}:`, error)
      } else {
        console.log(`✅ Archived Task ${task.id}: ${task.reason}`)
      }
    }
    
    // 2. Create proper sequential tasks
    console.log('\n🎯 STEP 2: Create proper sequential tasks')
    
    const properTasks = [
      {
        task_title: 'Initial contact with Global Tech Solutions',
        task_description: 'Make first contact with Global Tech Solutions to understand their requirements and establish communication.',
        client_name: 'Global Tech Solutions',
        assigned_employee: 'Navya N Kumar',
        priority: 'medium',
        estimated_value: 250000,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        task_type: 'contact',
        stage: 'initial_contact',
        status: 'pending',
        task_category: 'sales'
      },
      {
        task_title: 'Contact Jothi Alagarsamy for requirements clarification',
        task_description: 'Reach out to Jothi Alagarsamy to clarify requirements before finalizing quotation.',
        client_name: 'Jothi Alagarsamy', 
        assigned_employee: 'Navya N Kumar',
        priority: 'high',
        estimated_value: 43500,
        due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        task_type: 'contact',
        stage: 'requirement_clarification',
        status: 'pending',
        task_category: 'sales'
      }
    ]
    
    for (const taskData of properTasks) {
      const { data: newTask, error } = await supabase
        .from('ai_tasks')
        .insert([taskData])
        .select()
        .single()
        
      if (error) {
        console.error(`❌ Error creating task:`, error)
      } else {
        console.log(`✅ Created Task ${newTask.id}: ${newTask.task_title}`)
        console.log(`   Client: ${newTask.client_name}`)
        console.log(`   Value: ₹${newTask.estimated_value?.toLocaleString()}`)
        console.log(`   Stage: ${newTask.stage}`)
        console.log()
      }
    }
    
    // 3. Show the new clean workflow
    console.log('🎯 STEP 3: New clean workflow structure')
    console.log('=' * 50)
    
    const { data: activeTasks, error: activeError } = await supabase
      .from('ai_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true })
    
    if (activeError) {
      console.error('❌ Error fetching active tasks:', activeError)
      return
    }
    
    console.log('\n📋 ACTIVE TASKS (Cleaned up):')
    activeTasks.forEach((task, index) => {
      console.log(`${index + 1}. Task ${task.id}: ${task.task_title}`)
      console.log(`   👤 Client: ${task.client_name}`)
      console.log(`   👨‍💼 Assigned: ${task.assigned_employee}`)
      console.log(`   💰 Value: ₹${task.estimated_value?.toLocaleString()}`)
      console.log(`   🎯 Stage: ${task.stage}`)
      console.log(`   ⏰ Due: ${new Date(task.due_date).toLocaleDateString()}`)
      console.log()
    })
    
    // 4. Explain the sequential workflow
    console.log('📈 SEQUENTIAL WORKFLOW EXPLANATION:')
    console.log('=' * 50)
    console.log('🎯 ONE task per client at a time')
    console.log('📋 When employee completes a task, next stage auto-creates')
    console.log('')
    console.log('Example for "Global Tech Solutions":')
    console.log('Stage 1: ✅ "Contact Global Tech" → Complete → Auto-create Stage 2')
    console.log('Stage 2: 🔄 "Qualify Global Tech requirements" → Complete → Auto-create Stage 3')
    console.log('Stage 3: 🔄 "Prepare quotation for Global Tech" → Complete → Auto-create Stage 4')
    console.log('Stage 4: 🔄 "Follow up Global Tech quotation" → Complete → DONE ✅')
    console.log('')
    console.log('💡 This eliminates:')
    console.log('   ❌ Duplicate tasks for same client')
    console.log('   ❌ Confusion about which task to do first')
    console.log('   ❌ Multiple people working on same client')  
    console.log('   ❌ Tasks with unclear context')
    
    return activeTasks
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
  }
}

// Run the cleanup
implementCleanTaskWorkflow() 