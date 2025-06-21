import { query, transaction } from '@/lib/postgresql-client'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 📋 DEPARTMENT INSTRUCTION APPROVAL SYSTEM
 * =========================================
 * 
 * Final workflow step: Approves department instructions and routes to accounting/post-sales
 */

export async function POST(request: NextRequest) {
  try {
    console.log('📋 [INSTRUCTION APPROVAL] Processing approval via PostgreSQL...')
    
    const { 
      instructionId, 
      approval_status, // 'approved' or 'rejected'
      approverComments,
      approvedBy 
    } = await request.json()

    console.log('📋 Processing instruction approval for ID:', instructionId)

    // Start transaction for complex workflow approval
    await transaction(async (client) => {
      // 1️⃣ Get instruction details
      const instructionResult = await client.query(`
        SELECT 
          di.*,
          q.quotation_number,
          q.client_name,
          p.amount,
          p.payment_type,
          p.payment_reference
        FROM department_instructions di
        JOIN quotations q ON di.quotation_id = q.id
        LEFT JOIN payments p ON di.payment_id = p.id
        WHERE di.id = $1
      `, [instructionId])

      if (instructionResult.rows.length === 0) {
        throw new Error('Instruction not found')
      }

      const instruction = instructionResult.rows[0]

      // 2️⃣ Update instruction approval status
      await client.query(`
        UPDATE instruction_approvals
        SET 
          approval_status = $1,
          approved_by = $2,
          approved_at = NOW(),
          comments = $3
        WHERE instruction_id = $4
      `, [approval_status, approvedBy, approverComments, instructionId])

      // 3️⃣ Update instruction status
      await client.query(`
        UPDATE department_instructions
        SET 
          status = $1,
          updated_at = NOW()
        WHERE id = $2
      `, [approval_status, instructionId])

      if (approval_status === 'approved') {
        // 4️⃣ ROUTE TO ACCOUNTING & POST-SALES
        await routeToAccountingAndPostSales(client, instruction)
        
        // 5️⃣ Create completion tasks
        await createCompletionTasks(client, instruction)
        
        console.log('✅ Instructions approved and routed to accounting/post-sales via PostgreSQL')
      } else {
        console.log('❌ Instructions rejected, creating revision task')
        await createRevisionTask(client, instruction, approverComments)
      }
    })

    return NextResponse.json({
      success: true,
      status: approval_status,
      instructionId,
      message: `Instructions ${approval_status} successfully`
    })

  } catch (error) {
    console.error('❌ Instruction approval error (PostgreSQL):', error)
    return NextResponse.json({ 
      error: 'Failed to process instruction approval',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * 💼 ROUTE TO ACCOUNTING & POST-SALES
 */
async function routeToAccountingAndPostSales(client: any, instruction: any) {
  try {
    console.log('💼 Routing to accounting and post-sales for:', instruction.quotation_number)

    // Create accounting workflow entry
    const accountingResult = await client.query(`
      INSERT INTO accounting_workflows (
        quotation_id,
        payment_id,
        instruction_id,
        status,
        total_amount,
        payment_type,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [
      instruction.quotation_id,
      instruction.payment_id,
      instruction.id,
      'pending_processing',
      instruction.amount,
      instruction.payment_type
    ])

    const accountingEntry = accountingResult.rows[0]

    // Create post-sales workflow entry  
    const postSalesResult = await client.query(`
      INSERT INTO post_sales_workflows (
        quotation_id,
        payment_id,
        instruction_id,
        client_name,
        status,
        instructions,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [
      instruction.quotation_id,
      instruction.payment_id,
      instruction.id,
      instruction.client_name,
      'pending_confirmation',
      instruction.instructions
    ])

    const postSalesEntry = postSalesResult.rows[0]

    // Create tasks for both teams
    await client.query(`
      INSERT INTO ai_tasks (
        task_title,
        task_description,
        priority,
        status,
        due_date,
        category,
        assigned_to,
        metadata
      ) VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8),
      ($9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      // Accounting task
      `💰 Process Payment - ${instruction.quotation_number}`,
      `Process advance payment of ₹${instruction.amount} for ${instruction.client_name}. Reference: ${instruction.payment_reference}`,
      'high',
      'pending',
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      'accounting_processing',
      'accounting_team',
      JSON.stringify({
        quotation_id: instruction.quotation_id,
        payment_id: instruction.payment_id,
        accounting_workflow_id: accountingEntry?.id,
        task_type: 'accounting_processing'
      }),
      // Post-sales task
      `📞 Post-Sales Confirmation - ${instruction.quotation_number}`,
      `Conduct post-sales confirmation call with ${instruction.client_name}. Follow department instructions provided.`,
      'high',
      'pending',
      new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      'post_sales_confirmation',
      'post_sales_team',
      JSON.stringify({
        quotation_id: instruction.quotation_id,
        payment_id: instruction.payment_id,
        post_sales_workflow_id: postSalesEntry?.id,
        task_type: 'post_sales_confirmation'
      })
    ])

    console.log('✅ Successfully routed to accounting and post-sales teams via PostgreSQL')

  } catch (error) {
    console.error('❌ Error routing to teams:', error)
    throw error
  }
}

/**
 * ✅ CREATE COMPLETION TASKS
 */
async function createCompletionTasks(client: any, instruction: any) {
  try {
    // Create project completion tracking tasks
    await client.query(`
      INSERT INTO ai_tasks (
        task_title,
        task_description,
        priority,
        status,
        due_date,
        category,
        metadata
      ) VALUES 
      ($1, $2, $3, $4, $5, $6, $7),
      ($8, $9, $10, $11, $12, $13, $14)
    `, [
      // Project setup completion
      `📋 Project Setup Complete - ${instruction.quotation_number}`,
      `All approvals complete. Project setup for ${instruction.client_name} is ready to begin.`,
      'medium',
      'pending',
      new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      'project_setup',
      JSON.stringify({
        quotation_id: instruction.quotation_id,
        instruction_id: instruction.id,
        task_type: 'project_setup'
      }),
      // Weekly progress tracking
      `📊 Weekly Progress Update - ${instruction.quotation_number}`,
      `Weekly progress update for ${instruction.client_name} project.`,
      'low',
      'pending',
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      'progress_tracking',
      JSON.stringify({
        quotation_id: instruction.quotation_id,
        instruction_id: instruction.id,
        task_type: 'progress_tracking'
      })
    ])

    console.log('✅ Completion tasks created via PostgreSQL')

  } catch (error) {
    console.error('❌ Error creating completion tasks:', error)
    throw error
  }
}

/**
 * 🔄 CREATE REVISION TASK
 */
async function createRevisionTask(client: any, instruction: any, rejectionReason: string) {
  try {
    // Create revision task for rejected instructions
    await client.query(`
      INSERT INTO ai_tasks (
        task_title,
        task_description,
        priority,
        status,
        due_date,
        category,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      `🔄 Revise Instructions - ${instruction.quotation_number}`,
      `Instructions for ${instruction.client_name} have been rejected. Reason: ${rejectionReason}\n\nPlease revise and resubmit for approval.`,
      'high',
      'pending',
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      'instruction_revision',
      JSON.stringify({
        quotation_id: instruction.quotation_id,
        instruction_id: instruction.id,
        rejection_reason: rejectionReason,
        task_type: 'instruction_revision'
      })
    ])

    console.log('✅ Revision task created via PostgreSQL')

  } catch (error) {
    console.error('❌ Error creating revision task:', error)
    throw error
  }
} 