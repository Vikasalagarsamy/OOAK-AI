import { query, transaction } from '@/lib/postgresql-client'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 📝 QUOTATION REVISION SYSTEM
 * ============================
 * 
 * Handles quotation modifications after initial approval.
 * Maintains version history and re-triggers approval workflow.
 */

// Handle quotation revisions and price negotiations
export async function POST(request: NextRequest) {
  try {
    console.log('📝 [QUOTATION REVISION] Processing revision via PostgreSQL...')
    
    const { quotationId, newAmount, revisionReason, clientFeedback, negotiationNotes } = await request.json()

    console.log('📝 Processing quotation revision:', { quotationId, newAmount, revisionReason })

    if (!quotationId || !newAmount) {
      return NextResponse.json({ error: 'Quotation ID and new amount are required' }, { status: 400 })
    }

    // Get current quotation details
    const quotationResult = await query(`
      SELECT *
      FROM quotations
      WHERE id = $1
    `, [quotationId])

    if (quotationResult.rows.length === 0) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    const quotation = quotationResult.rows[0]
    const originalAmount = quotation.total_amount
    const discountPercent = ((originalAmount - newAmount) / originalAmount * 100).toFixed(1)

    console.log(`💰 Price revision: ₹${originalAmount.toLocaleString()} → ₹${newAmount.toLocaleString()} (${discountPercent}% ${newAmount < originalAmount ? 'discount' : 'increase'})`)

    // Start transaction for revision process
    await transaction(async (client) => {
      // Update quotation with new amount and revision details
      const negotiationHistory = quotation.negotiation_history || []
      negotiationHistory.push({
        timestamp: new Date().toISOString(),
        original_amount: originalAmount,
        revised_amount: newAmount,
        discount_percent: parseFloat(discountPercent),
        reason: revisionReason,
        client_feedback: clientFeedback,
        negotiation_notes: negotiationNotes
      })

      await client.query(`
        UPDATE quotations
        SET 
          total_amount = $1,
          status = 'pending_approval',
          workflow_status = 'pending_approval',
          updated_at = NOW(),
          revision_notes = $2,
          client_feedback = $3,
          negotiation_history = $4,
          revision_count = COALESCE(revision_count, 0) + 1
        WHERE id = $5
      `, [newAmount, revisionReason, clientFeedback, JSON.stringify(negotiationHistory), quotationId])

      // Create new approval record for the revised quotation
      await client.query(`
        INSERT INTO quotation_approvals (
          quotation_id,
          approval_status,
          comments,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, NOW(), NOW())
      `, [
        quotationId,
        'pending',
        `Revised quotation resubmitted. Amount changed from ₹${originalAmount.toLocaleString()} to ₹${newAmount.toLocaleString()} (${discountPercent}% ${newAmount < originalAmount ? 'discount' : 'increase'}). Reason: ${revisionReason}`
      ])

      // Complete the current revision task
      await client.query(`
        UPDATE ai_tasks
        SET 
          status = 'completed',
          completed_at = NOW(),
          completion_notes = $1
        WHERE quotation_id = $2 
          AND task_type = 'quotation_revision' 
          AND status = 'pending'
      `, [`Quotation revised successfully. Amount updated from ₹${originalAmount.toLocaleString()} to ₹${newAmount.toLocaleString()}. Resubmitted for approval.`, quotationId])

      // Create new approval task for Sales Head
      await createRevisionApprovalTask(client, quotation, {
        id: Date.now(), // Temporary ID
        revision_number: (quotation.revision_count || 0) + 1,
        original_amount: originalAmount,
        revised_amount: newAmount,
        discount_percent: parseFloat(discountPercent),
        revision_reason: revisionReason
      })
    })

    console.log('✅ Quotation revision completed and resubmitted for approval via PostgreSQL')

    return NextResponse.json({
      success: true,
      message: 'Quotation revised and resubmitted for approval',
      revision_details: {
        quotation_number: quotation.quotation_number,
        original_amount: originalAmount,
        revised_amount: newAmount,
        discount_percent: parseFloat(discountPercent),
        revision_count: (quotation.revision_count || 0) + 1
      }
    })

  } catch (error) {
    console.error('❌ Error in quotation revision (PostgreSQL):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * 🔢 GET NEXT REVISION NUMBER
 */
async function getNextRevisionNumber(quotationId: number): Promise<number> {
  const result = await query(`
    SELECT revision_number
    FROM quotation_revisions
    WHERE original_quotation_id = $1
    ORDER BY revision_number DESC
    LIMIT 1
  `, [quotationId])

  return result.rows.length > 0 ? result.rows[0].revision_number + 1 : 1
}

/**
 * 📧 NOTIFY SALES HEAD FOR REVISION APPROVAL
 */
async function notifySalesHeadForRevisionApproval(quotation: any, revision: any, reason: string) {
  try {
    console.log('📧 Notifying sales head about quotation revision:', quotation.quotation_number)
    
    // Create internal notification
    await query(`
      INSERT INTO notifications (
        recipient_role,
        type,
        title,
        message,
        data,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      'sales_head',
      'quotation_revision_approval',
      `Quotation Revision Approval Needed - ${quotation.quotation_number}`,
      `${quotation.client_name} quotation has been revised. Reason: ${reason}`,
      JSON.stringify({
        quotation_id: quotation.id,
        revision_id: revision.id,
        quotation_number: quotation.quotation_number
      })
    ])
  } catch (error) {
    console.error('❌ Error notifying sales head:', error)
  }
}

/**
 * ✅ CREATE REVISION APPROVAL TASK
 */
async function createRevisionApprovalTask(client: any, quotation: any, revision: any) {
  try {
    // Find Sales Head for approval
    const salesHeadResult = await client.query(`
      SELECT id, first_name, last_name
      FROM employees
      WHERE job_title ILIKE '%sales head%'
        AND status = 'active'
      LIMIT 1
    `)

    if (salesHeadResult.rows.length === 0) {
      console.warn('⚠️ No Sales Head found for revision approval task')
      return
    }

    const salesHead = salesHeadResult.rows[0]

    // Create approval task
    await client.query(`
      INSERT INTO ai_tasks (
        task_title,
        task_description,
        task_type,
        priority,
        status,
        assigned_to_employee_id,
        assigned_to,
        quotation_id,
        due_date,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      `📝 Revised Quotation Approval - ${quotation.quotation_number}`,
      `Quotation ${quotation.quotation_number} has been revised and requires your approval.\n\nRevision Details:\n- Original Amount: ₹${revision.original_amount.toLocaleString()}\n- Revised Amount: ₹${revision.revised_amount.toLocaleString()}\n- Change: ${revision.discount_percent}%\n- Reason: ${revision.revision_reason}`,
      'quotation_approval',
      'high',
      'pending',
      salesHead.id,
      `${salesHead.first_name} ${salesHead.last_name}`,
      quotation.id,
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      JSON.stringify({
        revision_number: revision.revision_number,
        quotation_number: quotation.quotation_number,
        revision_type: 'price_revision'
      })
    ])

  } catch (error) {
    console.error('❌ Error creating revision approval task:', error)
  }
}

// GET endpoint to fetch revision history
export async function GET(request: NextRequest) {
  try {
    console.log('📝 [QUOTATION REVISION] Getting revision history via PostgreSQL...')
    
    const { searchParams } = new URL(request.url)
    const quotationId = searchParams.get('quotation_id')

    if (!quotationId) {
      return NextResponse.json({ error: 'Quotation ID is required' }, { status: 400 })
    }

    // Get quotation with revision history
    const quotationResult = await query(`
      SELECT 
        id,
        quotation_number,
        total_amount,
        status,
        revision_count,
        negotiation_history,
        revision_notes,
        client_feedback,
        created_at,
        updated_at
      FROM quotations
      WHERE id = $1
    `, [quotationId])

    if (quotationResult.rows.length === 0) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    const quotation = quotationResult.rows[0]

    // Parse negotiation history
    const negotiationHistory = typeof quotation.negotiation_history === 'string' 
      ? JSON.parse(quotation.negotiation_history) 
      : (quotation.negotiation_history || [])

    return NextResponse.json({
      success: true,
      quotation: {
        ...quotation,
        negotiation_history: negotiationHistory
      }
    })

  } catch (error) {
    console.error('❌ Error fetching revision history (PostgreSQL):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 